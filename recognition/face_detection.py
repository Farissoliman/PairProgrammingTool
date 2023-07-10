"""Face detection module."""
import time
import asyncio
import cv2
from deepface import DeepFace
import websockets

classifier = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")


async def send_emotion(emotion):
    """Sends the emotion to the server."""
    uri = "ws://127.0.0.1:3030"

    # Connect to the WebSocket server
    async with websockets.connect(uri) as websocket:
        await websocket.send(emotion)

        # Open the video stream once connected
        cap = cv2.VideoCapture(0)

        previous_emotion = None
        while True:
            if websocket.closed:
                break
            # Read each frame from the video stream
            ret, frame = cap.read()

            # Detect faces in the frame
            result = DeepFace.analyze(
                img_path=frame, actions=["emotion"], enforce_detection=False
            )

            emotion = result[0]["dominant_emotion"][:]
            if emotion != previous_emotion:
                await websocket.send(emotion)

            previous_emotion = emotion
            time.sleep(0.5)

        cap.release()
        cv2.destroyAllWindows()


asyncio.get_event_loop().run_until_complete(send_emotion("connection_established"))
