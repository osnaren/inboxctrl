import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const providerConfig = {
  sqlite: {
    betterAuthProvider: 'sqlite',
  },
  postgres: {
    betterAuthProvider: 'postgresql',
  },
} as const;

const providerArg = process.argv[2] || 'sqlite';

if (!(providerArg in providerConfig)) {
  const validProviders = Object.keys(providerConfig);
  console.error(`❌ Invalid provider: ${providerArg}. Must be one of: ${validProviders.join(', ')}`);
  process.exit(1);
}

const provider = providerArg as keyof typeof providerConfig;
const prismaDir = path.resolve(__dirname, '../prisma');
const profileModulePath = path.resolve(__dirname, '../src/profile.ts');

const baseSchemaPath = path.resolve(prismaDir, 'schema.base.prisma');
const providerSchemaPath = path.resolve(prismaDir, `providers/${provider}.prisma`);

if (!fs.existsSync(baseSchemaPath)) {
  console.error(`❌ Base schema not found at ${baseSchemaPath}`);
  process.exit(1);
}

if (!fs.existsSync(providerSchemaPath)) {
  console.error(`❌ Provider schema not found at ${providerSchemaPath}`);
  process.exit(1);
}

const baseSchema = fs.readFileSync(baseSchemaPath, 'utf-8');
const providerSchema = fs.readFileSync(providerSchemaPath, 'utf-8');

const combinedSchema = `// Auto-generated. Do not edit.\n// Run \`pnpm db:use <provider>\` to change DB provider.\n\n${providerSchema}\n\n${baseSchema}`;
const profileModule = `// Auto-generated. Do not edit.\n// Run \`pnpm db:use <provider>\` to change DB provider.\n\nexport type DatabaseProfile = 'sqlite' | 'postgres';\nexport type PrismaAdapterProvider = 'sqlite' | 'postgresql';\n\nexport const currentDatabaseProfile: DatabaseProfile = '${provider}';\nexport const currentPrismaAdapterProvider: PrismaAdapterProvider = '${providerConfig[provider].betterAuthProvider}';\n`;

fs.writeFileSync(path.resolve(prismaDir, 'schema.prisma'), combinedSchema);
fs.writeFileSync(profileModulePath, profileModule);

console.log(`✅ Prisma schema and DB profile generated for provider: ${provider}`);
