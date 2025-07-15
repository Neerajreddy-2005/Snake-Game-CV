from flask import Flask, jsonify, render_template, Response
import numpy as np
import cv2
import mediapipe as mp
import random
import threading
import time
import atexit

app = Flask(__name__)

# Game state
snake_position = [[250, 250], [240, 250], [230, 250]]
apple_position = [random.randrange(1, 50) * 10, random.randrange(1, 50) * 10]
score = 0
button_direction = 1  # 0: Left, 1: Right, 2: Up, 3: Down
snake_head = [250, 250]
game_over = False
current_direction = "None"
prev_index_pos = None  # Track previous index finger position (not used now)
reset_flag = False  # Flag to signal game loop restart

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1)
mp_drawing = mp.solutions.drawing_utils

# Initialize webcam with enhanced retry and release
cap = None
for i in range(3):  # Try indices 0, 1, 2
    cap = cv2.VideoCapture(i)
    if cap.isOpened():
        print(f"Successfully opened camera index {i}")
        break
    else:
        print(f"Failed to open camera index {i}, releasing...")
        cap.release()
if not cap or not cap.isOpened():
    print("No webcam detected after retries. Check connection, permissions, or drivers.")
    cap = None  # Ensure cap is None if failed

def create_placeholder_frame():
    frame = np.zeros((240, 320, 3), dtype=np.uint8)
    cv2.putText(frame, "Webcam Failed - Check Connection", (10, 120), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
    return frame

def collision_with_apple(apple_position, score):
    apple_position = [random.randrange(1, 50) * 10, random.randrange(1, 50) * 10]
    score += 1
    return apple_position, score

def collision_with_boundaries(snake_head):
    return snake_head[0] >= 500 or snake_head[0] < 0 or snake_head[1] >= 500 or snake_head[1] < 0

def collision_with_self(snake_position):
    return snake_head in snake_position[1:]

def get_hand_direction(landmarks):
    wrist = landmarks[0]  # Wrist landmark
    finger_tips = [landmarks[i] for i in [4, 8, 12, 16, 20]]  # Tips of thumb, index, middle, ring, pinky

    x_vals = [tip.x for tip in finger_tips]
    y_vals = [tip.y for tip in finger_tips]

    if all(y > wrist.y for y in y_vals):  # All fingers below wrist
        current_direction = "Down"
        print("Detected Down")
        return 3
    elif all(y < wrist.y for y in y_vals):  # All fingers above wrist
        current_direction = "Up"
        print("Detected Up")
        return 2
    elif all(x < wrist.x for x in x_vals):  # All fingers to the left of wrist
        current_direction = "Left"
        print("Detected Left")
        return 0
    elif all(x > wrist.x for x in x_vals):  # All fingers to the right of wrist
        current_direction = "Right"
        print("Detected Right")
        return 1
    current_direction = "None"
    return -1

def update_game():
    global snake_position, apple_position, score, snake_head, button_direction, game_over, reset_flag
    while cap is None or cap.isOpened():
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
                    direction = get_hand_direction(hand_landmarks.landmark)
                    if direction != -1 and direction != button_direction:
                        button_direction = direction

        if button_direction == 1: snake_head[0] += 10  # Right
        elif button_direction == 0: snake_head[0] -= 10  # Left
        elif button_direction == 2: snake_head[1] += 10  # Up
        elif button_direction == 3: snake_head[1] -= 10  # Down

        if snake_head == apple_position:
            apple_position, score = collision_with_apple(apple_position, score)
            snake_position.insert(0, list(snake_head))
        else:
            snake_position.insert(0, list(snake_head))
            snake_position.pop()

        if collision_with_boundaries(snake_head) or collision_with_self(snake_position):
            game_over = True
        time.sleep(0.01)

def gen_frames():
    placeholder = create_placeholder_frame()
    while True:
        if cap and cap.isOpened():
            success, frame = cap.read()
            if not success:
                print("Failed to grab frame. Retrying...")
                time.sleep(0.2)
                frame = placeholder
            else:
                frame = cv2.flip(frame, 1)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                result = hands.process(rgb_frame)

                if result.multi_hand_landmarks:
                    for hand_landmarks in result.multi_hand_landmarks:
                        mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                        get_hand_direction(hand_landmarks.landmark)
                        cv2.putText(frame, f"Direction: {current_direction}", (10, 30), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2, cv2.LINE_AA)
        else:
            frame = placeholder
            print("Webcam unavailable. Using placeholder.")

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

threading.Thread(target=update_game, daemon=True).start()

@atexit.register
def cleanup():
    if cap:
        cap.release()
        print("Camera released.")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game_state')
def game_state():
    return jsonify({
        'snake': snake_position,
        'apple': apple_position,
        'score': score,
        'game_over': game_over
    })

@app.route('/reset')
def reset_game():
    global snake_position, apple_position, score, button_direction, snake_head, game_over, prev_index_pos, current_direction, reset_flag
    snake_position = [[250, 250], [240, 250], [230, 250]]
    apple_position = [random.randrange(1, 50) * 10, random.randrange(1, 50) * 10]
    score = 0
    button_direction = 1
    snake_head = [250, 250]
    game_over = False
    prev_index_pos = None
    current_direction = "None"
    reset_flag = True
    return jsonify({"status": "Game reset"})

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(debug=True)