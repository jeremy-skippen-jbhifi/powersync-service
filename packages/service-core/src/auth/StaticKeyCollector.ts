import * as jose from 'jose';
import { KeyCollector, KeyResult } from './KeyCollector.js';
import { KeySpec } from './KeySpec.js';

/**
 * Set of static keys.
 *
 * A key can be added both with and without a kid, in case wildcard matching is desired.
 */
export class StaticKeyCollector implements KeyCollector {
  private keymap: Map<string, KeySpec> = new Map();
  private wildcardKeys: KeySpec[] = [];
  private duplicateOrInvalidKeys: KeySpec[] = [];

  static async importKeys(keys: jose.JWK[]) {
    const parsedKeys = await Promise.all(keys.map((key) => KeySpec.importKey(key)));
    return new StaticKeyCollector(parsedKeys);
  }

  constructor(keys: KeySpec[]) {
    for (let key of keys) {
      if (typeof key.kid === 'string') {
        if (!this.keymap.has(key.kid)) {
          this.keymap.set(key.kid, key);
        } else {
          this.duplicateOrInvalidKeys.push(key);
        }
      } else if (key.kid === null || key.kid === undefined) {
        this.wildcardKeys.push(key);
      } else {
        this.duplicateOrInvalidKeys.push(key);
      }
    }
  }

  async getKeys(): Promise<KeyResult> {
    return {
      errors: [],
      getKeyById: Map.prototype.get.bind(this.keymap),
      wildcardKeys: this.wildcardKeys,
      allKeys: () => [...this.keymap.values(), ...this.wildcardKeys, ...this.duplicateOrInvalidKeys]
    };
  }
}
