
import React, { useRef, useEffect, useState } from 'react';
import { Particle, MousePosition } from '../types';

interface VisualizerProps {
  analyzer: AnalyserNode | null;
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyzer, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  // Fix: Added initial value undefined to useRef to satisfy TypeScript requirement of 1 argument
  const requestRef = useRef<number | undefined>(undefined);

  // Cyberpunk Palette
  const COLORS = {
    bass: '#240b36', // Deep Purple
    mid: '#00d2ff',  // Neon Cyan
    treble: '#ff0055', // Neon Pink
    glow: '#3a0ca3'
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Initialize particles
    particlesRef.current = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 0.5,
      color: COLORS.mid,
      life: Math.random()
    }));

    const dataArray = new Uint8Array(64);

    const render = () => {
      if (analyzer && isPlaying) {
        analyzer.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      // Calculate intensities
      const bassFreq = dataArray.slice(0, 10);
      const bassAvg = bassFreq.reduce((a, b) => a + b, 0) / bassFreq.length;
      const midFreq = dataArray.slice(10, 40);
      const midAvg = midFreq.reduce((a, b) => a + b, 0) / midFreq.length;
      const trebleFreq = dataArray.slice(40, 64);
      const trebleAvg = trebleFreq.reduce((a, b) => a + b, 0) / trebleFreq.length;

      const normalizedBass = bassAvg / 255;
      const normalizedMid = midAvg / 255;
      const normalizedTreble = trebleAvg / 255;

      // Draw Sequence
      // 1. Clear with slight trail
      ctx.fillStyle = 'rgba(5, 5, 5, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply parallax
      ctx.translate(mousePos.x * 0.5, mousePos.y * 0.5);

      // 2. Draw Particles
      particlesRef.current.forEach(p => {
        p.x += p.vx * (1 + normalizedBass * 5);
        p.y += p.vy * (1 + normalizedBass * 5);
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const currentSize = p.size * (1 + normalizedBass * 3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 210, 255, ${0.1 + normalizedBass * 0.4})`;
        ctx.fill();
      });

      // 3. Draw Energy Ring
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.25;

      // Inner Glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.5, `rgba(36, 11, 54, ${normalizedBass * 0.2})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bars
      for (let i = 0; i < 64; i++) {
        const val = dataArray[i];
        const barHeight = (val / 255) * radius * 0.8;
        const angle = (i / 64) * Math.PI * 2;
        
        const xStart = centerX + Math.cos(angle) * radius;
        const yStart = centerY + Math.sin(angle) * radius;
        const xEnd = centerX + Math.cos(angle) * (radius + barHeight + (normalizedBass * 20));
        const yEnd = centerY + Math.sin(angle) * (radius + barHeight + (normalizedBass * 20));

        // Color Logic
        let color = COLORS.mid;
        if (i < 10) color = COLORS.bass;
        else if (i > 45) color = COLORS.treble;

        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.lineWidth = 3 + (val / 255) * 8;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        
        // Glow effect for individual bars
        ctx.shadowBlur = isPlaying ? (val / 255) * 20 : 0;
        ctx.shadowColor = color;
        ctx.stroke();
      }

      // Chromatic Aberration Simulation (Layered offsets)
      if (normalizedBass > 0.4 && isPlaying) {
          ctx.globalCompositeOperation = 'screen';
          ctx.drawImage(canvas, 3, 0);
          ctx.drawImage(canvas, -3, 0);
          ctx.globalCompositeOperation = 'source-over';
      }

      ctx.restore();

      // UI Frame / Tech Grid overlay (static but follows mouse slightly)
      drawOverlay(ctx, canvas, mousePos);

      requestRef.current = requestAnimationFrame(render);
    };

    const drawOverlay = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, mouse: MousePosition) => {
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        const offsetX = mouse.x * 0.1;
        const offsetY = mouse.y * 0.1;

        for (let x = offsetX; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = offsetY; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Crosshairs
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.2)';
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 20, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + 20, canvas.height / 2);
        ctx.moveTo(canvas.width / 2, canvas.height / 2 - 20);
        ctx.lineTo(canvas.width / 2, canvas.height / 2 + 20);
        ctx.stroke();
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [analyzer, isPlaying, mousePos]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default Visualizer;
