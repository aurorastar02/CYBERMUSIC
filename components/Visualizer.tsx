
import React, { useRef, useEffect } from 'react';
import { Particle } from '../types';

interface VisualizerProps {
  analyzer: AnalyserNode | null;
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyzer, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number | undefined>(undefined);

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

    // 初始化背景粒子
    particlesRef.current = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 1.2,
      color: 'rgba(255, 255, 255, 0.2)',
      life: Math.random()
    }));

    const bufferLength = 64; // 與 App.tsx 中的 fftSize 相對應 (128/2)
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (analyzer && isPlaying) {
        analyzer.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      // 1. 清除畫布並繪製深色背景
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const minDimension = Math.min(canvas.width, canvas.height);
      const innerRadius = minDimension * 0.15; // 圓環內徑
      
      // 2. 計算低音振幅 (Bass: 索引 0-10)
      let bassSum = 0;
      for (let i = 0; i < 10; i++) {
        bassSum += dataArray[i];
      }
      const avgBass = bassSum / 10;
      const normalizedBass = avgBass / 255;

      // 3. 繪製背景裝飾：科技感網格
      drawGrid(ctx, canvas);
      drawParticles(ctx, canvas, normalizedBass);

      // 4. 繪製環狀音階 (Circular Spectrum)
      for (let i = 0; i < bufferLength; i++) {
        const amplitude = dataArray[i];
        const normalizedAmp = amplitude / 255;
        
        // 極座標計算
        const angle = (i / bufferLength) * Math.PI * 2;
        const barHeight = normalizedAmp * minDimension * 0.25;
        
        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * (innerRadius + barHeight + (normalizedBass * 20));
        const y2 = centerY + Math.sin(angle) * (innerRadius + barHeight + (normalizedBass * 20));

        // 彩虹漸變：HSL 色相隨索引值變動 (0 - 360)
        const hue = (i / bufferLength) * 360;
        const color = `hsl(${hue}, 80%, 60%)`;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        
        // 繪圖樣式
        ctx.lineWidth = (minDimension / bufferLength) * 0.8;
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;
        
        // 增加霓虹發光感
        ctx.shadowBlur = normalizedAmp * 15;
        ctx.shadowColor = color;
        
        ctx.stroke();
      }
      ctx.shadowBlur = 0; // 重置發光

      // 5. 繪製跳動能量球 (Bouncing Beat Ball)
      drawBeatBall(ctx, centerX, centerY, innerRadius, normalizedBass);

      // 6. 全局特效：色散 (強低音時觸發)
      if (normalizedBass > 0.6 && isPlaying) {
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(canvas, 3, 0);
        ctx.drawImage(canvas, -3, 0);
        ctx.globalCompositeOperation = 'source-over';
      }

      requestRef.current = requestAnimationFrame(render);
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const step = 50;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    };

    const drawParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, bass: number) => {
      particlesRef.current.forEach(p => {
        p.x += p.vx * (1 + bass * 5);
        p.y += p.vy * (1 + bass * 5);
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + bass * 0.2})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawBeatBall = (ctx: CanvasRenderingContext2D, x: number, y: number, baseRadius: number, bass: number) => {
      const ballRadius = baseRadius * 0.6 * (1 + bass * 0.4);
      
      // 球體徑向漸變
      const gradient = ctx.createRadialGradient(
        x - ballRadius * 0.2, 
        y - ballRadius * 0.2, 
        ballRadius * 0.1, 
        x, y, ballRadius
      );
      
      // 根據低音強弱改變球體核心顏色
      const hue = bass * 60; // 在紅色到黃色之間切換
      gradient.addColorStop(0, `hsl(${hue}, 100%, 90%)`);
      gradient.addColorStop(0.5, `hsl(${hue}, 80%, 50%)`);
      gradient.addColorStop(1, '#000');

      ctx.beginPath();
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
      
      // 球體外發光
      ctx.shadowBlur = 30 + bass * 50;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 裝飾性的環結構
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + bass * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, ballRadius * 1.2, 0, Math.PI * 2);
      ctx.stroke();
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [analyzer, isPlaying]);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default Visualizer;
