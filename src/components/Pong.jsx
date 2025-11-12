import { useState, useEffect, useRef } from 'react';
import './Pong.css';

const Pong = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [gameState, setGameState] = useState('ready'); // ready, playing, paused
  const gameStateRef = useRef({ 
    ball: { x: 400, y: 300, dx: 4, dy: 4 }, 
    player: { y: 250, height: 100 },
    ai: { y: 250, height: 100 },
    keys: {},
    lastSpacePress: 0
  });
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      state.keys[key] = true;
      
      // Handle space bar with debounce to prevent rapid toggling
      if (key === ' ') {
        const now = Date.now();
        if (now - state.lastSpacePress > 300) { // 300ms debounce
          state.lastSpacePress = now;
          setGameState(prev => {
            if (prev === 'ready') return 'playing';
            if (prev === 'playing') return 'paused';
            return 'playing';
          });
        }
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      state.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles
      ctx.fillStyle = '#fff';
      ctx.fillRect(20, state.player.y, 10, state.player.height);
      ctx.fillRect(canvas.width - 30, state.ai.y, 10, state.ai.height);

      // Draw ball
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw score
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${score.player}`, canvas.width / 4, 50);
      ctx.fillText(`${score.ai}`, (canvas.width / 4) * 3, 50);

      if (gameState === 'ready') {
        ctx.font = '24px Arial';
        ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2);
      } else if (gameState === 'paused') {
        ctx.font = '24px Arial';
        ctx.fillText('PAUSED - Press SPACE to resume', canvas.width / 2, canvas.height / 2);
      }
    };

    const resetBall = () => {
      state.ball.x = canvas.width / 2;
      state.ball.y = canvas.height / 2;
      // Keep speed constant - don't increase with score
      state.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 4;
      state.ball.dy = (Math.random() > 0.5 ? 1 : -1) * 4;
    };

    const update = () => {
      draw();
      
      if (gameState !== 'playing') {
        animationFrameRef.current = requestAnimationFrame(update);
        return;
      }

      const ball = state.ball;
      const player = state.player;
      const ai = state.ai;

      // Move player paddle
      if (state.keys['w'] || state.keys['arrowup']) {
        player.y = Math.max(0, player.y - 5);
      }
      if (state.keys['s'] || state.keys['arrowdown']) {
        player.y = Math.min(canvas.height - player.height, player.y + 5);
      }

      // AI paddle (simple AI with consistent speed)
      const aiCenter = ai.y + ai.height / 2;
      const aiSpeed = 3; // Constant AI speed
      if (aiCenter < ball.y - 10) {
        ai.y = Math.min(canvas.height - ai.height, ai.y + aiSpeed);
      } else if (aiCenter > ball.y + 10) {
        ai.y = Math.max(0, ai.y - aiSpeed);
      }

      // Move ball
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Ball collision with top/bottom
      if (ball.y <= 8 || ball.y >= canvas.height - 8) {
        ball.dy = -ball.dy;
      }

      // Ball collision with paddles
      if (ball.x <= 30 && ball.x >= 20 && 
          ball.y >= player.y && ball.y <= player.y + player.height) {
        ball.dx = Math.abs(ball.dx); // Ensure ball goes right
        ball.x = 30;
      }

      if (ball.x >= canvas.width - 30 && ball.x <= canvas.width - 20 &&
          ball.y >= ai.y && ball.y <= ai.y + ai.height) {
        ball.dx = -Math.abs(ball.dx); // Ensure ball goes left
        ball.x = canvas.width - 30;
      }

      // Score - pause game briefly when scoring
      if (ball.x < 0) {
        setScore(prev => ({ ...prev, ai: prev.ai + 1 }));
        setGameState('paused');
        resetBall();
        setTimeout(() => {
          setGameState('playing');
        }, 1000);
      } else if (ball.x > canvas.width) {
        setScore(prev => ({ ...prev, player: prev.player + 1 }));
        setGameState('paused');
        resetBall();
        setTimeout(() => {
          setGameState('playing');
        }, 1000);
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, score]);

  const resetGame = () => {
    setScore({ player: 0, ai: 0 });
    setGameState('ready');
    gameStateRef.current.ball = { x: 400, y: 300, dx: 4, dy: 4 };
    gameStateRef.current.player = { y: 250, height: 100 };
    gameStateRef.current.ai = { y: 250, height: 100 };
    gameStateRef.current.lastSpacePress = 0;
  };

  return (
    <div className="pong-game">
      <div className="game-header">
        <h2>Pong</h2>
        <button className="reset-button" onClick={resetGame}>Reset</button>
      </div>
      <div className="game-instructions">
        <p>Use W/S or Arrow Keys to move paddle | SPACE to pause</p>
      </div>
      <canvas ref={canvasRef} width={800} height={600} className="pong-canvas" />
    </div>
  );
};

export default Pong;
