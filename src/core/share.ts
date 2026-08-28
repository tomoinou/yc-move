import type { Play } from './types.ts';
import { migrateToLatest } from './migration.ts';

export async function encodePlay(play: Play): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(play));
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const compressed = await new Response(cs.readable).arrayBuffer();
  const arr = new Uint8Array(compressed);
  let binary = '';
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function decodePlay(encoded: string): Promise<Play> {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (b64.length % 4)) % 4;
  const binary = atob(b64 + '='.repeat(padding));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const text = await new Response(ds.readable).text();
  return migrateToLatest(JSON.parse(text));
}
