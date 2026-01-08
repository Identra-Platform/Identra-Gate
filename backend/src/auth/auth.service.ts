import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { MoreThan, Repository } from 'typeorm';
import { LoginAttempt } from './entities/login-attempt.entity';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from 'src/config/services/app-config.service';
import * as bcrypt from 'bcrypt';
import { access } from 'fs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService
  ) {}

  async validateUser(username: string, password: string, ipAddress: string, userAgent: string) {
    await this.checkLoginAttempts(username, ipAddress);

    const user = await this.userRepository.findOne({
      where: { name: username }
    });

    if (!user) {
      await this.recordLoginAttempt(null, username, ipAddress,userAgent, false, 'User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.recordLoginAttempt(user, username, ipAddress, userAgent, false, 'Invalid password');
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.clearFailedAttempts(user, ipAddress);
    await this.recordLoginAttempt(user, username, ipAddress, userAgent, true);

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any, ipAddress: string, userAgent: string) {
    const payload = {
      username: user.name,
      sub: user.id,
      roles: user.roles,
      email: user.email
    };

    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.name,
        email: user.email,
        roles: user.roles
      }
    };
  }

  private async checkLoginAttempts(username: string, ipAddress: string) {
    const lockoutTime = new Date(Date.now() - this.configService.auth.password.lockoutDuration);

    const userAttempts = await this.loginAttemptRepository.count({
      where: {
        user: { name: username },
        success: false,
        createdAt: MoreThan(lockoutTime)
      }
    });

    const ipAttempts = await this.loginAttemptRepository.count({
      where: {
        ipAddress,
        success: false,
        createdAt: MoreThan(lockoutTime)
      }
    });

    const maxAttempts = this.configService.auth.password.maxAttempts;
    if (userAttempts >= maxAttempts || ipAttempts >= maxAttempts) {
      throw new ForbiddenException('Too many login attempts. Please try again later.');
    }
  }

  private async recordLoginAttempt(user: User | null, username: string, ipAddress: string, userAgent: string, success: boolean, failureReason?: string) {
    const loginAttempt = this.loginAttemptRepository.create({
      user: user ?? undefined,
      ipAddress,
      userAgent,
      success,
      failureReason
    });

    await this.loginAttemptRepository.save(loginAttempt);
  }

  private async clearFailedAttempts(user: User, ipAddress: string) {
    const loginAttempts = await this.loginAttemptRepository.find({
      where: {
        user, ipAddress,
        success: false
      }
    });
    await this.loginAttemptRepository.remove(loginAttempts);
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub }
      });

      if (!user) return null;

      return user;
    } catch {
      return null;
    }
  }
}
