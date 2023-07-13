import asyncio
import time
import speech_recognition as sr

# Create a recognizer object
speech_recognizer = sr.Recognizer()

# Create a microphone object
microphone = sr.Microphone()

utterances = []

# Define a function to get the current time
def get_current_time():
    return time.time()

# Define the callback function to handle speech recognition results
def callback(recognizer, audio):
    try:
        start_time = get_current_time()
        
        # Convert audio to text
        text = recognizer.recognize_google(audio)

        # Update the most recent utterance
        most_recent_utterance = text

        if most_recent_utterance == "the" or most_recent_utterance == "":
            return

        data = {
            "start_time": start_time,
            "utterance": most_recent_utterance,
            "end_time": get_current_time()
        }
        
        utterances.append(data)
        print(utterances)

    except sr.UnknownValueError:
        # Speech is not recognized
        pass
    except sr.RequestError as error:
        # Error occurred during speech recognition
        print("Error: {}".format(error))

# Define the main function to connect to the WebSocket server and run the program
async def main():
    # Adjust the recognizer sensitivity to ambient noise and record audio from the microphone
    with microphone as source:
        speech_recognizer.adjust_for_ambient_noise(source)

    # Start the microphone listening
    stop_listening = speech_recognizer.listen_in_background(microphone, callback=callback, phrase_time_limit=5)

    print("Listening...")
    try:
        while True:
            pass
    except KeyboardInterrupt:
        stop_listening(wait_for_stop=False)
        
def reset_state():
    global utterances
    utterances = []


async def collect():
    return utterances


def start():
    asyncio.get_event_loop().run_until_complete(main())

start()