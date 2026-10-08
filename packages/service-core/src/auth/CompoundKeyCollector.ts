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
    let keymap: Record<string, KeySpec> = {};
    const errors: AuthorizationError[] = [];
    const promises = this.collectors.map((collector) =>
      collector.getKeys().then((result) => {
        keys.push(...result.keys);
        keymap = { ...keymap, ...result.keymap };
        errors.push(...result.errors);
      })
    );
    await Promise.all(promises);
    return { keys, keymap, errors };
  }

  async noKeyFound(): Promise<void> {
    const promises = this.collectors.map((collector) => collector.noKeyFound?.());
    await Promise.all(promises);
  }
}
