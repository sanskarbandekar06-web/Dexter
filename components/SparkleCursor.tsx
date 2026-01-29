
import React, { useEffect, useRef } from 'react';
import { ThemeColors } from '../types';

interface SparkleCursorProps {
  isDarkMode: boolean;
}

const SparkleCursor: React.FC<SparkleCursorProps> = ({ isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const cursor = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const colors = isDarkMode 
      ? ['#fbbf24', '#818cf8', '#ffffff'] // Gold, Indigo, White
      : ['#f59e0b', '#10b981', '#fcd34d']; // Orange, Emerald, Gold

    const addParticle = (x: number, y: number) => {
      const size = Math.random() * 3 + 1;
      particles.current.push({
        x,
        y,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
        life: 1
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      cursor.current = { x: e.clientX, y: e.clientY };
      // Add particles more frequently for a denser trail
      for(let i=0; i<3; i++) {
        addParticle(e.clientX, e.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.current.length; i++) {
        const p = particles.current[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= 0.02;
        p.size *= 0.95;

        if (p.life <= 0 || p.size <= 0.2) {
          particles.current.splice(i, 1);
          i--;
          continue;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add sparkle glint
        if (Math.random() > 0.9) {
           ctx.fillStyle = '#ffffff';
           ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        }
      }

      animationFrame.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrame.current);
    };
  }, [isDarkMode]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default SparkleCursor;
