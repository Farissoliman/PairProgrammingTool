"""Face detection module."""
import time
import asyncio
import cv2
from deepface import DeepFace

classifier = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")

emotions = []


async def gather_emotion():
    global emotions
    # Open the video stream once connected
    cap = cv2.VideoCapture(0)

    previous_emotion = None
    while True:
        # Read each frame from the video stream
        ret, frame = cap.read()

        # Detect faces in the frame
        result = DeepFace.analyze(
            img_path=frame, actions=["emotion"], enforce_detection=False
        )

        emotion = result[0]["dominant_emotion"][:]
        if emotion != previous_emotion:
            print(emotion)
            emotions.append({"emotion": emotion, "timestamp": time.time()})

        previous_emotion = emotion
        time.sleep(0.5)

    cap.release()
    cv2.destroyAllWindows()


def reset_state():
    global emotions
    emotions = []


async def collect():
    return emotions


async def start():
    asyncio.get_event_loop().run_until_complete(gather_emotion())


start()
