import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getGameState, resetGame } from '@/services/api';
import type { GameState } from '@/types/api';

// Logical board size used by the backend (do not change)
const BASE_BOARD_SIZE = 500; // px
const CELL_SIZE = 10;        // px per step in backend
const GRID_SIZE = BASE_BOARD_SIZE / CELL_SIZE; // 50x50 grid

type GameBoardProps = {
  preferredSize?: number;
};

export const GameBoard = ({ preferredSize }: GameBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderWidth, setRenderWidth] = useState<number>(BASE_BOARD_SIZE);
  const [renderHeight, setRenderHeight] = useState<number>(BASE_BOARD_SIZE);
  
  const { data: gameState, refetch } = useQuery({
    queryKey: ['gameState'],
    queryFn: getGameState,
    refetchInterval: 100, // 10 Hz
    refetchIntervalInBackground: true,
  });

  const handleReset = async () => {
    try {
      await resetGame();
      refetch();
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
  };

  // Resize canvas to fill container while preserving 1:1 aspect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resize = () => {
      const containerWidth = container.clientWidth;
      const desired = preferredSize ? preferredSize : containerWidth;
      // Clamp to container width to avoid overflow, but if container is wider, still use desired square
      const side = Math.min(desired, containerWidth);
      setRenderWidth(side);
      setRenderHeight(side); // square
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [preferredSize]);

  useEffect(() => {
    if (!canvasRef.current || !gameState) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure canvas pixel size matches current render size
    canvas.width = renderWidth;
    canvas.height = renderHeight;

    const scaleX = renderWidth / BASE_BOARD_SIZE;
    const scaleY = renderHeight / BASE_BOARD_SIZE;

    // Clear canvas
    // Use explicit hex colors to ensure Canvas compatibility across browsers
    ctx.fillStyle = '#0b0f12'; // board background
    ctx.fillRect(0, 0, renderWidth, renderHeight);

    // Draw grid (slightly higher contrast and thickness so it's always visible)
    ctx.strokeStyle = '#1a2a1a'; // grid color
    ctx.lineWidth = Math.max(0.8, 0.8 * Math.min(scaleX, scaleY));
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE * scaleX, 0);
      ctx.lineTo(i * CELL_SIZE * scaleX, renderHeight);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE * scaleY);
      ctx.lineTo(renderWidth, i * CELL_SIZE * scaleY);
      ctx.stroke();
    }

    // Draw apple with glow effect
    const [appleX, appleY] = gameState.apple ?? [BASE_BOARD_SIZE / 2, BASE_BOARD_SIZE / 2];
    const ax = Number(appleX);
    const ay = Number(appleY);
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10 * Math.min(scaleX, scaleY);
    ctx.fillStyle = '#ff1a1a';
    ctx.fillRect(
      (ax + 2) * scaleX,
      (ay + 2) * scaleY,
      (CELL_SIZE - 4) * scaleX,
      (CELL_SIZE - 4) * scaleY
    );

    // Reset shadow for snake
    ctx.shadowBlur = 0;

    // Draw snake with gradient and glow
    const snakeToDraw = (gameState.snake?.length ? gameState.snake : [[BASE_BOARD_SIZE/2, BASE_BOARD_SIZE/2]]) as [number, number][];
    snakeToDraw.forEach(([x, y], index) => {
      const sx = Number(x);
      const sy = Number(y);
      const isHead = index === 0;
      
      if (isHead) {
        // Snake head with stronger glow
        ctx.shadowColor = '#22ff22';
        ctx.shadowBlur = 15 * Math.min(scaleX, scaleY);
        ctx.fillStyle = '#22ff22';
      } else {
        // Snake body with softer glow
        ctx.shadowBlur = 5 * Math.min(scaleX, scaleY);
        const opacity = 0.8 - (index / (gameState.snake?.length || 1)) * 0.3;
        const alpha = Math.max(0.2, Math.min(1, opacity));
        ctx.fillStyle = `rgba(34, 255, 34, ${alpha})`;
      }
      
      ctx.fillRect(
        (sx + 1) * scaleX,
        (sy + 1) * scaleY,
        (CELL_SIZE - 2) * scaleX,
        (CELL_SIZE - 2) * scaleY
      );
    });

    // Reset shadow
    ctx.shadowBlur = 0;
  }, [gameState, renderWidth, renderHeight]);

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">Snake Game</h2>
          <div className="text-2xl font-mono text-primary">
            Score: {gameState?.score || 0}
          </div>
        </div>
        
        <div className="relative" ref={containerRef}>
          <canvas
            ref={canvasRef}
            width={renderWidth}
            height={renderHeight}
            className="border-2 border-border rounded-lg bg-game-board w-full h-auto"
            style={{ 
              filter: 'drop-shadow(0 0 20px hsla(var(--glow-primary) / var(--glow-intensity)))',
            }}
          />
          
          {gameState?.game_over && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
              <div className="text-center space-y-4">
                <h3 className="text-3xl font-bold text-destructive">Game Over!</h3>
                <p className="text-xl text-muted-foreground">Final Score: {gameState.score}</p>
                <Button 
                  onClick={handleReset}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                >
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Direction: {gameState?.current_direction || 'None'}</span>
          <span>Status: {gameState?.game_over ? 'Game Over' : 'Playing'}</span>
        </div>
      </div>
    </Card>
  );
};