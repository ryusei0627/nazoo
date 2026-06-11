// 自前ひらがなキーボード用：濁点・半濁点・小文字の変換ロジック

const DAKUTEN: Record<string, string> = {
  か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご',
  さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ',
  た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど',
  は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ',
  う: 'ゔ',
};
const HANDAKUTEN: Record<string, string> = {
  は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ',
};
const SMALL: Record<string, string> = {
  あ: 'ぁ', い: 'ぃ', う: 'ぅ', え: 'ぇ', お: 'ぉ',
  つ: 'っ', や: 'ゃ', ゆ: 'ゅ', よ: 'ょ', わ: 'ゎ',
};

const invert = (m: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k]));

const INV_DAKUTEN = invert(DAKUTEN);
const INV_HANDAKUTEN = invert(HANDAKUTEN);
const INV_SMALL = invert(SMALL);

// 「゛゜」キー：直前の1文字を 清音→濁音→半濁音→清音 と巡回させる
//   例) か→が→か / は→ば→ぱ→は
export function cycleMark(ch: string): string {
  if (DAKUTEN[ch]) return DAKUTEN[ch]; // 清音 → 濁音
  const baseFromDakuten = INV_DAKUTEN[ch];
  if (baseFromDakuten) {
    // 濁音 → （半濁音があれば半濁音 / なければ清音へ戻す）
    return HANDAKUTEN[baseFromDakuten] ?? baseFromDakuten;
  }
  if (INV_HANDAKUTEN[ch]) return INV_HANDAKUTEN[ch]; // 半濁音 → 清音
  return ch;
}

// 「小」キー：直前の1文字を 大⇄小 でトグル
//   例) つ→っ→つ / や→ゃ→や
export function toggleSmall(ch: string): string {
  if (SMALL[ch]) return SMALL[ch];
  if (INV_SMALL[ch]) return INV_SMALL[ch];
  return ch;
}

// フリック用「小゛゜」キー：直前の1文字を 清音→小/濁/半濁 と巡回させる（iOS風）
//   例) は→ば→ぱ→は / つ→っ→づ→つ / あ→ぁ→あ
const CYCLE_GROUPS = [
  'あぁ', 'いぃ', 'うぅゔ', 'えぇ', 'おぉ',
  'かが', 'きぎ', 'くぐ', 'けげ', 'こご',
  'さざ', 'しじ', 'すず', 'せぜ', 'そぞ',
  'ただ', 'ちぢ', 'つっづ', 'てで', 'とど',
  'はばぱ', 'ひびぴ', 'ふぶぷ', 'へべぺ', 'ほぼぽ',
  'やゃ', 'ゆゅ', 'よょ', 'わゎ',
];
const NEXT_VARIANT: Record<string, string> = {};
for (const g of CYCLE_GROUPS) {
  for (let i = 0; i < g.length; i++) NEXT_VARIANT[g[i]] = g[(i + 1) % g.length];
}
export function cycleKana(ch: string): string {
  return NEXT_VARIANT[ch] ?? ch;
}
