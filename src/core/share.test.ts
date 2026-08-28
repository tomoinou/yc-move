import { describe, expect, it } from 'vitest';
import { encodePlay, decodePlay } from './share.ts';
import type { Play } from './types.ts';

const testPlay: Play = {
  schemaVersion: 2,
  id: 'test123',
  title: 'テストプレイ',
  meta: { tags: ['test'], updatedAt: '2026-01-01T00:00:00Z' },
  durationMs: 3000,
  markers: [1000, 2000],
  viewY: 5,
  entities: [
    { id: 'a1', side: 'attack', label: 'A1', track: [{ t: 0, p: { x: 10, y: 5 } }, { t: 2000, p: { x: 20, y: 25 } }] },
  ],
  ball: { holders: [{ t: 0, holderId: 'a1' }] },
  annotations: [{ id: 'ann1', text: 'テスト', p: { x: 20, y: 20 } }],
  nextAttackIdx: 2,
  nextDefenceIdx: 1,
};

describe('share', () => {
  it('encode→decode でラウンドトリップする', async () => {
    const encoded = await encodePlay(testPlay);
    expect(typeof encoded).toBe('string');
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
    const decoded = await decodePlay(encoded);
    expect(decoded).toEqual(testPlay);
  });

  it('エンコードが元の JSON より短い', async () => {
    const encoded = await encodePlay(testPlay);
    const rawLen = JSON.stringify(testPlay).length;
    // base64 overhead ~4/3, but gzip should beat raw JSON for repeated keys
    expect(encoded.length).toBeLessThan(rawLen);
  });

  it('V1 フォーマットをデコードして V2 にマイグレーションする', async () => {
    const v1Play = {
      schemaVersion: 1,
      id: 'v1test',
      title: 'V1 Test',
      meta: { tags: [], updatedAt: '2026-01-01T00:00:00Z' },
      durationMs: 2000,
      markers: [1000],
      viewY: 0,
      entities: [{ id: 'p1', side: 'attack' as const, label: 'P1', track: [{ t: 0, p: { x: 10, y: 5 } }] }],
      ball: { initialHolder: 'p1', events: [] },
      annotations: [],
      nextAttackIdx: 2,
      nextDefenceIdx: 1,
    };
    const bytes = new TextEncoder().encode(JSON.stringify(v1Play));
    const cs = new CompressionStream('gzip');
    const w = cs.writable.getWriter();
    w.write(bytes);
    w.close();
    const compressed = await new Response(cs.readable).arrayBuffer();
    const arr = new Uint8Array(compressed);
    let binary = '';
    for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
    const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const decoded = await decodePlay(encoded);
    expect(decoded.schemaVersion).toBe(2);
    expect(decoded.ball.holders[0]).toEqual({ t: 0, holderId: 'p1' });
  });
});
