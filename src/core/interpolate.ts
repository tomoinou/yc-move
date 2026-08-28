import type { Entity, TrackKey, Vec2 } from './types.ts';

export type SegmentWarning = {
  fromIndex: number;
  toIndex: number;
  avgSpeedMs: number;
};

const ALPHA = 0.5;
const ARC_SAMPLES = 100;
const SPEED_LIMIT = 6.0;
const KNOT_EPS = 1e-10;

function dist(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function lerp2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function wsum(a: Vec2, wa: number, b: Vec2, wb: number): Vec2 {
  return { x: wa * a.x + wb * b.x, y: wa * a.y + wb * b.y };
}

// Centripetal Catmull-Rom via Barry-Goldman. u ∈ [0,1] along P1→P2.
function catmullRomPoint(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, u: number): Vec2 {
  const d01 = Math.pow(dist(p0, p1), ALPHA);
  const d12 = Math.pow(dist(p1, p2), ALPHA);
  const d23 = Math.pow(dist(p2, p3), ALPHA);

  // Degenerate: same-position keys → linear fallback
  if (d01 < KNOT_EPS || d12 < KNOT_EPS) return lerp2(p1, p2, u);

  const t1 = d01;
  const t2 = t1 + d12;
  // If P2 == P3 (ghost or coincident), borrow d12 to avoid ÷0
  const d23eff = d23 < KNOT_EPS ? d12 : d23;
  const t3 = t2 + d23eff;

  const tp = t1 + u * d12;

  const a1 = wsum(p0, (t1 - tp) / d01,   p1, tp / d01);
  const a2 = wsum(p1, (t2 - tp) / d12,   p2, (tp - t1) / d12);
  const a3 = wsum(p2, (t3 - tp) / d23eff, p3, (tp - t2) / d23eff);

  const b1 = wsum(a1, (t2 - tp) / (t2 - 0),   a2, tp / (t2 - 0));
  const b2 = wsum(a2, (t3 - tp) / (t3 - t1), a3, (tp - t1) / (t3 - t1));

  return wsum(b1, (t2 - tp) / d12, b2, (tp - t1) / d12);
}

type ArcEntry = { u: number; arcLen: number };

function buildArcTable(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2): ArcEntry[] {
  const table: ArcEntry[] = [{ u: 0, arcLen: 0 }];
  let prev = catmullRomPoint(p0, p1, p2, p3, 0);
  let total = 0;
  for (let i = 1; i <= ARC_SAMPLES; i++) {
    const u = i / ARC_SAMPLES;
    const pt = catmullRomPoint(p0, p1, p2, p3, u);
    total += dist(prev, pt);
    table.push({ u, arcLen: total });
    prev = pt;
  }
  return table;
}

function arcTableQuery(
  table: ArcEntry[],
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2,
  fraction: number,
): Vec2 {
  const totalLen = table[table.length - 1].arcLen;
  if (totalLen < KNOT_EPS) return lerp2(p1, p2, fraction);

  const target = fraction * totalLen;
  let lo = 0;
  let hi = table.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (table[mid].arcLen <= target) lo = mid;
    else hi = mid;
  }
  const span = table[hi].arcLen - table[lo].arcLen;
  const u = span < KNOT_EPS
    ? table[lo].u
    : table[lo].u + (table[hi].u - table[lo].u) * (target - table[lo].arcLen) / span;

  return catmullRomPoint(p0, p1, p2, p3, u);
}

// Segment: contiguous slice of track between corner keys (inclusive indices).
// Corner keys are shared between adjacent segments (last of one, first of next).
type Segment = { start: number; end: number };

function getSegments(track: readonly TrackKey[]): Segment[] {
  const segs: Segment[] = [];
  let start = 0;
  for (let i = 1; i < track.length; i++) {
    if (track[i].corner) {
      segs.push({ start, end: i });
      start = i;
    }
  }
  segs.push({ start, end: track.length - 1 });
  return segs;
}

// Returns 4 Catmull-Rom control points [P0, P1, P2, P3] for chord (idx, idx+1).
// Missing neighbours are ghost-reflected to produce straight-line behaviour.
function controlPoints(
  track: readonly TrackKey[],
  idx: number,
  seg: Segment,
): [Vec2, Vec2, Vec2, Vec2] {
  const p1 = track[idx].p;
  const p2 = track[idx + 1].p;
  const p0: Vec2 = idx > seg.start
    ? track[idx - 1].p
    : { x: 2 * p1.x - p2.x, y: 2 * p1.y - p2.y };
  const p3: Vec2 = idx + 2 <= seg.end
    ? track[idx + 2].p
    : { x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y };
  return [p0, p1, p2, p3];
}

function findSegment(segs: Segment[], chordIdx: number): Segment {
  // A chord (chordIdx, chordIdx+1) belongs to the segment where start <= chordIdx < end
  for (const s of segs) {
    if (s.start <= chordIdx && chordIdx < s.end) return s;
  }
  // Fallback: last segment (should not happen with well-formed track)
  return segs[segs.length - 1];
}

export function entityPositionAt(entity: Entity, t: number): Vec2 {
  const { track } = entity;

  if (track.length === 0) return { x: 0, y: 0 };
  if (track.length === 1) return { ...track[0].p };
  if (t <= track[0].t) return { ...track[0].p };
  if (t >= track[track.length - 1].t) return { ...track[track.length - 1].p };

  // Find chord: largest i such that track[i].t <= t
  let ci = 0;
  for (let i = 0; i < track.length - 1; i++) {
    if (track[i].t <= t && t < track[i + 1].t) { ci = i; break; }
  }

  const k1 = track[ci];
  const k2 = track[ci + 1];

  // Hold: remain at k1's position until k2's time
  if (k2.hold) return { ...k1.p };

  const dt = k2.t - k1.t;
  if (dt <= 0) return { ...k1.p };

  const fraction = (t - k1.t) / dt;
  const segs = getSegments(track);
  const seg = findSegment(segs, ci);
  const [p0, p1, p2, p3] = controlPoints(track, ci, seg);
  const table = buildArcTable(p0, p1, p2, p3);
  return arcTableQuery(table, p0, p1, p2, p3, fraction);
}

export function segmentWarnings(entity: Entity): SegmentWarning[] {
  const { track } = entity;
  if (track.length < 2) return [];

  const segs = getSegments(track);
  const warnings: SegmentWarning[] = [];

  for (let i = 0; i < track.length - 1; i++) {
    const k2 = track[i + 1];
    if (k2.hold) continue;

    const dt = k2.t - track[i].t;
    if (dt <= 0) continue;

    const seg = findSegment(segs, i);
    const [p0, p1, p2, p3] = controlPoints(track, i, seg);
    const table = buildArcTable(p0, p1, p2, p3);
    const arcLen = table[table.length - 1].arcLen;
    const avgSpeed = arcLen / (dt / 1000);

    if (avgSpeed > SPEED_LIMIT) {
      warnings.push({ fromIndex: i, toIndex: i + 1, avgSpeedMs: avgSpeed });
    }
  }

  return warnings;
}
