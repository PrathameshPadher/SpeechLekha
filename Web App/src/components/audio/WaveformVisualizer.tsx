import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

interface WaveformVisualizerProps {
  mode?: 'full' | 'compact' | 'bars';
  height?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  mode = 'bars',
  height = 120
}) => {
  const { isListening, isPaused, audioState } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const isActive = isListening && !isPaused;

      // Extract real audio levels if available
      let audioLevel = 0.4;
      if (isActive && audioState?.analyser && audioState?.dataArray) {
        try {
          (audioState.analyser as any).getByteFrequencyData(audioState.dataArray);
          let sum = 0;
          const len = audioState.dataArray.length;
          for (let i = 0; i < len; i++) {
            sum += audioState.dataArray[i];
          }
          audioLevel = Math.max(0.2, (sum / (len * 255)) * 2.5);
        } catch (e) {
          audioLevel = 0.5 + Math.sin(phase * 1.5) * 0.3;
        }
      } else if (isActive) {
        audioLevel = 0.5 + Math.sin(phase * 1.8) * 0.3 + Math.cos(phase * 3.4) * 0.15;
      } else {
        audioLevel = 0.08;
      }

      phase += isActive ? 0.045 : 0.01;

      // 48 Vertical Waveform Bars
      const barCount = 48;
      const barWidth = 4;
      const totalWidth = rect.width;
      const gap = Math.max(2, (totalWidth - barCount * barWidth) / (barCount - 1));
      const midY = rect.height / 2;

      for (let i = 0; i < barCount; i++) {
        const norm = i / (barCount - 1);
        // Bell envelope shape
        const envelope = Math.sin(norm * Math.PI);
        
        // Multi-harmonic wave fluctuation
        const wave = 
          Math.sin(phase * 2.2 + i * 0.28) * 0.4 +
          Math.cos(phase * 1.4 - i * 0.18) * 0.35 +
          Math.sin(phase * 3.5 + i * 0.45) * 0.25;

        const maxH = rect.height * 0.82;
        const barHeight = Math.max(
          6,
          maxH * envelope * audioLevel * (0.45 + 0.55 * Math.abs(wave))
        );

        const x = i * (barWidth + gap);
        const y = midY - barHeight / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isActive) {
          gradient.addColorStop(0, '#c7f1fa');
          gradient.addColorStop(0.3, '#5eb2cb');
          gradient.addColorStop(0.7, '#24647d');
          gradient.addColorStop(1, '#113544');
        } else {
          gradient.addColorStop(0, '#42535a');
          gradient.addColorStop(1, '#1d272b');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isListening, isPaused, audioState, mode]);

  return (
    <div className="waveform-visualizer-wrap" style={{ height: `${height}px`, width: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};
