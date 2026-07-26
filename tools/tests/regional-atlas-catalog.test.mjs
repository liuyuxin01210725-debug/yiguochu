import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateRegionalAtlas } from '../lib/regional-atlas-validator.mjs';

const atlas = JSON.parse(fs.readFileSync(
  new URL('../data/regional-atlas.v2.json', import.meta.url),
  'utf8',
));

test('national atlas contains the exact phase-zero skeleton', () => {
  assert.equal(atlas.regions.length, 13);
  assert.equal(atlas.province_nodes.length, 34);
  assert.equal(atlas.technique_families.length, 12);
  assert.deepEqual(validateRegionalAtlas(atlas), []);
});

test('every province belongs to exactly one region and blanks remain explicit', () => {
  assert.equal(new Set(atlas.province_nodes.map(row => row.atlas_code)).size, 34);
  for (const row of atlas.province_nodes) {
    assert.equal(row.status, 'skeleton_only');
    assert.ok(Boolean(row.research_question) !== Boolean(row.defer_reason));
  }
});

test('catalog contains the exact province set and each parent region is known', () => {
  const expected = [
    'CN-AH', 'CN-BJ', 'CN-CQ', 'CN-FJ', 'CN-GD', 'CN-GS', 'CN-GX', 'CN-GZ',
    'CN-HA', 'CN-HB', 'CN-HE', 'CN-HI', 'CN-HK', 'CN-HL', 'CN-HN', 'CN-JL',
    'CN-JS', 'CN-JX', 'CN-LN', 'CN-MO', 'CN-NM', 'CN-NX', 'CN-QH', 'CN-SC',
    'CN-SD', 'CN-SH', 'CN-SN', 'CN-SX', 'CN-TJ', 'CN-TW', 'CN-XJ', 'CN-XZ',
    'CN-YN', 'CN-ZJ',
  ];
  assert.deepEqual(atlas.province_nodes.map(row => row.atlas_code).sort(), expected);
  const regions = new Set(atlas.regions.map(row => row.region_id));
  assert.ok(atlas.province_nodes.every(row => regions.has(row.region_id)));
});

test('culture overlays reference province nodes instead of duplicating prototypes', () => {
  const provinceCodes = new Set(atlas.province_nodes.map(row => row.atlas_code));
  for (const overlay of atlas.cultural_overlays) {
    assert.ok(overlay.target_province_codes.every(code => provinceCodes.has(code)));
    assert.equal('prototype_name' in overlay, false);
    assert.equal(overlay.status, 'skeleton_only');
  }
});

test('catalog rejects duplicate provinces, unknown parents and recipe fields', () => {
  const broken = structuredClone(atlas);
  broken.province_nodes[1].atlas_code = broken.province_nodes[0].atlas_code;
  broken.province_nodes[2].region_id = 'missing-region';
  broken.province_nodes[3].ratio_rules = ['不应出现在骨架层'];
  const message = validateRegionalAtlas(broken).join('\n');
  assert.match(message, /province atlas_code must be unique/);
  assert.match(message, /unknown region_id missing-region/);
  assert.match(message, /ratio_rules is not allowed/);
});

test('catalog validator is total for malformed roots and nested rows', () => {
  assert.deepEqual(validateRegionalAtlas(null), ['catalog must be an object']);
  const broken = structuredClone(atlas);
  broken.regions = [null];
  broken.province_nodes = [null];
  broken.technique_families = [null];
  broken.cultural_overlays = [null];
  assert.doesNotThrow(() => validateRegionalAtlas(broken));
  assert.match(validateRegionalAtlas(broken).join('\n'), /must be an object/);
});
