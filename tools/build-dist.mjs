#!/usr/bin/env node

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRiceCookerSourceEvidence } from './lib/rice-cooker-source-evidence-validator.mjs';
import { buildShelfCatalog } from './lib/source-backed-shelf.mjs';
import { canonicalJson } from '../worker/src/rice-meal-selector.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_ROOT = path.join(ROOT, 'dist');
const BASE_STATIC_ASSETS = [
  'index.html',
  'manifest.json',
  'sw.js',
  'icon.svg',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
];
const RESEARCH_STATIC_ASSETS = ['source-recipes.html', 'recipes.html', 'cook.html'];
const GENERATED_ASSETS = [
  ['tools/data/foods-tw.json', 'foods-tw.json'],
  ['tools/data/recipe-library.json', 'recipe-library.json'],
  ['tools/data/ingredient-taxonomy.v1.json', 'ingredient-taxonomy.v1.json'],
  ['tools/data/meal-templates.v2.json', 'meal-templates.v2.json'],
  ['tools/data/ratio-rules.v1.json', 'ratio-rules.v1.json'],
  ['tools/data/recipe-runtime.v1.json', 'recipe-runtime.v1.json'],
  ['tools/data/recipe-action-profiles.v1.json', 'recipe-action-profiles.v1.json'],
  ['tools/data/rice-meal-catalog.v1.json', 'rice-meal-catalog.v1.json'],
  ['tools/data/rice-meal-collection.v1.json', 'rice-meal-collection.v1.json'],
  ['tools/data/rice-cooker-source-evidence.v1.json', 'rice-cooker-source-evidence.v1.json'],
  ['tools/data/source-backed-one-pot-preview.v1.json', 'source-backed-one-pot-preview.v1.json'],
  ['tools/data/generated/runtime-one-pot-catalog.v1.json', 'runtime-one-pot-catalog.v1.json'],
  ['tools/data/runtime-authority.v1.json', 'runtime-authority.v1.json'],
  ['tools/data/runtime-contract.schema.v1.json', 'runtime-contract.schema.v1.json'],
  ['tools/data/source-backed-release-ledger.v1.json', 'source-backed-release-ledger.v1.json'],
  ['tools/data/source-backed-formalization-ledger.v1.json', 'source-backed-formalization-ledger.v1.json'],
  ['tools/data/source-backed-execution-library.v1.json', 'source-backed-execution-library.v1.json'],
  ['tools/data/source-backed-formal-candidate-review.v1.json', 'source-backed-formal-candidate-review.v1.json'],
  ['tools/data/source-backed-formal-ratio-evidence.v1.json', 'source-backed-formal-ratio-evidence.v1.json'],
  ['tools/data/source-backed-formal-staging.v1.json', 'source-backed-formal-staging.v1.json'],
  ['tools/data/source-backed-coverage-matrix.v1.json', 'source-backed-coverage-matrix.v1.json'],
  ['tools/data/source-backed-formalization-matrix.v1.json', 'source-backed-formalization-matrix.v1.json'],
  ['tools/data/runtime-coverage-matrix.v1.json', 'runtime-coverage-matrix.v1.json'],
  ['tools/data/runtime-coverage-results.v1.json', 'runtime-coverage-results.v1.json'],
  ['tools/data/kitchen-trial-catalog.v1.json', 'kitchen-trial-catalog.v1.json'],
  ['worker/src/worker.js', '_worker.js'],
  ['worker/src/planner-v2.js', 'planner-v2.js'],
  ['worker/src/planner-coverage.js', 'planner-coverage.js'],
  ['worker/src/ratio-dsl.js', 'ratio-dsl.js'],
  ['worker/src/taxonomy-identity.js', 'taxonomy-identity.js'],
  ['worker/src/allergen-semantics.js', 'allergen-semantics.js'],
  ['worker/src/plan-presentation.js', 'plan-presentation.js'],
  ['worker/src/generated-plan-contract.js', 'generated-plan-contract.js'],
  ['worker/src/recipe-runtime-matcher.js', 'recipe-runtime-matcher.js'],
  ['worker/src/recipe-runtime-compiler.js', 'recipe-runtime-compiler.js'],
  ['worker/src/recipe-runtime-validator.js', 'recipe-runtime-validator.js'],
  ['worker/src/recipe-action-registry.js', 'recipe-action-registry.js'],
  ['worker/src/recipe-action-profile-validator.js', 'recipe-action-profile-validator.js'],
  ['worker/src/ingredient-taxonomy-validator.js', 'ingredient-taxonomy-validator.js'],
  ['worker/src/meal-template-validator.js', 'meal-template-validator.js'],
  ['worker/src/recipe-library-validator.js', 'recipe-library-validator.js'],
  ['worker/src/runtime-authority.js', 'runtime-authority.js'],
  ['worker/src/rice-meal-selector.js', 'rice-meal-selector.js'],
  ['worker/src/rice-meal-compiler.js', 'rice-meal-compiler.js'],
  ['worker/src/rice-meal-catalog-validator.js', 'rice-meal-catalog-validator.js'],
  ['worker/src/rice-cooker-source-evidence-validator.js', 'rice-cooker-source-evidence-validator.js'],
];
const COMPILED_BUILD_METADATA_SENTINEL = "'__YIGUOCHU_COMPILED_BUILD_METADATA_JSON__'";
const COMPILED_PLANNER_ASSETS_SENTINEL = "'__YIGUOCHU_COMPILED_PLANNER_ASSETS_JSON__'";
const SERVICE_WORKER_SHELL_SENTINEL = '__YIGUOCHU_SHELL_JSON__';

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/build-dist.mjs [--out-dir <directory>] [--build-id <id>] [--artifact-scope runtime|research|calibration] [--planner-rollout off|direct-recommend] [--generation-mode deterministic|llm] [--product-focus legacy|rice-meal-v1] [--rice-catalog-scope ready|calibration]');
  process.exitCode = 1;
}

