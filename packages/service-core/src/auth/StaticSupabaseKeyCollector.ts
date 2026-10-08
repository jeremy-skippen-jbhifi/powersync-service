import * as jose from 'jose';
import { KeyCollector, KeyResult } from './KeyCollector.js';
import { KeyOptions, KeySpec } from './KeySpec.js';

export const SUPABASE_KEY_OPTIONS: KeyOptions = {
  requiresAudience: ['authenticated'],
  maxLifetimeSeconds: 86400 * 7 + 1200 // 1 week + 20 minutes margin
};

/**
 * Set of static keys for Supabase.
 *
 * Same as StaticKeyCollector, but with some configuration tweaks for Supabase.
 *
 * Similar to SupabaseKeyCollector, but using hardcoded keys instead of fetching
 * from the database.
 *
 * A key can be added both with and without a kid, in case wildcard matching is desired.
 */
export class StaticSupabaseKeyCollector implements KeyCollector {
  private keys: KeySpec[] = [];
  private keymap: Record<string, KeySpec> = {};

  static async importKeys(keys: jose.JWK[]) {
    const parsedKeys = await Promise.all(keys.map((key) => KeySpec.importKey(key, SUPABASE_KEY_OPTIONS)));
    return new StaticSupabaseKeyCollector(parsedKeys);
  }

  constructor(keys: KeySpec[]) {
    for (let key of keys) {
      if (typeof key.kid === 'string') {
        this.keymap[key.kid] = key;
      } else {
        this.keys.push(key);
      }
    }
  }

  async getKeys(): Promise<KeyResult> {
    return { keys: this.keys, keymap: this.keymap, errors: [] };
  }
}
