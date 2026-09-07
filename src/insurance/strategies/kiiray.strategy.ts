import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import dayjs from 'dayjs';
import { InsuranceProviderStrategy, QuoteRequestDetails, QuoteResponse, CertificateRequestDetails, CertificateResponse } from './insurance-provider.strategy';

const GUARANTEES_LABELS: Record<number, string> = {
  1: 'Défense et recours',
  2: 'Personnes transportées',
  3: 'Bris de glace',
  4: 'Avance / Recours',
  5: 'Incendie',
  6: 'Vol',
  7: 'Tierce collision',
  8: 'Tierce complète',
};

const DEFAULT_VEHICLE_VALUE = 9000900;
const DEFAULT_POLICE_COST = 3000;
const DEFAULT_REMISE_RC = 0;
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

interface KiirayMotoQuotePayload {
  cylindre: string;
  duree: string;
  periodicite: string;
  genre: string;
  energie: string;
  usage: string;
  nombrePlace: string;
  cout_police: number;
  remise_rc: number;
  garanties: number[];
}

interface KiirayCarQuotePayload {
  puissanceFiscale: number;
  duree: number;
  genre: string;
  nombrePlace: number;
  periodicite: string;
  energie: string;
  valeurNeuve: number;
  valeurActuelle: number;
  garanties: number[];
  garantiesOptPT: string;
  garantiesOptAR: string;
  garantiesOptAS: string;
  cout_police: number;
  remise_rc: number;
}

interface KiirayPartyInfo {
  nom: string;
  prenom: string;
  cellulaire?: string;
  email?: string;
}

interface KiirayMotoCertificatePayload {
  dateEffet: string;
  dateExpiration: string;
  duree: number;
  periodicite: string;
  police: string;
  cout_police: number;
  remise_rc: number;
  referenceTrxPartner: string;
  responsabiliteCivile: number;
  typePersonne: string;
  souscripteur: KiirayPartyInfo;
  assure: KiirayPartyInfo;
  vehicule: {
    cylindre: number;
    dateMiseCirculation: string;
    nombrePlace: number;
    immatriculation: string;
    energie: string;
    genre: string;
    modele: string;
    marque: string;
    usage: string;
  };
  garanties: number[];
}

interface KiirayCarCertificatePayload {
  responsabiliteCivile: number;
  dateEffet: string;
  duree: number;
  periodicite: string;
  garanties: number[];
  police: string;
  typePersonne: string;
  souscripteur: KiirayPartyInfo;
  assure: KiirayPartyInfo;
  vehicule: {
    puissanceFiscale: number;
    dateMiseCirculation: string;
    valeurNeuve: number;
    valeurActuelle: number;
    immatriculation: string;
    energie: string;
    genre: string;
    modele: string;
    marque: string;
    chassis: string;
  };
  referenceTrxPartner: string;
}

@Injectable()
export class KiirayStrategy implements InsuranceProviderStrategy {
  private readonly logger = new Logger(KiirayStrategy.name);

  private readonly baseUrl = process.env.KIIRAY_BASE_URL || '';
  private readonly user = process.env.KIIRAY_BASIC_AUTH_USER || '';
  private readonly pass = process.env.KIIRAY_BASIC_AUTH_PASSWORD || '';
  private readonly authHeader = 'Basic ' + Buffer.from(`${this.user}:${this.pass}`).toString('base64');

  constructor(private readonly httpService: HttpService) {}

  getProviderCode(): string {
    return 'KIIRAY';
  }

  private calculateExpirationDate(dateEffet: string, dureeMonths: number): string {
    return dayjs(dateEffet)
      .add(dureeMonths, 'month')
      .subtract(1, 'day')
      .format('YYYY-MM-DD');
  }

