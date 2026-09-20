import type { FieldMetadata } from '../types';
import { FieldType } from '../types';

export interface FieldValidationResult {
  missing: string[]; // required (non-optional, non-image) field ids with no matching key
  unknown: string[]; // incoming keys that don't match any mappable field id
}

/**
 * Compares incoming data keys (MQTT payload keys, or CSV headers) against a
 * template's field ids. Image fields can't be driven by incoming data, so
 * they're excluded from both sides of the comparison.
 */
export const validateFieldKeys = (
  fieldMetadata: FieldMetadata[],
  keys: string[]
): FieldValidationResult => {
  const mappable = fieldMetadata.filter(f => f.type !== FieldType.IMAGE);
  const keySet = new Set(keys);

  const missing = mappable
    .filter(f => !f.optional && !keySet.has(f.id))
    .map(f => f.id);

  const mappableIds = new Set(mappable.map(f => f.id));
  const unknown = keys.filter(k => !mappableIds.has(k));

  return { missing, unknown };
};

export const hasValidationErrors = (result: FieldValidationResult): boolean =>
  result.missing.length > 0 || result.unknown.length > 0;

export const formatValidationError = (result: FieldValidationResult): string => {
  const parts: string[] = [];
  if (result.missing.length > 0) parts.push(`missing: ${result.missing.join(', ')}`);
  if (result.unknown.length > 0) parts.push(`unknown: ${result.unknown.join(', ')}`);
  return parts.join('; ');
};
