import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', '.next', 'node_modules']);
const textExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.prisma', '.css', '.yml', '.yaml']);
const errors = [];
const warnings = [];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(root);
for (const file of files) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  if (!textExt.has(path.extname(file)) && !['.env.example', '.gitignore'].includes(path.basename(file))) continue;
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }

  if (/^(<<<<<<<|=======|>>>>>>>)/m.test(text)) errors.push(`${rel}: marcador de conflito Git encontrado`);
  if (['.ts','.tsx','.js','.jsx','.mjs','.cjs'].includes(path.extname(file)) && rel !== 'scripts/preflight.mjs' && text.includes(['localhost', '10000'].join(':'))) errors.push(`${rel}: referência proibida a localhost:10000`);
  if (/new URL\([^\n]+,\s*req\.url\)/.test(text)) warnings.push(`${rel}: redirect baseado em req.url; prefira appUrl()`);
  if (/MERCADOPAGO_ACCESS_TOKEN\s*=\s*["'][A-Za-z0-9_-]{20,}/.test(text)) errors.push(`${rel}: possível token Mercado Pago gravado no código`);
  if (/TIKTOK_APP_SECRET\s*=\s*["'][^"']{12,}/.test(text)) errors.push(`${rel}: possível secret TikTok gravado no código`);
}

for (const required of [
  'package.json',
  'prisma/schema.prisma',
  'prisma/migrations/20260825040000_fluxtok_v4/migration.sql',
  'prisma/migrations/20260825170000_fluxtok_v43_pix/migration.sql',
  'prisma/migrations/20260825210000_safe_plan_changes/migration.sql',
  'lib/app-url.ts',
  'lib/legal.ts',
  'lib/flux-radar.ts',
  'app/(protected)/support/page.tsx',
  'app/superadmin/suporte/page.tsx',
  'SETUP_MERCADOPAGO.md',
  'UPGRADE_V4_SAME_REPO.md',
  'QA_LAUNCH.md',
]) {
  if (!fs.existsSync(path.join(root, required))) errors.push(`arquivo obrigatório ausente: ${required}`);
}

const v4Migration = path.join(root, 'prisma/migrations/20260825040000_fluxtok_v4/migration.sql');
if (fs.existsSync(v4Migration)) {
  const migrationText = fs.readFileSync(v4Migration, 'utf8');
  if (/\b(DROP\s+TABLE|TRUNCATE\s+TABLE|DELETE\s+FROM|DROP\s+COLUMN)\b/i.test(migrationText)) {
    errors.push('migration V4 contém operação destrutiva; revise antes do deploy');
  }
}

if (fs.existsSync(path.join(root, '.env'))) errors.push('.env real encontrado na raiz; não envie secrets ao GitHub');

console.log(`Fluxtok preflight: ${files.length} arquivos inspecionados.`);
for (const warning of warnings) console.warn(`AVISO: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERRO: ${error}`);
  process.exit(1);
}
console.log(`OK: sem conflitos Git, localhost:10000, secrets óbvios ou arquivos obrigatórios ausentes.${warnings.length ? ` ${warnings.length} aviso(s).` : ''}`);