function parseArgs(argumentsList) {
  const options = {
    outputDir: path.join(ROOT, 'dist'),
    artifactScope: 'runtime',
    buildId: new Date().toISOString().replace(/[^0-9A-Za-z]+/g, '-'),
    // The current product is the source-backed rice-meal rotation. Legacy
    // Planner builds remain available only when explicitly requested.
    plannerRollout: 'direct-recommend',
    generationMode: 'deterministic',
    productFocus: 'rice-meal-v1',
    riceCatalogScope: 'ready',
  };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--out-dir' || argument === '--build-id' || argument === '--artifact-scope'
        || argument === '--planner-rollout' || argument === '--generation-mode'
        || argument === '--product-focus' || argument === '--rice-catalog-scope') {
      const value = argumentsList[index + 1];
      if (!value || value.startsWith('--')) {
        usage(`${argument} requires a value.`);
        return null;
      }
      if (argument === '--out-dir') options.outputDir = path.resolve(value);
      if (argument === '--build-id') options.buildId = value;
      if (argument === '--artifact-scope') options.artifactScope = value;
      if (argument === '--planner-rollout') options.plannerRollout = value;
      if (argument === '--generation-mode') options.generationMode = value;
      if (argument === '--product-focus') options.productFocus = value;
      if (argument === '--rice-catalog-scope') options.riceCatalogScope = value;
      index += 1;
      continue;
    }
    usage(`Unknown argument: ${argument}`);
    return null;
  }

  const relativeToDist = path.relative(DIST_ROOT, options.outputDir);
  const isWithinDist = relativeToDist === ''
    || (!relativeToDist.startsWith('..') && !path.isAbsolute(relativeToDist));
  if (!isWithinDist) {
    // `dist` itself and its descendants are build artifacts. Anything else
    // could be source code or an unrelated directory, so must never be cleaned.
    usage('Output directory must be dist or one of its descendants.');
    return null;
  }
  if (!/^[0-9A-Za-z_-]+$/.test(options.buildId)) {
    usage('Build id may contain only letters, numbers, underscores, and hyphens.');
    return null;
  }
  if (!['off', 'direct-recommend'].includes(options.plannerRollout)) {
    usage('Planner rollout must be off or direct-recommend.');
    return null;
  }
  if (!['deterministic', 'llm'].includes(options.generationMode)) {
    usage('Generation mode must be deterministic or llm.');
    return null;
  }
  if (!['legacy', 'rice-meal-v1'].includes(options.productFocus)) {
    usage('Product focus must be legacy or rice-meal-v1.');
    return null;
  }
  if (!['ready', 'calibration'].includes(options.riceCatalogScope)) {
    usage('Rice catalog scope must be ready or calibration.');
    return null;
  }
  if (!['runtime', 'research', 'calibration'].includes(options.artifactScope)) {
    usage('Artifact scope must be runtime, research, or calibration.');
    return null;
  }
  if (options.productFocus === 'rice-meal-v1'
      && (options.plannerRollout !== 'direct-recommend' || options.generationMode !== 'deterministic')) {
    usage('rice-meal-v1 requires direct-recommend and deterministic build metadata.');
    return null;
  }
  return options;
}

