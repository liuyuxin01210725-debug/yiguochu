import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateRecipeDraftLibrary } from '../lib/recipe-draft-validator.mjs';
import {
  validateExpectedDraftMappings,
  validateThirtyDraftReleaseGate,
} from '../lib/recipe-draft-release-gate.mjs';

const candidateLedger = { entries: [{ id: 'candidate-a' }] };
const validDraftLibrary = {
  schema_version: 1, purpose: '原创试做草案，不进入运行时。',
  drafts: [{
    id: 'sample-draft', candidate_id: 'candidate-a', status: 'draft', name: '示例饭', region: '示例地区', form: '焖饭',
    adaptation_summary: '以家庭一锅完成为目标的原创试做底稿。', serving_range: [2, 4],
    core_ingredients: ['大米', '青菜'], optional_ingredients: ['葱'],
    substitution_slots: [{ slot: '叶菜', replaces: ['青菜'], allowed: ['小白菜'] }],
    draft_ratio_rules: ['每100克大米配120至140克总液体。'], technique_outline: ['炒香配料', '同锅焖熟'],
    safety_and_quality_gates: [{ type: 'texture', requirement: '叶菜后段加入，避免出水过多。' }],
    trial_requirements: ['记录锅具、份数、实际用量、总时长、米粒状态和修订原因。'],
  }],
};

test('draft documentation states the thirty-draft production boundary', () => {
  const doc = fs.readFileSync(new URL('../../docs/传统一锅草案说明.md', import.meta.url), 'utf8');
  assert.match(doc, /30 道草案/);
  assert.match(doc, /不进入运行时/);
  assert.match(doc, /生产可用 0 道/);
  assert.match(doc, /尚无完成的真实试做/);
  assert.match(doc, /high/);
});

test('draft library accepts an original trial draft linked to a candidate', () => {
  assert.deepEqual(validateRecipeDraftLibrary(validDraftLibrary, candidateLedger), []);
});

test('draft library rejects production status and a missing safety gate', () => {
  const invalid = structuredClone(validDraftLibrary);
  invalid.drafts[0].status = 'approved';
  invalid.drafts[0].safety_and_quality_gates = [];
  assert.deepEqual(validateRecipeDraftLibrary(invalid, candidateLedger), [
    'sample-draft status must be draft',
    'sample-draft safety_and_quality_gates must be non-empty',
  ]);
});

test('expected mapping validator rejects a missing and an extra draft', () => {
  const library = { drafts: [{ id: 'a-draft', candidate_id: 'a' }, { id: 'extra-draft', candidate_id: 'b' }] };
  const candidates = { entries: [{ id: 'a', status: 'candidate' }, { id: 'b', status: 'candidate' }] };
  assert.deepEqual(validateExpectedDraftMappings(library, candidates, new Map([['a-draft', 'a'], ['missing-draft', 'b']]), true), [
    'expected draft missing-draft is missing',
    'unexpected draft extra-draft is present',
  ]);
});

test('expected mapping validator reports a wrong mapping and non-candidate link', () => {
  const library = { drafts: [{ id: 'a-draft', candidate_id: 'b' }] };
  const candidates = { entries: [{ id: 'b', status: 'approved' }] };
  assert.deepEqual(validateExpectedDraftMappings(library, candidates, new Map([['a-draft', 'a']]), false), [
    'a-draft must link candidate_id a',
    'a-draft linked candidate b must have status candidate',
  ]);
});

test('draft ledger contains thirty entries and accurate thirty-draft purpose metadata', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  assert.equal(drafts.drafts.length, 30);
  assert.match(drafts.purpose, /三十道/);
  assert.ok(drafts.drafts.some(draft => draft.id === 'banshan-wild-rice-draft'));
});

test('thirty-draft release gate accepts the complete fixed mapping', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  assert.equal(drafts.drafts.length, 30);
  assert.deepEqual(validateThirtyDraftReleaseGate(drafts, candidates), []);
});

test('thirty traditional drafts are isolated from candidates and production', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateRecipeDraftLibrary(drafts, candidates), []);
  assert.equal(drafts.drafts.length, 30);
  assert.ok(drafts.drafts.every(draft => draft.status === 'draft'));
  assert.equal(production.families.length, 15);
  assert.equal(production.recipes.length, 42);
  assert.ok(drafts.drafts.every(draft => !production.recipes.some(recipe => recipe.id === draft.id)));
});

