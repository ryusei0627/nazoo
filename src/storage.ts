import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nazoo_highscore_v1';

export async function getHighScore(): Promise<number> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function setHighScore(score: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, String(score));
  } catch {
    // 失敗しても致命的ではないので無視
  }
}

const MUTE_KEY = 'nazoo_muted_v1';

export async function getMuted(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(MUTE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setMuted(v: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(MUTE_KEY, v ? '1' : '0');
  } catch {
    // 無視
  }
}
