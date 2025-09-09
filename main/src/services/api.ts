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
  // Use Netlify Functions in production, Vite proxy in development
  baseURL: import.meta.env.DEV ? '' : '/.netlify/functions',
  timeout: 10000,
});

export const getGameState = async (): Promise<GameState> => {
  const response = await api.get<GameState>('/game-state');
  return response.data;
};

export const getCameraStatus = async (): Promise<CameraStatus> => {
  const response = await api.get<CameraStatus>('/camera-status');
  return response.data;
};

export const getGestureInfo = async (): Promise<GestureInfo> => {
  const response = await api.get<GestureInfo>('/gesture-info');
  return response.data;
};

export const postGestureInfo = async (payload: Partial<GestureInfo>): Promise<{ status: string; data: GestureInfo }> => {
  const response = await api.post<{ status: string; data: GestureInfo }>('/gesture-info', payload);
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
  const response = await api.get<ResetResponse>('/reset-game');
  return response.data;
};

export const startGame = async (): Promise<{ status: string }> => {
  const response = await api.get<{ status: string }>('/start-game');
  return response.data;
};

export const stopGame = async (): Promise<{ status: string }> => {
  const response = await api.get<{ status: string }>('/stop-game');
  return response.data;
};