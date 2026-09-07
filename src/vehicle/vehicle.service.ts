import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateVehicleDto, userId: string) {
    // 1. Spec check: Either immatriculation or chassis must be provided
    if (!dto.immatriculation && !dto.chassis) {
      throw new BadRequestException(
        "L'immatriculation ou le numéro de châssis est obligatoire."
      );
    }

    // 2. Date check: dateMiseCirculation must be in the past (before today)
    const circulationDate = new Date(dto.dateMiseCirculation);
    const today = new Date();
    if (circulationDate >= today) {
      throw new BadRequestException(
        "La date de mise en circulation doit être inférieure à la date d'aujourd'hui."
      );
    }

    // 2. Validate that the fuelCode (energie) exists in DB
    const fuel = await this.prisma.vehicleFuel.findUnique({
      where: { code: dto.energie },
    });
    if (!fuel) {
      throw new BadRequestException(`Le type d'énergie '${dto.energie}' n'existe pas.`);
    }

    // 3. Validate that the genreCode (genre) exists and retrieve its categoryCode
    const genre = await this.prisma.vehicleGenre.findUnique({
      where: { code: dto.genre },
    });
    if (!genre) {
      throw new BadRequestException(`Le genre de véhicule '${dto.genre}' n'existe pas.`);
    }

    // If the category is C5 (motos), cylindre is mandatory
    if (genre.categoryCode === 'C5') {
      if (!dto.cylindre || dto.cylindre <= 0) {
        throw new BadRequestException(
          "La cylindrée est obligatoire pour les véhicules à deux ou trois roues."
        );
      }
    }

    // 4. Validate that the usageCode (usage) exists if supplied
    if (dto.usage) {
      const usage = await this.prisma.vehicleUsage.findUnique({
        where: { code: dto.usage },
      });
      if (!usage) {
        throw new BadRequestException(`Le type d'usage '${dto.usage}' n'existe pas.`);
      }
    }

    // 5. Create the vehicle record
    return this.prisma.vehicle.create({
      data: {
        marque: dto.marque,
        modele: dto.modele,
        immatriculation: dto.immatriculation || null,
        chassis: dto.chassis || null,
        puissanceFiscale: dto.puissanceFiscale,
        nombrePlace: dto.nombrePlace,
        dateMiseCirculation: new Date(dto.dateMiseCirculation),
        valeurNeuve: dto.valeurNeuve || null,
        valeurActuelle: dto.valeurActuelle || null,
        cylindre: dto.cylindre || null,
        userId,
        fuelCode: dto.energie,
        genreCode: dto.genre,
        categoryCode: genre.categoryCode,
        usageCode: dto.usage || null,
      },
    });
  }

  async getByUser(userId: string) {
    return this.prisma.vehicle.findMany({
      where: { userId },
      include: {
        category: true,
        genre: true,
        fuel: true,
        usage: true,
      },
    });
  }

  async getOne(id: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        category: true,
        genre: true,
        fuel: true,
        usage: true,
      },
    });

    if (!vehicle || vehicle.userId !== userId) {
      throw new NotFoundException('Véhicule non trouvé.');
    }

    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto, userId: string) {
    // 1. Check existence and owner
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle || vehicle.userId !== userId) {
      throw new NotFoundException('Véhicule non trouvé.');
    }

    // 2. Validate immatriculation / chassis logic if modified
    const finalImmatriculation = dto.immatriculation !== undefined ? dto.immatriculation : vehicle.immatriculation;
    const finalChassis = dto.chassis !== undefined ? dto.chassis : vehicle.chassis;
    if (!finalImmatriculation && !finalChassis) {
      throw new BadRequestException(
        "L'immatriculation ou le numéro de châssis est obligatoire."
      );
    }

    // 3. Date check if provided
    if (dto.dateMiseCirculation) {
      const circulationDate = new Date(dto.dateMiseCirculation);
      const today = new Date();
      if (circulationDate >= today) {
        throw new BadRequestException(
          "La date de mise en circulation doit être inférieure à la date d'aujourd'hui."
        );
      }
    }

    // 4. Validate referenced fuelCode (energie) if provided
    if (dto.energie) {
      const fuel = await this.prisma.vehicleFuel.findUnique({
        where: { code: dto.energie },
      });
      if (!fuel) {
        throw new BadRequestException(`Le type d'énergie '${dto.energie}' n'existe pas.`);
      }
    }

    // 5. Validate referenced genreCode (genre) if provided and get categoryCode
    let categoryCode = vehicle.categoryCode;
    if (dto.genre) {
      const genre = await this.prisma.vehicleGenre.findUnique({
        where: { code: dto.genre },
      });
      if (!genre) {
        throw new BadRequestException(`Le genre de véhicule '${dto.genre}' n'existe pas.`);
      }
      categoryCode = genre.categoryCode;
    }

    // 6. Validate referenced usageCode (usage) if provided
    if (dto.usage) {
      const usage = await this.prisma.vehicleUsage.findUnique({
        where: { code: dto.usage },
      });
      if (!usage) {
        throw new BadRequestException(`Le type d'usage '${dto.usage}' n'existe pas.`);
      }
    }

    const finalCylindre = dto.cylindre !== undefined ? dto.cylindre : vehicle.cylindre;
    if (categoryCode === 'C5') {
      if (!finalCylindre || finalCylindre <= 0) {
        throw new BadRequestException(
          "La cylindrée est obligatoire pour les véhicules à deux ou trois roues."
        );
      }
    }

    // 7. Update vehicle
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        marque: dto.marque,
        modele: dto.modele,
        immatriculation: dto.immatriculation !== undefined ? (dto.immatriculation || null) : undefined,
        chassis: dto.chassis !== undefined ? (dto.chassis || null) : undefined,
        puissanceFiscale: dto.puissanceFiscale,
        nombrePlace: dto.nombrePlace,
        dateMiseCirculation: dto.dateMiseCirculation ? new Date(dto.dateMiseCirculation) : undefined,
        valeurNeuve: dto.valeurNeuve !== undefined ? (dto.valeurNeuve || null) : undefined,
        valeurActuelle: dto.valeurActuelle !== undefined ? (dto.valeurActuelle || null) : undefined,
        cylindre: dto.cylindre !== undefined ? (dto.cylindre || null) : undefined,
        fuelCode: dto.energie,
        genreCode: dto.genre,
        categoryCode,
        usageCode: dto.usage !== undefined ? (dto.usage || null) : undefined,
      },
    });
  }

  async delete(id: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle || vehicle.userId !== userId) {
      throw new NotFoundException('Véhicule non trouvé.');
    }

    await this.prisma.vehicle.delete({
      where: { id },
    });

    return { message: 'Véhicule supprimé avec succès.' };
  }
}
