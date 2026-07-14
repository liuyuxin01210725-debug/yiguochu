#!/usr/bin/env node
import fs from 'node:fs';
import { validateRecipeLibrary } from './lib/recipe-library-validator.mjs';

const file = new URL('./data/recipe-library.json', import.meta.url);
const lib = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = validateRecipeLibrary(lib);
for (const error of errors) console.error(`❌ ${error}`);
const familyCount = Array.isArray(lib?.families) ? lib.families.length : 0;
const recipeCount = Array.isArray(lib?.recipes) ? lib.recipes.length : 0;
console.log(`菜谱家族 ${familyCount} 个 · 基础菜谱 ${recipeCount} 道`);
console.log(errors.length ? `❌ 菜谱库体检不通过: ${errors.length} 项` : '✅ 菜谱库体检通过');
process.exit(errors.length ? 1 : 0);
