import { PASSWORD_MAX } from '@subzero/shared';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_MAX)
  currentPassword!: string;

  // Policy (length + letter + digit) is enforced in the service via
  // `isValidPassword`; here we only bound the size.
  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_MAX)
  newPassword!: string;
}
