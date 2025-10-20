/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateAuthDto {
  @IsEmail()
  public email: string;

  @IsOptional()
  @IsString()
  public password?: string;

  @IsOptional()
  @IsString()
  public googleId?: string;

  @IsOptional()
  @IsString()
  public secretName: string;
}