function assertNoSymlinkInOutputPath(outputDir) {
  const relativeParts = path.relative(ROOT, outputDir).split(path.sep);
  let current = ROOT;
  for (const part of relativeParts) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) continue;
    if (fs.lstatSync(current).isSymbolicLink()) {
      throw new Error(`Output directory cannot traverse a symbolic link: ${current}`);
    }
  }
}

function copy(sourceRelativePath, outputPath) {
  const sourcePath = path.join(ROOT, sourceRelativePath);
  if (!fs.existsSync(sourcePath)) throw new Error(`Required build input is missing: ${sourceRelativePath}`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.copyFileSync(sourcePath, outputPath);
}

function shellEntries(includeResearch) {
  const shell = [
    './',
    './index.html',
    './recipes/',
    './recipes/index.html',
    './cook/',
    './cook/index.html',
    './manifest.json',
    './icon.svg',
    './icon-180.png',
    './icon-192.png',
    './icon-512.png',
  ];
  if (includeResearch) shell.push(
    './source-recipes.html',
    './source-recipes/',
    './source-recipes/index.html',
    './recipes.html',
    './cook.html',
  );
  return shell;
}

function readCanonicalJson(sourceRelativePath) {
  const sourcePath = path.join(ROOT, sourceRelativePath);
  try {
    return JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot embed canonical JSON ${sourceRelativePath}: ${error.message}`);
  }
}

function build({ outputDir, buildId, artifactScope, plannerRollout, generationMode, productFocus, riceCatalogScope }) {
  assertNoSymlinkInOutputPath(outputDir);
  if (fs.existsSync(outputDir) && !fs.lstatSync(outputDir).isDirectory()) {
    throw new Error(`Output path must be a directory: ${outputDir}`);
  }
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const includeResearch = artifactScope === 'research' || artifactScope === 'calibration';
  for (const asset of [...BASE_STATIC_ASSETS, ...(includeResearch ? RESEARCH_STATIC_ASSETS : [])]) {
    copy(asset, path.join(outputDir, asset));
  }
  // Research/calibration pages are deliberately outside the default runtime
  // package.  A runtime build must not expose the 923-card research browser.
  if (includeResearch) {
    // Cloudflare Pages can resolve `source-recipes.html` as `/source-recipes`,
    // but some browsers fail that extensionless preview route. Keep a real
    // directory index so the share URL has a stable trailing slash.
    copy('source-recipes.html', path.join(outputDir, 'source-recipes', 'index.html'));
  }
  // Runtime pages consume only the formal runtime catalog. Research builds
  // retain the 923-card source execution pages for audit/review journeys.
  copy(includeResearch ? 'recipes.html' : 'runtime-recipes.html', path.join(outputDir, 'recipes', 'index.html'));
  copy(includeResearch ? 'cook.html' : 'runtime-cook.html', path.join(outputDir, 'cook', 'index.html'));
  if (!includeResearch) {
    // Do not ship the research page aliases in a runtime package.
    for (const legacyPage of ['recipes.html', 'cook.html']) {
      const target = path.join(outputDir, legacyPage);
      if (fs.existsSync(target)) fs.rmSync(target);
    }
  }
  const publicRuntimeTargets = new Set([
    'foods-tw.json', 'recipe-library.json', 'ingredient-taxonomy.v1.json',
    'meal-templates.v2.json', 'ratio-rules.v1.json', 'recipe-runtime.v1.json',
    'recipe-action-profiles.v1.json', 'rice-meal-catalog.v1.json',
    'rice-meal-collection.v1.json', 'rice-cooker-source-evidence.v1.json',
    'runtime-one-pot-catalog.v1.json', 'runtime-authority.v1.json',
    'runtime-contract.schema.v1.json',
  ]);
  const researchTargets = new Set([
    'source-backed-one-pot-preview.v1.json',
    'source-backed-release-ledger.v1.json',
    'source-backed-formalization-ledger.v1.json',
    'source-backed-execution-library.v1.json',
    'source-backed-formal-candidate-review.v1.json',
    'source-backed-formal-ratio-evidence.v1.json',
    'source-backed-formal-staging.v1.json',
    'source-backed-coverage-matrix.v1.json',
    'source-backed-formalization-matrix.v1.json',
    'runtime-coverage-matrix.v1.json',
    'runtime-coverage-results.v1.json',
    'kitchen-trial-catalog.v1.json',
  ]);
  for (const [source, target] of GENERATED_ASSETS) {
    const include = publicRuntimeTargets.has(target)
      || (includeResearch && researchTargets.has(target))
      || target === '_worker.js'
      || target.endsWith('.js');
    if (include) copy(source, path.join(outputDir, target));
  }

  if (includeResearch) {
    const sourceBackedCatalog = readCanonicalJson('tools/data/source-backed-one-pot-recipes.v1.json');
    const shelfCatalog = buildShelfCatalog(sourceBackedCatalog);
    fs.writeFileSync(
      path.join(outputDir, 'source-backed-one-pot-shelf.v1.json'),
      `${JSON.stringify(shelfCatalog)}\n`,
      'utf8',
    );
  }

  const riceCookerSourceEvidence = readCanonicalJson('tools/data/rice-cooker-source-evidence.v1.json');
  const sourceEvidenceErrors = validateRiceCookerSourceEvidence(riceCookerSourceEvidence);
  if (sourceEvidenceErrors.length) {
    throw new Error(`Cannot build invalid rice-cooker source evidence: ${sourceEvidenceErrors.join('; ')}`);
  }
  const riceCookerSourceEvidenceSha256 = crypto.createHash('sha256')
    .update(canonicalJson(riceCookerSourceEvidence))
    .digest('hex');

  const workerPath = path.join(outputDir, '_worker.js');
  const sourceWorker = fs.readFileSync(workerPath, 'utf8');
  const buildMetadata = {
    buildId,
    plannerRollout,
    generationMode,
    productFocus,
    riceCatalogScope,
    artifactScope,
    runtimeAuthorityMode: 'shadow',
    runtimeCatalogVersion: 'runtime-one-pot-catalog-v1-20260813-c11',
    riceCookerSourceEvidenceVersion: riceCookerSourceEvidence.ledger_version,
    riceCookerSourceEvidenceSha256,
  };
  const embeddedPlannerAssets = {
    taxonomy: readCanonicalJson('tools/data/ingredient-taxonomy.v1.json'),
    templates: readCanonicalJson('tools/data/meal-templates.v2.json'),
    ratios: readCanonicalJson('tools/data/ratio-rules.v1.json'),
    recipes: readCanonicalJson('tools/data/recipe-library.json'),
    recipeRuntime: readCanonicalJson('tools/data/recipe-runtime.v1.json'),
    actionProfiles: readCanonicalJson('tools/data/recipe-action-profiles.v1.json'),
    riceMealCatalog: readCanonicalJson('tools/data/rice-meal-catalog.v1.json'),
    riceMealCollection: readCanonicalJson('tools/data/rice-meal-collection.v1.json'),
    riceCookerSourceEvidence,
  };
  const generatedWorker = sourceWorker
    .replace(
      COMPILED_BUILD_METADATA_SENTINEL,
      JSON.stringify(JSON.stringify(buildMetadata)),
    )
    .replace(
      COMPILED_PLANNER_ASSETS_SENTINEL,
      JSON.stringify(JSON.stringify(embeddedPlannerAssets)),
    );
  if (generatedWorker === sourceWorker
      || generatedWorker.includes(COMPILED_BUILD_METADATA_SENTINEL)
      || generatedWorker.includes(COMPILED_PLANNER_ASSETS_SENTINEL)) {
    throw new Error('Cannot embed canonical Worker metadata; update tools/build-dist.mjs for the current worker.js format.');
  }
  fs.writeFileSync(workerPath, generatedWorker, 'utf8');

  const serviceWorkerPath = path.join(outputDir, 'sw.js');
  const sourceServiceWorker = fs.readFileSync(serviceWorkerPath, 'utf8');
  const cacheKey = `yiguochu-shell-v5-${buildId}`;
  const generatedServiceWorker = sourceServiceWorker.replace(
    "const C = 'yiguochu-shell-v5';",
    `const C = '${cacheKey}';`,
  ).replace(
    `const ARTIFACT_SCOPE = '${'__YIGUOCHU_ARTIFACT_SCOPE__'}';`,
    `const ARTIFACT_SCOPE = '${artifactScope}';`,
  ).replace(SERVICE_WORKER_SHELL_SENTINEL, JSON.stringify(shellEntries(includeResearch)));
  if (generatedServiceWorker === sourceServiceWorker
      || generatedServiceWorker.includes('__YIGUOCHU_ARTIFACT_SCOPE__')) {
    throw new Error('Cannot inject the service-worker cache key; update tools/build-dist.mjs for the current sw.js format.');
  }
  fs.writeFileSync(serviceWorkerPath, generatedServiceWorker, 'utf8');

  const indexPath = path.join(outputDir, 'index.html');
  const sourceIndex = fs.readFileSync(indexPath, 'utf8');
  const generatedIndex = sourceIndex
    .replaceAll('__YIGUOCHU_BUILD_ID__', buildId)
    .replaceAll('__YIGUOCHU_PLANNER_ROLLOUT__', plannerRollout)
    .replaceAll('__YIGUOCHU_GENERATION_MODE__', generationMode)
    .replaceAll('__YIGUOCHU_PRODUCT_FOCUS__', productFocus);
  const scopedIndex = generatedIndex
    .replaceAll('__YIGUOCHU_RICE_CATALOG_SCOPE__', riceCatalogScope)
    .replaceAll('__YIGUOCHU_ARTIFACT_SCOPE__', artifactScope);
  if (generatedIndex === sourceIndex) {
    throw new Error('Cannot inject the frontend build id; update tools/build-dist.mjs for the current index.html format.');
  }
  fs.writeFileSync(indexPath, scopedIndex, 'utf8');

  fs.writeFileSync(
    path.join(outputDir, 'build-meta.json'),
    `${JSON.stringify(buildMetadata, null, 2)}\n`,
    'utf8',
  );

  console.log(JSON.stringify({
    outputDir,
    buildId,
    plannerRollout,
    generationMode,
    productFocus,
    riceCatalogScope,
    artifactScope,
    files: fs.readdirSync(outputDir, { recursive: true }).filter(entry => typeof entry === 'string' && fs.statSync(path.join(outputDir, entry)).isFile()).length,
  }));
}

const options = parseArgs(process.argv.slice(2));
if (options) {
  try {
    build(options);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
