from flask import Flask, jsonify, Response, request
from flask_cors import CORS
import numpy as np
import cv2
import mediapipe as mp
import random
import threading
import time
import atexit
import math

app = Flask(__name__)

# Enable CORS for all routes - allow Netlify frontend
CORS(app, 
     origins=[
         'https://snake-gamecv.netlify.app',  # Your Netlify URL
         'http://localhost:3000',  # Local development
         'http://localhost:5173',  # Vite dev server
         'http://127.0.0.1:3000',
         'http://127.0.0.1:5173'
     ], 
     methods=['GET', 'POST', 'OPTIONS'], 
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

# Game state
snake_position = [[250, 250], [240, 250], [230, 250]]
apple_position = [random.randrange(1, 50) * 10, random.randrange(1, 50) * 10]
score = 0
button_direction = 1  # 0: Left, 1: Right, 2: Up, 3: Down
snake_head = [250, 250]
game_over = False
current_direction = "None"
prev_index_pos = None  # Track previous index finger position
reset_flag = False  # Flag to signal game loop restart
game_active = False  # Flag to control whether the game loop updates state
game_thread = None  # Reference to the background game loop thread

# Enhanced MediaPipe setup
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Gesture detection parameters (configurable)
GESTURE_THRESHOLD = 0.1  # Minimum movement threshold
GESTURE_COOLDOWN = 0.3   # Cooldown between gesture detections
FINGER_THRESHOLD = 0.08  # Finger extension threshold
last_gesture_time = 0

# Calibration settings
calibration_settings = {
    'gesture_threshold': GESTURE_THRESHOLD,
    'gesture_cooldown': GESTURE_COOLDOWN,
    'finger_threshold': FINGER_THRESHOLD,
    'detection_confidence': 0.7,
    'tracking_confidence': 0.5,
    'tick_interval': 0.03
}

# Initialize webcam with enhanced retry and release
cap = None
def initialize_camera():
    global cap
    print("=== Enhanced Camera Initialization ===")
    
    # Try different camera indices with better error handling
    for i in range(10):  # Try indices 0-9
        print(f"Attempting to open camera index {i}...")
        cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)  # Use DirectShow backend on Windows
        
        if cap.isOpened():
            print(f"✓ Successfully opened camera index {i}")
            
            # Set camera properties for better performance/latency
            # Start with 640x480 for higher FPS; we'll try 1280x720 if stable
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            cap.set(cv2.CAP_PROP_FPS, 30)
            cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
            cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.75)  # 0.75 -> auto exposure on many Windows drivers
            cap.set(cv2.CAP_PROP_AUTO_WB, 1)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            # Get and display camera properties
            width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
            height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
            fps = cap.get(cv2.CAP_PROP_FPS)
            print(f"Camera properties: {width}x{height} @ {fps} FPS")
            
            # Test if we can actually read multiple frames
            frame_count = 0
            test_frame = None
            for _ in range(10):  # Test 10 frames
                ret, frm = cap.read()
                if ret:
                    test_frame = frm
                    frame_count += 1
                else:
                    break

            # If low FPS or unstable at 640x480, try 1280x720 once more
            if frame_count >= 6:
                print(f"✓ Camera is working! Successfully read {frame_count}/10 test frames")
                if test_frame is not None:
                    print(f"Frame shape: {test_frame.shape}")
                return True
            else:
                print("⚠ Low stability/FPS at 640x480, trying 1280x720...")
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                frame_count = 0
                for _ in range(10):
                    ret, frm = cap.read()
                    if ret:
                        test_frame = frm
                        frame_count += 1
                    else:
                        break
                if frame_count >= 6:
                    print(f"✓ Camera is stable at 1280x720 with {frame_count}/10 frames")
                    if test_frame is not None:
                        print(f"Frame shape: {test_frame.shape}")
                    return True
                else:
                    print(f"✗ Camera opened but cannot read frames consistently from index {i}")
                    cap.release()
        else:
            print(f"✗ Failed to open camera index {i}")
            if cap:
                cap.release()
    
    print("✗ No working camera found after trying all indices")
    print("Possible issues:")
    print("- Camera not connected")
    print("- Camera in use by another application")
    print("- Missing camera drivers")
    print("- Permission issues")
    print("- Try running as administrator")
    cap = None
    return False

