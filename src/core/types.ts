export type Vec2 = { x: number; y: number };

export type TrackKey = {
  t: number;
  p: Vec2;
  hold?: boolean;
  corner?: boolean;
};

export type Entity = {
  id: string;
  side: 'attack' | 'defence';
  label: string;
  track: TrackKey[];
};

export type BallHolder = {
  t: number;         // ms
  holderId: string;  // Entity.id
};

export type BallTrack = {
  holders: BallHolder[];  // t 昇順。{t:0, holderId:...} から始まる
};

export type Annotation = {
  id: string;
  text: string;
  p: Vec2;
  from?: number;
  to?: number;
};

export type Play = {
  schemaVersion: 2;
  id: string;
  title: string;
  meta: { tags: string[]; updatedAt: string };
  durationMs: number;
  markers: number[];
  viewY: number;
  entities: Entity[];
  ball: BallTrack;
  annotations: Annotation[];
  nextAttackIdx: number;
  nextDefenceIdx: number;
};
