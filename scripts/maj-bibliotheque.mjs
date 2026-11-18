// Régénère lib/ à partir de la bibliothèque cookexpert-bt (MIT, Julien Deudon).
// Usage : node scripts/maj-bibliotheque.mjs <chemin du clone cookexpert-bt> [<chemin vers esbuild>]
// Les fichiers .ts sont convertis en JavaScript (types effacés), sans autre modification.
import { execFileSync } from 'node:child_process';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [source, esbuild = 'esbuild'] = process.argv.slice(2);
if (!source) {
  console.error('Usage : node scripts/maj-bibliotheque.mjs <clone cookexpert-bt> [esbuild]');
  process.exit(1);
}
const lib = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib');
const commit = execFileSync('git', ['-C', source, 'rev-parse', '--short', 'HEAD']).toString().trim();

for (const nom of ['protocole', 'balance', 'conversion']) {
  const ts = readFileSync(join(source, 'src', `${nom}.ts`), 'utf8');
  const js = execFileSync(esbuild, ['--loader=ts', '--format=esm', '--target=es2022', '--charset=utf8'], { input: ts })
    .toString()
    .replaceAll(/from ["']\.\/(\w+)\.ts["']/g, "from './$1.js'");
  const entete = `// Généré depuis cookexpert-bt (github.com/Julien-Deudon/cookexpert-bt), commit ${commit}.\n// Licence MIT © 2026 Julien Deudon — voir LICENSE-cookexpert-bt. Ne pas modifier à la main.\n`;
  writeFileSync(join(lib, `${nom}.js`), entete + js);
  console.log(`lib/${nom}.js`);
}
copyFileSync(join(source, 'LICENSE'), join(lib, 'LICENSE-cookexpert-bt'));
