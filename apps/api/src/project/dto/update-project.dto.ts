import { IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateProjectDto {
  // Both fields optional individually; service rejects an empty patch (400).
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color must be #RRGGBB' })
  color?: string;

  // Optimistic lock — client echoes the version it saw.
  @IsInt()
  @Min(1)
  version!: number;
}
