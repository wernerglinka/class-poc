/**
 * @fileoverview Tests for the metalsmith-cpc-classes plugin.
 *
 * The plugin fetches class data from the Google Apps Script web app
 * and attaches it to global metadata. These tests inject a fake fetch
 * so nothing touches the network, and a minimal fake Metalsmith
 * instance so no build pipeline is needed.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import cpcClasses, {
  findFirstSessionDate,
  normalizeOfferings
} from '../plugins/metalsmith-cpc-classes.js';

/**
 * Create a minimal Metalsmith stand-in: just metadata() and debug().
 * @returns {{metadata: Function, debug: Function}} Fake Metalsmith
 */
const createFakeMetalsmith = () => {
  const metadata = {};
  return {
    metadata: () => metadata,
    debug: () => () => {}
  };
};

/**
 * Create a fetch stub that returns the given payload and counts calls.
 * @param {Object} payload - JSON body to return
 * @param {number} [status] - HTTP status, default 200
 * @returns {{fetchStub: Function, calls: {count: number, lastUrl: string}}} Stub and call record
 */
const createFetchStub = (payload, status = 200) => {
  const calls = { count: 0, lastUrl: '' };
  const fetchStub = (url) => {
    calls.count += 1;
    calls.lastUrl = url;
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(payload)
    });
  };
  return { fetchStub, calls };
};

const samplePayload = {
  offerings: [
    {
      offeringId: 'later-class-20260801',
      classTitle: 'Later Class',
      sessions: [
        { sessionId: 'later-class-20260801-s1', sessionDate: '2026-08-01' }
      ]
    },
    {
      offeringId: 'undated-class',
      classTitle: 'Undated Class',
      sessions: []
    },
    {
      offeringId: 'early-class-20260710',
      classTitle: 'Early Class',
      sessions: [
        { sessionId: 'early-class-20260710-s2', sessionDate: '2026-07-17' },
        { sessionId: 'early-class-20260710-s1', sessionDate: '2026-07-10' }
      ]
    }
  ]
};

describe('option validation', () => {
  it('throws without apiUrl', () => {
    assert.throws(() => cpcClasses({ token: 'x' }), /apiUrl option is required/);
  });

  it('throws without token', () => {
    assert.throws(() => cpcClasses({ apiUrl: 'https://example.com/exec' }), /token option is required/);
  });
});

describe('findFirstSessionDate', () => {
  it('returns the earliest date regardless of order', () => {
    const offering = {
      sessions: [{ sessionDate: '2026-07-17' }, { sessionDate: '2026-07-10' }]
    };
    assert.equal(findFirstSessionDate(offering), '2026-07-10');
  });

  it('returns empty string for no sessions', () => {
    assert.equal(findFirstSessionDate({ sessions: [] }), '');
  });
});

describe('normalizeOfferings', () => {
  it('rejects unexpected payload shapes', () => {
    assert.throws(() => normalizeOfferings(null), /unexpected payload shape/);
    assert.throws(() => normalizeOfferings({}), /unexpected payload shape/);
    assert.throws(() => normalizeOfferings({ offerings: 'nope' }), /unexpected payload shape/);
  });

  it('sorts by first session date with dateless offerings last', () => {
    const normalized = normalizeOfferings(samplePayload);
    assert.deepEqual(
      normalized.map((offering) => offering.offeringId),
      ['early-class-20260710', 'later-class-20260801', 'undated-class']
    );
  });

  it('stamps firstSessionDate on every offering', () => {
    const normalized = normalizeOfferings(samplePayload);
    assert.equal(normalized[0].firstSessionDate, '2026-07-10');
    assert.equal(normalized[2].firstSessionDate, '');
  });
});

describe('plugin behavior', () => {
  it('attaches sorted offerings to metadata under the configured key', async () => {
    const { fetchStub } = createFetchStub(samplePayload);
    const metalsmith = createFakeMetalsmith();
    const plugin = cpcClasses({
      apiUrl: 'https://example.com/exec',
      token: 'secret',
      metadataKey: 'classes',
      fetchImplementation: fetchStub
    });

    await plugin({}, metalsmith);

    const classes = metalsmith.metadata().classes;
    assert.equal(classes.length, 3);
    assert.equal(classes[0].offeringId, 'early-class-20260710');
  });

  it('sends the token as a query parameter', async () => {
    const { fetchStub, calls } = createFetchStub(samplePayload);
    const plugin = cpcClasses({
      apiUrl: 'https://example.com/exec',
      token: 'se cret',
      fetchImplementation: fetchStub
    });

    await plugin({}, createFakeMetalsmith());

    assert.equal(calls.lastUrl, 'https://example.com/exec?token=se%20cret');
  });

  it('caches across runs within the TTL', async () => {
    const { fetchStub, calls } = createFetchStub(samplePayload);
    const plugin = cpcClasses({
      apiUrl: 'https://example.com/exec',
      token: 'secret',
      ttlSeconds: 300,
      fetchImplementation: fetchStub
    });

    await plugin({}, createFakeMetalsmith());
    const metalsmith = createFakeMetalsmith();
    await plugin({}, metalsmith);

    assert.equal(calls.count, 1, 'second run should use the cache');
    assert.equal(metalsmith.metadata().classes.length, 3, 'cached run still attaches metadata');
  });

  it('fetches fresh every run when TTL is 0', async () => {
    const { fetchStub, calls } = createFetchStub(samplePayload);
    const plugin = cpcClasses({
      apiUrl: 'https://example.com/exec',
      token: 'secret',
      ttlSeconds: 0,
      fetchImplementation: fetchStub
    });

    await plugin({}, createFakeMetalsmith());
    await plugin({}, createFakeMetalsmith());

    assert.equal(calls.count, 2);
  });

  it('rejects on HTTP errors with status context', async () => {
    const { fetchStub } = createFetchStub({}, 500);
    const plugin = cpcClasses({
      apiUrl: 'https://example.com/exec',
      token: 'secret',
      fetchImplementation: fetchStub
    });

    await assert.rejects(() => plugin({}, createFakeMetalsmith()), /HTTP 500/);
  });
});
