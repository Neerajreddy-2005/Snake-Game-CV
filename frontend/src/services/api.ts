import axios from 'axios';
import type {
  GameState,
  CameraStatus,
  GestureInfo,
  CalibrationResponse,
  CalibrationSettings,
  CalibrationPostResponse,
  ResetResponse
} from '../types/api';

const api = axios.create({
  // Use Vite proxy in development by default (relative base URL). Override with VITE_API_BASE_URL for prod.
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000, // Increased for production
});

export const getGameState = async (): Promise<GameState> => {
  const response = await api.get<GameState>('/game_state');
  return response.data;
};

export const getCameraStatus = async (): Promise<CameraStatus> => {
  const response = await api.get<CameraStatus>('/camera_status');
  return response.data;
};

export const getGestureInfo = async (): Promise<GestureInfo> => {
  const response = await api.get<GestureInfo>('/gesture_info');
  return response.data;
};

export const getCalibration = async (): Promise<CalibrationResponse> => {
  const response = await api.get<CalibrationResponse>('/calibration');
  return response.data;
};

export const postCalibration = async (
  payload: Partial<CalibrationSettings & { tracking_confidence: number }>
): Promise<CalibrationPostResponse> => {
  const response = await api.post<CalibrationPostResponse>('/calibration', payload);
  return response.data;
};

export const resetGame = async (): Promise<ResetResponse> => {
  const response = await api.get<ResetResponse>('/reset');
  return response.data;
};

export const startGame = async (): Promise<{ status: string }> => {
  // GET for simplicity to avoid CORS preflight in dev
  const response = await api.get<{ status: string }>('/start');
  return response.data;
};

export const stopGame = async (): Promise<{ status: string }> => {
  const response = await api.get<{ status: string }>('/stop');
  return response.data;
};