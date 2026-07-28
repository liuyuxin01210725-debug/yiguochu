#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_ROOT = path.join(ROOT, 'dist');
const STATIC_ASSETS = [
  'index.html',
  'recipes.html',
  'manifest.json',
  'sw.js',
  'icon.svg',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
];
const GENERATED_ASSETS = [
  ['tools/data/foods-tw.json', 'foods-tw.json'],
  ['tools/data/recipe-library.json', 'recipe-library.json'],
  ['tools/data/ingredient-taxonomy.v1.json', 'ingredient-taxonomy.v1.json'],
  ['tools/data/meal-templates.v2.json', 'meal-templates.v2.json'],
  ['tools/data/ratio-rules.v1.json', 'ratio-rules.v1.json'],
  ['worker/src/worker.js', '_worker.js'],
  ['worker/src/planner-v2.js', 'planner-v2.js'],
  ['worker/src/ratio-dsl.js', 'ratio-dsl.js'],
  ['worker/src/taxonomy-identity.js', 'taxonomy-identity.js'],
  ['worker/src/allergen-semantics.js', 'allergen-semantics.js'],
  ['worker/src/generated-plan-contract.js', 'generated-plan-contract.js'],
  ['worker/src/ingredient-taxonomy-validator.js', 'ingredient-taxonomy-validator.js'],
  ['worker/src/meal-template-validator.js', 'meal-template-validator.js'],
  ['worker/src/recipe-library-validator.js', 'recipe-library-validator.js'],
];

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/build-dist.mjs [--out-dir <directory>] [--build-id <id>] [--planner-rollout off|direct-recommend] [--generation-mode deterministic|llm]');
  process.exitCode = 1;
}

function parseArgs(argumentsList) {
  const options = {
    outputDir: path.join(ROOT, 'dist'),
    buildId: new Date().toISOString().replace(/[^0-9A-Za-z]+/g, '-'),
    plannerRollout: 'off',
    generationMode: 'llm',
  };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--out-dir' || argument === '--build-id'
        || argument === '--planner-rollout' || argument === '--generation-mode') {
      const value = argumentsList[index + 1];
      if (!value || value.startsWith('--')) {
        usage(`${argument} requires a value.`);
        return null;
      }
      if (argument === '--out-dir') options.outputDir = path.resolve(value);
      if (argument === '--build-id') options.buildId = value;
      if (argument === '--planner-rollout') options.plannerRollout = value;
      if (argument === '--generation-mode') options.generationMode = value;
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
  fs.copyFileSync(sourcePath, outputPath);
}

function build({ outputDir, buildId, plannerRollout, generationMode }) {
  assertNoSymlinkInOutputPath(outputDir);
  if (fs.existsSync(outputDir) && !fs.lstatSync(outputDir).isDirectory()) {
    throw new Error(`Output path must be a directory: ${outputDir}`);
  }
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  for (const asset of STATIC_ASSETS) copy(asset, path.join(outputDir, asset));
  for (const [source, target] of GENERATED_ASSETS) copy(source, path.join(outputDir, target));

  const serviceWorkerPath = path.join(outputDir, 'sw.js');
  const sourceServiceWorker = fs.readFileSync(serviceWorkerPath, 'utf8');
  const cacheKey = `yiguochu-shell-v4-${buildId}`;
  const generatedServiceWorker = sourceServiceWorker.replace(
    "const C = 'yiguochu-shell-v4';",
    `const C = '${cacheKey}';`,
  );
  if (generatedServiceWorker === sourceServiceWorker) {
    throw new Error('Cannot inject the service-worker cache key; update tools/build-dist.mjs for the current sw.js format.');
  }
  fs.writeFileSync(serviceWorkerPath, generatedServiceWorker, 'utf8');

  const indexPath = path.join(outputDir, 'index.html');
  const sourceIndex = fs.readFileSync(indexPath, 'utf8');
  const generatedIndex = sourceIndex
    .replaceAll('__YIGUOCHU_BUILD_ID__', buildId)
    .replaceAll('__YIGUOCHU_PLANNER_ROLLOUT__', plannerRollout)
    .replaceAll('__YIGUOCHU_GENERATION_MODE__', generationMode);
  if (generatedIndex === sourceIndex) {
    throw new Error('Cannot inject the frontend build id; update tools/build-dist.mjs for the current index.html format.');
  }
  fs.writeFileSync(indexPath, generatedIndex, 'utf8');

  fs.writeFileSync(
    path.join(outputDir, 'build-meta.json'),
    `${JSON.stringify({ buildId, plannerRollout, generationMode }, null, 2)}\n`,
    'utf8',
  );

  console.log(JSON.stringify({
    outputDir,
    buildId,
    plannerRollout,
    generationMode,
    files: STATIC_ASSETS.length + GENERATED_ASSETS.length + 1,
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
