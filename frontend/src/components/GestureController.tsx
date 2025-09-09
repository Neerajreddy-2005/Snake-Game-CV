import { useEffect, useRef, useState } from 'react';

interface GestureControllerProps {
  onDirectionChange: (direction: number) => void;
}

export const GestureController = ({ onDirectionChange }: GestureControllerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    let animationFrame: number;

    const startGestureDetection = () => {
      const detectGestures = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Simple gesture detection based on hand position
        // This is a basic implementation - you can enhance it with MediaPipe
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const gesture = detectHandGesture(imageData, canvas.width, canvas.height);
        
        if (gesture !== -1) {
          onDirectionChange(gesture);
        }

        animationFrame = requestAnimationFrame(detectGestures);
      };

      detectGestures();
    };

    const detectHandGesture = (imageData: ImageData, width: number, height: number): number => {
      // Simple gesture detection based on color analysis
      // This is a placeholder - replace with proper hand detection
      const data = imageData.data;
      let handPixels = 0;
      let centerX = 0;
      let centerY = 0;

      // Look for skin-colored pixels (simplified)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Basic skin color detection
        if (r > 95 && g > 40 && b > 20 && r > g && r > b && r - g > 15) {
          handPixels++;
          const pixelIndex = i / 4;
          centerX += pixelIndex % width;
          centerY += Math.floor(pixelIndex / width);
        }
      }

      if (handPixels < 1000) return -1; // Not enough hand pixels

      centerX = centerX / handPixels;
      centerY = centerY / handPixels;

      // Determine direction based on hand position
      const centerScreenX = width / 2;
      const centerScreenY = height / 2;
      
      const deltaX = centerX - centerScreenX;
      const deltaY = centerY - centerScreenY;
      
      const threshold = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        return deltaX > threshold ? 1 : 0; // Right : Left
      } else {
        return deltaY > threshold ? 3 : 2; // Down : Up
      }
    };

    // In Flask mode the backend handles hand tracking. We only render guidance
    startGestureDetection();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [onDirectionChange]);

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-destructive text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="w-full h-[240px] rounded-lg border-2 border-border flex items-center justify-center text-sm text-muted-foreground">
          Hand gestures are detected on the backend. Use Video panel to view camera.
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Move your hand to control the snake. Camera permission required.
      </p>
    </div>
  );
};
