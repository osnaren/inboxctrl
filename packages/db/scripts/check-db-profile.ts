import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { currentDatabaseProfile, currentPrismaAdapterProvider } from '../src/profile';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prismaDir = path.resolve(__dirname, '../prisma');
const generatedSchemaPath = path.resolve(prismaDir, 'schema.prisma');

if (!fs.existsSync(generatedSchemaPath)) {
  console.error('❌ Generated schema not found. Run `pnpm db:use <provider>` first.');
  process.exit(1);
}

const schema = fs.readFileSync(generatedSchemaPath, 'utf-8');
const isSqlite = schema.includes('provider = "sqlite"');
const isPostgres = schema.includes('provider = "postgresql"');

if (!isSqlite && !isPostgres) {
  console.log('Current DB profile: unknown');
  process.exit(1);
}

const schemaProfile = isSqlite ? 'sqlite' : 'postgres';
const adapterProvider = isSqlite ? 'sqlite' : 'postgresql';

if (currentDatabaseProfile !== schemaProfile || currentPrismaAdapterProvider !== adapterProvider) {
  console.error(
    `❌ DB profile mismatch. schema.prisma=${schemaProfile}/${adapterProvider} but profile.ts=${currentDatabaseProfile}/${currentPrismaAdapterProvider}. Run \`pnpm db:use ${schemaProfile}\`.`
  );
  process.exit(1);
}

console.log(`Current DB profile: ${currentDatabaseProfile}`);
