// ═══════════════════════════════════════════════════════════
// Nazoo — キャンディポップ・ズー デザインシステム
// 立体キャンディボタン × ステッカーカード × ぷにぷにマスコット
// （Claude Design「Nazoo UI Redesign」より移植）
// ═══════════════════════════════════════════════════════════

export const COLORS = {
  // 背景（空色グラデ）
  bgTop: '#AEE3FF',
  bgBottom: '#E9F8FF',
  bg: '#E9F8FF', // 単色フォールバック
  // 面
  card: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceEdge: '#D3E6F2',
  // 文字
  ink: '#3D3A50',
  inkSoft: '#9A93AD',
  // CTA（コーラルピンク）
  primary: '#FF6B85',
  primaryDark: '#E04A66',
  // ミント
  teal: '#3FC9B5',
  tealDark: '#2DA896',
  // サン（イエロー）
  yellow: '#FFC83D',
  yellowDark: '#EAA916',
  sunInk: '#8A6200',
  // グレープ
  purple: '#8E7CE0',
  purpleDark: '#7361C4',
  // ピンク（うさぎ・5文字目）
  pink: '#FF8FAB',
  // せいかい＝ミント
  success: '#3FC9B5',
  successDark: '#2DA896',
  // ざんねん・危険
  danger: '#FF5B6E',
  dangerDark: '#DF3B50',
  // 時間バー等のトラック
  track: '#FFFFFF',
  // キーボードの補助キー
  keyMuted: '#F0EAF6',
  keyMutedEdge: '#D8CEE6',
  navy: '#3D3A50',
};

// 立体・形状トークン
export const DS = {
  depth: 5, // キャンディボタンの厚み(px)
  cardEdge: 4, // ステッカーカードの下エッジ(px)
  rLg: 26,
  rMd: 18,
  rSm: 13,
};

// 丸ゴシックフォント（M PLUS Rounded 1c）
export const FONTS = {
  medium: 'MPLUSRounded1c_500Medium',
  bold: 'MPLUSRounded1c_700Bold',
  exbold: 'MPLUSRounded1c_800ExtraBold',
  black: 'MPLUSRounded1c_900Black',
};

// 「Nazoo」ロゴの1文字ごとの色（N a z o o）
export const LOGO_COLORS = ['#FF6B85', '#FFB23F', '#3FC9B5', '#8E7CE0', '#FF8FAB'];

// 難易度ごとのアクセント色（本体／下エッジ）
export const DIFFICULTY_COLORS: Record<number, string> = {
  1: '#3FC9B5',
  2: '#FFB23F',
  3: '#8E7CE0',
  4: '#FF5B6E',
};
export const DIFFICULTY_EDGES: Record<number, string> = {
  1: '#2DA896',
  2: '#E2941C',
  3: '#7361C4',
  4: '#DF3B50',
};

// 時間ルール（おまかせ初期値・後で調整しやすいよう一箇所に）
export const GAME_CONFIG = {
  startTime: 60, // 開始時の持ち時間（秒）
  correctBonus: 5, // 正解で +5秒
  wrongPenalty: 3, // 不正解で −3秒
  skipPenalty: 3, // スキップで −3秒
  hintsPerGame: 3, // ヒント回数
  levelUpEvery: 5, // 5問正解ごとに難易度アップ
  maxBarSeconds: 60, // 時間バーの満タン基準（秒）
};
