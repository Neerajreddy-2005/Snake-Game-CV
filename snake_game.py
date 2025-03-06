import numpy as np
import matplotlib.pyplot as plt
import random
import cv2
import mediapipe as mp

mp_hands = mp.solutions.hands
hands = mp_hands.Hands()
mp_drawing = mp.solutions.drawing_utils

snake_position = [[250, 250], [240, 250], [230, 250]]
apple_position = [random.randrange(1, 50) * 10, random.randrange(1, 50) * 10]
score = 0
button_direction = 1
snake_head = [250, 250]

plt.ion()
fig, ax = plt.subplots()

ax.set_facecolor('black')
boundary_color = 'white'
boundary_width = 2

cap = cv2.VideoCapture(0)

game_over = False
countdown_timer = 5

def collision_with_apple(apple_position, score):
    apple_position = [random.randrange(1, 50) * 10, random.randrange(1, 50) * 10]
    score += 1
    return apple_position, score

def collision_with_boundaries(snake_head):
    if snake_head[0] >= 500 or snake_head[0] < 0 or snake_head[1] >= 500 or snake_head[1] < 0:
        return True
    return False

def collision_with_self(snake_position):
    snake_head = snake_position[0]
    if snake_head in snake_position[1:]:
        return True
    return False

def get_hand_direction(landmarks):
    wrist = landmarks[0]
    finger_tips = [landmarks[i] for i in [4, 8, 12, 16, 20]]

    x_vals = [tip.x for tip in finger_tips]
    y_vals = [tip.y for tip in finger_tips]
    avg_x = sum(x_vals) / len(x_vals)
    avg_y = sum(y_vals) / len(y_vals)

    if avg_y > wrist.y + 0.1:  # Added threshold
        return 3  # Down
    elif avg_y < wrist.y - 0.1:
        return 2  # Up
    elif avg_x < wrist.x - 0.1:
        return 0  # Left
    elif avg_x > wrist.x + 0.1:
        return 1  # Right
    return -1

while cap.isOpened():
    if game_over:
        countdown_timer -= 0.1

        ax.clear()
        ax.set_xlim(0, 500)
        ax.set_ylim(0, 500)
        ax.axis('off')

        ax.add_patch(
            plt.Rectangle((0, 0), 500, 500, linewidth=boundary_width, edgecolor=boundary_color, facecolor='black'))
        ax.text(250, 250, f'Game Over! Your Score: {score}\nExiting in {max(0, int(countdown_timer) + 1)} seconds...',
                ha='center', va='center', color='white', fontsize=15)

        plt.pause(0.1)

        if countdown_timer <= 0:
            break
        continue

    success, frame = cap.read()
    if not success:
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb_frame)

    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            direction = get_hand_direction(hand_landmarks.landmark)
            if direction != -1 and direction != button_direction:
                button_direction = direction

    if button_direction == 1:
        snake_head[0] += 10  # Right
    elif button_direction == 0:
        snake_head[0] -= 10  # Left
    elif button_direction == 2:
        snake_head[1] += 10  # Up
    elif button_direction == 3:
        snake_head[1] -= 10  # Down

    if snake_head == apple_position:
        apple_position, score = collision_with_apple(apple_position, score)
        snake_position.insert(0, list(snake_head))
    else:
        snake_position.insert(0, list(snake_head))
        snake_position.pop()

    if collision_with_boundaries(snake_head) or collision_with_self(snake_position):
        game_over = True
        continue

    ax.clear()
    ax.set_xlim(0, 500)
    ax.set_ylim(0, 500)
    ax.axis('off')
    ax.add_patch(plt.Rectangle((0, 0), 500, 500, linewidth=boundary_width, edgecolor=boundary_color, facecolor='black'))
    ax.add_patch(plt.Rectangle((apple_position[0], apple_position[1]), 10, 10, color="red"))

    for pos in snake_position:
        ax.add_patch(plt.Rectangle((pos[0], pos[1]), 10, 10, color="green"))

    plt.pause(0.1)

cap.release()
hands.close()
plt.ioff()
plt.close(fig)