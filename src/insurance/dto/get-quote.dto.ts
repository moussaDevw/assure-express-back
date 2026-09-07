import { IsString, IsNotEmpty, IsUUID, IsInt, IsArray, IsIn, IsOptional, Min, Max, IsNumber } from 'class-validator';

export class GetQuoteDto {
  @IsString()
  @IsNotEmpty({ message: "Le code de la compagnie d'assurance est requis." })
  companyCode: string;

  @IsUUID('4', { message: "L'identifiant du véhicule doit être un UUID valide." })
  @IsNotEmpty({ message: "L'identifiant du véhicule est requis." })
  vehicleId: string;

  @IsInt({ message: "La durée doit être un nombre entier." })
  @Min(1, { message: "La durée minimale est de 1 mois." })
  @Max(12, { message: "La durée maximale est de 12 mois." })
  @IsNotEmpty({ message: "La durée est requise." })
  duree: number;

  @IsArray({ message: "Les garanties doivent être sous forme de tableau." })
  @IsInt({ each: true, message: "Chaque garantie doit être un nombre entier." })
  @IsIn([1, 2, 3, 4, 5, 6, 7, 8], { each: true, message: "Les garanties possibles sont comprises entre 1 et 8." })
  @IsOptional()
  garanties?: number[] = [];

  @IsString()
  @IsOptional()
  garantiesOptPT?: string;

  @IsString()
  @IsOptional()
  garantiesOptAR?: string;

  @IsString()
  @IsOptional()
  garantiesOptAS?: string;

  @IsNumber({}, { message: "Le coût de police doit être un nombre." })
  @IsOptional()
  cout_police?: number;

  @IsNumber({}, { message: "La remise RC doit être un nombre." })
  @IsOptional()
  remise_rc?: number;
}



