// ネイティブ版 Rive 再生（rive-react-native）
// ※ ネイティブ実機での検証は dev build / EAS build 時に行う（Expo Go不可）
import { useEffect, useRef } from 'react';
import Rive, { RiveRef } from 'rive-react-native';

type Props = {
  src: any; // require('./assets/rive/owl.riv') の結果
  width: number;
  height: number;
  stateMachine?: string;
  trigger?: string;
  fire?: number;
};

export default function RiveMascot({ src, width, height, stateMachine = 'State Machine 1', trigger, fire }: Props) {
  const ref = useRef<RiveRef>(null);

  useEffect(() => {
    if (fire && trigger) {
      try {
        ref.current?.fireState(stateMachine, trigger);
      } catch {
        // 入力名が無い等は無視
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fire]);

  return <Rive ref={ref} source={src} stateMachineName={stateMachine} autoplay style={{ width, height }} />;
}
