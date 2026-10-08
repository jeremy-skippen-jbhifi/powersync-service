import * as jose from 'jose';
import { KeyCollector, KeyResult } from './KeyCollector.js';
import { KeySpec } from './KeySpec.js';

/**
 * Set of static keys.
 *
 * A key can be added both with and without a kid, in case wildcard matching is desired.
 */
export class StaticKeyCollector implements KeyCollector {
  private keys: KeySpec[] = [];
  private keymap: Map<string, KeySpec> = new Map();

  static async importKeys(keys: jose.JWK[]) {
    const parsedKeys = await Promise.all(keys.map((key) => KeySpec.importKey(key)));
    return new StaticKeyCollector(parsedKeys);
  }

  constructor(keys: KeySpec[]) {
    for (let key of keys) {
      if (typeof key.kid === 'string') {
        this.keymap.set(key.kid, key);
      } else {
        this.keys.push(key);
      }
    }
  }

  async getKeys(): Promise<KeyResult> {
    return { keys: this.keys, getKeyById: Map.prototype.get.bind(this.keymap), errors: [] };
  }
}
