import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'global-pmposhan-poushtik-khichdi',
    name: 'Poushtik Khichdi',
    url: 'https://pmposhan.education.gov.in/Files/Review/Fifth_Review/Odisha/JRM_Report_Odisha_MDM.pdf',
    vessel: /普通锅|炊具|stove|pot/u,
  },
  {
    recipeId: 'global-ayush-moong-dal-khichidi',
    name: 'Moong Dal Khichidi',
    url: 'https://ayush.gov.in/resources/pdf/health/ARPHHC19.pdf',
    vessel: /普通锅|器皿|pot|stove/u,
  },
  {
    recipeId: 'global-argentina-nea-arroz-pollo',
    name: 'Guiso de arroz con pollo (NEA)',
    url: 'https://www.argentina.gob.ar/sites/default/files/2020/09/pnpa_-_2021_-_recetario_nea.pdf',
    vessel: /普通锅|锅|stovetop|pot/u,
  },
  {
    recipeId: 'global-spain-arroz-negro',
    name: 'Arroz negro',
    url: 'https://www.spain.info/en/recipe/arroz-negro/',
    vessel: /paella|普通锅|锅/u,
  },
  {
    recipeId: 'global-nwu-one-pot-chicken-rice',
    name: 'One-Pot Chicken and Rice',
    url: 'https://health-sciences.nwu.ac.za/sites/health-sciences.nwu.ac.za/files/files/Consumer_Sciences/Documents/Resepteboek_2024_B5.pdf',
    vessel: /普通锅|炉灶|pot|stove/u,
  },
  {
    recipeId: 'global-fnde-arroz-colorido-soy',
    name: 'Arroz Colorido com Carne de Soja',
    url: 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae/campanhas/concurso-melhores-receitas/receitas/to-1/receita_escola_blandina.pdf/',
    vessel: /普通锅|锅|pot|stove/u,
  },
  {
    recipeId: 'global-irga-risoto-frango-legumes',
    name: 'Risoto de Frango com Legumes',
    url: 'https://irga.rs.gov.br/risoto-de-frango-com-legumes',
    vessel: /普通锅|大锅|锅|pot/u,
  },
  {
    recipeId: 'global-peru-minsa-arroz-pollo',
    name: 'Arroz con Pollo (CENAN 版本)',
    url: 'https://www.gob.pe/institucion/minsa/noticias/42250-el-pollo-es-una-importante-fuente-de-fosforo-y-potasio',
    vessel: /普通锅|锅|pot|stove/u,
  },
  {
    recipeId: 'global-greece-mushroom-mageiritsa',
    name: 'Mushroom Mageiritsa',
    url: 'https://www.visitgreece.gr/experiences/gastronomy/recipes/mushroom-mageiritsa/',
    vessel: /普通锅|锅|pot|stove/u,
  },
];

test('r125 adds nine official global rice-main candidates', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r218');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);

  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(recipe, item.recipeId);
    assert.equal(recipe.canonical_name, item.name, item.recipeId);
    assert.equal(recipe.status, item.recipeId === 'global-spain-arroz-negro' ? 'executable' : 'recipe_fact_checked', item.recipeId);
    assert.equal(recipe.identity_status, 'verified', item.recipeId);
    if (item.recipeId !== 'global-spain-arroz-negro') assert.notEqual(recipe.status, 'executable', item.recipeId);
    assert.notEqual(recipe.status, 'preview_ready', item.recipeId);
    assert.ok(recipe.core_ingredients.length >= 3, item.recipeId);
    assert.ok(recipe.cooking_sequence.length >= 2, item.recipeId);
    assert.match(recipe.traditional_vessels.join(' '), item.vessel, item.recipeId);

    const source = recipe.source_refs.find((candidate) => candidate.url === item.url);
    assert.ok(source, `${item.recipeId}: official source URL`);
    assert.equal(source.access_status, 'opened', item.recipeId);
    assert.ok(source.evidence_locator, item.recipeId);
    assert.ok(source.claim_scopes.includes('identity'), item.recipeId);
    assert.ok(source.claim_scopes.includes('ingredients'), item.recipeId);
    assert.ok(source.claim_scopes.includes('process'), item.recipeId);
  }
});

test('r125 keeps source-limited appliance and safety boundaries', () => {
  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(['source_limited', 'not_adapted'].includes(recipe.cooker_adaptation.status), item.recipeId);
    assert.match(recipe.cooker_adaptation.notes, /不外推.*电饭煲|普通锅|非电饭煲|原器具|器皿/u, item.recipeId);
    if (['global-nwu-one-pot-chicken-rice', 'global-irga-risoto-frango-legumes', 'global-peru-minsa-arroz-pollo'].includes(item.recipeId)) {
      assert.deepEqual(recipe.safety_endpoints, [{
        code: 'poultry_fully_cooked',
        minimum_core_temperature_c: 74,
        source_ids: ['S-SAFETY-TEMPERATURES-1'],
      }], item.recipeId);
    } else if (item.recipeId === 'global-spain-arroz-negro') {
      assert.deepEqual(recipe.safety_endpoints, [{
        code: 'seafood_fully_cooked',
        minimum_core_temperature_c: 63,
        source_ids: ['S-SAFETY-TEMPERATURES-1'],
      }], item.recipeId);
    } else {
      assert.deepEqual(recipe.safety_endpoints, [], item.recipeId);
    }
  }

  const poushtik = byId.get('global-pmposhan-poushtik-khichdi');
  assert.equal(poushtik.fixed_batch.servings, 25);
  assert.equal(poushtik.liquid_contract.amount.value, 2);
  assert.equal(poushtik.liquid_contract.amount.unit, '倍米量');

  const arrozNegro = byId.get('global-spain-arroz-negro');
  assert.equal(arrozNegro.fixed_batch.servings, 6);
  assert.equal(arrozNegro.liquid_contract.amount.value, 1.25);
  assert.equal(arrozNegro.liquid_contract.amount.unit, 'L');
  assert.equal(arrozNegro.time_contract.total_minutes, 35);

  const nwu = byId.get('global-nwu-one-pot-chicken-rice');
  assert.equal(nwu.fixed_batch.servings, 4);
  assert.equal(nwu.liquid_contract.amount.value, 500);
  assert.equal(nwu.liquid_contract.amount.unit, 'ml');
  assert.equal(nwu.time_contract, null);

  const irga = byId.get('global-irga-risoto-frango-legumes');
  assert.equal(irga.fixed_batch.servings, 4);
  assert.equal(irga.liquid_contract.amount.value, 1.5);
  assert.equal(irga.liquid_contract.amount.unit, 'L');
  assert.equal(irga.time_contract, null);
});

test('r125 does not publish global entries as executable or regional traditions', () => {
  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(Array.isArray(recipe.region_codes), item.recipeId);
    assert.match(recipe.evidence_notes, /官方|来源|不外推|普通锅|安全/u, item.recipeId);
  }
});
