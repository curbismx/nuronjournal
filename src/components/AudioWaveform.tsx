import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  audioLevel: number;
  recordingTime: number;
}

const AudioWaveform = ({ isRecording, audioLevel, recordingTime }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numBars = 40;
    const barWidth = 4;
    const gap = 8;
    const maxHeight = canvas.height;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Number of bars to show based on recording time (one per second)
      const barsToShow = Math.min(recordingTime, numBars);

      // Draw bars from left to right
      for (let i = 0; i < barsToShow; i++) {
        const x = i * (barWidth + gap);
        
        // Create animated height for each bar
        const randomVariation = Math.sin(Date.now() * 0.003 + i * 0.5) * 0.3;
        const barHeight = isRecording ? Math.max(0.3, Math.min(1, audioLevel + randomVariation + 0.2)) : 0.3;
        
        const h = barHeight * maxHeight * 0.8;
        const y = (maxHeight - h) / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(x, y, barWidth, h);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isRecording) {
      animate();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, audioLevel, recordingTime]);

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
