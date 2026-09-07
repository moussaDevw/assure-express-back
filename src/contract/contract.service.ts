import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InsuranceService } from '../insurance/insurance.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly insuranceService: InsuranceService,
  ) { }

  /**
   * List all contracts belonging to a specific user.
   */
  async listContracts(userId: string) {
    return this.prisma.contract.findMany({
      where: { userId },
      include: {
        vehicle: true,
        company: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetch a single contract. Verifies ownership.
   */
  async getOne(id: string, userId: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, userId },
      include: {
        vehicle: true,
        company: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contrat introuvable.');
    }

    return contract;
  }

  /**
   * Main orchestrator method to subscribe to a policy:
   * 1. Check user exists
   * 2. Check vehicle exists and user owns it
   * 3. Compute quote to confirm the premium amount
   * 4. Call strategy's certificate endpoint
   * 5. Parse Odoo expiration dates
   * 6. Save contract log in database
   */
  async createContract(dto: CreateContractDto, userId: string) {
    // 1. Fetch user profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { typePersonne: true },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    // 2. Fetch vehicle & check ownership
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle || vehicle.userId !== userId) {
      throw new NotFoundException('Véhicule introuvable.');
    }

    // 3. Confirm premium price from the partner quote
    const quote = await this.insuranceService.requestQuote(
      dto.companyCode,
      dto.vehicleId,
      dto.duree,
      dto.garanties || [],
      {},
      userId,
    );

    const company = await this.prisma.insuranceCompany.findUnique({
      where: { code: dto.companyCode },
    });

    if (!company) {
      throw new NotFoundException("Compagnie d'assurance introuvable.");
    }

    // 4. Build subscriber & beneficiary info (fallback to authenticated user profile)
    const souscripteur = {
      nom: dto.souscripteur?.nom || user.lastName || 'Client',
      prenom: dto.souscripteur?.prenom || user.firstName || 'Express',
      cellulaire: dto.souscripteur?.cellulaire || user.phone,
      email: dto.souscripteur?.email || '',
    };

    const assure = {
      nom: dto.assure?.nom || souscripteur.nom,
      prenom: dto.assure?.prenom || souscripteur.prenom,
      cellulaire: dto.assure?.cellulaire || souscripteur.cellulaire,
      email: dto.assure?.email || souscripteur.email,
    };

    // 5. Generate unique transaction reference & police fallback
    const referenceTrxPartner = `TRX-AE-${Date.now()}`;
    const police = "500-2024200001";

    // 6. Request the Odoo certificate strategy
    const odooResponse = await this.insuranceService.requestCertificate(
      dto.companyCode,
      {
        vehicle,
        user,
        responsabiliteCivile: quote.premium,
        dateEffet: dto.dateEffet,
        duree: dto.duree,
        garanties: dto.garanties || [],
        police,
        referenceTrxPartner,
        souscripteur,
        assure,
      },
    );

    // 7. Parse dateExpiration
    let dateExpiration: Date | null = null;
    if (odooResponse.dateExpiration) {
      try {
        const parts = odooResponse.dateExpiration.split('-');
        if (parts.length >= 6) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // 0-based
          const day = parseInt(parts[2], 10);
          const hour = parseInt(parts[3], 10);
          const minute = parseInt(parts[4], 10);
          const second = parseInt(parts[5], 10);
          dateExpiration = new Date(year, month, day, hour, minute, second);
        } else {
          dateExpiration = new Date(odooResponse.dateExpiration);
        }
      } catch (err) {
        console.warn('Could not parse expiration date from Odoo response:', odooResponse.dateExpiration, err);
      }
    }

    // 8. Save Contract to Database
    return this.prisma.contract.create({
      data: {
        policeNumber: odooResponse.policeNumber || police,
        attestationNumber: odooResponse.attestationNumber,
        linkAttestation: odooResponse.linkAttestation,
        linkCarteBrune: odooResponse.linkCarteBrune,
        dateExpiration,
        referenceTrxPartner,
        responsabiliteCivile: quote.premium,
        dateEffet: new Date(dto.dateEffet),
        duree: dto.duree,
        userId,
        vehicleId: vehicle.id,
        companyId: company.id,
        operationStatus: odooResponse.operationStatus,
        operationMessage: odooResponse.operationMessage,
        odooData: odooResponse.data || {},
      },
    });
  }
}
