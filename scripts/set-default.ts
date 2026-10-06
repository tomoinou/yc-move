// 使い方:
//   npm run set-default "<共有URL または #p= 以降の文字列>"
//   npm run set-default 0   … ゴールデンマスター(scripts/golden-default.json)に戻す
import { readFileSync, writeFileSync } from 'node:fs';
import { decodePlay } from '../src/core/share.ts';
import { migrateToLatest } from '../src/core/migration.ts';

const arg = process.argv[2];
if (!arg) {
  console.error('使い方: npm run set-default "<共有URL>"   / ゴールデンマスターに戻す: npm run set-default 0');
  process.exit(1);
}

const isGolden = arg === '0';
const play = isGolden
  ? migrateToLatest(JSON.parse(readFileSync(new URL('./golden-default.json', import.meta.url), 'utf8')))
  : await decodePlay(arg.includes('#p=') ? arg.slice(arg.indexOf('#p=') + 3) : arg);

const out = {
  ...play,
  id: 'default',
  title: '新規プレイ',
  meta: { ...play.meta, updatedAt: new Date().toISOString() },
};

const path = new URL('../public/default-play.json', import.meta.url);
writeFileSync(path, JSON.stringify(out, null, 2) + '\n');
console.log(`public/default-play.json を${isGolden ? 'ゴールデンマスターに戻しました' : '更新しました'}（プレイヤー ${out.entities.length} 人）`);
console.log('反映するには: git add public/default-play.json && git commit -m "初期配置を更新" && git push');
