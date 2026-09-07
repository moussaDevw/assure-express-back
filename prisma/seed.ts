import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categories = [
  { code: 'C1' },
  { code: 'C2' },
  { code: 'C3' },
  { code: 'C4' },
  { code: 'C5' },
  { code: 'C6' },
  { code: 'C7' },
  { code: 'C8' },
  { code: 'C9' },
  { code: 'C10' },
  { code: 'BUS_ECOLE' },
  { code: 'REMORQUE' },
];

const genres = [
  // C1
  { code: 'VP', description: 'Véhicule Particulier', categoryCode: 'C1' },
  // C2
  { code: 'TPC', description: 'Véhicules utilitaires à carrosserie Tourisme (ex: Break...)', categoryCode: 'C2' },
  { code: 'TPC3T500', description: "Véhicules utilitaires autres carrosseries jusqu'à 3T 500", categoryCode: 'C2' },
  { code: 'TPC3T500P', description: "Véhicules utilitaires autres carrosseries au-delà de 3T 500", categoryCode: 'C2' },
  // C3
  { code: 'TPM3T500', description: "Véhicules transports publics de marchandises jusqu'à 3T 500", categoryCode: 'C3' },
  { code: 'TPM3T500P', description: "Véhicules transports publics de marchandises au-delà de 3T 500", categoryCode: 'C3' },
  // C4
  { code: 'TPV8', description: 'Véhicules utilisés pour transports de personnes à titre onéreux 8 places au plus', categoryCode: 'C4' },
  { code: 'TPV9', description: 'Véhicules utilisés pour transports de personnes à titre onéreux 9 places et plus', categoryCode: 'C4' },
  // C5
  { code: '2RCYC', description: 'Véhicules motorisés à deux roues ou trois roues - Cyclomoteurs', categoryCode: 'C5' },
  { code: '2RSCO', description: "Véhicules motorisés à deux roues ou trois roues - Scooters et vélomoteurs jusqu'à 125 cm3", categoryCode: 'C5' },
  { code: '2RMOT', description: 'Véhicules motorisés à deux roues ou trois roues - Motocyclettes et scooters de plus de 125 cm3', categoryCode: 'C5' },
  { code: '2RSID', description: 'Véhicules motorisés à deux roues ou trois roues - Side-cars (toutes cylindrées)', categoryCode: 'C5' },
  // C6
  { code: 'C6-WG-4R', description: 'Garage Véhicule à 04 roues', categoryCode: 'C6' },
  { code: 'C6-WG-ATELIER-AUTRE', description: 'Garage Véhicule à 02 ou 03 roues pour atelier autre', categoryCode: 'C6' },
  // C7
  { code: 'C7-AE-SC-VTSDC_2R', description: 'Side-cars Sans Double Commande', categoryCode: 'C7' },
  { code: 'C7-AE-VTADC', description: 'Véhicule de Tourisme Avec Double Commande', categoryCode: 'C7' },
  { code: 'C7-AE-VTADC_TPC', description: 'Véhicule des catégories 2, 3 Avec Double Commande', categoryCode: 'C7' },
  { code: 'C7-AE-VTSDC', description: 'Véhicule de Tourisme Sans Double Commande', categoryCode: 'C7' },
  { code: 'C7-AE-VTSDC_TPC', description: 'Véhicule des catégories 2, 3 Sans Double Commande', categoryCode: 'C7' },
  // C8
  { code: 'C8-VLSC', description: 'Véhicule de Location Sans Chauffeur', categoryCode: 'C8' },
  { code: 'C8-VLSC_TPC', description: 'Véhicule de Location Sans Chauffeur TPC', categoryCode: 'C8' },
  { code: 'C8-VLSC_TPM3T500', description: 'Véhicule de Location Sans Chauffeur TPM moins de 3T500', categoryCode: 'C8' },
  { code: 'C8-VLSC_TPM3T500P', description: 'Véhicule de Location Sans Chauffeur TPM plus de 3T500', categoryCode: 'C8' },
  // C9
  { code: 'C9-EMC-EXCLUSION', description: 'Engins Mobiles de Chantier avec exclusions des accidents', categoryCode: 'C9' },
  { code: 'C9-EMC-EXTENSION', description: 'Engins Mobiles de Chantier avec extension des accidents', categoryCode: 'C9' },
  // C10
  { code: 'C10-VS-EMC', description: 'Engins mobiles de chantiers - Tracteurs forestiers (avec ou sans chenilles) ne circulant pas sur la route', categoryCode: 'C10' },
  { code: 'C10-VS-EMC_TPC3T500', description: 'Engins mobiles de chantiers - Tracteurs forestiers (avec ou sans chenilles) ne circulant pas sur la route de moins de 3T500', categoryCode: 'C10' },
  { code: 'C10-VS-EMC_TPC3T500P', description: 'Engins mobiles de chantiers - Tracteurs forestiers (avec ou sans chenilles) ne circulant pas sur la route de plus de 3T500', categoryCode: 'C10' },
  { code: 'C10-VS-TAR', description: 'Tracteurs agricoles et routiers (avec ou sans chenilles)', categoryCode: 'C10' },
  { code: 'C10-VS-TAR_TPC3T500', description: 'Tracteurs agricoles et routiers (avec ou sans chenilles) de moins de 3T500', categoryCode: 'C10' },
  { code: 'C10-VS-TAR_TPC3T500P', description: 'Tracteurs agricoles et routiers (avec ou sans chenilles) de plus de 3T500', categoryCode: 'C10' },
  { code: 'C10-VS-VACFF', description: "Voitures d'ambulances, corbillards et fourgons funéraires", categoryCode: 'C10' },
  { code: 'C10-VS-VAME', description: 'Véhicules automobiles à moteur électrique', categoryCode: 'C10' },
  { code: 'C10-VS-VCP', description: 'Véhicules des collectivités publiques', categoryCode: 'C10' },
  { code: 'C10-VS-VCP_TPC3T500', description: 'Véhicules des collectivités publiques de moins de 3T500', categoryCode: 'C10' },
  { code: 'C10-VS-VCP_TPC3T500P', description: 'Véhicules des collectivités publiques de plus de 3T500', categoryCode: 'C10' },
  // BUS_ECOLE
  { code: 'BE-VTA', description: 'Véhicule de Transport dans des autocars', categoryCode: 'BUS_ECOLE' },
  { code: 'BE-VTCATP', description: 'Transport dans des camions aménagés pour le transport de personnes', categoryCode: 'BUS_ECOLE' },
  // REMORQUE
  { code: 'REMORQUE', description: 'Remorque', categoryCode: 'REMORQUE' },
];

