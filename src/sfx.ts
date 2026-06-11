// 効果音（自前生成WAVを再生）。expo-audioを使用。
import { createAudioPlayer, AudioPlayer } from 'expo-audio';

type Name = 'correct' | 'wrong' | 'tap' | 'levelup' | 'gameover';

const SOURCES: Record<Name, number> = {
  correct: require('../assets/sfx/correct.wav'),
  wrong: require('../assets/sfx/wrong.wav'),
  tap: require('../assets/sfx/tap.wav'),
  levelup: require('../assets/sfx/levelup.wav'),
  gameover: require('../assets/sfx/gameover.wav'),
};

// 各音の音量バランス
const VOLUME: Record<Name, number> = {
  correct: 0.8,
  wrong: 0.7,
  tap: 0.3,
  levelup: 0.85,
  gameover: 0.75,
};

let players: Partial<Record<Name, AudioPlayer>> | null = null;
let enabled = true;

function init(): Partial<Record<Name, AudioPlayer>> {
  if (players) return players;
  players = {};
  (Object.keys(SOURCES) as Name[]).forEach((name) => {
    try {
      const p = createAudioPlayer(SOURCES[name]);
      p.volume = VOLUME[name];
      players![name] = p;
    } catch {
      // 生成失敗は無視（音無しで続行）
    }
  });
  return players;
}

function play(name: Name) {
  if (!enabled) return;
  const p = init()[name];
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    // 再生失敗は無視
  }
}

export function setSfxEnabled(v: boolean) {
  enabled = v;
}
export function isSfxEnabled() {
  return enabled;
}

export const sfx = {
  correct: () => play('correct'),
  wrong: () => play('wrong'),
  tap: () => play('tap'),
  levelup: () => play('levelup'),
  gameover: () => play('gameover'),
};
