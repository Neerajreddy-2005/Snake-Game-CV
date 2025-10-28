// Gesture detection using MediaPipe in the browser
// This will process camera frames and detect hand gestures

export interface HandLandmarks {
  x: number;
  y: number;
  z: number;
}

export interface GestureResult {
  direction: 'left' | 'right' | 'up' | 'down' | 'none';
  confidence: number;
  landmarks?: HandLandmarks[];
}

class GestureDetector {
  private hands: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Dynamically import MediaPipe
      const { Hands } = await import('@mediapipe/hands');
      
      this.hands = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      this.isInitialized = true;
      console.log('✅ MediaPipe Hands initialized');
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe:', error);
      throw error;
    }
  }

  async detectGesture(canvas: HTMLCanvasElement): Promise<GestureResult> {
    if (!this.hands || !this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      this.hands.onResults((results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          const direction = this.analyzeGestures(landmarks);
          resolve({
            direction,
            confidence: 0.8,
            landmarks: landmarks.map((lm: any) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z
            }))
          });
        } else {
          resolve({
            direction: 'none',
            confidence: 0
          });
        }
      });

      // Send frame to MediaPipe
      this.hands.send({ image: canvas });
    });
  }

  private analyzeGestures(landmarks: any[]): 'left' | 'right' | 'up' | 'down' | 'none' {
    // Get key landmarks
    const wrist = landmarks[0];
    const thumb_tip = landmarks[4];
    const index_tip = landmarks[8];
    const middle_tip = landmarks[12];
    const ring_tip = landmarks[16];
    const pinky_tip = landmarks[20];

    // Calculate finger distances from wrist
    const fingerDistances = [
      this.distance(wrist, thumb_tip),
      this.distance(wrist, index_tip),
      this.distance(wrist, middle_tip),
      this.distance(wrist, ring_tip),
      this.distance(wrist, pinky_tip)
    ];

    // Check if fingers are extended
    const fingerThreshold = 0.08;
    const fingersExtended = fingerDistances.map(dist => dist > fingerThreshold);
    const extendedCount = fingersExtended.filter(Boolean).length;

    // Multiple fingers extended - check direction
    if (extendedCount >= 3) {
      const extendedFingers = [];
      if (fingersExtended[0]) extendedFingers.push(thumb_tip);
      if (fingersExtended[1]) extendedFingers.push(index_tip);
      if (fingersExtended[2]) extendedFingers.push(middle_tip);
      if (fingersExtended[3]) extendedFingers.push(ring_tip);
      if (fingersExtended[4]) extendedFingers.push(pinky_tip);

      if (extendedFingers.length > 0) {
        const avgX = extendedFingers.reduce((sum, f) => sum + f.x, 0) / extendedFingers.length;
        const avgY = extendedFingers.reduce((sum, f) => sum + f.y, 0) / extendedFingers.length;

        const dx = avgX - wrist.x;
        const dy = avgY - wrist.y;

        const threshold = 0.1;
        if (Math.abs(dx) > Math.abs(dy)) {
          return dx > threshold ? 'right' : dx < -threshold ? 'left' : 'none';
        } else {
          return dy > threshold ? 'down' : dy < -threshold ? 'up' : 'none';
        }
      }
    }

    // Single finger gesture (index finger pointing)
    if (fingersExtended[1] && !fingersExtended[0] && !fingersExtended[2] && !fingersExtended[3] && !fingersExtended[4]) {
      const dx = index_tip.x - wrist.x;
      const dy = index_tip.y - wrist.y;

      const threshold = 0.1;
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > threshold ? 'right' : dx < -threshold ? 'left' : 'none';
      } else {
        return dy > threshold ? 'down' : dy < -threshold ? 'up' : 'none';
      }
    }

    return 'none';
  }

  private distance(point1: any, point2: any): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export const gestureDetector = new GestureDetector();
