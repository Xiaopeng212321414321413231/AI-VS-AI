import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { OPTIONAL_PROVIDER_CONFIGS } from '../modules/optional-provider-access.js';
import { PROVIDERS, getProviderById } from '../modules/providers.js';

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), 'manifest.json'), 'utf8')
);

const MINIMAX_ORIGINS = [
  'https://agent.minimax.io/*',
  'https://agent.minimax.cn/*',
  'https://agent.minimaxi.com/*',
];

const NEW_PROVIDER_CASES = [
  ['minimax-agent', 'minimax-agent-scripts', MINIMAX_ORIGINS, 1005],
  ['hailuo-cn', 'hailuo-cn-scripts', ['https://hailuoai.com/*', 'https://www.hailuoai.com/*'], 1006],
  ['hailuo-global', 'hailuo-global-scripts', ['https://hailuoai.video/*', 'https://www.hailuoai.video/*'], 1007],
];

describe('MiniMax and Hailuo provider wiring', () => {
  it('registers each new provider in the selectable provider list', () => {
    expect(getProviderById('minimax-agent')).toMatchObject({
      name: 'MiniMax Agent',
      url: 'https://agent.minimax.io/',
      icon: '/icons/providers/minimax.png',
    });
    expect(getProviderById('hailuo-cn')).toMatchObject({
      name: 'Hailuo AI (China)',
      url: 'https://hailuoai.com/',
      icon: '/icons/providers/hailuo.png',
    });
    expect(getProviderById('hailuo-global')).toMatchObject({
      name: 'Hailuo AI (Global)',
      url: 'https://hailuoai.video/',
      icon: '/icons/providers/hailuo.png',
    });
  });

  it('gives every provider a distinct optional origin set', () => {
    const originKeys = PROVIDERS
      .filter(({ optionalOrigins }) => optionalOrigins)
      .map(({ optionalOrigins }) => optionalOrigins.join('|'));

    expect(new Set(originKeys).size).toBe(originKeys.length);
  });

  it.each(NEW_PROVIDER_CASES)(
    'declares optional host permissions for %s',
    (_providerId, _scriptId, origins) => {
      for (const origin of origins) {
        expect(manifest.optional_host_permissions).toContain(origin);
        expect(manifest.host_permissions).not.toContain(origin);
      }
    }
  );

  it.each(NEW_PROVIDER_CASES)(
    'registers %s scripts and a frame rule dynamically',
    (providerId, scriptId, origins, frameRuleId) => {
      const config = OPTIONAL_PROVIDER_CONFIGS[providerId];

      expect(config.origins).toEqual(origins);
      expect(config.contentScript).toMatchObject({
        id: scriptId,
        matches: origins,
        runAt: 'document_start',
        allFrames: true,
      });
      expect(config.frameRule).toMatchObject({
        id: frameRuleId,
        condition: { resourceTypes: ['sub_frame'] },
      });
      expect(manifest.content_scripts.some(({ matches }) =>
        matches.some((match) => origins.includes(match))
      )).toBe(false);
    }
  );

  it('loads the Enter behavior script before text injection', () => {
    expect(OPTIONAL_PROVIDER_CONFIGS['minimax-agent'].contentScript.js).toEqual([
      'content-scripts/button-finder-utils.js',
      'content-scripts/enter-behavior-utils.js',
      'content-scripts/enter-behavior-minimax-agent.js',
      'content-scripts/text-injection-all-providers.js',
      'content-scripts/focus-toggle.js',
    ]);
    expect(OPTIONAL_PROVIDER_CONFIGS['hailuo-cn'].contentScript.js).toContain(
      'content-scripts/enter-behavior-hailuo.js'
    );
    expect(OPTIONAL_PROVIDER_CONFIGS['hailuo-global'].contentScript.js).toContain(
      'content-scripts/enter-behavior-hailuo.js'
    );
  });
});
