import { IsString, IsEmail, MinLength, Matches, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Full name (alphabets and spaces only)' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Unique email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Strong password (min 8 chars, upper+lower+number+special)' })
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])/, { message: 'Must contain a lowercase letter' })
  @Matches(/(?=.*[A-Z])/, { message: 'Must contain an uppercase letter' })
  @Matches(/(?=.*\d)/, { message: 'Must contain a number' })
  @Matches(/(?=.*[^A-Za-z0-9])/, { message: 'Must contain a special character' })
  password: string;

  @ApiProperty({ description: 'Role of the user', enum: UserRole })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
