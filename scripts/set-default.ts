// 使い方: npm run set-default "<共有URL または #p= 以降の文字列>"
import { writeFileSync } from 'node:fs';
import { decodePlay } from '../src/core/share.ts';

const arg = process.argv[2];
if (!arg) {
  console.error('使い方: npm run set-default "<共有URL>"');
  process.exit(1);
}

const idx = arg.indexOf('#p=');
const encoded = idx >= 0 ? arg.slice(idx + 3) : arg;
const play = await decodePlay(encoded);

const out = {
  ...play,
  id: 'default',
  title: '新規プレイ',
  meta: { ...play.meta, updatedAt: new Date().toISOString() },
};

const path = new URL('../public/default-play.json', import.meta.url);
writeFileSync(path, JSON.stringify(out, null, 2) + '\n');
console.log(`public/default-play.json を更新しました（プレイヤー ${out.entities.length} 人）`);
console.log('反映するには: git add public/default-play.json && git commit -m "初期配置を更新" && git push');
