import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(9, 9, { message: 'Le numéro de téléphone doit contenir 9 chiffres' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Le code OTP doit faire exactement 6 chiffres' })
  code: string;
}