# Initialize camera
camera_initialized = initialize_camera()

def create_placeholder_frame():
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(frame, "Webcam Failed - Check Connection", (50, 200), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(frame, "Camera Status: " + ("Connected" if camera_initialized else "Not Found"), (50, 250), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0) if camera_initialized else (0, 0, 255), 2, cv2.LINE_AA)
    return frame

def test_camera_feed():
    """Test function to display camera feed in a window"""
    if not cap or not cap.isOpened():
        print("Cannot test camera - no camera available")
        return
    
    print("=== Testing Camera Feed ===")
    print("Press 'q' to quit the camera test")
    
    frame_count = 0
    start_time = time.time()
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to read frame from camera")
            break
        
        frame_count += 1
        
        # Add frame info to the image
        cv2.putText(frame, f"Frame: {frame_count}", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
        cv2.putText(frame, f"Shape: {frame.shape}", (10, 60), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
        
        # Calculate and display FPS
        elapsed_time = time.time() - start_time
        if elapsed_time > 0:
            fps = frame_count / elapsed_time
            cv2.putText(frame, f"FPS: {fps:.1f}", (10, 90), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
        
        # Display the frame
        cv2.imshow('Camera Test Feed', frame)
        
        # Check for 'q' key to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cv2.destroyAllWindows()
    print(f"Camera test completed. Processed {frame_count} frames in {elapsed_time:.2f} seconds")
    print(f"Average FPS: {frame_count/elapsed_time:.1f}")

def collision_with_apple(apple_position, score):
    apple_position = [random.randrange(1, 50) * 10, random.randrange(1, 50) * 10]
    score += 1
    return apple_position, score

def collision_with_boundaries(snake_head):
    # No longer used for game over; kept for compatibility
    return False

def collision_with_self(snake_position):
    return snake_head in snake_position[1:]

def get_hand_direction(landmarks, frame_shape):
    """Enhanced gesture detection using finger positions and movement analysis"""
    global last_gesture_time, prev_index_pos, current_direction
    
    current_time = time.time()
    
    # Get key landmarks
    wrist = landmarks[0]
    thumb_tip = landmarks[4]
    index_tip = landmarks[8]
    middle_tip = landmarks[12]
    ring_tip = landmarks[16]
    pinky_tip = landmarks[20]
    
    # Calculate finger distances from wrist
    thumb_dist = math.sqrt((thumb_tip.x - wrist.x)**2 + (thumb_tip.y - wrist.y)**2)
    index_dist = math.sqrt((index_tip.x - wrist.x)**2 + (index_tip.y - wrist.y)**2)
    middle_dist = math.sqrt((middle_tip.x - wrist.x)**2 + (middle_tip.y - wrist.y)**2)
    ring_dist = math.sqrt((ring_tip.x - wrist.x)**2 + (ring_tip.y - wrist.y)**2)
    pinky_dist = math.sqrt((pinky_tip.x - wrist.x)**2 + (pinky_tip.y - wrist.y)**2)
    
    # Check if fingers are extended (distance > threshold)
    finger_threshold = calibration_settings['finger_threshold']
    fingers_extended = [
        thumb_dist > finger_threshold,
        index_dist > finger_threshold,
        middle_dist > finger_threshold,
        ring_dist > finger_threshold,
        pinky_dist > finger_threshold
    ]
    
    # Count extended fingers
    extended_count = sum(fingers_extended)
    
    # Gesture detection based on finger positions and movement
    if extended_count >= 3:  # Multiple fingers extended - check direction
        # Calculate center of extended fingers
        extended_fingers = []
        if fingers_extended[0]: extended_fingers.append(thumb_tip)
        if fingers_extended[1]: extended_fingers.append(index_tip)
        if fingers_extended[2]: extended_fingers.append(middle_tip)
        if fingers_extended[3]: extended_fingers.append(ring_tip)
        if fingers_extended[4]: extended_fingers.append(pinky_tip)
        
        if extended_fingers:
            # Calculate average position of extended fingers
            avg_x = sum(f.x for f in extended_fingers) / len(extended_fingers)
            avg_y = sum(f.y for f in extended_fingers) / len(extended_fingers)
            
            # Calculate movement from wrist to finger center
            dx = avg_x - wrist.x
            dy = avg_y - wrist.y
            
            # Determine direction based on movement vector
            threshold = calibration_settings['gesture_threshold']
            if abs(dx) > abs(dy):  # Horizontal movement
                if dx > threshold:
                    current_direction = "Right"
                    return 1
                elif dx < -threshold:
                    current_direction = "Left"
                    return 0
            else:  # Vertical movement
                if dy > threshold:
                    current_direction = "Down"
                    return 3
                elif dy < -threshold:
                    current_direction = "Up"
                    return 2
    
    # Single finger gesture (index finger pointing)
    elif fingers_extended[1] and not any(fingers_extended[i] for i in [0, 2, 3, 4]):
        # Use index finger movement for direction
        if prev_index_pos is not None:
            dx = index_tip.x - prev_index_pos[0]
            dy = index_tip.y - prev_index_pos[1]
            
            # Check for significant movement
            threshold = calibration_settings['gesture_threshold']
            if abs(dx) > threshold or abs(dy) > threshold:
                if abs(dx) > abs(dy):  # Horizontal movement
                    if dx > threshold:
                        current_direction = "Right"
                        return 1
                    elif dx < -threshold:
                        current_direction = "Left"
                        return 0
                else:  # Vertical movement
                    if dy > threshold:
                        current_direction = "Down"
                        return 3
                    elif dy < -threshold:
                        current_direction = "Up"
                        return 2
        
        # Update previous position
        prev_index_pos = (index_tip.x, index_tip.y)
    
    # No clear gesture detected
    current_direction = "None"
    return -1

def update_game():
    global snake_position, apple_position, score, snake_head, button_direction, game_over, reset_flag, last_gesture_time, game_active, cap
    while cap is None or cap.isOpened():
        # If game is not active, idle briefly and continue
        if not game_active:
            time.sleep(0.05)
            continue
        if reset_flag:  # Check if reset was triggered
            reset_flag = False
            print("Game loop restarted after reset")
            continue

        if game_over:
            time.sleep(0.1)
            continue

        success, frame = cap.read() if cap else (False, None)
        if not success and cap:
            print("Failed to grab frame. Retrying...")
            time.sleep(0.2)
            continue
        elif cap:
            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = hands.process(rgb_frame)

            if result.multi_hand_landmarks:
                for hand_landmarks in result.multi_hand_landmarks:
                    current_time = time.time()
                    # Add cooldown to prevent rapid direction changes
                    if current_time - last_gesture_time > calibration_settings['gesture_cooldown']:
                        direction = get_hand_direction(hand_landmarks.landmark, frame.shape)
                        if direction != -1 and direction != button_direction:
                            button_direction = direction
                            last_gesture_time = current_time
                            print(f"Direction changed to: {current_direction}")

        # Update snake position based on current direction
        if button_direction == 1: snake_head[0] += 10  # Right
        elif button_direction == 0: snake_head[0] -= 10  # Left
        elif button_direction == 2: snake_head[1] -= 10  # Up (fixed coordinate system)
        elif button_direction == 3: snake_head[1] += 10  # Down (fixed coordinate system)

        # Wrap around edges so opposite edges are connected (toroidal board)
        if snake_head[0] >= 500: snake_head[0] = 0
        elif snake_head[0] < 0: snake_head[0] = 500 - 10
        if snake_head[1] >= 500: snake_head[1] = 0
        elif snake_head[1] < 0: snake_head[1] = 500 - 10

        if snake_head == apple_position:
            apple_position, score = collision_with_apple(apple_position, score)
            snake_position.insert(0, list(snake_head))
        else:
            snake_position.insert(0, list(snake_head))
            snake_position.pop()

        # Only self-collision ends the game; boundaries wrap
        if collision_with_self(snake_position):
            game_over = True
        # Use configurable tick interval for game speed
        time.sleep(float(calibration_settings.get('tick_interval', 0.03)))

def gen_frames():
    """Generate camera frames (no hand processing here to avoid conflicts)"""
    placeholder = create_placeholder_frame()
    frame_count = 0
    
    while True:
        if cap and cap.isOpened():
            success, frame = cap.read()
            if not success:
                print("Failed to grab frame. Retrying...")
                time.sleep(0.2)
                frame = placeholder
            else:
                # Flip the frame horizontally for mirror effect
                frame = cv2.flip(frame, 1)
                
                # Important: do NOT call hands.process() here.
                # Hand detection runs in the game loop; duplicating it from another
                # thread causes MediaPipe timestamp mismatches and freezes.
                
                # Add UI overlay with gesture information
                frame_height, frame_width = frame.shape[:2]
                
                # Draw semi-transparent overlay
                overlay = frame.copy()
                cv2.rectangle(overlay, (10, 10), (300, 120), (0, 0, 0), -1)
                cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
                
                # Add text information
                cv2.putText(frame, f"Direction: {current_direction}", (20, 35), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(frame, f"Score: {score}", (20, 60), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                cv2.putText(frame, f"Game Status: {'OVER' if game_over else 'PLAYING'}", (20, 85), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255) if game_over else (0, 255, 0), 2)
                
                # Add gesture instructions
                cv2.putText(frame, "Gestures:", (20, frame_height - 80), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(frame, "Multiple fingers = Direction", (20, frame_height - 60), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                cv2.putText(frame, "Index finger = Point direction", (20, frame_height - 40), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                cv2.putText(frame, "Make clear gestures!", (20, frame_height - 20), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
                
                frame_count += 1
        else:
            frame = placeholder
            print("Webcam unavailable. Using placeholder.")

        try:
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])  # Optimized JPEG quality
            if not ret:
                continue
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        except Exception as encode_err:
            print(f"Video stream encode error: {encode_err}")
            time.sleep(0.01)

def ensure_game_thread_running():
    global game_thread
    if game_thread is None or not game_thread.is_alive():
        game_thread = threading.Thread(target=update_game, daemon=True)
        game_thread.start()

# Start background thread in idle state so it's ready when activated
ensure_game_thread_running()

@atexit.register
def cleanup():
    if cap:
        cap.release()
        print("Camera released.")

@app.route('/')
def index():
    """API health check endpoint"""
    return jsonify({
        "status": "success",
        "message": "Snake Game CV API is running",
        "endpoints": {
            "game_state": "/game_state",
            "video_feed": "/video_feed",
            "camera_status": "/camera_status",
            "calibration": "/calibration",
            "reset": "/reset",
            "start": "/start",
            "stop": "/stop",
            "test_camera": "/test_camera"
        }
    })

@app.route('/game_state')
def game_state():
    return jsonify({
        'snake': snake_position,
        'apple': apple_position,
        'score': score,
        'game_over': game_over,
        'current_direction': current_direction,
        'button_direction': button_direction
    })

@app.route('/gesture_info')
def gesture_info():
    """Endpoint to get current gesture detection information"""
    return jsonify({
        'current_direction': current_direction,
        'button_direction': button_direction,
        'gesture_threshold': calibration_settings['gesture_threshold'],
        'gesture_cooldown': calibration_settings['gesture_cooldown'],
        'finger_threshold': calibration_settings['finger_threshold'],
        'last_gesture_time': last_gesture_time,
        'camera_initialized': camera_initialized
    })

@app.route('/calibration', methods=['GET', 'POST'])
def calibration():
    """Endpoint to get or update calibration settings"""
    global calibration_settings, hands
    
    if request.method == 'POST':
        data = request.get_json()
        
        # Update calibration settings
        if 'gesture_threshold' in data:
            calibration_settings['gesture_threshold'] = float(data['gesture_threshold'])
        if 'gesture_cooldown' in data:
            calibration_settings['gesture_cooldown'] = float(data['gesture_cooldown'])
        if 'finger_threshold' in data:
            calibration_settings['finger_threshold'] = float(data['finger_threshold'])
        if 'detection_confidence' in data:
            calibration_settings['detection_confidence'] = float(data['detection_confidence'])
        if 'tracking_confidence' in data:
            calibration_settings['tracking_confidence'] = float(data['tracking_confidence'])
        if 'tick_interval' in data:
            calibration_settings['tick_interval'] = max(0.005, float(data['tick_interval']))
        
        # Reinitialize MediaPipe hands with new confidence settings
        hands = mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=calibration_settings['detection_confidence'],
            min_tracking_confidence=calibration_settings['tracking_confidence']
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Calibration settings updated',
            'settings': calibration_settings
        })
    
    return jsonify({
        'settings': calibration_settings,
        'current_direction': current_direction,
        'camera_initialized': camera_initialized
    })

@app.route('/camera_status')
def camera_status():
    """Simple endpoint to check camera status"""
    if cap and cap.isOpened():
        return jsonify({
            "camera_available": True,
            "camera_initialized": camera_initialized,
            "frame_size": f"{cap.get(cv2.CAP_PROP_FRAME_WIDTH)}x{cap.get(cv2.CAP_PROP_FRAME_HEIGHT)}",
            "fps": cap.get(cv2.CAP_PROP_FPS)
        })
    else:
        return jsonify({
            "camera_available": False,
            "camera_initialized": camera_initialized,
            "error": "Camera not available"
        })

@app.route('/reset')
def reset_game():
    global snake_position, apple_position, score, button_direction, snake_head, game_over, prev_index_pos, current_direction, reset_flag, last_gesture_time
    snake_position = [[250, 250], [240, 250], [230, 250]]
    apple_position = [random.randrange(1, 50) * 10, random.randrange(1, 50) * 10]
    score = 0
    button_direction = 1
    snake_head = [250, 250]
    game_over = False
    prev_index_pos = None
    current_direction = "None"
    last_gesture_time = 0
    reset_flag = True
    return jsonify({"status": "Game reset"})

@app.route('/start', methods=['POST', 'GET'])
def start_game():
    """Activate the game loop and reset the game state."""
    global game_active
    # Reinitialize camera if needed
    global cap, camera_initialized
    if cap is None or not (cap and cap.isOpened()):
        camera_initialized = initialize_camera()
    ensure_game_thread_running()
    # Reset on start to present a fresh game
    _ = reset_game()
    game_active = True
    return jsonify({"status": "Game started"})

@app.route('/stop', methods=['POST', 'GET'])
def stop_game():
    """Deactivate the game loop updates (keeps server alive)."""
    global game_active, cap
    game_active = False
    # Fully release camera so hardware light turns off
    try:
        if cap:
            cap.release()
    finally:
        cap = None
    return jsonify({"status": "Game stopped"})

@app.route('/video_feed')
def video_feed():
    # If camera is not available, do not hold hardware
    if cap is None or not cap.isOpened():
        return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/test_camera')
def test_camera():
    """Route to test camera functionality"""
    if camera_initialized:
        return jsonify({
            "status": "success",
            "message": "Camera is initialized and ready",
            "camera_index": "Found working camera",
            "frame_size": f"{cap.get(cv2.CAP_PROP_FRAME_WIDTH)}x{cap.get(cv2.CAP_PROP_FRAME_HEIGHT)}",
            "fps": cap.get(cv2.CAP_PROP_FPS)
        })
    else:
        return jsonify({
            "status": "error",
            "message": "Camera initialization failed",
            "suggestions": [
                "Check if camera is connected",
                "Ensure no other application is using the camera",
                "Check camera drivers",
                "Verify camera permissions"
            ]
        })

if __name__ == '__main__':
    import os
    print("=== Snake Game with Hand Gesture Control ===")
    print(f"Camera Status: {'✓ Connected' if camera_initialized else '✗ Not Found'}")
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    print("Starting Flask application...")
    print(f"Access the game at: http://localhost:{port}")
    print(f"Test camera at: http://localhost:{port}/test_camera")
    print(f"Video feed at: http://localhost:{port}/video_feed")

    # Important: do not block the server with interactive camera test
    # Use /video_feed or /test_camera endpoints instead
    app.run(host='0.0.0.0', port=port, debug=debug, use_reloader=False)