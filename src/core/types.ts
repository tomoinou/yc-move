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

export type PassEvent = {
  t: number;
  kind: 'pass';
  from: string;
  to: string;
  flightMs: number;
};

export type BallTrack = {
  initialHolder: string;
  events: PassEvent[];
};

export type Annotation = {
  id: string;
  text: string;
  p: Vec2;
  from?: number;
  to?: number;
};

export type Play = {
  schemaVersion: 1;
  id: string;
  title: string;
  meta: { tags: string[]; updatedAt: string };
  durationMs: number;
  markers: number[];
  viewY: number;
  entities: Entity[];
  ball: BallTrack;
  annotations: Annotation[];
};

