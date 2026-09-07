import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KiirayStrategy } from './strategies/kiiray.strategy';
import { InsuranceProviderStrategy, QuoteResponse } from './strategies/insurance-provider.strategy';

@Injectable()
export class InsuranceService {
  private readonly strategies = new Map<string, InsuranceProviderStrategy>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly kiirayStrategy: KiirayStrategy,
  ) {
    this.strategies.set(kiirayStrategy.getProviderCode(), kiirayStrategy);
  }

  /**
   * List all active partner insurance companies.
   */
  async listCompanies() {
    return this.prisma.insuranceCompany.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        baseUrl: true,
        logoUrl: true,
      },
    });
  }

  /**
   * Request a quote from a partner.
   * Verifies that the vehicle exists and belongs to the requesting user.
   */
  async requestQuote(
    companyCode: string,
    vehicleId: string,
    duree: number,
    garanties: number[],
    options: {
      garantiesOptPT?: string;
      garantiesOptAR?: string;
      garantiesOptAS?: string;
      cout_police?: number;
      remise_rc?: number;
    },
    userId: string,
  ): Promise<QuoteResponse> {
    const company = await this.prisma.insuranceCompany.findUnique({
      where: { code: companyCode },
    });

    if (!company || !company.isActive) {
      throw new NotFoundException(`Compagnie d'assurance ${companyCode} introuvable ou inactive.`);
    }

    const strategy = this.strategies.get(companyCode);
    if (!strategy) {
      throw new BadRequestException(`L'intégration pour ${companyCode} n'est pas encore implémentée.`);
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    // Security check: ensure vehicle exists and belongs to the authenticated user
    if (!vehicle || vehicle.userId !== userId) {
      throw new NotFoundException(`Véhicule introuvable.`);
    }

    return strategy.getQuote({
      vehicle,
      duree,
      garanties,
      ...options,
    });
  }

  async requestCertificate(
    companyCode: string,
    details: any,
  ) {
    const strategy = this.strategies.get(companyCode);
    if (!strategy) {
      throw new BadRequestException(`L'intégration pour ${companyCode} n'est pas encore implémentée.`);
    }
    return strategy.getCertificate(details);
  }
}
