import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, Camera } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const VideoPanel = () => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
    
    // Retry after 2 seconds
    setTimeout(() => {
      setImageError(false);
      setIsLoading(true);
    }, 2000);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-secondary">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Camera Feed</h3>
        </div>
        
        <div className="relative aspect-[4/3] w-full max-w-md mx-auto">
          <div className="absolute inset-0 rounded-lg border-2 border-border overflow-hidden bg-muted">
            {!imageError ? (
              <>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
                      <p className="text-sm text-muted-foreground">Loading camera feed...</p>
                    </div>
                  </div>
                )}
                <img
                  src={`${API_BASE_URL}/video_feed`}
                  alt="Live camera feed for gesture detection"
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  style={{ 
                    filter: 'drop-shadow(0 0 10px hsla(var(--glow-primary) / 0.3))',
                  }}
                />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Camera not available</p>
                  <p className="text-xs text-muted-foreground mt-1">Retrying...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};