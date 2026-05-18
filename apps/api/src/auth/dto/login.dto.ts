import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  // ctx-security.md §1: email ≤ 254.
  @IsEmail()
  @MaxLength(254)
  email!: string;

  // Login does not enforce password policy (legacy hashes); only an upper
  // bound to cap argon2 work. Policy is enforced at set-password (#54).
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}
