import { IsString, IsNotEmpty, IsUUID, IsInt, IsArray, IsIn, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PartyInfoDto {
  @IsString()
  @IsNotEmpty({ message: "Le nom est requis." })
  nom: string;

  @IsString()
  @IsNotEmpty({ message: "Le prénom est requis." })
  prenom: string;

  @IsString()
  @IsOptional()
  cellulaire?: string;

  @IsString()
  @IsOptional()
  email?: string;
}

export class CreateContractDto {
  @IsString()
  @IsNotEmpty({ message: "Le code de la compagnie d'assurance est requis." })
  companyCode: string;

  @IsUUID('4', { message: "L'identifiant du véhicule doit être un UUID valide." })
  @IsNotEmpty({ message: "L'identifiant du véhicule est requis." })
  vehicleId: string;

  @IsString()
  @IsNotEmpty({ message: "La date d'effet est requise (Format AAAA-MM-JJ)." })
  dateEffet: string;

  @IsInt({ message: "La durée doit être un nombre entier." })
  @Min(1, { message: "La durée minimale est de 1 mois." })
  @Max(12, { message: "La durée maximale est de 12 mois." })
  duree: number;

  @IsArray({ message: "Les garanties doivent être sous forme de tableau." })
  @IsInt({ each: true, message: "Chaque garantie doit être un nombre entier." })
  @IsIn([1, 2, 3, 4, 5, 6, 7, 8], { each: true, message: "Les garanties possibles sont comprises entre 1 et 8." })
  @IsOptional()
  garanties?: number[] = [];

  @IsString()
  @IsOptional()
  police?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartyInfoDto)
  souscripteur?: PartyInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartyInfoDto)
  assure?: PartyInfoDto;
}
