import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

if (isSqlite) {
  console.log('Current DB profile: sqlite');
} else if (isPostgres) {
  console.log('Current DB profile: postgres');
} else {
  console.log('Current DB profile: unknown');
  process.exit(1);
}
