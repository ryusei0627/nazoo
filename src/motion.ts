import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

export const MOTION = {
  fast: 140,
  base: 220,
  calm: 340,
  slow: 520,
  easeOut: Easing.out(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  playful: Easing.bezier(0.2, 1.3, 0.3, 1),
};

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    const media =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    if (media) setReduced(media.matches);

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduced(enabled || !!media?.matches);
      })
      .catch(() => {});

    const onMediaChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media?.addEventListener?.('change', onMediaChange);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      media?.removeEventListener?.('change', onMediaChange);
      sub?.remove?.();
    };
  }, []);

  return reduced;
}
