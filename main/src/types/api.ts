export type DirectionName = "None" | "Up" | "Down" | "Left" | "Right";
export type ButtonDirection = 0 | 1 | 2 | 3;

export interface GameState {
  snake: [number, number][];
  apple: [number, number];
  score: number;
  game_over: boolean;
  current_direction: DirectionName;
  button_direction: ButtonDirection;
}

export interface CameraStatus {
  camera_available: boolean;
  camera_initialized: boolean;
  frame_size: string;
  fps?: number;
}

export interface CalibrationSettings {
  gesture_threshold: number;
  gesture_cooldown: number;
  finger_threshold: number;
  detection_confidence: number;
  tracking_confidence: number;
}

export interface CalibrationResponse {
  settings: CalibrationSettings;
  current_direction: DirectionName;
  camera_initialized: boolean;
}

export interface GestureInfo {
  current_direction: DirectionName;
  button_direction: ButtonDirection;
  gesture_threshold: number;
  gesture_cooldown: number;
  finger_threshold: number;
  last_gesture_time: number;
  camera_initialized: boolean;
}

export interface CalibrationPostResponse {
  status: string;
  message: string;
  settings: CalibrationSettings;
}

export interface ResetResponse {
  status: string;
}