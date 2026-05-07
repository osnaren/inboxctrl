import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type Violation = {
  file: string;
  message: string;
};

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), '..');
const siteRoot = path.join(repoRoot, 'apps', 'site');
const siteAppRoot = path.join(siteRoot, 'src', 'app');
const webRoot = path.join(repoRoot, 'apps', 'web');

const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx']);

const forbiddenPackagePrefixes = [
  '@googleapis/',
  '@inboxctrl/ai',
  '@inboxctrl/db',
  '@inboxctrl/gmail',
  '@inboxctrl/rule-engine',
  '@inboxctrl/sync-engine',
  '@prisma/client',
  'better-auth',
  'googleapis',
  'prisma',
];

const forbiddenRoutePrefixes = [
  'mail',
  'api/auth',
  'api/accounts',
  'api/sync',
  'api/labels',
  'api/mail',
  'api/actions',
  'api/filters',
  'api/ai',
  'api/settings',
  'api/pro',
];

const allowedApiRouteFiles = new Set(['api/search/route.ts', 'api/search/route.tsx']);

const violations: Violation[] = [];

const toDisplayPath = (filePath: string) => path.relative(repoRoot, filePath).replaceAll(path.sep, '/');

const readJson = (filePath: string) => {
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
};

const walkFiles = (dir: string): string[] => {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (entry === '.next' || entry === 'node_modules') {
        return [];
      }

      return walkFiles(fullPath);
    }

    return stats.isFile() ? [fullPath] : [];
  });
};

const isForbiddenPackage = (source: string) =>
  forbiddenPackagePrefixes.some((prefix) => source === prefix || source.startsWith(`${prefix}/`));

const isInsideWebApp = (filePath: string) => {
  const relative = path.relative(webRoot, filePath);
  return relative.length > 0 && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const resolveImport = (fromFile: string, source: string) => {
  if (!source.startsWith('.')) {
    return null;
  }

  return path.resolve(path.dirname(fromFile), source);
};

const collectImports = (contents: string) => {
  const imports = new Set<string>();
  const fromPattern = /(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g;
  const sideEffectPattern = /^\s*import\s+['"]([^'"]+)['"]/gm;

  for (const pattern of [fromPattern, sideEffectPattern]) {
    let match = pattern.exec(contents);

    while (match) {
      imports.add(match[1]);
      match = pattern.exec(contents);
    }
  }

  return imports;
};

const checkPackageManifest = () => {
  const packagePath = path.join(siteRoot, 'package.json');

  if (!existsSync(packagePath)) {
    violations.push({
      file: toDisplayPath(packagePath),
      message: 'apps/site must have its own package.json.',
    });
    return;
  }

  const manifest = readJson(packagePath);
  const dependencyGroups = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

  for (const group of dependencyGroups) {
    const dependencies = manifest[group];

    if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies)) {
      continue;
    }

    for (const dependency of Object.keys(dependencies)) {
      if (isForbiddenPackage(dependency)) {
        violations.push({
          file: toDisplayPath(packagePath),
          message: `Forbidden public-site dependency "${dependency}" in ${group}.`,
        });
      }
    }
  }
};

const checkImports = () => {
  for (const filePath of walkFiles(siteRoot)) {
    if (!sourceExtensions.has(path.extname(filePath))) {
      continue;
    }

    const contents = readFileSync(filePath, 'utf8');

    for (const source of collectImports(contents)) {
      if (isForbiddenPackage(source)) {
        violations.push({
          file: toDisplayPath(filePath),
          message: `Forbidden public-site import "${source}".`,
        });
      }

      if (source.includes('apps/web') || source.includes('apps\\web')) {
        violations.push({
          file: toDisplayPath(filePath),
          message: `Public site must not import web app internals: "${source}".`,
        });
      }

      const resolved = resolveImport(filePath, source);

      if (resolved && isInsideWebApp(resolved)) {
        violations.push({
          file: toDisplayPath(filePath),
          message: `Public site import resolves into apps/web: "${source}".`,
        });
      }
    }
  }
};

const routePrefixMatches = (relativePath: string, prefix: string) =>
  relativePath === prefix ||
  relativePath.startsWith(`${prefix}/`) ||
  relativePath.startsWith(`(${prefix})/`) ||
  relativePath.includes(`/(${prefix})/`);

const checkRoutes = () => {
  if (!existsSync(siteAppRoot)) {
    violations.push({
      file: toDisplayPath(siteAppRoot),
      message: 'apps/site/src/app is missing.',
    });
    return;
  }

  for (const filePath of walkFiles(siteAppRoot)) {
    const relativeFile = path.relative(siteAppRoot, filePath).replaceAll(path.sep, '/');

    if (relativeFile.startsWith('api/') && !allowedApiRouteFiles.has(relativeFile)) {
      violations.push({
        file: toDisplayPath(filePath),
        message: 'The only allowed public-site API route is api/search/route.ts for static docs search.',
      });
    }

    for (const prefix of forbiddenRoutePrefixes) {
      if (routePrefixMatches(relativeFile, prefix)) {
        violations.push({
          file: toDisplayPath(filePath),
          message: `Forbidden public-site route under "${prefix}".`,
        });
      }
    }
  }
};

checkPackageManifest();
checkImports();
checkRoutes();

if (violations.length > 0) {
  console.error('Public boundary check failed:');

  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.message}`);
  }

  process.exit(1);
}

console.log('Public boundary check passed.');
