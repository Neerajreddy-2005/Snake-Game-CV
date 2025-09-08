import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Navigation, 
  Gamepad2, 
  Activity,
  Wifi,
  WifiOff 
} from 'lucide-react';
import { getCameraStatus, getGameState, getGestureInfo } from '@/services/api';

export const StatusPanel = () => {
  const { data: cameraStatus } = useQuery({
    queryKey: ['cameraStatus'],
    queryFn: getCameraStatus,
    refetchInterval: 5000, // Every 5 seconds
  });

  const { data: gameState } = useQuery({
    queryKey: ['gameState'],
    queryFn: getGameState,
    refetchInterval: 500, // Every 500ms
  });

  const { data: gestureInfo } = useQuery({
    queryKey: ['gestureInfo'],
    queryFn: getGestureInfo,
    refetchInterval: 1000, // Every second
  });

  const getCameraStatusColor = () => {
    if (!cameraStatus?.camera_available) return 'status-disconnected';
    if (cameraStatus?.camera_initialized) return 'status-connected';
    return 'status-warning';
  };

  const getCameraStatusText = () => {
    if (!cameraStatus?.camera_available) return 'Disconnected';
    if (cameraStatus?.camera_initialized) return 'Connected';
    return 'Initializing';
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'Up':
        return '↑';
      case 'Down':
        return '↓';
      case 'Left':
        return '←';
      case 'Right':
        return '→';
      default:
        return '•';
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-secondary">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">System Status</h3>
        </div>

        <div className="space-y-3">
          {/* Camera Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Camera</span>
            </div>
            <Badge 
              variant="outline" 
              className={`border-${getCameraStatusColor()} text-${getCameraStatusColor()}`}
            >
              {cameraStatus?.camera_available ? (
                <Wifi className="h-3 w-3 mr-1" />
              ) : (
                <WifiOff className="h-3 w-3 mr-1" />
              )}
              {getCameraStatusText()}
            </Badge>
          </div>

          {/* Camera Details */}
          {cameraStatus && (
            <div className="text-xs text-muted-foreground pl-6">
              <div>Frame Size: {cameraStatus.frame_size}</div>
              {cameraStatus.fps && <div>FPS: {cameraStatus.fps}</div>}
            </div>
          )}

          {/* Current Direction */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Gesture Direction</span>
            </div>
            <Badge variant="secondary" className="font-mono">
              {getDirectionIcon(gestureInfo?.current_direction || 'None')} {gestureInfo?.current_direction || 'None'}
            </Badge>
          </div>

          {/* Snake Direction */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Snake Direction</span>
            </div>
            <Badge variant="secondary" className="font-mono">
              {getDirectionIcon(gameState?.current_direction || 'None')} {gameState?.current_direction || 'None'}
            </Badge>
          </div>

          {/* Game Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Game Status</span>
            </div>
            <Badge 
              variant={gameState?.game_over ? "destructive" : "default"}
              className={gameState?.game_over ? "" : "bg-status-connected text-primary-foreground"}
            >
              {gameState?.game_over ? 'Game Over' : 'Playing'}
            </Badge>
          </div>

          {/* Button Direction */}
          {gestureInfo && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Button Direction</span>
              </div>
              <Badge variant="outline" className="font-mono">
                {gestureInfo.button_direction}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};