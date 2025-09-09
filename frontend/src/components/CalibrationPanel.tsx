import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings, RotateCcw } from 'lucide-react';
import { getCalibration, postCalibration } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { CalibrationSettings } from '@/types/api';

export const CalibrationPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<CalibrationSettings>({
    gesture_threshold: 0.5,
    gesture_cooldown: 1.0,
    finger_threshold: 0.5,
    detection_confidence: 0.5,
    tracking_confidence: 0.5,
  });

  const { data: calibrationData } = useQuery({
    queryKey: ['calibration'],
    queryFn: getCalibration,
    refetchInterval: 10000, // Every 10 seconds
  });

  const calibrationMutation = useMutation({
    mutationFn: postCalibration,
    onSuccess: (data) => {
      toast({
        title: "Calibration Updated",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['calibration'] });
      queryClient.invalidateQueries({ queryKey: ['gestureInfo'] });
    },
    onError: (error) => {
      toast({
        title: "Calibration Failed", 
        description: "Failed to update calibration settings",
        variant: "destructive",
      });
      console.error('Calibration error:', error);
    },
  });

  // Update local settings when calibration data changes
  useEffect(() => {
    if (calibrationData?.settings) {
      setSettings(calibrationData.settings);
    }
  }, [calibrationData]);

  const handleApplyCalibration = () => {
    calibrationMutation.mutate(settings);
  };

  const handleResetCalibration = () => {
    const defaultSettings: CalibrationSettings = {
      gesture_threshold: 0.5,
      gesture_cooldown: 1.0,
      finger_threshold: 0.5,
      detection_confidence: 0.5,
      tracking_confidence: 0.5,
    };
    setSettings(defaultSettings);
  };

  const updateSetting = (key: keyof CalibrationSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const sliderConfigs = [
    {
      key: 'gesture_threshold' as const,
      label: 'Gesture Threshold',
      description: 'Sensitivity for gesture detection',
      min: 0.1,
      max: 1.0,
      step: 0.05,
    },
    {
      key: 'gesture_cooldown' as const,
      label: 'Gesture Cooldown',
      description: 'Time between gestures (seconds)',
      min: 0.1,
      max: 3.0,
      step: 0.1,
    },
    {
      key: 'finger_threshold' as const,
      label: 'Finger Threshold',
      description: 'Finger detection sensitivity',
      min: 0.1,
      max: 1.0,
      step: 0.05,
    },
    {
      key: 'detection_confidence' as const,
      label: 'Detection Confidence',
      description: 'Hand detection confidence',
      min: 0.1,
      max: 1.0,
      step: 0.05,
    },
    {
      key: 'tracking_confidence' as const,
      label: 'Tracking Confidence',
      description: 'Hand tracking confidence',
      min: 0.1,
      max: 1.0,
      step: 0.05,
    },
  ];

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-secondary">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Calibration</h3>
        </div>

        <div className="space-y-4">
          {sliderConfigs.map(({ key, label, description, min, max, step }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={key} className="text-sm font-medium">
                  {label}
                </Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {settings[key].toFixed(2)}
                </span>
              </div>
              <Slider
                id={key}
                min={min}
                max={max}
                step={step}
                value={[settings[key]]}
                onValueChange={(value) => updateSetting(key, value[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleApplyCalibration}
            disabled={calibrationMutation.isPending}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {calibrationMutation.isPending ? 'Applying...' : 'Apply'}
          </Button>
          <Button
            onClick={handleResetCalibration}
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Direction Display */}
        {calibrationData && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Direction:</span>
              <span className="font-mono text-primary">
                {calibrationData.current_direction}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Camera Status:</span>
              <span className={`font-mono ${calibrationData.camera_initialized ? 'text-status-connected' : 'text-status-disconnected'}`}>
                {calibrationData.camera_initialized ? 'Initialized' : 'Not Ready'}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};