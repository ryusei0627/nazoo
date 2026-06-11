// 正解判定（ゆるめ）：ひらがな・カタカナ・空白・記号のゆらぎを吸収する
// 漢字の表記ゆれは questions.ts の accept[] に明示することで対応する

// カタカナ → ひらがな
function katakanaToHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

// 正規化：前後空白除去 → 全角/半角空白除去 → 記号除去 → カタカナをひらがな化 → 小文字化
export function normalize(input: string): string {
  return katakanaToHiragana(
    input
      .trim()
      .replace(/[\s　]/g, '') // 半角・全角スペース
      .replace(/[、。!！?？「」『』・,.]/g, '') // よくある記号
      .toLowerCase()
  );
}

// 入力 input が、受理リスト accept のいずれか（または表示answer）に一致するか
export function isCorrect(input: string, accept: string[], answer: string): boolean {
  const n = normalize(input);
  if (n.length === 0) return false;
  const candidates = [...accept, answer].map(normalize);
  return candidates.includes(n);
}
