// 最下部パネルとフレームチップ列で共有する寸法(px)
export const BTN_H = 28;
export const LABEL_W = 40;      // プレイヤー名 / 選択中フレームチップ
export const DEL_W = 20;        // 消去ボタン
export const GAP_IN_GROUP = 3;
export const GAP_BETWEEN_GROUPS = 10;
export const ROW_PAD_X = 10;
export const ROW_PAD_Y = 3;

// 操作パネル: 標準幅ボタン8個 + 名前欄 + 消去 + 隙間(グループ内4・グループ間4)
const STD_BTN_COUNT = 8;
const FIXED_W = ROW_PAD_X * 2 + LABEL_W + DEL_W + GAP_IN_GROUP * 4 + GAP_BETWEEN_GROUPS * 4;

// .app-frame を container にし、画面幅から標準幅を算出（全行で同じ値になる）
export const STD_W = `calc((100cqw - ${FIXED_W}px) / ${STD_BTN_COUNT})`;
