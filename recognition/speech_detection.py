import asyncio
import time
import speech_recognition as sr



class SpeechDetection:
    
    running = True
    
    # Create a recognizer object
    speech_recognizer = sr.Recognizer()

    # Create a microphone object
    microphone = sr.Microphone()

    utterances = []

    # Define a function to get the current time
    def get_current_time(self):
        return time.time() * 1000

    # Define the callback function to handle speech recognition results
    def callback(self, recognizer, audio):
        try:
            start_time = self.get_current_time()

            # Convert audio to text
            text = recognizer.recognize_google(audio)

            # Update the most recent utterance
            most_recent_utterance = text

            if most_recent_utterance == "the" or most_recent_utterance == "":
                return

            data = {
                "start_time": start_time,
                "utterance": most_recent_utterance,
                "end_time": self.get_current_time(),
            }

            self.utterances.append(data)
            print(self.utterances)

        except sr.UnknownValueError:
            # Speech is not recognized
            pass
        except sr.RequestError as error:
            # Error occurred during speech recognition
            print("Error: {}".format(error))

    # Define the main function to connect to the WebSocket server and run the program
    async def main(self):
        # Adjust the recognizer sensitivity to ambient noise and record audio from the microphone
        with self.microphone as source:
            self.speech_recognizer.adjust_for_ambient_noise(source)

        # Start the microphone listening
        listener = self.speech_recognizer.listen_in_background(
            self.microphone, callback=self.callback, phrase_time_limit=5
        )

        print("Listening...")
        try:
            while self.running:
                pass
            listener(wait_for_stop=False)
        except KeyboardInterrupt:
            return

    def reset_state(self):
        self.utterances = []

    def collect(self):
        return self.utterances

    def start(self):
        self.running = True
        asyncio.new_event_loop().run_until_complete(self.main())
    
    def stop(self):
        self.running = False
        asyncio.get_event_loop().stop()