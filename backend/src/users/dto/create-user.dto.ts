import { ArrayNotEmpty, ArrayUnique, IsArray, IsEmail, IsEnum, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";
import { UserRole } from "../entities/role.entity";

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsStrongPassword({
    minLength: 8
  })
  password: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
}
