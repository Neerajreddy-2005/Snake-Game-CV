import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hand, Zap, ZapOff } from 'lucide-react';
import { CameraCapture } from './CameraCapture';

// API function to send video frame to backend for gesture processing
const processFrame = async (imageData: string) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/process_frame`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageData }),
  });
  return response.json();
};

export const GestureController = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastGesture, setLastGesture] = useState<string>('none');
  const [gestureCount, setGestureCount] = useState(0);
  const lastGestureTime = useRef<number>(0);
  const gestureCooldown = 500; // 500ms cooldown between gestures

  const frameMutation = useMutation({
    mutationFn: processFrame,
    onSuccess: (data) => {
      if (data.gesture_detected && data.direction !== 'None') {
        const now = Date.now();
        
        // Apply cooldown to prevent spam
        if (now - lastGestureTime.current > gestureCooldown) {
          setLastGesture(data.direction);
          setGestureCount(prev => prev + 1);
          lastGestureTime.current = now;
          console.log('Gesture detected:', data.direction);
        }
      }
    },
    onError: (error) => {
      console.error('Failed to process frame:', error);
    }
  });

  const handleFrame = (imageData: string) => {
    if (!isDetecting) return;
    
    // Send frame to backend for processing
    frameMutation.mutate(imageData);
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

        <CameraCapture 
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
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
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