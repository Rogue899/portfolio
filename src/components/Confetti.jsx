import { useEffect, useRef } from 'react';
import './Confetti.css';

const Confetti = ({ onComplete }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti = [];
    const confettiCount = 150;
    const colors = ['#ff1493', '#ff69b4', '#ffb6c1', '#ff91a4', '#ffc0cb', '#ff69b4', '#ff1493'];

    // Create confetti particles
    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * confettiCount,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleIncrement: Math.random() * 0.07 + 0.05,
        tiltAngle: 0
      });
    }

    let animationId;
    let startTime = Date.now();
    const duration = 3000; // 3 seconds

    const draw = () => {
      const currentTime = Date.now();
      if (currentTime - startTime > duration) {
        if (onComplete) onComplete();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confetti.forEach((c, i) => {
        ctx.beginPath();
        ctx.lineWidth = c.r / 2;
        ctx.strokeStyle = c.color;
        ctx.moveTo(c.x + c.tilt + c.r, c.y);
        ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r);
        ctx.stroke();

        c.tiltAngle += c.tiltAngleIncrement;
        c.y += (Math.cos(c.d) + 3 + c.r / 2) / 2;
        c.tilt = Math.sin(c.tiltAngle - i / 3) * 15;
        c.x += Math.sin(c.d) - 0.5;

        if (c.y > canvas.height) {
          confetti[i] = {
            x: Math.random() * canvas.width,
            y: -20,
            r: c.r,
            d: c.d,
            color: c.color,
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleIncrement: c.tiltAngleIncrement,
            tiltAngle: 0
          };
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [onComplete]);

  return <canvas ref={canvasRef} className="confetti-canvas" />;
};

export default Confetti;

