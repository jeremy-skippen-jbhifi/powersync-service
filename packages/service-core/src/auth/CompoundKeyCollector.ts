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
    const keys: KeySpec[] = [];
    const getKeyByIdFns: Array<(kid: string) => KeySpec | undefined> = [];
    const errors: AuthorizationError[] = [];
    const promises = this.collectors.map((collector) =>
      collector.getKeys().then((result) => {
        keys.push(...result.keys);
        getKeyByIdFns.push(result.getKeyById);
        errors.push(...result.errors);
      })
    );
    await Promise.all(promises);
    return {
      errors,
      keys,
      getKeyById(kid) {
        for (let fn of getKeyByIdFns) {
          const key = fn(kid);
          if (key) {
            return key;
          }
        }
        return undefined;
      }
    };
  }

  async noKeyFound(): Promise<void> {
    const promises = this.collectors.map((collector) => collector.noKeyFound?.());
    await Promise.all(promises);
  }
}
