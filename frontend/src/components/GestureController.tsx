import { useRef, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hand, Zap, ZapOff, Camera, Video, VideoOff, AlertCircle } from 'lucide-react';

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

type GestureControllerProps = {
  gameActive: boolean;
};

export const GestureController = ({ gameActive }: GestureControllerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
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

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front camera
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        console.log('✅ Camera access granted');
      }
    } catch (err) {
      console.error('❌ Camera access denied:', err);
      setError('Camera access denied. Please allow camera permissions and refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    console.log('📹 Camera stopped');
  };

  // Auto-start camera when game becomes active
  useEffect(() => {
    if (gameActive && !isStreaming && !isLoading) {
      startCamera();
    } else if (!gameActive && isStreaming) {
      stopCamera();
    }
  }, [gameActive]);

  // Capture frames and send to backend when streaming
  useEffect(() => {
    if (!isStreaming || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const captureFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        // Convert canvas to base64 image data
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Send frame to backend for processing
        frameMutation.mutate(imageData);
      }
      requestAnimationFrame(captureFrame);
    };

    captureFrame();
  }, [isStreaming, frameMutation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-secondary">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Hand className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Gesture Control</h3>
        </div>

        <div className="relative aspect-[4/3] w-full max-w-md mx-auto">
          <div className="absolute inset-0 rounded-lg border-2 border-border overflow-hidden bg-muted">
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">{error}</p>
                  <Button onClick={startCamera} size="sm" variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : !isStreaming ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {gameActive ? 'Starting camera...' : 'Camera will start when game begins'}
                  </p>
                  {isLoading && (
                    <p className="text-xs text-muted-foreground">Requesting camera permission...</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  style={{ 
                    filter: 'drop-shadow(0 0 10px hsla(var(--glow-primary) / 0.3))',
                  }}
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  LIVE
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas
          ref={canvasRef}
          className="hidden"
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

        {isStreaming && (
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