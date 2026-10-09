import { AuthorizationError } from '@powersync/lib-services-framework';
import { KeyCollector, KeyResult } from './KeyCollector.js';
import { KeySpec } from './KeySpec.js';

export class CompoundKeyCollector implements KeyCollector {
  private collectors: KeyCollector[];

  constructor(collectors?: KeyCollector[]) {
    this.collectors = collectors ?? [];
  }

  add(collector: KeyCollector) {
    this.collectors.push(collector);
  }

  async getKeys(): Promise<KeyResult> {
    const errors: AuthorizationError[] = [];
    const getKeyByIdFns: Array<(kid: string) => KeySpec | undefined> = [];
    const getWildcardKeyFns: Array<(alg: string, token: string) => Promise<KeySpec | undefined>> = [];
    const allKeyFns: Array<() => KeySpec[]> = [];
    const promises = this.collectors.map((collector) =>
      collector.getKeys().then((result) => {
        errors.push(...result.errors);
        getKeyByIdFns.push(result.getKeyById);
        getWildcardKeyFns.push(result.getWildcardKey);
        allKeyFns.push(result.allKeys);
      })
    );
    await Promise.all(promises);
    return {
      errors,
      getKeyById(kid) {
        for (let fn of getKeyByIdFns) {
          const key = fn(kid);
          if (key) {
            return key;
          }
        }
        return undefined;
      },
      async getWildcardKey(alg, token) {
        for (let fn of getWildcardKeyFns) {
          const key = await fn(alg, token);
          if (key) {
            return key;
          }
        }
        return undefined;
      },
      allKeys: () => allKeyFns.flatMap((fn) => fn())
    };
  }

  async noKeyFound(): Promise<void> {
    const promises = this.collectors.map((collector) => collector.noKeyFound?.());
    await Promise.all(promises);
  }
}
