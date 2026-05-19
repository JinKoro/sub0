import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

/** Profile card on Settings → Account: name only (avatar blocked on #6). */
export class ProfileDto {
  // ctx-security.md §1: имя ≤ 100.
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  // Optimistic lock (ctx-architecture §4): client echoes the version it saw.
  @IsInt()
  @Min(1)
  version!: number;
}
