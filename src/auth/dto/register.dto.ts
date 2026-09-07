import { IsString, IsNotEmpty, Length } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(9, 9, { message: 'Le numéro de téléphone doit contenir 9 chiffres' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  lastName: string;
}