test('all high-risk candidate drafts retain their applicable safety gates and trial records', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const highRiskRequirements = {
    'xinjiang-lamb-pilaf-draft': {
      gatePatterns: {
        lamb_identity: /羊肉部位.*可食部分.*购买来源.*原始生熟状态/,
        food_safety: /羊肉中心.*完全熟制.*无生肉状态.*检查记录/,
        allergen_scope: /水果.*坚果.*完整成分.*过敏原信息/,
        storage: /当餐.*冷却.*冷藏.*再次加热/,
      },
      recordPatterns: [
        /羊肉部位.*可食部分.*购买来源.*原始生熟状态.*中心完全熟制检查/,
        /水果.*坚果.*完整成分.*过敏原信息/,
        /当餐.*冷却.*冷藏.*再次加热.*胡萝卜.*米粒状态.*修订原因/,
      ],
    },
    'guizhou-dong-community-rice-draft': {
      gatePatterns: {
        cured_meat_identity: /腌肉.*准确食品名称.*食品级标签.*购买来源.*原始生熟状态/,
        food_safety: /腌肉中心.*完全熟制.*无生肉状态.*检查记录/,
        plant_identity: /地方叶菜.*准确植物身份.*食品级证明.*购买来源.*可食用依据.*原始状态/,
        allergen_scope: /腌肉.*完整成分.*过敏原信息.*叶菜.*过敏原声明/,
        seasoning: /腌肉.*食品级标签.*来源.*尝味.*补加盐.*高盐/,
        storage: /当餐.*冷却.*冷藏.*再次加热/,
      },
      recordPatterns: [
        /腌肉.*准确食品名称.*食品级标签.*购买来源.*原始生熟状态.*中心完全熟制检查/,
        /地方叶菜.*准确植物身份.*食品级证明.*购买来源.*可食用依据.*原始状态/,
        /腌肉.*完整成分.*过敏原信息.*叶菜.*过敏原声明.*尝味.*补盐决定/,
        /当餐.*冷却.*冷藏.*再次加热.*米粒状态.*修订原因/,
      ],
    },
    'cantonese-mushroom-chicken-claypot-rice-draft': {
      gatePatterns: {
        chicken_identity: /鸡肉部位.*可食部分.*购买来源.*原始生熟状态/,
        food_safety: /鸡肉中心.*完全熟制.*无生肉状态.*检查记录/,
        mushroom_moisture: /食品名称.*来源.*原始含水.*加热出水.*积液.*质地合格/,
        storage: /当餐.*冷却.*冷藏.*再次加热/,
      },
      recordPatterns: [
        /鸡肉部位.*可食部分.*购买来源.*原始生熟状态.*中心完全熟制检查/,
        /香菇食品名称.*购买来源.*原始状态.*出水.*成品湿度/,
        /叶菜.*过敏原声明.*当餐.*冷却.*冷藏.*再次加热.*修订原因/,
      ],
    },
    'cantonese-black-bean-pork-rib-claypot-rice-draft': {
      gatePatterns: {
        bone_safety: /肋排骨片检查.*成品复查.*碎骨.*锐骨/,
        food_safety: /猪肉中心.*完全熟制.*无生肉状态.*检查记录/,
        fermented_bean_salt: /豆豉.*来源.*尝味.*补加盐.*高盐调味料/,
        storage: /当餐.*冷却.*冷藏.*再次加热/,
      },
      recordPatterns: [
        /猪肋排购买来源.*原始生熟状态.*骨片检查.*可食部分.*中心完全熟制检查/,
        /豆豉食品级标签.*来源.*过敏原信息.*尝味.*补盐决定/,
        /食用菌.*食品名称.*过敏原声明.*当餐.*冷却.*冷藏.*再次加热/,
      ],
    },
    'qinghai-hao-fan-draft': {
      gatePatterns: {
        ingredient_identity: /食品名称.*购买来源.*可食用依据.*身份不明.*区域植物/,
        food_safety: /土豆.*熟透.*无硬芯.*原始状态.*熟制检查/,
        allergen_scope: /豆类.*叶菜.*过敏原.*不耐受声明/,
        storage: /当餐.*冷却.*冷藏.*再次加热/,
      },
      recordPatterns: [
        /全部主料.*食品名称.*购买来源.*可食用依据.*原始状态/,
        /土豆.*豆类.*熟制检查.*成品稠度.*锅具/,
        /豆类.*过敏原声明.*当餐.*冷却.*冷藏.*再次加热.*修订原因/,
      ],
    },
    'tibetan-savory-congee-draft': {
      forbiddenOptionalIngredient: /肉/,
      gatePatterns: {
        dairy_allergen: /乳.*过敏原范围.*替代品.*完整成分.*过敏原信息/,
        simmered_outcome: /谷物.*煮熟软.*无硬芯.*成品稠度.*原始生熟状态/,
        storage: /当餐.*冷却.*冷藏.*再次加热/,
      },
      recordPatterns: [
        /谷物、乳制品或替代品.*食品名称.*来源.*原始状态.*成分.*过敏原范围/,
        /谷物熟软检查.*稠度.*咸味尝味.*锅具/,
        /叶菜.*食品名称.*过敏原声明.*当餐.*冷却.*冷藏.*再次加热.*修订原因/,
      ],
    },
    'tibetan-gutu-draft': {
      gatePatterns: {
        cultural_scope: /不得宣称.*模拟.*复刻.*节庆仪式.*象征物.*占卜.*传统成品/,
        dough_cook_through: /面团.*内部无生粉.*无夹生.*原始状态.*熟制检查/,
        allergen_scope: /小麦.*食用菌.*过敏原声明/,
        storage: /当餐.*冷却.*冷藏.*再次加热/,
      },
      recordPatterns: [
        /面粉.*蔬菜.*食用菌.*食品名称.*来源.*原始状态.*小麦.*过敏原声明/,
        /面团内部无生粉.*熟制检查.*汤体状态.*锅具/,
        /当餐.*冷却.*冷藏.*再次加热.*修订原因/,
      ],
    },
    'tibetan-ginseng-fruit-rice-draft': {
      gatePatterns: {
        food_grade_identity: /蕨麻.*准确食品名称.*食品级标签.*可食用依据.*购买来源/,
        claim_boundary: /不得出现.*药用.*保健.*治疗.*功效宣称/,
        food_safety: /蕨麻.*谷物.*熟透.*无硬芯.*原始状态.*熟制检查/,
        allergen_and_storage: /蕨麻.*谷物.*干果.*过敏原声明.*冷却.*冷藏.*再次加热/,
      },
      recordPatterns: [
        /蕨麻.*准确食品名称.*食品级标签.*可食用依据.*购买来源.*原始状态/,
        /蕨麻.*谷物.*熟制检查.*湿度.*锅具/,
        /干果.*过敏原声明.*当餐.*冷却.*冷藏.*再次加热.*修订原因/,
      ],
    },
    'she-people-black-rice-draft': {
      gatePatterns: {
        botanical_identity: /植物色源.*准确植物身份.*食品级证明.*购买来源.*可食用依据/,
        soak_and_rinse: /糯米浸泡.*漂洗.*原始状态.*用水观察/,
        food_safety: /糯米.*蒸熟.*无硬芯/,
        allergen_and_storage: /色源.*坚果.*种子.*过敏原声明.*冷却.*冷藏.*再次加热/,
      },
      recordPatterns: [
        /色源.*植物身份.*食品级证明.*购买来源.*可食用依据.*原始状态/,
        /糯米浸泡.*漂洗.*蒸熟检查.*成品湿度/,
        /坚果.*种子.*过敏原声明.*当餐.*冷却.*冷藏.*再次加热.*修订原因/,
      ],
    },
    'banshan-wild-rice-draft': {
      gatePatterns: {
        wild_ingredient_identity: /野生食材.*准确身份.*可食用依据.*来源.*原始状态.*安全替代食材/,
        food_safety: /米.*野生食材.*替代食材.*完全熟制.*无硬芯.*生食状态/,
        allergen_scope: /野生食材.*替代食材.*香菇.*过敏原声明/,
        storage: /当餐.*冷却.*冷藏.*再次加热/,
      },
      recordPatterns: [
        /野生食材.*安全替代食材.*准确食品名称.*可食用依据.*购买来源.*原始状态/,
        /米.*食材.*完全熟制检查.*成品湿度.*锅具/,
        /全部可选食材.*过敏原声明.*当餐.*冷却.*冷藏.*再次加热.*修订原因/,
      ],
    },
  };
  const candidatesById = new Map(candidates.entries.map(candidate => [candidate.id, candidate]));
  const expectedHighRiskIds = drafts.drafts
    .filter(draft => candidatesById.get(draft.candidate_id)?.risk_level === 'high')
    .map(draft => draft.id)
    .sort();

  assert.deepEqual(Object.keys(highRiskRequirements).sort(), expectedHighRiskIds, 'every high-risk candidate draft needs explicit evidence requirements');
  const highRiskDrafts = drafts.drafts.filter(draft => expectedHighRiskIds.includes(draft.id));
  assert.equal(highRiskDrafts.length, expectedHighRiskIds.length);
  for (const draft of highRiskDrafts) {
    const requirements = highRiskRequirements[draft.id];
    assert.equal(draft.status, 'draft', draft.id);
    assert.ok(draft.safety_and_quality_gates.length >= 3, `${draft.id} needs at least three gates`);
    const gatesByType = new Map(draft.safety_and_quality_gates.map(gate => [gate.type, gate.requirement]));
    for (const [type, pattern] of Object.entries(requirements.gatePatterns)) {
      assert.match(gatesByType.get(type) || '', pattern, `${draft.id}:${type}`);
    }
    if (requirements.forbiddenOptionalIngredient) {
      assert.doesNotMatch(draft.optional_ingredients.join('\n'), requirements.forbiddenOptionalIngredient, draft.id);
    }
    assert.equal(draft.trial_requirements.length, requirements.recordPatterns.length, `${draft.id} record count`);
    requirements.recordPatterns.forEach((pattern, index) => {
      assert.match(draft.trial_requirements[index] || '', pattern, `${draft.id} record ${index + 1}`);
    });
  }
});

