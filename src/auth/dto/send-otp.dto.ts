import { IsString, IsNotEmpty, Length } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(9, 9, { message: 'Le numéro de téléphone doit contenir 9 chiffres' })
  phone: string;
}
