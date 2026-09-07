import { Vehicle } from '@prisma/client';

export interface QuoteRequestDetails {
  vehicle: Vehicle;
  duree: number;
  garanties: number[];
  garantiesOptPT?: string;
  garantiesOptAR?: string;
  garantiesOptAS?: string;
  cout_police?: number;
  remise_rc?: number;
}

export interface QuoteResponse {
  providerCode: string;
  premium: number;
  details: any;
}

export interface CertificateRequestDetails {
  vehicle: any; // includes relations
  user: any; // includes relations
  responsabiliteCivile: number;
  dateEffet: string; // AAAA-MM-JJ
  duree: number;
  garanties: number[];
  police: string;
  referenceTrxPartner: string;
  souscripteur: {
    nom: string;
    prenom: string;
    cellulaire?: string;
    email?: string;
  };
  assure: {
    nom: string;
    prenom: string;
    cellulaire?: string;
    email?: string;
  };
}

export interface CertificateResponse {
  providerCode: string;
  policeNumber: string;
  attestationNumber: string;
  linkAttestation: string;
  linkCarteBrune: string;
  dateExpiration: string;
  operationStatus: string;
  operationMessage: string;
  data: any;
}

export interface InsuranceProviderStrategy {
  getProviderCode(): string;
  getQuote(request: QuoteRequestDetails): Promise<QuoteResponse>;
  getCertificate(request: CertificateRequestDetails): Promise<CertificateResponse>;
}


