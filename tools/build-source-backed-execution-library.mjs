import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSourceBackedExecutionLibrary } from './lib/source-backed-execution-library.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'tools', 'data', 'source-backed-one-pot-recipes.v1.json');
const outputPath = path.join(root, 'tools', 'data', 'source-backed-execution-library.v1.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const library = buildSourceBackedExecutionLibrary(catalog);
fs.writeFileSync(outputPath, `${JSON.stringify(library, null, 2)}\n`);
console.log(`source-backed execution library ${library.execution_library_version}: ${library.counts.total} cards · ${library.counts.source_complete} source-complete · ${library.counts.run_scope.research_only} research-only`);
