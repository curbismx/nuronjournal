import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  audioLevel: number;
}

const AudioWaveform = ({ isRecording, audioLevel }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const barsRef = useRef<number[]>([]);
  const positionRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numBars = 40;
    if (barsRef.current.length === 0) {
      barsRef.current = Array(numBars).fill(0);
    }

    const animate = () => {
      if (!isRecording) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update bars array with new audio level
      barsRef.current.shift();
      const randomVariation = Math.random() * 0.3;
      const barHeight = Math.max(0.2, Math.min(1, audioLevel + randomVariation));
      barsRef.current.push(barHeight);

      // Draw bars
      const barWidth = 4;
      const gap = 8;
      const maxHeight = canvas.height;

      barsRef.current.forEach((height, index) => {
        const x = index * (barWidth + gap);
        const h = height * maxHeight * 0.8;
        const y = (maxHeight - h) / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(x, y, barWidth, h);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isRecording) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, audioLevel]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={60}
      className="w-full h-full"
    />
  );
};

export default AudioWaveform;
