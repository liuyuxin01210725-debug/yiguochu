import { RECIPE_ACTION_REGISTRY } from './recipe-action-registry.js';

const CATALOG_VERSION = 'recipe-action-profiles-v1-20260731-r1';
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonEmpty = value => typeof value === 'string' && value.length > 0;
const uniqueStrings = value => Array.isArray(value)
  && value.every(nonEmpty) && new Set(value).size === value.length;
const sameSet = (left, right) => left.length === right.length && left.every(value => right.includes(value));

function unknownKeys(value, allowed, label, errors) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${label} unknown key ${key}`);
}

function orderedInstances(profile) {
  const byId = new Map((profile.instances || []).map(instance => [instance.instance_id, instance]));
  return (profile.execution_sequence || []).map(instanceId => byId.get(instanceId)).filter(Boolean);
}

function validatePartialOrder(profile, errors, label) {
  const ordered = orderedInstances(profile);
  const positions = new Map();
  ordered.forEach((instance, index) => {
    if (!positions.has(instance.action_code)) positions.set(instance.action_code, []);
    positions.get(instance.action_code).push(index);
  });
  for (const instance of ordered) {
    const schema = RECIPE_ACTION_REGISTRY[instance.action_code];
    const current = positions.get(instance.action_code) || [];
    for (const target of schema?.must_precede || []) {
      const targetPositions = positions.get(target) || [];
      if (!targetPositions.length) {
        errors.push(`${label} ${instance.action_code} must_precede requires action ${target}`);
      } else if (Math.max(...current) >= Math.min(...targetPositions)) {
        errors.push(`${label} ${instance.action_code} must_precede ${target}`);
      }
    }
    for (const target of schema?.must_follow || []) {
      const targetPositions = positions.get(target) || [];
      if (!targetPositions.length) {
        errors.push(`${label} ${instance.action_code} must_follow requires action ${target}`);
      } else if (Math.min(...current) <= Math.max(...targetPositions)) {
        errors.push(`${label} ${instance.action_code} must_follow ${target}`);
      }
    }
    for (const alternatives of schema?.must_precede_any || []) {
      const targetPositions = alternatives.flatMap(target => positions.get(target) || []);
      if (!targetPositions.length) {
        errors.push(`${label} ${instance.action_code} must_precede requires one action from ${alternatives.join(',')}`);
      } else if (Math.max(...current) >= Math.min(...targetPositions)) {
        errors.push(`${label} ${instance.action_code} must_precede one of ${alternatives.join(',')}`);
      }
    }
    for (const alternatives of schema?.must_follow_any || []) {
      const targetPositions = alternatives.flatMap(target => positions.get(target) || []);
      if (!targetPositions.length) {
        errors.push(`${label} ${instance.action_code} must_follow requires one action from ${alternatives.join(',')}`);
      } else if (current.some(position => !targetPositions.some(targetPosition => targetPosition < position))) {
        errors.push(`${label} ${instance.action_code} must_follow one of ${alternatives.join(',')}`);
      }
    }
  }
}

export function validateRecipeActionProfileCatalog(catalog) {
  const errors = [];
  if (!isObject(catalog)) return ['action profile catalog must be an object'];
  unknownKeys(catalog, new Set(['action_profile_catalog_version', 'profiles']), 'action profile catalog', errors);
  if (catalog.action_profile_catalog_version !== CATALOG_VERSION) {
    errors.push('action profile catalog version is invalid');
  }
  if (!Array.isArray(catalog.profiles)) return [...errors, 'action profile catalog profiles must be an array'];
  const seenRefs = new Set();
  for (const [profileIndex, profile] of catalog.profiles.entries()) {
    const label = `action profiles[${profileIndex}]`;
    if (!isObject(profile)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    unknownKeys(profile, new Set(['action_profile_id', 'profile_version', 'instances', 'execution_sequence']), label, errors);
    if (!nonEmpty(profile.action_profile_id)) errors.push(`${label}.action_profile_id must be a non-empty string`);
    if (!nonEmpty(profile.profile_version)) errors.push(`${label}.profile_version must be a non-empty string`);
    const ref = `${profile.action_profile_id}\0${profile.profile_version}`;
    if (seenRefs.has(ref)) errors.push(`${label} duplicate profile reference`);
    seenRefs.add(ref);
    if (!Array.isArray(profile.instances) || profile.instances.length === 0) {
      errors.push(`${label}.instances must not be empty`);
      continue;
    }
    const instanceIds = [];
    for (const [instanceIndex, instance] of profile.instances.entries()) {
      const instanceLabel = `${label}.instances[${instanceIndex}]`;
      if (!isObject(instance)) {
        errors.push(`${instanceLabel} must be an object`);
        continue;
      }
      unknownKeys(instance, new Set([
        'instance_id', 'action_code', 'slot_ids', 'fact_refs', 'produces_resources',
        'consumes_resources', 'safety_endpoint_codes',
      ]), instanceLabel, errors);
      if (!nonEmpty(instance.instance_id)) errors.push(`${instanceLabel}.instance_id must be a non-empty string`);
      else instanceIds.push(instance.instance_id);
      if (!RECIPE_ACTION_REGISTRY[instance.action_code]) errors.push(`${instanceLabel}.action_code is unknown`);
      for (const field of ['slot_ids', 'fact_refs', 'produces_resources', 'consumes_resources', 'safety_endpoint_codes']) {
        if (!uniqueStrings(instance[field] || [])) errors.push(`${instanceLabel}.${field} must contain unique strings`);
      }
      const actionSchema = RECIPE_ACTION_REGISTRY[instance.action_code];
      if (actionSchema) {
        if (instance.action_code !== 'complete_recipe_safety'
            && !actionSchema.exact_slot_sets.some(expected => sameSet(instance.slot_ids || [], expected))) {
          errors.push(`${instanceLabel}.slot_ids do not match action schema`);
        }
        if (!sameSet(instance.fact_refs || [], actionSchema.required_facts)) {
          errors.push(`${instanceLabel}.fact_refs do not match action schema`);
        }
        if (!sameSet(instance.produces_resources || [], actionSchema.produces_resources)
            || !sameSet(instance.consumes_resources || [], actionSchema.consumes_resources)) {
          errors.push(`${instanceLabel}.resources do not match action schema`);
        }
      }
    }
    if (new Set(instanceIds).size !== instanceIds.length) errors.push(`${label} duplicate instance_id`);
    if (!uniqueStrings(profile.execution_sequence)) {
      errors.push(`${label}.execution_sequence must contain unique instance ids`);
    } else if (profile.execution_sequence.length !== instanceIds.length
        || profile.execution_sequence.some(instanceId => !instanceIds.includes(instanceId))) {
      errors.push(`${label}.execution_sequence must exactly cover instances`);
    }
    validatePartialOrder(profile, errors, label);
  }
  return errors;
}

export function resolveRecipeActionProfile(catalog, ref) {
  const errors = validateRecipeActionProfileCatalog(catalog);
  if (errors.length) throw new Error(`named_recipe_action_profile_invalid:${errors[0]}`);
  if (!isObject(ref) || !nonEmpty(ref.action_profile_id) || !nonEmpty(ref.profile_version)) {
    throw new Error('named_recipe_action_profile_missing');
  }
  const matches = catalog.profiles.filter(profile => profile.action_profile_id === ref.action_profile_id
    && profile.profile_version === ref.profile_version);
  if (matches.length !== 1) throw new Error('named_recipe_action_profile_stale');
  return matches[0];
}

export function materializeProfileActions(profile) {
  const byId = new Map(profile.instances.map(instance => [instance.instance_id, instance]));
  return profile.execution_sequence.map((instanceId, index) => ({
    ...structuredClone(byId.get(instanceId)),
    phase: index + 1,
  }));
}

export const RECIPE_ACTION_PROFILE_CATALOG_VERSION = CATALOG_VERSION;
