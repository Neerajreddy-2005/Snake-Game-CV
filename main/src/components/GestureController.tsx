import { useEffect, useRef, useState } from 'react';
import { postGestureInfo } from '@/services/api';

interface GestureControllerProps {
  onDirectionChange: (direction: number) => void;
}

export const GestureController = ({ onDirectionChange }: GestureControllerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrame: number;

    const initializeCamera = async () => {
      try {
        // Request camera permission
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsInitialized(true);
          setError(null);
        }

        // Start gesture detection
        startGestureDetection();
      } catch (err) {
        console.error('Camera access denied:', err);
        setError('Camera access is required for gesture control. Please allow camera permission and refresh the page.');
      }
    };

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

    initializeCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
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
        <video
          ref={videoRef}
          className="w-full h-auto rounded-lg border-2 border-border"
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <p className="text-sm text-muted-foreground">Initializing camera...</p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Move your hand to control the snake. Camera permission required.
      </p>
    </div>
  );
};