  async getQuote(request: QuoteRequestDetails): Promise<QuoteResponse> {
    const isMoto = request.vehicle.categoryCode === 'C5';
    let endpoint = `${this.baseUrl}/api/v1/partner/rc.request`;
    let body: KiirayMotoQuotePayload | KiirayCarQuotePayload;

    if (isMoto) {
      endpoint = `${this.baseUrl}/api/v1/partner/rc.moto`;
      body = {
        cylindre: request.vehicle.cylindre ? String(request.vehicle.cylindre) : '0',
        duree: String(request.duree),
        periodicite: 'MOIS',
        genre: request.vehicle.genreCode || '2RCYC',
        energie: request.vehicle.fuelCode || 'ESSENCE',
        usage: request.vehicle.usageCode === 'commerciale' ? 'COMMERCIAL' : 'NON_COMMERCIAL',
        nombrePlace: request.vehicle.nombrePlace ? String(request.vehicle.nombrePlace) : '2',
        cout_police: request.cout_police ?? DEFAULT_POLICE_COST,
        remise_rc: request.remise_rc ?? DEFAULT_REMISE_RC,
        garanties: request.garanties || [],
      };
    } else {
      body = {
        puissanceFiscale: request.vehicle.puissanceFiscale,
        duree: request.duree,
        genre: request.vehicle.genreCode || 'VP',
        nombrePlace: request.vehicle.nombrePlace ?? 5,
        periodicite: 'MOIS',
        energie: request.vehicle.fuelCode || 'ESSENCE',
        valeurNeuve: request.vehicle.valeurNeuve ? Number(request.vehicle.valeurNeuve) : DEFAULT_VEHICLE_VALUE,
        valeurActuelle: request.vehicle.valeurActuelle ? Number(request.vehicle.valeurActuelle) : DEFAULT_VEHICLE_VALUE,
        garanties: request.garanties || [],
        garantiesOptPT: request.garantiesOptPT ?? 'OPTION_1',
        garantiesOptAR: request.garantiesOptAR ?? '500000',
        garantiesOptAS: request.garantiesOptAS ?? 'OPTION_1',
        cout_police: request.cout_police ?? DEFAULT_POLICE_COST,
        remise_rc: request.remise_rc ?? DEFAULT_REMISE_RC,
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(endpoint, body, {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
          },
          timeout: REQUEST_TIMEOUT_MS,
        })
      );

      const data = response.data;

      // Check if Odoo returned an operation error
      if (data.operationStatus !== 'SUCCESS') {
        this.logger.warn(
          `Échec de l'opération de devis (operationStatus = ${data.operationStatus}). Réponse: ${JSON.stringify(data)}`
        );
        throw new Error(data.operationMessage || 'Une erreur est survenue lors du calcul de la prime.');
      }

      // Extract the premium from the 'data' field of the response
      const premium = data.data ?? 0;

      return {
        providerCode: this.getProviderCode(),
        premium: Number(premium),
        details: {
          ...data,
          message: 'Calculé en direct via Kiiray Partner API',
        },
      };
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.response) {
        const data = error.response.data || {};
        const errorDesc = data.error_descrip || data.error || `HTTP ${error.response.status}`;
        errorMessage = `L'API partenaire a retourné une erreur: ${errorDesc}`;
        this.logger.warn(
          `Erreur HTTP ${error.response.status} de l'API partenaire sur ${endpoint}. Payload: ${JSON.stringify(body)}. Réponse: ${JSON.stringify(data)}`
        );
      } else {
        this.logger.error(
          `Erreur lors de l'appel getQuote sur ${endpoint} : ${error.message}`,
          error.stack
        );
      }
      throw new Error(`Erreur lors de l'appel à l'API Kiiray: ${errorMessage}`);
    }
  }

  async getCertificate(request: CertificateRequestDetails): Promise<CertificateResponse> {
    const isMoto = request.vehicle.categoryCode === 'C5';
    let endpoint = `${this.baseUrl}/api/v1/partner/qrcode.request`;
    let body: KiirayMotoCertificatePayload | KiirayCarCertificatePayload;

    if (isMoto) {
      endpoint = `${this.baseUrl}/api/v1/partner/moto.request`;
      const dateExpiration = this.calculateExpirationDate(request.dateEffet, request.duree);

      body = {
        dateEffet: request.dateEffet,
        dateExpiration,
        duree: request.duree,
        periodicite: 'MOIS',
        police: request.police,
        cout_police: DEFAULT_POLICE_COST,
        remise_rc: DEFAULT_REMISE_RC,
        referenceTrxPartner: request.referenceTrxPartner,
        responsabiliteCivile: request.responsabiliteCivile,
        typePersonne: request.user.typePersonneCode || 'PHYSIQUE',
        souscripteur: request.souscripteur,
        assure: request.assure,
        vehicule: {
          cylindre: request.vehicle.cylindre ? Number(request.vehicle.cylindre) : 0,
          dateMiseCirculation: request.vehicle.dateMiseCirculation instanceof Date 
            ? request.vehicle.dateMiseCirculation.toISOString().split('T')[0]
            : dayjs(request.vehicle.dateMiseCirculation).format('YYYY-MM-DD'),
          nombrePlace: request.vehicle.nombrePlace ?? 2,
          immatriculation: request.vehicle.immatriculation || '',
          energie: request.vehicle.fuelCode || 'ESSENCE',
          genre: request.vehicle.genreCode || '2RCYC',
          modele: request.vehicle.modele,
          marque: request.vehicle.marque,
          usage: request.vehicle.usageCode === 'commerciale' ? 'COMMERCIALE' : 'NON_COMMERCIALE',
        },
        garanties: request.garanties || [],
      };
    } else {
      body = {
        responsabiliteCivile: request.responsabiliteCivile,
        dateEffet: request.dateEffet,
        duree: request.duree,
        periodicite: 'MOIS',
        garanties: request.garanties || [],
        police: request.police,
        typePersonne: request.user.typePersonneCode || 'PHYSIQUE',
        souscripteur: request.souscripteur,
        assure: request.assure,
        vehicule: {
          puissanceFiscale: request.vehicle.puissanceFiscale,
          dateMiseCirculation: request.vehicle.dateMiseCirculation instanceof Date 
            ? request.vehicle.dateMiseCirculation.toISOString().split('T')[0]
            : dayjs(request.vehicle.dateMiseCirculation).format('YYYY-MM-DD'),
          valeurNeuve: request.vehicle.valeurNeuve ? Number(request.vehicle.valeurNeuve) : DEFAULT_VEHICLE_VALUE,
          valeurActuelle: request.vehicle.valeurActuelle ? Number(request.vehicle.valeurActuelle) : DEFAULT_VEHICLE_VALUE,
          immatriculation: request.vehicle.immatriculation || '',
          energie: request.vehicle.fuelCode || 'ESSENCE',
          genre: request.vehicle.genreCode || 'VP',
          modele: request.vehicle.modele,
          marque: request.vehicle.marque,
          chassis: request.vehicle.chassis || '',
        },
        referenceTrxPartner: request.referenceTrxPartner,
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(endpoint, body, {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
          },
          timeout: REQUEST_TIMEOUT_MS,
        })
      );

      const data = response.data;

      if (data.operationStatus !== 'SUCCESS') {
        this.logger.warn(
          `Échec de l'opération de souscription (operationStatus = ${data.operationStatus}). Réponse: ${JSON.stringify(data)}`
        );
        throw new Error(data.operationMessage || "Erreur de génération d'attestation Odoo");
      }

      const odooData = data.data || {};

      return {
        providerCode: this.getProviderCode(),
        policeNumber: request.police,
        attestationNumber: odooData.attestationNumber || '',
        linkAttestation: odooData.linkAttestation || '',
        linkCarteBrune: odooData.linkCarteBrune || '',
        dateExpiration: odooData.dateExpiration || '',
        operationStatus: data.operationStatus,
        operationMessage: data.operationMessage,
        data: odooData,
      };
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.response) {
        const data = error.response.data || {};
        const errorDesc = data.error_descrip || data.error || `HTTP ${error.response.status}`;
        errorMessage = `L'API qrcode.request a retourné une erreur: ${errorDesc}`;
        this.logger.warn(
          `Erreur HTTP ${error.response.status} de l'API partenaire sur ${endpoint}. Payload: ${JSON.stringify(body)}. Réponse: ${JSON.stringify(data)}`
        );
      } else {
        this.logger.error(
          `Erreur lors de l'appel getCertificate sur ${endpoint} : ${error.message}`,
          error.stack
        );
      }
      throw new Error(`Erreur lors de l'appel qrcode.request: ${errorMessage}`);
    }
  }
}


