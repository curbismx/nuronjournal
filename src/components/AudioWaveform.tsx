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
  const lastRecordingTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const barWidth = 3;
    const gap = 4;
    const maxHeight = canvas.height;

    // Add a new bar every second with some variation
    if (isRecording && recordingTime > lastRecordingTimeRef.current) {
      // Add random variation to make it more like a waveform
      const variation = Math.random() * 0.4 - 0.2;
      barsRef.current.push(audioLevel + variation);
      lastRecordingTimeRef.current = recordingTime;
    }

    // Reset when recording stops
    if (!isRecording && barsRef.current.length > 0) {
      barsRef.current = [];
      lastRecordingTimeRef.current = 0;
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw each captured bar
      barsRef.current.forEach((level, i) => {
        const x = i * (barWidth + gap);
        const barHeight = Math.max(0.2, Math.min(1, level + 0.3));
        const h = barHeight * maxHeight;
        const y = (maxHeight - h) / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, 1.5);
        ctx.fill();
      });
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, audioLevel, recordingTime]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
    />
  );
};

export default AudioWaveform;
