import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// password / newPassword policy (min 8, ≥1 digit+letter) is enforced in the
// service via @subzero/shared isValidPassword — it's state-conditional.
export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;
}

export class EmailOnlyDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token!: string;

  @IsString()
  @MaxLength(128)
  newPassword!: string;
}