test('thirty-draft release gate rejects a high-risk draft remapped to another valid candidate', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const draft = drafts.drafts.find(entry => entry.id === 'banshan-wild-rice-draft');
  draft.candidate_id = 'suzhou-salted-pork-vegetable-rice';

  assert.deepEqual(validateThirtyDraftReleaseGate(drafts, candidates), [
    'banshan-wild-rice-draft must link candidate_id banshan-wild-rice',
  ]);
});

test('thirty-draft release gate rejects a high-risk draft linked to a non-candidate', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const draft = drafts.drafts.find(entry => entry.id === 'banshan-wild-rice-draft');
  candidates.entries.find(entry => entry.id === draft.candidate_id).status = 'approved';

  assert.deepEqual(validateThirtyDraftReleaseGate(drafts, candidates), [
    'banshan-wild-rice-draft linked candidate banshan-wild-rice must have status candidate',
  ]);
});

test('draft checker permits exactly thirty mapped drafts', () => {
  const run = spawnSync('node', ['tools/check-recipe-drafts.mjs'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /传统一锅草案 30 道 · 生产可用 0 道/);
});

test('draft checker rejects draft counts other than thirty', (t) => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'recipe-drafts-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const runWithDraftCount = (count) => {
    const fixtureDrafts = structuredClone(drafts);
    const fixtureCandidates = structuredClone(candidates);
    while (fixtureDrafts.drafts.length < count) {
      const number = fixtureDrafts.drafts.length + 1;
      const draft = structuredClone(fixtureDrafts.drafts[0]);
      draft.id = `fixture-draft-${number}`;
      draft.candidate_id = `fixture-candidate-${number}`;
      fixtureDrafts.drafts.push(draft);
      fixtureCandidates.entries.push({ id: draft.candidate_id, status: 'candidate' });
    }
    fixtureDrafts.drafts.length = count;
    const draftPath = path.join(tempDir, `drafts-${count}.json`);
    const candidatePath = path.join(tempDir, `candidates-${count}.json`);
    const productionPath = path.join(tempDir, `production-${count}.json`);
    fs.writeFileSync(draftPath, JSON.stringify(fixtureDrafts));
    fs.writeFileSync(candidatePath, JSON.stringify(fixtureCandidates));
    fs.writeFileSync(productionPath, JSON.stringify(production));
    return spawnSync('node', [
      'tools/check-recipe-drafts.mjs',
      '--draft-file', draftPath,
      '--candidate-file', candidatePath,
      '--production-file', productionPath,
    ], { encoding: 'utf8' });
  };

  for (const count of [5, 29, 31]) {
    const run = runWithDraftCount(count);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /draft library must contain exactly 30 drafts/);
  }
});

test('draft documentation keeps the production promotion boundary explicit', () => {
  const doc = fs.readFileSync(new URL('../../docs/传统一锅草案说明.md', import.meta.url), 'utf8');
  assert.match(doc, /不进入运行时/);
  assert.match(doc, /原创标准配方/);
  assert.match(doc, /真实试做/);
  assert.match(doc, /node tools\/check-recipe-drafts\.mjs/);
});
