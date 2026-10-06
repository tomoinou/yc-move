import type { Play } from '../core/types.ts';
import { migrateToLatest } from '../core/migration.ts';

// 作成者が `npm run set-default` で更新する初期配置。public/default-play.json
export async function fetchDefaultPlay(): Promise<Play | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}default-play.json`, { cache: 'no-cache' });
    if (!res.ok) return null;
    const play = migrateToLatest(await res.json());
    return Array.isArray(play.entities) ? play : null;
  } catch {
    return null;
  }
}
