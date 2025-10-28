import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Camera, Video, VideoOff } from 'lucide-react';

type CameraCaptureProps = {
  onFrame?: (imageData: string) => void;
  active?: boolean;
};

export const CameraCapture = ({ onFrame, active = true }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

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
        setPermissionGranted(true);
        console.log('✅ Camera access granted');
      }
    } catch (err) {
      console.error('❌ Camera access denied:', err);
      setError('Camera access denied. Please allow camera permissions and refresh the page.');
      setPermissionGranted(false);
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

  // Capture frames and send to callback
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
        
        // Send frame to parent component
        if (onFrame) {
          onFrame(imageData);
        }
      }
      requestAnimationFrame(captureFrame);
    };

    captureFrame();
  }, [isStreaming, onFrame]);

  // Auto-start camera when component mounts
  useEffect(() => {
    if (active && !isStreaming && !isLoading) {
      startCamera();
    }
  }, [active]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-secondary">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Camera Feed</h3>
          </div>
          <div className="flex gap-2">
            {!isStreaming ? (
              <Button
                onClick={startCamera}
                disabled={isLoading}
                size="sm"
                variant="outline"
              >
                <Video className="h-4 w-4 mr-2" />
                {isLoading ? 'Starting...' : 'Start Camera'}
              </Button>
            ) : (
              <Button
                onClick={stopCamera}
                size="sm"
                variant="outline"
              >
                <VideoOff className="h-4 w-4 mr-2" />
                Stop Camera
              </Button>
            )}
          </div>
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
                    Click "Start Camera" to begin
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your browser will ask for camera permission
                  </p>
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

        {permissionGranted && (
          <div className="text-center">
            <p className="text-sm text-green-600">
              ✅ Camera permission granted! Make hand gestures to control the snake.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
