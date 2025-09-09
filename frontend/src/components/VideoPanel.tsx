import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, Camera } from 'lucide-react';

export const VideoPanel = () => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // Point to Flask MJPEG stream (proxied by Vite)
    if (imgRef.current) {
      imgRef.current.src = '/video_feed';
      const handleLoad = () => setIsLoading(false);
      const handleError = () => {
        setError('Failed to load video feed from backend. Ensure Flask is running and camera is available.');
        setIsLoading(false);
      };
      imgRef.current.addEventListener('load', handleLoad);
      imgRef.current.addEventListener('error', handleError);
      return () => {
        imgRef.current?.removeEventListener('load', handleLoad);
        imgRef.current?.removeEventListener('error', handleError);
        if (imgRef.current) imgRef.current.src = '';
      };
    }
  }, []);

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-secondary">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Camera Feed</h3>
        </div>

        <div className="relative aspect-[4/3] w-full max-w-md mx-auto">
          <div className="absolute inset-0 rounded-lg border-2 border-border overflow-hidden bg-muted">
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : (
              <>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
                      <p className="text-sm text-muted-foreground">Initializing camera…</p>
                    </div>
                  </div>
                )}
                <img
                  ref={imgRef}
                  className="w-full h-full object-cover"
                  alt="Camera feed"
                  style={{ 
                    filter: 'drop-shadow(0 0 10px hsla(var(--glow-primary) / 0.3))',
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};