## Snake-Game-CV

Gesture‑controlled Snake game with a Python/Flask backend (OpenCV + MediaPipe) and a modern React + Vite frontend. The backend performs hand/gesture detection and runs the game loop; the frontend renders the board, shows the camera stream, exposes calibration controls, and manages session flow.

### Key Features
- Gesture control via webcam (MediaPipe Hands) – steer the snake with natural hand movements
- Live MJPEG camera stream served from Flask to the frontend
- Configurable calibration (sensitivity, cooldown, confidence, and game tick speed)
- Resilient camera initialization with helpful diagnostics
- Clean UI with status panel and start/stop controls

---

## Architecture Overview

- `backend/app.py` (Flask)
  - Endpoints:
    - `GET /start` – start a new session (resets state, ensures camera/thread)
    - `GET /stop` – stop session and fully release the camera
    - `GET /reset` – reset game state to initial
    - `GET /game_state` – current snake, apple, score, and status
    - `GET /gesture_info` – current direction and calibration info
    - `GET|POST /calibration` – read/update calibration settings
    - `GET /camera_status` – camera connection info
    - `GET /video_feed` – MJPEG stream served by OpenCV
  - Background thread: `update_game()` runs the game loop and consumes gesture detections
  - Camera lifecycle: initialized on start, released on stop and on game over

- `frontend` (Vite + React + TypeScript)
  - Proxies Flask endpoints in `vite.config.ts`
  - Data fetching via TanStack Query
  - Components: `GameBoard`, `VideoPanel` (MJPEG), `StatusPanel`, `CalibrationPanel`

---

## Prerequisites
- Windows 10/11 (other OSes likely work with minor changes)
- Python 3.10+ with build tools
- Node.js 18+
- A working webcam

---

## Setup & Installation

### 1) Backend (Flask)
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
The server starts at `http://localhost:5000` and logs camera status and stream URLs.

### 2) Frontend (React + Vite)
```
cd frontend
npm install
npm run dev
```
Open the Vite URL (default `http://localhost:8080`). Requests are proxied to Flask.

---

## How to Play
1. Start the backend first; confirm the console shows a working camera or placeholder.
2. Start the frontend and navigate to the Dashboard.
3. Click “Start Game”. The camera light should turn on and the board begins updating.
4. Use hand gestures to change direction:
   - Multiple fingers moved left/right/up/down → corresponding direction
   - Single index finger movement also works as a pointer
5. Eat apples to increase your score. Self-collision ends the game (edges wrap).

---

## Calibration
Open the Calibration panel (top bar → Open) while the game is running. Sliders map to the backend’s `calibration_settings`:

- `gesture_threshold`: minimum movement threshold (lower = more sensitive)
- `gesture_cooldown`: minimal time between direction changes (seconds)
- `finger_threshold`: threshold for fingers considered extended
- `detection_confidence`: MediaPipe detection confidence
- `tracking_confidence`: MediaPipe tracking confidence
- `tick_interval`: game loop delay in seconds (higher = slower snake)

Recommended starting values:
- gesture_threshold: 0.10
- gesture_cooldown: 0.20
- finger_threshold: 0.08
- detection_confidence: 0.5–0.6
- tracking_confidence: 0.5–0.6
- tick_interval: 0.05–0.08

Click “Apply” to persist and auto-close the dialog. If needed, Stop → Start Game to re-initialize.

---

## Troubleshooting

### Camera doesn’t show in the Video panel
- Ensure Flask is running and visit `http://localhost:5000/video_feed` to confirm stream
- The Vite proxy (in `vite.config.ts`) should include `/video_feed`
- Close other apps that use the webcam (Teams/Zoom/Meet/etc.)

### Game doesn’t move / gestures not detected
- Increase `tick_interval` (slower game) and slightly lower `gesture_threshold`
- Watch Flask console for lines like “Direction changed to: …”
- Press Stop → Start Game to reinitialize camera and thread

### Camera light stays on after stop or game over
- The backend releases the camera on stop and game over. If the light persists, refresh the frontend and ensure no other tab or app holds the camera.

---

## Scripts & Commands
- Backend: `python app.py`
- Frontend: `npm run dev` | `npm run build` | `npm run preview`

---

## Tech Stack
- Backend: Python, Flask, OpenCV, MediaPipe, NumPy
- Frontend: React, TypeScript, Vite, TanStack Query, Tailwind-based UI

---

## License
This project is licensed under the MIT License. See `LICENSE` for details.
