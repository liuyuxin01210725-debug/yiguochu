#!/usr/bin/env node
import fs from 'node:fs';
import { validateRecipeLibrary } from './lib/recipe-library-validator.mjs';
import { validateCoverageRecipePromotion } from './lib/coverage-recipe-promotion-gate.mjs';
import { validateIngredientTaxonomy } from './lib/ingredient-taxonomy-validator.mjs';
import { validateMealTemplateCatalog } from './lib/meal-template-validator.mjs';
import { validateRatioDslCatalog } from './lib/ratio-dsl-validator.mjs';
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

const file = new URL('./data/recipe-library.json', import.meta.url);
const lib = JSON.parse(fs.readFileSync(file, 'utf8'));
const recipeLibraryErrors = validateRecipeLibrary(lib);
const errors = [...recipeLibraryErrors];
const menuMasterInputErrors = [];
const regionalAtlasInputErrors = [];
const northeastResearchInputErrors = [];
const jiangnanResearchInputErrors = [];
const shandongResearchInputErrors = [];
const centralPlainsResearchInputErrors = [];
const middleYangtzeResearchInputErrors = [];
const fujianTaiwanResearchInputErrors = [];
const northChinaResearchInputErrors = [];
const sichuanChongqingResearchInputErrors = [];
const yunnanGuizhouResearchInputErrors = [];
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
const regionalResearch = readReviewLedger('./data/regional-menu-research.v1.json', 'regional menu research ledger');
const verificationCases = readReviewLedger('./data/menu-verification-cases.v1.json', 'menu verification cases ledger');
const menuMasterBaseline = readReviewLedger('./data/menu-master-baseline.v1.json', 'menu master Phase Zero baseline');
const regionalAtlas = readReviewLedger('./data/regional-atlas.v2.json', 'regional atlas catalog', regionalAtlasInputErrors);
const regionalMenuMappings = readReviewLedger('./data/regional-menu-mappings.v1.json', 'regional menu mapping ledger', regionalAtlasInputErrors);
const northeastResearch = readReviewLedger('./data/northeast-stew-research.v1.json', 'northeast stew research assessment', northeastResearchInputErrors);
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
const templateErrors = validateMealTemplateCatalog(templates, taxonomy, lib);
const ratioErrors = validateRatioDslCatalog(ratios, templates, taxonomy, lib);
errors.push(...taxonomyErrors, ...templateErrors, ...ratioErrors);
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
console.log(`菜谱家族 ${familyCount} 个 · 基础菜谱 ${recipeCount} 道（approved 人工批准 ${approvedCount} 道 · auto_approved 自动闸门通过待评审 ${autoApprovedCount} 道）`);
console.log([
  `${recipeCount} recipes`,
  `${activeTemplateCount} active templates`,
  `${plannedTemplateCount} planned templates`,
  taxonomyErrors.length ? `taxonomy invalid (${taxonomyErrors.length})` : 'taxonomy ok',
  ratioErrors.length ? `ratio DSL invalid (${ratioErrors.length})` : 'ratio DSL ok',
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
console.log(errors.length ? `❌ 菜谱库体检不通过: ${errors.length} 项` : '✅ 菜谱库体检通过');
process.exit(errors.length ? 1 : 0);
