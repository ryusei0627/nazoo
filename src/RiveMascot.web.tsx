// Web版 Rive 再生（@rive-app/react-canvas）
import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

type Props = {
  src: any; // require('./assets/rive/owl.riv')
  width: number;
  height: number;
  stateMachine?: string;
  trigger?: string; // 反応用トリガー入力名
  fire?: number; // 変化するたびに trigger を発火
};

export default function RiveMascot({ src, width, height, stateMachine = 'State Machine 1', trigger, fire }: Props) {
  // .riv の URL を解決
  const [uri, setUri] = useState<string | null>(typeof src === 'string' ? src : src?.uri ?? null);
  useEffect(() => {
    if (uri) return;
    try {
      const a = Asset.fromModule(src);
      if (a.uri) setUri(a.uri);
      else a.downloadAsync().then(() => setUri(a.localUri || a.uri));
    } catch {
      // 解決失敗時は何もしない
    }
  }, [src, uri]);

  const { rive, RiveComponent } = useRive({
    src: uri || undefined,
    stateMachines: stateMachine,
    autoplay: true,
  });

  const input = useStateMachineInput(rive, stateMachine, trigger || '');
  useEffect(() => {
    if (input && fire) input.fire();
  }, [fire, input]);

  if (!uri) return null;
  return <RiveComponent style={{ width, height }} />;
}
