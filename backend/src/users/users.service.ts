import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Equal, In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, UserRole } from './entities/role.entity';
import * as bcrypt from 'bcrypt';
import { hash } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser)
      throw new ConflictException('User with this email already exists');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    let roles: Role[] = await this.roleRepository.find({
      where: { role: In(createUserDto.roles) },
    });

    if (roles.length !== createUserDto.roles.length) {
      const foundRoles = roles.map((role) => role.role);
      const missingRoles = createUserDto.roles.filter(
        (role) => !foundRoles.includes(role),
      );
      throw new NotFoundException(
        `Roles not found: ${missingRoles.join(', ')} ${roles.map((role) => role.role)}`,
      );
    }

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      roles,
    });

    return await this.userRepository.save(user);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: string,
  ) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .take(limit)
      .skip((page - 1) * limit);

    if (search) {
      queryBuilder.where(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (role) {
      queryBuilder
        .andWhere('roles.role = :role', { role })
        .leftJoin('user.roles', 'filterRoles')
        .andWhere('filterRoles.role = :role', { role });
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    const pages = Math.ceil(total / limit);
    return {
      users,
      pagination: { page, limit, total, pages },
    };
  }

  async findOne(id: string) {
    return await this.userRepository.findOneOrFail({
      where: { id },
      relations: ['roles'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already taken');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
