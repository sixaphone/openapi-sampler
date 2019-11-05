'use strict';

import { traverse } from './traverse';
import {mergeDeep, nestedTypeLookup} from './utils';

export function allOfSample(into, children, options, spec) {
  const res = traverse(into, options, spec);
  const subSamples = [];

  for (let subSchema of children) {
    const { type, readOnly, writeOnly, value } = traverse({ type, ...subSchema }, options, spec);

    if (res.type && type && type !== res.type) {
      throw new Error('allOf: schemas with different types can\'t be merged');
    }

    res.type = res.type || type;
    res.readOnly = res.readOnly || readOnly;
    res.writeOnly = res.writeOnly || writeOnly;

    if (value != null) {
      subSamples.push(value);
    }
  }

  if (res.type === 'object') {
    res.value = mergeDeep(res.value || {}, ...subSamples);
  } else {
    if (res.type === 'array' ) {

      if (!options.quiet) {
        console.warn('OpenAPI Sampler: found allOf with "array" type. Result may be incorrect');
      }

      const arraySchema = mergeDeep(...children);
      if (!arraySchema.items) {
        arraySchema.items = {type: nestedTypeLookup(arraySchema)};
      }
      res.value = traverse(arraySchema, options, spec).value;
    } else {
      const lastSample = subSamples[subSamples.length - 1];
      res.value = lastSample != null ? lastSample : res.value;
    }
  }
  return res;
}
