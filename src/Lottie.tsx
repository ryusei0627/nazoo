// ネイティブ版Lottie再生（lottie-react-native）
import LottieView from 'lottie-react-native';

type Props = { source: any; loop?: boolean; width: number; height: number; onDone?: () => void };

export default function LottieFX({ source, loop = false, width, height, onDone }: Props) {
  return (
    <LottieView
      source={source}
      autoPlay
      loop={loop}
      style={{ width, height }}
      resizeMode="cover"
      onAnimationFinish={onDone}
    />
  );
}
