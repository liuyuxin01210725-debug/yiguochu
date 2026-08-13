#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateRecipeLibrary } from './lib/recipe-library-validator.mjs';
import { validateCoverageRecipePromotion } from './lib/coverage-recipe-promotion-gate.mjs';
import { validateIngredientTaxonomy } from './lib/ingredient-taxonomy-validator.mjs';
import { validateMealTemplateCatalog } from './lib/meal-template-validator.mjs';
import { validateRatioDslCatalog } from './lib/ratio-dsl-validator.mjs';
import { validateRecipeRuntimeCatalog } from './lib/recipe-runtime-validator.mjs';
import { validateRiceMealCatalog } from './lib/rice-meal-catalog-validator.mjs';
import { validateRiceMealCollection } from './lib/rice-meal-collection-validator.mjs';
import { validateRiceCookerSourceEvidence } from './lib/rice-cooker-source-evidence-validator.mjs';
import { buildRiceMealCollectionArtifacts } from './lib/rice-meal-collection-renderer.mjs';
import { canonicalJson } from '../worker/src/rice-meal-selector.js';
import { validateRegionalMenuResearch } from './lib/regional-menu-research-validator.mjs';
import { validateMenuVerificationCases } from './lib/menu-verification-validator.mjs';
import { buildMenuMaster, validateMenuMaster, validateMenuMasterBaseline } from './lib/menu-master-builder.mjs';
import { buildMenuMasterArtifacts } from './lib/menu-master-renderer.mjs';
import { validateRegionalAtlas } from './lib/regional-atlas-validator.mjs';
import { validateRegionalMenuMappings } from './lib/regional-menu-mapping-validator.mjs';
import {
  buildRegionalAtlasReport,
  formatRegionalAtlasSummary,
  validateRegionalAtlasReport,
} from './lib/regional-atlas-builder.mjs';
import { buildRegionalAtlasArtifacts } from './lib/regional-atlas-renderer.mjs';
import { validateNortheastStewResearch } from './lib/northeast-stew-research-validator.mjs';
import {
  buildNortheastStewResearchReport,
  validateNortheastStewResearchReport,
} from './lib/northeast-stew-research-builder.mjs';
import { buildNortheastStewResearchArtifacts } from './lib/northeast-stew-research-renderer.mjs';
import { validateNortheastStewNumericEvidence } from './lib/northeast-stew-numeric-evidence-validator.mjs';
import {
  buildNortheastStewNumericEvidenceReport,
  formatNortheastStewNumericEvidenceSummary,
  validateNortheastStewNumericEvidenceReport,
} from './lib/northeast-stew-numeric-evidence-builder.mjs';
import { buildNortheastStewNumericEvidenceArtifacts } from './lib/northeast-stew-numeric-evidence-renderer.mjs';
import { validateNortheastStewSafetyEvidence } from './lib/northeast-stew-safety-evidence-validator.mjs';
import {
  buildNortheastStewSafetyEvidenceReport,
  formatNortheastStewSafetyEvidenceSummary,
  validateNortheastStewSafetyEvidenceReport,
} from './lib/northeast-stew-safety-evidence-builder.mjs';
import { buildNortheastStewSafetyEvidenceArtifacts } from './lib/northeast-stew-safety-evidence-renderer.mjs';
import { validateJiangnanRiceResearch } from './lib/jiangnan-rice-research-validator.mjs';
import {
  buildJiangnanRiceResearchReport,
  validateJiangnanRiceResearchReport,
} from './lib/jiangnan-rice-research-builder.mjs';
import { buildJiangnanRiceResearchArtifacts } from './lib/jiangnan-rice-research-renderer.mjs';
import { validateShandongOnePotResearch } from './lib/shandong-one-pot-research-validator.mjs';
import {
  buildShandongOnePotResearchReport,
  formatShandongOnePotResearchSummary,
  validateShandongOnePotResearchReport,
} from './lib/shandong-one-pot-research-builder.mjs';
import { buildShandongOnePotResearchArtifacts } from './lib/shandong-one-pot-research-renderer.mjs';
import { validateCentralPlainsNoodleResearch } from './lib/central-plains-noodle-research-validator.mjs';
import {
  buildCentralPlainsNoodleResearchReport,
  formatCentralPlainsNoodleResearchSummary,
  validateCentralPlainsNoodleResearchReport,
} from './lib/central-plains-noodle-research-builder.mjs';
import { buildCentralPlainsNoodleResearchArtifacts } from './lib/central-plains-noodle-research-renderer.mjs';
import { validateMiddleYangtzeMainMealResearch } from './lib/middle-yangtze-main-meal-research-validator.mjs';
import {
  buildMiddleYangtzeMainMealResearchReport,
  formatMiddleYangtzeMainMealResearchSummary,
  validateMiddleYangtzeMainMealResearchReport,
} from './lib/middle-yangtze-main-meal-research-builder.mjs';
import { buildMiddleYangtzeMainMealResearchArtifacts } from './lib/middle-yangtze-main-meal-research-renderer.mjs';
import { validateFujianTaiwanRiceNoodleResearch } from './lib/fujian-taiwan-rice-noodle-research-validator.mjs';
import {
  buildFujianTaiwanRiceNoodleResearchReport,
  formatFujianTaiwanRiceNoodleResearchSummary,
  validateFujianTaiwanRiceNoodleResearchReport,
} from './lib/fujian-taiwan-rice-noodle-research-builder.mjs';
import { buildFujianTaiwanRiceNoodleResearchArtifacts } from './lib/fujian-taiwan-rice-noodle-research-renderer.mjs';
import { validateJingjinjiJinmengOnePotResearch } from './lib/jingjinji-jinmeng-one-pot-research-validator.mjs';
import {
  buildJingjinjiJinmengOnePotResearchReport,
  formatJingjinjiJinmengOnePotResearchSummary,
  validateJingjinjiJinmengOnePotResearchReport,
} from './lib/jingjinji-jinmeng-one-pot-research-builder.mjs';
import { buildJingjinjiJinmengOnePotResearchArtifacts } from './lib/jingjinji-jinmeng-one-pot-research-renderer.mjs';
import { validateSichuanChongqingRiceResearch } from './lib/sichuan-chongqing-rice-research-validator.mjs';
import {
  buildSichuanChongqingRiceResearchReport,
  formatSichuanChongqingRiceResearchSummary,
  validateSichuanChongqingRiceResearchReport,
} from './lib/sichuan-chongqing-rice-research-builder.mjs';
import { buildSichuanChongqingRiceResearchArtifacts } from './lib/sichuan-chongqing-rice-research-renderer.mjs';
import { validateYunnanGuizhouRiceResearch } from './lib/yunnan-guizhou-rice-research-validator.mjs';
import {
  buildYunnanGuizhouRiceResearchReport,
  formatYunnanGuizhouRiceResearchSummary,
  validateYunnanGuizhouRiceResearchReport,
} from './lib/yunnan-guizhou-rice-research-builder.mjs';
import { buildYunnanGuizhouRiceResearchArtifacts } from './lib/yunnan-guizhou-rice-research-renderer.mjs';
import {
  readJson as readSourceBackedJson,
  validateSourceBackedCatalogFiles,
} from './check-source-backed-one-pot-catalog.mjs';
import { validateSourceBackedPreviewManifest } from './lib/source-backed-preview-manifest.mjs';
import { validateSourceBackedFormalizationLedger } from './lib/source-backed-formalization-ledger.mjs';
import { validateSourceBackedExecutionLibrary } from './lib/source-backed-execution-library.mjs';
import { validateSourceBackedFormalCandidateReview } from './lib/source-backed-formal-candidate-review.mjs';
import { validateSourceBackedFormalStaging } from './lib/source-backed-formal-staging.mjs';
import { validateSourceBackedFormalRatioEvidence } from './lib/source-backed-formal-ratio-evidence.mjs';
import { validateSourceBackedRuntimeCatalog } from './lib/source-backed-runtime-catalog.mjs';
import { validateSourceBackedCoverageMatrix } from './lib/source-backed-coverage-matrix.mjs';

