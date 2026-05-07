import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const provider = process.argv[2] || 'sqlite';
const validProviders = ['sqlite', 'postgres'];

if (!validProviders.includes(provider)) {
  console.error(`❌ Invalid provider: ${provider}. Must be one of: ${validProviders.join(', ')}`);
  process.exit(1);
}

const prismaDir = path.resolve(__dirname, '../prisma');
const generatedDir = path.resolve(prismaDir, 'generated');

if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

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

fs.writeFileSync(path.resolve(prismaDir, 'schema.prisma'), combinedSchema);

console.log(`✅ Prisma schema generated for provider: ${provider}`);
