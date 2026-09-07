import { IsString, IsNotEmpty, IsInt, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty({ message: 'La marque est requise' })
  marque: string;

  @IsString()
  @IsNotEmpty({ message: 'Le modèle est requis' })
  modele: string;

  @IsString()
  @IsOptional()
  immatriculation?: string;

  @IsString()
  @IsOptional()
  chassis?: string;

  @IsInt({ message: 'La puissance fiscale doit être un nombre entier' })
  @IsNotEmpty({ message: 'La puissance fiscale est requise' })
  puissanceFiscale: number;

  @IsInt({ message: 'Le nombre de places doit être un nombre entier' })
  @IsOptional()
  nombrePlace?: number;

  @IsDateString({}, { message: 'La date de mise en circulation doit être une date valide' })
  @IsNotEmpty({ message: 'La date de mise en circulation est requise' })
  dateMiseCirculation: string;

  @IsNumber({}, { message: 'La valeur à neuf doit être un nombre' })
  @IsOptional()
  valeurNeuve?: number;

  @IsNumber({}, { message: 'La valeur actuelle doit être un nombre' })
  @IsOptional()
  valeurActuelle?: number;

  @IsString()
  @IsNotEmpty({ message: "Le type d'énergie (fuelCode) est requis" })
  energie: string;

  @IsInt({ message: 'La cylindrée doit être un nombre entier' })
  @IsOptional()
  cylindre?: number;

  @IsString()
  @IsNotEmpty({ message: 'Le genre du véhicule (genreCode) est requis' })
  genre: string;

  @IsString()
  @IsOptional()
  usage?: string;
}
