// ポップでカラフルなテーマ（モックデザイン版）
export const COLORS = {
  bg: '#FBF1D6', // 温かいクリーム
  card: '#FFFFFF',
  ink: '#4B4A66',
  inkSoft: '#9B99B2',
  primary: '#FF6F4D', // コーラル
  primaryDark: '#F1552C',
  teal: '#33C2B4',
  tealDark: '#27A99B',
  yellow: '#FFC23D',
  yellowDark: '#F2A81C',
  purple: '#9B7EDE',
  pink: '#FF8FB1',
  success: '#2BBE9A', // せいかい（ティール寄り）
  danger: '#FF5B6E',
  track: '#FFE0CB',
  navy: '#3A3A5C', // 削除キー等
};

// 丸ゴシックフォント（M PLUS Rounded 1c）
export const FONTS = {
  medium: 'MPLUSRounded1c_500Medium',
  bold: 'MPLUSRounded1c_700Bold',
  exbold: 'MPLUSRounded1c_800ExtraBold',
  black: 'MPLUSRounded1c_900Black',
};

// 「Nazoo」ロゴの1文字ごとの色（N a z o o）
export const LOGO_COLORS = ['#FF6B5C', '#FF8A4C', '#33C2B4', '#9B7EDE', '#FF8FB1'];

// 難易度ごとのアクセント色
export const DIFFICULTY_COLORS: Record<number, string> = {
  1: '#33C2B4',
  2: '#FFB23F',
  3: '#9B7EDE',
  4: '#FF5B6E',
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
