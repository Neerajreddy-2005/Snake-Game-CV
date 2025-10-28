import { useEffect, useRef, useState } from 'react';
import { BrowserCamera } from './BrowserCamera';
import { gestureDetector, type GestureResult } from '@/services/gestureDetection';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hand, Zap, ZapOff } from 'lucide-react';

// API function to send gesture commands to backend
const sendGestureCommand = async (direction: string) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/keyboard_control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ direction }),
  });
  return response.json();
};

export const GestureController = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastGesture, setLastGesture] = useState<string>('none');
  const [gestureCount, setGestureCount] = useState(0);
  const lastGestureTime = useRef<number>(0);
  const gestureCooldown = 500; // 500ms cooldown between gestures

  const gestureMutation = useMutation({
    mutationFn: sendGestureCommand,
    onSuccess: (data) => {
      console.log('Gesture sent:', data);
    },
    onError: (error) => {
      console.error('Failed to send gesture:', error);
    }
  });

  const handleFrame = async (canvas: HTMLCanvasElement) => {
    if (!isDetecting) return;

    try {
      const result: GestureResult = await gestureDetector.detectGesture(canvas);
      
      if (result.direction !== 'none' && result.confidence > 0.7) {
        const now = Date.now();
        
        // Apply cooldown to prevent spam
        if (now - lastGestureTime.current > gestureCooldown) {
          setLastGesture(result.direction);
          setGestureCount(prev => prev + 1);
          lastGestureTime.current = now;
          
          // Send gesture to backend
          gestureMutation.mutate(result.direction);
        }
      }
    } catch (error) {
      console.error('Gesture detection error:', error);
    }
  };

  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
    if (!isDetecting) {
      setGestureCount(0);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-secondary">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hand className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Gesture Control</h3>
          </div>
          <Button
            onClick={toggleDetection}
            variant={isDetecting ? "destructive" : "default"}
            size="sm"
          >
            {isDetecting ? (
              <>
                <ZapOff className="h-4 w-4 mr-2" />
                Stop Detection
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Start Detection
              </>
            )}
          </Button>
        </div>

        <BrowserCamera 
          onFrame={handleFrame}
          active={isDetecting}
        />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Last Gesture</p>
            <p className="font-mono text-lg capitalize">{lastGesture}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Gestures Detected</p>
            <p className="font-mono text-lg">{gestureCount}</p>
          </div>
        </div>

        {isDetecting && (
          <div className="text-center">
            <p className="text-sm text-green-600">
              🎯 Gesture detection active! Make hand gestures to control the snake.
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              <p>• Extend multiple fingers and move in a direction</p>
              <p>• Or point with your index finger</p>
              <p>• Keep your hand visible in the camera frame</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};