const file = new URL('./data/recipe-library.json', import.meta.url);
const lib = JSON.parse(fs.readFileSync(file, 'utf8'));
const recipeLibraryErrors = validateRecipeLibrary(lib);
const errors = [...recipeLibraryErrors];
const sourceBackedCatalogInputErrors = [];
let sourceBackedCatalog = { recipes: [] };
let sourceBackedMigration = { items: [] };
let sourceBackedPreviewManifest = { counts: {}, records: [], blocked: [] };
let sourceBackedFormalizationLedger = { counts: {}, records: [] };
let sourceBackedExecutionLibrary = { counts: {}, entries: [] };
let sourceBackedFormalCandidateReview = { counts: {}, records: [] };
let sourceBackedFormalStaging = { counts: {}, records: [] };
let sourceBackedFormalRatioEvidence = { counts: {}, entries: [] };
let sourceBackedRuntimeCatalog = { entries: [] };
let sourceBackedCoverageMatrix = { records: [] };
for (const [relativePath, assign] of [
  ['tools/data/source-backed-one-pot-recipes.v1.json', value => { sourceBackedCatalog = value; }],
  ['tools/data/source-backed-catalog-migration.v1.json', value => { sourceBackedMigration = value; }],
  ['tools/data/source-backed-one-pot-preview.v1.json', value => { sourceBackedPreviewManifest = value; }],
  ['tools/data/source-backed-formalization-ledger.v1.json', value => { sourceBackedFormalizationLedger = value; }],
  ['tools/data/source-backed-execution-library.v1.json', value => { sourceBackedExecutionLibrary = value; }],
  ['tools/data/source-backed-formal-candidate-review.v1.json', value => { sourceBackedFormalCandidateReview = value; }],
  ['tools/data/source-backed-formal-staging.v1.json', value => { sourceBackedFormalStaging = value; }],
  ['tools/data/source-backed-formal-ratio-evidence.v1.json', value => { sourceBackedFormalRatioEvidence = value; }],
  ['tools/data/source-backed-runtime-catalog.v1.json', value => { sourceBackedRuntimeCatalog = value; }],
  ['tools/data/source-backed-coverage-matrix.v1.json', value => { sourceBackedCoverageMatrix = value; }],
]) {
  try {
    assign(readSourceBackedJson(relativePath));
  } catch (error) {
    sourceBackedCatalogInputErrors.push(
      `${relativePath} could not be read: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
const sourceBackedArtifactContents = new Map();
for (const relativePath of [
  'docs/source-backed-one-pot-recipes.md',
  'docs/source-backed-one-pot-recipes.csv',
  'docs/source-backed-one-pot-recipe-gaps.md',
  'docs/source-backed-one-pot-research-methods.md',
]) {
  const artifactUrl = new URL(`../${relativePath}`, import.meta.url);
  if (fs.existsSync(artifactUrl)) sourceBackedArtifactContents.set(relativePath, fs.readFileSync(artifactUrl, 'utf8'));
}
const sourceBackedCatalogErrors = [
  ...sourceBackedCatalogInputErrors,
  ...validateSourceBackedCatalogFiles({
    catalog: sourceBackedCatalog,
    migration: sourceBackedMigration,
    artifactContents: sourceBackedArtifactContents,
  }),
];
errors.push(...sourceBackedCatalogErrors);
const sourceBackedPreviewErrors = validateSourceBackedPreviewManifest(
  sourceBackedPreviewManifest,
  sourceBackedCatalog,
);
errors.push(...sourceBackedPreviewErrors.map(error => `source-backed preview manifest: ${error}`));
const sourceBackedFormalizationErrors = validateSourceBackedFormalizationLedger(
  sourceBackedFormalizationLedger,
  sourceBackedCatalog,
);
errors.push(...sourceBackedFormalizationErrors.map(error => `source-backed formalization ledger: ${error}`));
const sourceBackedExecutionErrors = validateSourceBackedExecutionLibrary(
  sourceBackedExecutionLibrary,
  sourceBackedCatalog,
);
errors.push(...sourceBackedExecutionErrors.map(error => `source-backed execution library: ${error}`));
const menuMasterInputErrors = [];
const regionalAtlasInputErrors = [];
const northeastResearchInputErrors = [];
const northeastNumericEvidenceInputErrors = [];
const northeastSafetyEvidenceInputErrors = [];
const jiangnanResearchInputErrors = [];
const shandongResearchInputErrors = [];
const centralPlainsResearchInputErrors = [];
const middleYangtzeResearchInputErrors = [];
const fujianTaiwanResearchInputErrors = [];
const northChinaResearchInputErrors = [];
const sichuanChongqingResearchInputErrors = [];
const yunnanGuizhouResearchInputErrors = [];
const riceCookerSourceEvidenceInputErrors = [];
function readReviewLedger(relativePath, label, inputErrors = menuMasterInputErrors) {
  const fileUrl = new URL(relativePath, import.meta.url);
  if (!fs.existsSync(fileUrl)) {
    inputErrors.push(`${label} is missing`);
    return {};
  }
  return JSON.parse(fs.readFileSync(fileUrl, 'utf8'));
}
const coverageCandidates = JSON.parse(fs.readFileSync(new URL('./data/coverage-recipe-candidates.json', import.meta.url), 'utf8'));
const recipeCandidates = JSON.parse(fs.readFileSync(new URL('./data/recipe-candidates.json', import.meta.url), 'utf8'));
const coverageDrafts = JSON.parse(fs.readFileSync(new URL('./data/coverage-recipe-drafts.json', import.meta.url), 'utf8'));
const coveragePromotions = JSON.parse(fs.readFileSync(new URL('./data/coverage-recipe-promotions.json', import.meta.url), 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(new URL('./data/ingredient-taxonomy.v1.json', import.meta.url), 'utf8'));
const templates = JSON.parse(fs.readFileSync(new URL('./data/meal-templates.v2.json', import.meta.url), 'utf8'));
const ratios = JSON.parse(fs.readFileSync(new URL('./data/ratio-rules.v1.json', import.meta.url), 'utf8'));
const sourceBackedFormalCandidateReviewErrors = validateSourceBackedFormalCandidateReview(
  sourceBackedFormalCandidateReview,
  sourceBackedCatalog,
  taxonomy,
  ratios,
  sourceBackedFormalRatioEvidence,
);
errors.push(...sourceBackedFormalCandidateReviewErrors.map(error => `source-backed formal candidate review: ${error}`));
const sourceBackedFormalRatioEvidenceErrors = validateSourceBackedFormalRatioEvidence(
  sourceBackedFormalRatioEvidence,
  sourceBackedCatalog,
);
errors.push(...sourceBackedFormalRatioEvidenceErrors.map(error => `source-backed formal ratio evidence: ${error}`));
const sourceBackedFormalStagingErrors = validateSourceBackedFormalStaging(
  sourceBackedFormalStaging,
  sourceBackedCatalog,
  sourceBackedFormalCandidateReview,
);
errors.push(...sourceBackedFormalStagingErrors.map(error => `source-backed formal staging: ${error}`));
const sourceBackedRuntimeCatalogErrors = validateSourceBackedRuntimeCatalog(
  sourceBackedRuntimeCatalog,
  {
    sourceCatalog: sourceBackedCatalog,
    executionLibrary: sourceBackedExecutionLibrary,
    formalizationLedger: sourceBackedFormalizationLedger,
  },
);
errors.push(...sourceBackedRuntimeCatalogErrors.map(error => `source-backed runtime catalog: ${error}`));
const sourceBackedCoverageMatrixInputs = {
  sourceCatalog: sourceBackedCatalog,
  executionLibrary: sourceBackedExecutionLibrary,
  formalizationLedger: sourceBackedFormalizationLedger,
  formalReview: sourceBackedFormalCandidateReview,
  formalStaging: sourceBackedFormalStaging,
  formalRecipeLibrary: lib,
  runtimeJourneys: readReviewLedger('./data/recipe-runtime-journeys.v1.json', 'recipe runtime journeys'),
  riceMealJourneys: readReviewLedger('./data/rice-meal-journeys.v1.json', 'rice meal journeys'),
  directRecommendShadow: readReviewLedger('./data/direct-recommend-shadow-v1.json', 'direct recommend shadow'),
  ratioEvidence: sourceBackedFormalRatioEvidence,
};
const sourceBackedCoverageMatrixErrors = validateSourceBackedCoverageMatrix(
  sourceBackedCoverageMatrix,
  sourceBackedCoverageMatrixInputs,
);
errors.push(...sourceBackedCoverageMatrixErrors.map(error => `source-backed coverage matrix: ${error}`));
const riceMealCatalog = JSON.parse(fs.readFileSync(new URL('./data/rice-meal-catalog.v1.json', import.meta.url), 'utf8'));
const riceMealCollection = JSON.parse(fs.readFileSync(new URL('./data/rice-meal-collection.v1.json', import.meta.url), 'utf8'));
const riceCookerSourceEvidence = readReviewLedger(
  './data/rice-cooker-source-evidence.v1.json',
  'rice-cooker source evidence ledger',
  riceCookerSourceEvidenceInputErrors,
);
const recipeRuntimeCatalog = JSON.parse(fs.readFileSync(new URL('./data/recipe-runtime.v1.json', import.meta.url), 'utf8'));
const recipeActionProfiles = JSON.parse(fs.readFileSync(new URL('./data/recipe-action-profiles.v1.json', import.meta.url), 'utf8'));
const regionalResearch = readReviewLedger('./data/regional-menu-research.v1.json', 'regional menu research ledger');
const verificationCases = readReviewLedger('./data/menu-verification-cases.v1.json', 'menu verification cases ledger');
const menuMasterBaseline = readReviewLedger('./data/menu-master-baseline.v1.json', 'menu master Phase Zero baseline');
const regionalAtlas = readReviewLedger('./data/regional-atlas.v2.json', 'regional atlas catalog', regionalAtlasInputErrors);
const regionalMenuMappings = readReviewLedger('./data/regional-menu-mappings.v1.json', 'regional menu mapping ledger', regionalAtlasInputErrors);
const northeastResearch = readReviewLedger('./data/northeast-stew-research.v1.json', 'northeast stew research assessment', northeastResearchInputErrors);
const northeastNumericEvidence = readReviewLedger('./data/northeast-stew-numeric-evidence.v1.json', 'northeast numeric evidence ledger', northeastNumericEvidenceInputErrors);
const northeastSafetyEvidence = readReviewLedger('./data/northeast-stew-safety-evidence.v1.json', 'northeast safety evidence ledger', northeastSafetyEvidenceInputErrors);
const jiangnanResearch = readReviewLedger('./data/jiangnan-rice-research.v1.json', 'Jiangnan rice research assessment', jiangnanResearchInputErrors);
const shandongResearch = readReviewLedger('./data/shandong-one-pot-research.v1.json', 'Shandong one-pot research assessment', shandongResearchInputErrors);
const centralPlainsResearch = readReviewLedger('./data/central-plains-noodle-research.v1.json', 'Central Plains noodle research assessment', centralPlainsResearchInputErrors);
const middleYangtzeResearch = readReviewLedger('./data/middle-yangtze-main-meal-research.v1.json', 'Middle Yangtze main-meal research assessment', middleYangtzeResearchInputErrors);
const fujianTaiwanResearch = readReviewLedger('./data/fujian-taiwan-rice-noodle-research.v1.json', 'Fujian-Taiwan rice-noodle research assessment', fujianTaiwanResearchInputErrors);
const northChinaResearch = readReviewLedger('./data/jingjinji-jinmeng-one-pot-research.v1.json', 'Jingjinji-Jinmeng one-pot research assessment', northChinaResearchInputErrors);
const sichuanChongqingResearch = readReviewLedger('./data/sichuan-chongqing-rice-research.v1.json', 'Sichuan-Chongqing rice research assessment', sichuanChongqingResearchInputErrors);
const yunnanGuizhouResearch = readReviewLedger('./data/yunnan-guizhou-rice-research.v1.json', 'Yunnan-Guizhou rice research assessment', yunnanGuizhouResearchInputErrors);
errors.push(...validateCoverageRecipePromotion({
  candidates: coverageCandidates,
  drafts: coverageDrafts,
  promotions: coveragePromotions.promotions,
  production: lib,
}));
const taxonomyErrors = validateIngredientTaxonomy(taxonomy);
const templateErrors = validateMealTemplateCatalog(templates, taxonomy, lib, ratios, riceMealCatalog);
const ratioErrors = validateRatioDslCatalog(ratios, templates, taxonomy, lib, riceMealCatalog);
const riceMealCatalogErrors = validateRiceMealCatalog(riceMealCatalog, {
  recipeLibrary: lib,
  sourceEvidence: riceCookerSourceEvidence,
  taxonomy,
  ratioCatalog: ratios,
  collection: riceMealCollection,
});
const riceMealCollectionErrors = validateRiceMealCollection(riceMealCollection, { taxonomy, catalog: riceMealCatalog });
const riceCookerSourceEvidenceErrors = [
  ...riceCookerSourceEvidenceInputErrors,
  ...validateRiceCookerSourceEvidence(riceCookerSourceEvidence),
];
const riceMealCollectionArtifactErrors = [];
if (riceMealCollectionErrors.length === 0) {
  for (const [relativePath, content] of buildRiceMealCollectionArtifacts(riceMealCollection)) {
    const artifact = new URL(`../${relativePath}`, import.meta.url);
    if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
      riceMealCollectionArtifactErrors.push(`${relativePath} is missing or stale; run node tools/build-rice-meal-collection.mjs --write`);
    }
  }
}
const recipeRuntimeErrors = validateRecipeRuntimeCatalog(recipeRuntimeCatalog, {
  recipes: lib,
  taxonomy,
  templates,
  ratios,
  actionProfiles: recipeActionProfiles,
});
errors.push(
  ...taxonomyErrors,
  ...templateErrors,
  ...ratioErrors,
  ...riceCookerSourceEvidenceErrors,
  ...riceMealCatalogErrors,
  ...riceMealCollectionErrors,
  ...riceMealCollectionArtifactErrors,
  ...recipeRuntimeErrors,
);
const recipes = Array.isArray(lib.recipes) ? lib.recipes : [];
const families = Array.isArray(lib.families) ? lib.families : [];
const recipeIds = new Set(recipes.filter(recipe => recipe && typeof recipe === 'object').map(recipe => recipe.id));
const familyIds = new Set(families.filter(family => family && typeof family === 'object').map(family => family.id));
const menuMasterSourceErrors = [
  ...menuMasterInputErrors,
  ...validateRegionalMenuResearch(regionalResearch, recipeIds),
  ...validateMenuVerificationCases(verificationCases, recipeIds, familyIds),
];
errors.push(...menuMasterSourceErrors);
const menuMasterErrors = [];
let menuMaster;
if (recipeLibraryErrors.length === 0 && taxonomyErrors.length === 0 && menuMasterSourceErrors.length === 0) {
  menuMaster = buildMenuMaster({
    recipeLibrary: { ...lib, recipes, families },
    taxonomy: { ...taxonomy, items: Array.isArray(taxonomy?.items) ? taxonomy.items : [] },
    regionalResearch,
    verificationCases,
  });
  menuMasterErrors.push(
    ...validateMenuMaster(menuMaster),
    ...validateMenuMasterBaseline(menuMaster, menuMasterBaseline),
  );
  if (menuMasterErrors.length === 0) {
    for (const [relativePath, content] of buildMenuMasterArtifacts(menuMaster)) {
      const artifact = new URL(`../${relativePath}`, import.meta.url);
      if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
        menuMasterErrors.push(`${relativePath} is missing or stale; run node tools/build-menu-master.mjs --write intentionally`);
      }
    }
  }
}
errors.push(...menuMasterErrors);
const regionalAtlasSourceErrors = [
  ...regionalAtlasInputErrors,
  ...validateRegionalAtlas(regionalAtlas),
  ...validateRegionalMenuMappings({
    mappings: regionalMenuMappings,
    atlas: regionalAtlas,
    recipeLibrary: lib,
    regionalResearch,
    templates,
    taxonomy,
    ratios,
  }),
];
errors.push(...regionalAtlasSourceErrors);
const regionalAtlasErrors = [];
let regionalAtlasReport;
if (recipeLibraryErrors.length === 0
  && menuMasterSourceErrors.length === 0
  && regionalAtlasSourceErrors.length === 0) {
  regionalAtlasReport = buildRegionalAtlasReport({
    atlas: regionalAtlas,
    mappings: regionalMenuMappings,
    recipeLibrary: lib,
    regionalResearch,
  });
  regionalAtlasErrors.push(...validateRegionalAtlasReport(regionalAtlasReport));
  if (regionalAtlasErrors.length === 0) {
    for (const [relativePath, content] of buildRegionalAtlasArtifacts(regionalAtlasReport)) {
      const artifact = new URL(`../${relativePath}`, import.meta.url);
      if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
        regionalAtlasErrors.push(`${relativePath} is missing or stale; run node tools/build-regional-atlas.mjs --write intentionally`);
      }
    }
  }
}
errors.push(...regionalAtlasErrors);
const northeastResearchSourceErrors = [
  ...northeastResearchInputErrors,
  ...validateNortheastStewResearch({
    assessment: northeastResearch,
    regionalAtlas,
    regionalResearch,
    taxonomy,
  }),
];
errors.push(...northeastResearchSourceErrors);
const northeastResearchErrors = [];
let northeastResearchReport;
if (regionalAtlasSourceErrors.length === 0 && menuMasterSourceErrors.length === 0 && northeastResearchSourceErrors.length === 0) {
  northeastResearchReport = buildNortheastStewResearchReport({
    assessment: northeastResearch,
    regionalAtlas,
    regionalResearch,
  });
  northeastResearchErrors.push(...validateNortheastStewResearchReport(northeastResearchReport));
  if (northeastResearchErrors.length === 0) {
    for (const [relativePath, content] of buildNortheastStewResearchArtifacts(northeastResearchReport)) {
      const artifact = new URL(`../${relativePath}`, import.meta.url);
      if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
        northeastResearchErrors.push(`${relativePath} is missing or stale; run node tools/build-northeast-stew-research.mjs --write intentionally`);
      }
    }
  }
}
errors.push(...northeastResearchErrors);
const northeastNumericEvidenceSourceErrors = [
  ...northeastNumericEvidenceInputErrors,
  ...validateNortheastStewNumericEvidence(northeastNumericEvidence, northeastResearch.calibration_cases),
];
errors.push(...northeastNumericEvidenceSourceErrors);
const northeastNumericEvidenceErrors = [];
let northeastNumericEvidenceReport;
if (northeastNumericEvidenceSourceErrors.length === 0) {
  northeastNumericEvidenceReport = buildNortheastStewNumericEvidenceReport(northeastNumericEvidence, northeastResearch.calibration_cases);
  northeastNumericEvidenceErrors.push(...validateNortheastStewNumericEvidenceReport(northeastNumericEvidenceReport));
  if (northeastNumericEvidenceErrors.length === 0) {
    for (const [relativePath, content] of buildNortheastStewNumericEvidenceArtifacts(northeastNumericEvidenceReport)) {
      const artifact = new URL(`../${relativePath}`, import.meta.url);
      if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
        northeastNumericEvidenceErrors.push(`${relativePath} is missing or stale; run node tools/build-northeast-stew-numeric-evidence.mjs --write intentionally`);
      }
    }
  }
}
errors.push(...northeastNumericEvidenceErrors);
const northeastSafetyEvidenceSourceErrors = [
  ...northeastSafetyEvidenceInputErrors,
  ...validateNortheastStewSafetyEvidence({
    ledger: northeastSafetyEvidence,
    research: northeastResearch,
    taxonomy,
  }),
];
errors.push(...northeastSafetyEvidenceSourceErrors);
const northeastSafetyEvidenceErrors = [];
let northeastSafetyEvidenceReport;
if (northeastSafetyEvidenceSourceErrors.length === 0 && northeastNumericEvidenceSourceErrors.length === 0) {
  try {
    northeastSafetyEvidenceReport = buildNortheastStewSafetyEvidenceReport({
      ledger: northeastSafetyEvidence,
      research: northeastResearch,
      taxonomy,
      numericEvidence: northeastNumericEvidence,
    });
    northeastSafetyEvidenceErrors.push(...validateNortheastStewSafetyEvidenceReport(northeastSafetyEvidenceReport));
    if (northeastSafetyEvidenceErrors.length === 0) {
      for (const [relativePath, content] of buildNortheastStewSafetyEvidenceArtifacts(northeastSafetyEvidenceReport)) {
        const artifact = new URL(`../${relativePath}`, import.meta.url);
        if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
          northeastSafetyEvidenceErrors.push(`${relativePath} is missing or stale; run node tools/build-northeast-stew-safety-evidence.mjs --write intentionally`);
        }
      }
    }
  } catch (error) {
    northeastSafetyEvidenceErrors.push(error instanceof Error ? error.message : String(error));
  }
}
errors.push(...northeastSafetyEvidenceErrors);
const jiangnanResearchSourceErrors = [
  ...jiangnanResearchInputErrors,
  ...validateJiangnanRiceResearch({
    assessment: jiangnanResearch,
    recipeLibrary: lib,
    recipeCandidates,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  }),
];
errors.push(...jiangnanResearchSourceErrors);
const jiangnanResearchErrors = [];
let jiangnanResearchReport;
if (recipeLibraryErrors.length === 0
  && regionalAtlasSourceErrors.length === 0
  && menuMasterSourceErrors.length === 0
  && jiangnanResearchSourceErrors.length === 0) {
  jiangnanResearchReport = buildJiangnanRiceResearchReport({
    assessment: jiangnanResearch,
    recipeLibrary: lib,
    recipeCandidates,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  });
  jiangnanResearchErrors.push(...validateJiangnanRiceResearchReport(jiangnanResearchReport));
  if (jiangnanResearchErrors.length === 0) {
    for (const [relativePath, content] of buildJiangnanRiceResearchArtifacts(jiangnanResearchReport)) {
      const artifact = new URL(`../${relativePath}`, import.meta.url);
      if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
        jiangnanResearchErrors.push(`${relativePath} is missing or stale; run node tools/build-jiangnan-rice-research.mjs --write intentionally`);
      }
    }
  }
}
errors.push(...jiangnanResearchErrors);
const shandongResearchSourceErrors = [
  ...shandongResearchInputErrors,
  ...validateShandongOnePotResearch({
    assessment: shandongResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  }),
];
errors.push(...shandongResearchSourceErrors);
const shandongResearchErrors = [];
let shandongResearchReport;
if (recipeLibraryErrors.length === 0
  && regionalAtlasSourceErrors.length === 0
  && menuMasterSourceErrors.length === 0
  && shandongResearchSourceErrors.length === 0) {
  shandongResearchReport = buildShandongOnePotResearchReport({
    assessment: shandongResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  });
  shandongResearchErrors.push(...validateShandongOnePotResearchReport(shandongResearchReport));
  if (shandongResearchErrors.length === 0) {
    for (const [relativePath, content] of buildShandongOnePotResearchArtifacts(shandongResearchReport)) {
      const artifact = new URL(`../${relativePath}`, import.meta.url);
      if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
        shandongResearchErrors.push(`${relativePath} is missing or stale; run node tools/build-shandong-one-pot-research.mjs --write intentionally`);
      }
    }
  }
}
errors.push(...shandongResearchErrors);
const centralPlainsResearchSourceErrors = [
  ...centralPlainsResearchInputErrors,
  ...validateCentralPlainsNoodleResearch({
    assessment: centralPlainsResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  }),
];
errors.push(...centralPlainsResearchSourceErrors);
const centralPlainsResearchErrors = [];
let centralPlainsResearchReport;
if (recipeLibraryErrors.length === 0
  && regionalAtlasSourceErrors.length === 0
  && menuMasterSourceErrors.length === 0
  && centralPlainsResearchSourceErrors.length === 0) {
  centralPlainsResearchReport = buildCentralPlainsNoodleResearchReport({
    assessment: centralPlainsResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  });
  centralPlainsResearchErrors.push(...validateCentralPlainsNoodleResearchReport(centralPlainsResearchReport));
  if (centralPlainsResearchErrors.length === 0) {
    for (const [relativePath, content] of buildCentralPlainsNoodleResearchArtifacts(centralPlainsResearchReport)) {
      const artifact = new URL(`../${relativePath}`, import.meta.url);
      if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
        centralPlainsResearchErrors.push(`${relativePath} is missing or stale; run node tools/build-central-plains-noodle-research.mjs --write intentionally`);
      }
    }
  }
}
errors.push(...centralPlainsResearchErrors);
const middleYangtzeResearchSourceErrors = [
  ...middleYangtzeResearchInputErrors,
  ...validateMiddleYangtzeMainMealResearch({
    assessment: middleYangtzeResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  }),
];
errors.push(...middleYangtzeResearchSourceErrors);
const middleYangtzeResearchErrors = [];
let middleYangtzeResearchReport;
if (recipeLibraryErrors.length === 0
  && regionalAtlasSourceErrors.length === 0
  && menuMasterSourceErrors.length === 0
  && middleYangtzeResearchSourceErrors.length === 0) {
  middleYangtzeResearchReport = buildMiddleYangtzeMainMealResearchReport({
    assessment: middleYangtzeResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  });
  middleYangtzeResearchErrors.push(...validateMiddleYangtzeMainMealResearchReport(middleYangtzeResearchReport));
  if (middleYangtzeResearchErrors.length === 0) {
    for (const [relativePath, content] of buildMiddleYangtzeMainMealResearchArtifacts(middleYangtzeResearchReport)) {
      const artifact = new URL(`../${relativePath}`, import.meta.url);
      if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
        middleYangtzeResearchErrors.push(`${relativePath} is missing or stale; run node tools/build-middle-yangtze-main-meal-research.mjs --write intentionally`);
      }
    }
  }
}
errors.push(...middleYangtzeResearchErrors);
const fujianTaiwanResearchSourceErrors = [
  ...fujianTaiwanResearchInputErrors,
  ...validateFujianTaiwanRiceNoodleResearch({
    assessment: fujianTaiwanResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  }),
];
errors.push(...fujianTaiwanResearchSourceErrors);
const fujianTaiwanResearchErrors = [];
let fujianTaiwanResearchReport;
if (recipeLibraryErrors.length === 0
  && regionalAtlasSourceErrors.length === 0
  && menuMasterSourceErrors.length === 0
  && fujianTaiwanResearchSourceErrors.length === 0) {
  fujianTaiwanResearchReport = buildFujianTaiwanRiceNoodleResearchReport({
    assessment: fujianTaiwanResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  });
  fujianTaiwanResearchErrors.push(...validateFujianTaiwanRiceNoodleResearchReport(fujianTaiwanResearchReport));
  if (fujianTaiwanResearchErrors.length === 0) {
    for (const [relativePath, content] of buildFujianTaiwanRiceNoodleResearchArtifacts(fujianTaiwanResearchReport)) {
      const artifact = new URL(`../${relativePath}`, import.meta.url);
      if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
        fujianTaiwanResearchErrors.push(`${relativePath} is missing or stale; run node tools/build-fujian-taiwan-rice-noodle-research.mjs --write intentionally`);
      }
    }
  }
}
errors.push(...fujianTaiwanResearchErrors);
const northChinaResearchSourceErrors = [
  ...northChinaResearchInputErrors,
  ...validateJingjinjiJinmengOnePotResearch({
    assessment: northChinaResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  }),
];
errors.push(...northChinaResearchSourceErrors);
const northChinaResearchErrors = [];
let northChinaResearchReport;
if (recipeLibraryErrors.length === 0
  && regionalAtlasSourceErrors.length === 0
  && menuMasterSourceErrors.length === 0
  && northChinaResearchSourceErrors.length === 0) {
  northChinaResearchReport = buildJingjinjiJinmengOnePotResearchReport({
    assessment: northChinaResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  });
  northChinaResearchErrors.push(...validateJingjinjiJinmengOnePotResearchReport(northChinaResearchReport));
  if (northChinaResearchErrors.length === 0) {
    for (const [relativePath, content] of buildJingjinjiJinmengOnePotResearchArtifacts(northChinaResearchReport)) {
      const artifact = new URL(`../${relativePath}`, import.meta.url);
      if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
        northChinaResearchErrors.push(`${relativePath} is missing or stale; run node tools/build-jingjinji-jinmeng-one-pot-research.mjs --write intentionally`);
      }
    }
  }
}
errors.push(...northChinaResearchErrors);
const sichuanChongqingResearchSourceErrors = [
  ...sichuanChongqingResearchInputErrors,
  ...validateSichuanChongqingRiceResearch({
    assessment: sichuanChongqingResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  }),
];
errors.push(...sichuanChongqingResearchSourceErrors);
const sichuanChongqingResearchErrors = [];
let sichuanChongqingResearchReport;
if (recipeLibraryErrors.length === 0
  && regionalAtlasSourceErrors.length === 0
  && menuMasterSourceErrors.length === 0
  && sichuanChongqingResearchSourceErrors.length === 0) {
  sichuanChongqingResearchReport = buildSichuanChongqingRiceResearchReport({
    assessment: sichuanChongqingResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  });
  sichuanChongqingResearchErrors.push(...validateSichuanChongqingRiceResearchReport(sichuanChongqingResearchReport));
  if (sichuanChongqingResearchErrors.length === 0) {
    for (const [relativePath, content] of buildSichuanChongqingRiceResearchArtifacts(sichuanChongqingResearchReport)) {
      const artifact = new URL(`../${relativePath}`, import.meta.url);
      if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
        sichuanChongqingResearchErrors.push(`${relativePath} is missing or stale; run node tools/build-sichuan-chongqing-rice-research.mjs --write intentionally`);
      }
    }
  }
}
errors.push(...sichuanChongqingResearchErrors);
const yunnanGuizhouResearchSourceErrors = [
  ...yunnanGuizhouResearchInputErrors,
  ...validateYunnanGuizhouRiceResearch({
    assessment: yunnanGuizhouResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  }),
];
errors.push(...yunnanGuizhouResearchSourceErrors);
const yunnanGuizhouResearchErrors = [];
let yunnanGuizhouResearchReport;
if (recipeLibraryErrors.length === 0
  && regionalAtlasSourceErrors.length === 0
  && menuMasterSourceErrors.length === 0
  && yunnanGuizhouResearchSourceErrors.length === 0) {
  yunnanGuizhouResearchReport = buildYunnanGuizhouRiceResearchReport({
    assessment: yunnanGuizhouResearch,
    recipeLibrary: lib,
    regionalResearch,
    regionalAtlas,
    regionalMappings: regionalMenuMappings,
  });
  yunnanGuizhouResearchErrors.push(...validateYunnanGuizhouRiceResearchReport(yunnanGuizhouResearchReport));
  if (yunnanGuizhouResearchErrors.length === 0) {
    for (const [relativePath, content] of buildYunnanGuizhouRiceResearchArtifacts(yunnanGuizhouResearchReport)) {
      const artifact = new URL(`../${relativePath}`, import.meta.url);
      if (!fs.existsSync(artifact) || !fs.readFileSync(artifact).equals(Buffer.from(content, 'utf8'))) {
        yunnanGuizhouResearchErrors.push(`${relativePath} is missing or stale; run node tools/build-yunnan-guizhou-rice-research.mjs --write intentionally`);
      }
    }
  }
}
errors.push(...yunnanGuizhouResearchErrors);
let nutritionIdentityAuditSummary = '';
if (errors.length === 0) {
  const nutritionAudit = spawnSync(process.execPath, [
    fileURLToPath(new URL('./check-core-ingredient-nutrition.mjs', import.meta.url)),
  ], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8',
  });
  if (nutritionAudit.status !== 0) {
    const detail = [nutritionAudit.stdout, nutritionAudit.stderr].filter(Boolean).join('\n').trim();
    errors.push(`nutrition identity audit failed${detail ? `: ${detail}` : ''}`);
  } else {
    nutritionIdentityAuditSummary = nutritionAudit.stdout.trim().split('\n').slice(-2).join(' · ');
  }
}
let plannerMenuCoverageSummary = '';
if (errors.length === 0) {
  const coverageCheck = spawnSync(process.execPath, [
    fileURLToPath(new URL('./build-planner-menu-coverage.mjs', import.meta.url)),
    '--check',
  ], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8',
  });
  if (coverageCheck.status !== 0) {
    const detail = [coverageCheck.stdout, coverageCheck.stderr].filter(Boolean).join('\n').trim();
    errors.push(`Planner menu coverage artifact check failed${detail ? `: ${detail}` : ''}`);
  } else {
    plannerMenuCoverageSummary = coverageCheck.stdout.trim();
  }
}
let lingnanHkMacaoResearchSummary = '';
// Keep this newest research layer behind every existing gate: if an established
// validator is red, do not run another builder and obscure the root failure.
if (errors.length === 0) {
  const lingnanCheck = spawnSync(process.execPath, [
    fileURLToPath(new URL('./build-lingnan-hk-macao-one-pot-research.mjs', import.meta.url)),
    '--check',
  ], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8',
  });
  if (lingnanCheck.status !== 0) {
    const detail = [lingnanCheck.stdout, lingnanCheck.stderr].filter(Boolean).join('\n').trim();
    errors.push(`Lingnan Hong Kong Macao research artifact check failed${detail ? `: ${detail}` : ''}`);
  } else {
    lingnanHkMacaoResearchSummary = lingnanCheck.stdout.trim();
  }
}
let northwestResearchSummary = '';
if (errors.length === 0) {
  const northwestCheck = spawnSync(process.execPath, [
    fileURLToPath(new URL('./build-northwest-one-pot-research.mjs', import.meta.url)),
    '--check',
  ], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8',
  });
  if (northwestCheck.status !== 0) {
    const detail = [northwestCheck.stdout, northwestCheck.stderr].filter(Boolean).join('\n').trim();
    errors.push(`Northwest research artifact check failed${detail ? `: ${detail}` : ''}`);
  } else {
    northwestResearchSummary = northwestCheck.stdout.trim();
  }
}
let qinghaiTibetResearchSummary = '';
if (errors.length === 0) {
  const qinghaiTibetCheck = spawnSync(process.execPath, [
    fileURLToPath(new URL('./build-qinghai-tibet-one-pot-research.mjs', import.meta.url)),
    '--check',
  ], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8',
  });
  if (qinghaiTibetCheck.status !== 0) {
    const detail = [qinghaiTibetCheck.stdout, qinghaiTibetCheck.stderr].filter(Boolean).join('\n').trim();
    errors.push(`Qinghai Tibet research artifact check failed${detail ? `: ${detail}` : ''}`);
  } else {
    qinghaiTibetResearchSummary = qinghaiTibetCheck.stdout.trim();
  }
}
let riceMealPreviewGateSummary = '';
if (errors.length === 0) {
  const riceMealPreviewGate = spawnSync(process.execPath, [
    fileURLToPath(new URL('./check-rice-meal-preview.mjs', import.meta.url)),
  ], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8',
  });
  if (riceMealPreviewGate.status !== 0) {
    const detail = [riceMealPreviewGate.stdout, riceMealPreviewGate.stderr].filter(Boolean).join('\n').trim();
    errors.push(`rice meal Preview gate failed${detail ? `: ${detail}` : ''}`);
  } else {
    riceMealPreviewGateSummary = riceMealPreviewGate.stdout.trim();
  }
}
for (const error of errors) console.error(`❌ ${error}`);
const familyCount = Array.isArray(lib?.families) ? lib.families.length : 0;
const recipeCount = Array.isArray(lib?.recipes) ? lib.recipes.length : 0;
const approvedCount = Array.isArray(lib?.recipes)
  ? lib.recipes.filter(recipe => recipe?.status === 'approved').length
  : 0;
const autoApprovedCount = Array.isArray(lib?.recipes)
  ? lib.recipes.filter(recipe => recipe?.status === 'auto_approved').length
  : 0;
const activeTemplateCount = Array.isArray(templates?.templates)
  ? templates.templates.filter(template => template?.activation_status === 'active' && template?.runtime_eligible === true).length
  : 0;
const plannedTemplateCount = Array.isArray(templates?.templates)
  ? templates.templates.filter(template => template?.activation_status === 'planned' && template?.runtime_eligible === false).length
  : 0;
const plannedRuntimeRecipeCount = Array.isArray(recipeRuntimeCatalog?.entries)
  ? recipeRuntimeCatalog.entries.filter(entry => entry?.activation_status === 'planned').length
  : 0;
const previewEnabledRuntimeRecipeCount = Array.isArray(recipeRuntimeCatalog?.entries)
  ? recipeRuntimeCatalog.entries.filter(entry => entry?.activation_status === 'preview_enabled').length
  : 0;
const riceMealFamilyCount = Array.isArray(riceMealCatalog?.families) ? riceMealCatalog.families.length : 0;
const riceMealVariants = Array.isArray(riceMealCatalog?.families)
  ? riceMealCatalog.families.flatMap(family => Array.isArray(family?.variants) ? family.variants : [])
  : [];
const riceMealPreviewReadyCount = riceMealVariants.filter(variant => variant?.status === 'preview_ready').length;
const riceMealCalibrationPreviewCount = riceMealVariants.filter(variant => variant?.status === 'calibration_preview').length;
const riceMealPlannedCount = riceMealVariants.filter(variant => variant?.status === 'planned').length;
const riceMealCollectionCandidates = Array.isArray(riceMealCollection?.candidates) ? riceMealCollection.candidates : [];
const riceMealCollectionTracking = Array.isArray(riceMealCollection?.catalog_tracking) ? riceMealCollection.catalog_tracking : [];
const riceMealCollectionRuntimeReadyCount = riceMealCollectionTracking.filter(row => row?.status === 'runtime_ready').length;
const riceMealCollectionCalibrationReadyCount = riceMealCollectionTracking.filter(row => row?.status === 'calibration_ready').length;
const riceMealCollectionPlannedCount = riceMealCollectionTracking.filter(row => row?.status === 'planned').length;
const riceMealCollectionGapCount = Array.isArray(riceMealCollection?.region_nodes)
  ? riceMealCollection.region_nodes.filter(node => typeof node?.gap === 'string' && node.gap.trim()).length
  : 0;
const riceCookerSourceEvidenceSha256 = riceCookerSourceEvidenceErrors.length === 0
  ? crypto.createHash('sha256').update(canonicalJson(riceCookerSourceEvidence)).digest('hex')
  : null;
const sourceBackedRecipes = Array.isArray(sourceBackedCatalog?.recipes) ? sourceBackedCatalog.recipes : [];
const sourceBackedStatusCounts = sourceBackedRecipes.reduce((counts, recipe) => {
  const status = typeof recipe?.status === 'string' && recipe.status ? recipe.status : 'invalid';
  counts[status] = (counts[status] ?? 0) + 1;
  return counts;
}, {});
const sourceBackedExecutionEntries = Array.isArray(sourceBackedExecutionLibrary?.entries)
  ? sourceBackedExecutionLibrary.entries
  : [];
const sourceBackedExecutionCompleteness = sourceBackedExecutionEntries.reduce((counts, entry) => {
  const card = entry?.execution_card || {};
  const hasQuantities = Array.isArray(card.ingredients)
    && card.ingredients.length > 0
    && card.ingredients.every(item => item?.amount && Number.isFinite(item.amount.value) && item.amount.unit);
  const hasLiquid = Boolean(card.liquid?.amount || card.liquid?.research_starting_point || card.liquid?.waterline);
  const hasSteps = Array.isArray(card.steps)
    && card.steps.length >= 3
    && card.steps.every(step => typeof step?.instruction === 'string' && step.instruction.trim());
  const hasTime = Boolean(card.time?.total_minutes || card.time?.range);
  if (hasQuantities) counts.quantities += 1;
  if (hasLiquid) counts.liquid += 1;
  if (hasSteps) counts.steps += 1;
  if (hasTime) counts.time += 1;
  if (hasQuantities && hasLiquid && hasSteps && hasTime) counts.fully_usable += 1;
  if (entry?.execution_card?.blocked_reason) counts.blocked += 1;
  if (!entry?.execution_card?.blocked_reason && hasQuantities && hasLiquid && hasSteps && hasTime) counts.unblocked += 1;
  return counts;
}, { quantities: 0, liquid: 0, steps: 0, time: 0, fully_usable: 0, unblocked: 0, blocked: 0 });
console.log(`菜谱家族 ${familyCount} 个 · 基础菜谱 ${recipeCount} 道（approved 人工批准 ${approvedCount} 道 · auto_approved 自动闸门通过待评审 ${autoApprovedCount} 道）`);
console.log([
  `${sourceBackedRecipes.length} source-backed one-pot recipes`,
  `version ${sourceBackedCatalog?.catalog_version || 'unavailable'}`,
  ...Object.entries(sourceBackedStatusCounts)
    .sort(([left], [right]) => left.localeCompare(right, 'en'))
    .map(([status, count]) => `${status} ${count}`),
  sourceBackedCatalogErrors.length
    ? `source-backed catalog invalid (${sourceBackedCatalogErrors.length})`
    : 'source-backed catalog and artifacts ok',
].join(' · '));
console.log(`source-backed preview ${sourceBackedPreviewManifest?.counts?.selected ?? 0} selected / ${sourceBackedPreviewManifest?.counts?.total ?? 0} total · ${sourceBackedPreviewManifest?.counts?.blocked ?? 0} blocked${sourceBackedPreviewErrors.length ? ` · invalid (${sourceBackedPreviewErrors.length})` : ' · manifest ok'}`);
console.log(`source-backed formalization ${sourceBackedFormalizationLedger?.counts?.preview_candidate ?? 0} preview candidates / ${sourceBackedFormalizationLedger?.counts?.blocked ?? 0} blocked / ${sourceBackedFormalizationLedger?.counts?.total ?? 0} total${sourceBackedFormalizationErrors.length ? ` · invalid (${sourceBackedFormalizationErrors.length})` : ' · ledger ok'}`);
console.log(`source-backed execution ${sourceBackedExecutionLibrary?.counts?.total ?? 0} cards · ${sourceBackedExecutionLibrary?.counts?.source_complete ?? 0} source-complete · ${sourceBackedExecutionLibrary?.counts?.run_scope?.research_only ?? 0} research-only${sourceBackedExecutionErrors.length ? ` · invalid (${sourceBackedExecutionErrors.length})` : ' · library ok'}`);
console.log(`source-backed execution completeness ${sourceBackedExecutionCompleteness.fully_usable}/${sourceBackedExecutionEntries.length} complete research fields · ${sourceBackedExecutionCompleteness.unblocked}/${sourceBackedExecutionEntries.length} unblocked complete · ${sourceBackedExecutionCompleteness.blocked} safety-blocked · ${sourceBackedExecutionCompleteness.quantities}/${sourceBackedExecutionEntries.length} quantities · ${sourceBackedExecutionCompleteness.liquid}/${sourceBackedExecutionEntries.length} liquid · ${sourceBackedExecutionCompleteness.steps}/${sourceBackedExecutionEntries.length} steps · ${sourceBackedExecutionCompleteness.time}/${sourceBackedExecutionEntries.length} time`);
console.log(`source-backed formal candidate review ${sourceBackedFormalCandidateReview?.counts?.total ?? 0} rows · ${sourceBackedFormalCandidateReview?.counts?.source_complete ?? 0} source-complete · ratio evidence ${sourceBackedFormalCandidateReview?.counts?.ratio_dsl?.candidate_evidence_only ?? 0} · ${sourceBackedFormalCandidateReview?.counts?.formal_ready ?? 0} formal-ready${sourceBackedFormalCandidateReviewErrors.length ? ` · invalid (${sourceBackedFormalCandidateReviewErrors.length})` : ' · review ok'}`);
console.log(`source-backed formal staging ${sourceBackedFormalStaging?.counts?.total ?? 0} queued · ${sourceBackedFormalStaging?.counts?.source_complete ?? 0} source-complete · ${sourceBackedFormalStaging?.counts?.formal_ready ?? 0} formal-ready · ${sourceBackedFormalStaging?.counts?.kitchen_pending ?? 0} kitchen pending${sourceBackedFormalStagingErrors.length ? ` · invalid (${sourceBackedFormalStagingErrors.length})` : ' · staging ok'}`);
console.log(`source-backed runtime catalog ${sourceBackedRuntimeCatalog?.counts?.total ?? 0} entries · ${sourceBackedRuntimeCatalog?.counts?.preview_only ?? 0} preview-only · ${sourceBackedRuntimeCatalog?.counts?.research_only ?? 0} research-only · ${sourceBackedRuntimeCatalog?.counts?.blocked ?? 0} blocked${sourceBackedRuntimeCatalogErrors.length ? ` · invalid (${sourceBackedRuntimeCatalogErrors.length})` : ' · runtime catalog ok'}`);
console.log(`source-backed coverage matrix ${sourceBackedCoverageMatrix?.counts?.total ?? 0} rows · P0 ${sourceBackedCoverageMatrix?.counts?.priority?.P0 ?? 0} · P1 ${sourceBackedCoverageMatrix?.counts?.priority?.P1 ?? 0} · P2 ${sourceBackedCoverageMatrix?.counts?.priority?.P2 ?? 0} · P3 ${sourceBackedCoverageMatrix?.counts?.priority?.P3 ?? 0}${sourceBackedCoverageMatrixErrors.length ? ` · invalid (${sourceBackedCoverageMatrixErrors.length})` : ' · matrix ok'}`);
console.log([
  `${recipeCount} recipes`,
  `${activeTemplateCount} active templates`,
  `${plannedTemplateCount} planned templates`,
  `${plannedRuntimeRecipeCount} planned runtime recipes`,
  `${previewEnabledRuntimeRecipeCount} preview-enabled runtime recipes`,
  taxonomyErrors.length ? `taxonomy invalid (${taxonomyErrors.length})` : 'taxonomy ok',
  ratioErrors.length ? `ratio DSL invalid (${ratioErrors.length})` : 'ratio DSL ok',
  recipeRuntimeErrors.length ? `recipe runtime invalid (${recipeRuntimeErrors.length})` : 'recipe runtime ok',
].join(' · '));
console.log([
  riceCookerSourceEvidenceErrors.length
    ? `rice-cooker source evidence invalid (${riceCookerSourceEvidenceErrors.length})`
    : 'rice-cooker source evidence ok',
  `version ${riceCookerSourceEvidence?.ledger_version || 'unavailable'}`,
  `sha256 ${riceCookerSourceEvidenceSha256 || 'unavailable'}`,
].join(' · '));
console.log([
  `${riceMealCollectionCandidates.length} collection candidates`,
  `${riceMealCollectionRuntimeReadyCount} runtime_ready`,
  `${riceMealCollectionCalibrationReadyCount} calibration_ready`,
  `${riceMealCollectionPlannedCount} planned`,
  `${riceMealCollectionGapCount} explicit regional gaps`,
  riceMealCollectionErrors.length ? `rice meal collection invalid (${riceMealCollectionErrors.length})` : 'rice meal collection ok',
].join(' · '));
console.log([
  `${riceMealFamilyCount} families`,
  `${riceMealVariants.length} variants`,
  `${riceMealPreviewReadyCount} preview_ready`,
  `${riceMealCalibrationPreviewCount} calibration_preview`,
  `${riceMealPlannedCount} planned`,
  riceMealCatalogErrors.length ? `rice meal catalog invalid (${riceMealCatalogErrors.length})` : 'rice meal catalog ok',
].join(' · '));
if (recipeLibraryErrors.length === 0 && taxonomyErrors.length === 0 && menuMasterSourceErrors.length === 0 && menuMasterErrors.length === 0) {
  console.log(`${menuMaster.summary.production_count} production menus · ${menuMaster.summary.research_count} research candidates · menu master ok`);
}
if (regionalAtlasReport && regionalAtlasSourceErrors.length === 0 && regionalAtlasErrors.length === 0) {
  console.log(`${formatRegionalAtlasSummary(regionalAtlasReport)} · regional atlas ok`);
}
if (northeastResearchReport && northeastResearchSourceErrors.length === 0 && northeastResearchErrors.length === 0) {
  console.log(`${northeastResearchReport.summary.prototype_count} northeast prototypes · ${northeastResearchReport.summary.source_count} sources · ${northeastResearchReport.summary.journey_count} journeys · northeast research ok`);
}
if (northeastNumericEvidenceReport && northeastNumericEvidenceSourceErrors.length === 0 && northeastNumericEvidenceErrors.length === 0) {
  console.log(`${formatNortheastStewNumericEvidenceSummary(northeastNumericEvidenceReport)} · northeast numeric evidence ok`);
}
if (northeastSafetyEvidenceReport && northeastSafetyEvidenceSourceErrors.length === 0 && northeastSafetyEvidenceErrors.length === 0) {
  console.log(`${formatNortheastStewSafetyEvidenceSummary(northeastSafetyEvidenceReport)} · northeast safety evidence ok`);
}
if (jiangnanResearchReport && jiangnanResearchSourceErrors.length === 0 && jiangnanResearchErrors.length === 0) {
  console.log(`${jiangnanResearchReport.summary.recipe_audit_count} Jiangnan recipe audits · ${jiangnanResearchReport.summary.source_count} sources · ${jiangnanResearchReport.summary.journey_count} journeys · Jiangnan research ok`);
}
if (shandongResearchReport && shandongResearchSourceErrors.length === 0 && shandongResearchErrors.length === 0) {
  console.log(formatShandongOnePotResearchSummary(shandongResearchReport));
}
if (centralPlainsResearchReport && centralPlainsResearchSourceErrors.length === 0 && centralPlainsResearchErrors.length === 0) {
  console.log(formatCentralPlainsNoodleResearchSummary(centralPlainsResearchReport));
}
if (middleYangtzeResearchReport && middleYangtzeResearchSourceErrors.length === 0 && middleYangtzeResearchErrors.length === 0) {
  console.log(formatMiddleYangtzeMainMealResearchSummary(middleYangtzeResearchReport));
}
if (fujianTaiwanResearchReport && fujianTaiwanResearchSourceErrors.length === 0 && fujianTaiwanResearchErrors.length === 0) {
  console.log(formatFujianTaiwanRiceNoodleResearchSummary(fujianTaiwanResearchReport));
}
if (northChinaResearchReport && northChinaResearchSourceErrors.length === 0 && northChinaResearchErrors.length === 0) {
  console.log(formatJingjinjiJinmengOnePotResearchSummary(northChinaResearchReport));
}
if (sichuanChongqingResearchReport && sichuanChongqingResearchSourceErrors.length === 0 && sichuanChongqingResearchErrors.length === 0) {
  console.log(formatSichuanChongqingRiceResearchSummary(sichuanChongqingResearchReport));
}
if (yunnanGuizhouResearchReport && yunnanGuizhouResearchSourceErrors.length === 0 && yunnanGuizhouResearchErrors.length === 0) {
  console.log(formatYunnanGuizhouRiceResearchSummary(yunnanGuizhouResearchReport));
}
if (nutritionIdentityAuditSummary) console.log(nutritionIdentityAuditSummary);
if (plannerMenuCoverageSummary) console.log(`${plannerMenuCoverageSummary} · planner menu coverage ok`);
if (lingnanHkMacaoResearchSummary) console.log(lingnanHkMacaoResearchSummary);
if (northwestResearchSummary) console.log(northwestResearchSummary);
if (qinghaiTibetResearchSummary) console.log(qinghaiTibetResearchSummary);
if (riceMealPreviewGateSummary) console.log(riceMealPreviewGateSummary);
console.log(errors.length ? `❌ 菜谱库体检不通过: ${errors.length} 项` : '✅ 菜谱库体检通过');
process.exit(errors.length ? 1 : 0);