const fuels = [
  { code: 'ESSENCE' },
  { code: 'DIESEL' },
];

const personTypes = [
  { code: 'PHYSIQUE' },
  { code: 'MORALE' },
];

const usages = [
  { code: 'commerciale' },
  { code: 'non_commerciale' },
];

const companies = [
  {
    code: 'KIIRAY',
    name: 'La Sécurité Sénégalaise (Kiiray)',
    baseUrl: 'https://kiiraytest.lasecu-assurances.sn',
    isActive: true,
  },
];

async function main() {
  console.log('Seeding categories...');
  for (const cat of categories) {
    await prisma.vehicleCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  console.log('Seeding insurance companies...');
  for (const company of companies) {
    await prisma.insuranceCompany.upsert({
      where: { code: company.code },
      update: {
        name: company.name,
        baseUrl: company.baseUrl,
        isActive: company.isActive,
      },
      create: company,
    });
  }


  console.log('Seeding genres...');
  for (const genre of genres) {
    await prisma.vehicleGenre.upsert({
      where: { code: genre.code },
      update: {
        description: genre.description,
        categoryCode: genre.categoryCode,
      },
      create: genre,
    });
  }

  console.log('Seeding fuels...');
  for (const fuel of fuels) {
    await prisma.vehicleFuel.upsert({
      where: { code: fuel.code },
      update: {},
      create: fuel,
    });
  }

  console.log('Seeding person types...');
  for (const pt of personTypes) {
    await prisma.personType.upsert({
      where: { code: pt.code },
      update: {},
      create: pt,
    });
  }

  console.log('Seeding usages...');
  for (const usage of usages) {
    await prisma.vehicleUsage.upsert({
      where: { code: usage.code },
      update: {},
      create: usage,
    });
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
