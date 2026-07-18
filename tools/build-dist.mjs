#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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
  ['worker/src/worker.js', '_worker.js'],
];

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/build-dist.mjs [--out-dir <directory>] [--build-id <id>]');
  process.exitCode = 1;
}

function parseArgs(argumentsList) {
  const options = {
    outputDir: path.join(ROOT, 'dist'),
    buildId: new Date().toISOString().replace(/[^0-9A-Za-z]+/g, '-'),
  };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--out-dir' || argument === '--build-id') {
      const value = argumentsList[index + 1];
      if (!value || value.startsWith('--')) {
        usage(`${argument} requires a value.`);
        return null;
      }
      if (argument === '--out-dir') options.outputDir = path.resolve(value);
      if (argument === '--build-id') options.buildId = value;
      index += 1;
      continue;
    }
    usage(`Unknown argument: ${argument}`);
    return null;
  }

  if (path.resolve(options.outputDir) === ROOT) {
    usage('Output directory cannot be the project root.');
    return null;
  }
  if (!/^[0-9A-Za-z_-]+$/.test(options.buildId)) {
    usage('Build id may contain only letters, numbers, underscores, and hyphens.');
    return null;
  }
  return options;
}

function copy(sourceRelativePath, outputPath) {
  const sourcePath = path.join(ROOT, sourceRelativePath);
  if (!fs.existsSync(sourcePath)) throw new Error(`Required build input is missing: ${sourceRelativePath}`);
  fs.copyFileSync(sourcePath, outputPath);
}

function build({ outputDir, buildId }) {
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

  console.log(JSON.stringify({ outputDir, buildId, files: STATIC_ASSETS.length + GENERATED_ASSETS.length }));
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
