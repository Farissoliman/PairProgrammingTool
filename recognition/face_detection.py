"""Face detection module."""
import time
import asyncio
import cv2
from deepface import DeepFace


class FaceDetection:
    emotions = []

    async def gather_emotion(self):
        # Open the video stream once connected
        cap = cv2.VideoCapture(0)

        previous_emotion = None
        try:
            while True:
                # Read each frame from the video stream
                _, frame = cap.read()

                # Detect faces in the frame
                result = DeepFace.analyze(
                    img_path=frame,
                    actions=["emotion"],
                    enforce_detection=False,
                    silent=True,
                )

                emotion = result[0]["dominant_emotion"][:]
                if emotion != previous_emotion:
                    print(emotion)
                    self.emotions.append(
                        {"emotion": emotion, "timestamp": time.time() * 1000}
                    )

                previous_emotion = emotion
                time.sleep(0.5)
        except KeyboardInterrupt:
            cap.release()
            cv2.destroyAllWindows()

    def reset_state(self):
        self.emotions = []

    def collect(self):
        return self.emotions

    def start(self):
        asyncio.new_event_loop().run_until_complete(self.gather_emotion())
