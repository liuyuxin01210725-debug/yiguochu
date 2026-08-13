import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { kitchenObservationRequiredFields, validateKitchenObservation } from '../lib/kitchen-observation.mjs';

const schema = JSON.parse(fs.readFileSync(new URL('../data/kitchen-observation.schema.v1.json', import.meta.url), 'utf8'));

test('hand validator and JSON Schema share top-level required and additionalProperties rules', () => {
  assert.deepEqual([...kitchenObservationRequiredFields].sort(), [...schema.required].sort());
  assert.equal(schema.additionalProperties, false);
  const unknown = { schema_version: 'kitchen-observation.v1', unexpected: true };
  assert.ok(validateKitchenObservation(unknown).some(error => error.includes('unknown top-level field')));
});
