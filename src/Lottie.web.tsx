// Web版Lottie再生（lottie-react）
import Lottie from 'lottie-react';

type Props = { source: any; loop?: boolean; width: number; height: number; onDone?: () => void };

export default function LottieFX({ source, loop = false, width, height, onDone }: Props) {
  return <Lottie animationData={source} loop={loop} autoplay style={{ width, height }} onComplete={onDone} />;
}
