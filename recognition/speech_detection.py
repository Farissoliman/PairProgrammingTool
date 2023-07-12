"""Speech detection module. This module is responsible for detecting speech 
and sending the data to the server using a websocket."""
from datetime import datetime
import asyncio
import json
import speech_recognition as sr
import websockets

websockets.connect('ws://127.0.0.1:3030')
print("Connected to WebSocket")

# Create a recognizer object
speech_recognizer = sr.Recognizer()

# Create a microphone object
microphone = sr.Microphone()

def get_current_time():
    """Gets the current universal time

    Returns:
        _type_: string - the current universal time in the format HH:MM:SS
    """
    return datetime.now().strftime("%H:%M:%S")

async def send_data():

    # Start the microphone listening
    stop_listening = speech_recognizer.listen_in_background(
        microphone,
        callback=callback,
        phrase_time_limit=5)
    
    print("Listening...")
    # Keep the program running
    while True:
        try:
            pass
        except websockets.exceptions.ConnectionClosed:
            stop_listening(wait_for_stop=False)

# Define the callback function to handle speech recognition results
def callback(recognizer, audio):
    """Callback function to get and handle speech recognition results

    Args:
        recognizer (Recognizer): Recognizer object from speech recognition class
                                 for recognizing speech
        audio (Microphone): microphone object from speech recognition class 
                            for getting audio inputs
    """
    try:
        start_time = get_current_time()
        # Convert audio to text
        text = recognizer.recognize_vosk(audio)

        # Update the most recent utterance
        most_recent_utterance = text

        if most_recent_utterance == "the" or most_recent_utterance == "":
            return

        # Prepare the data to send over the WebSocket
        data = {
            "start_time": start_time,
            "utterance": most_recent_utterance,
            "end_time": get_current_time()
        }
        json_data = json.dumps(data)

        print("Data is sending...")
        # Send the data over the WebSocket
        asyncio.get_event_loop().run_until_complete(websockets.send(json_data))

    except sr.UnknownValueError:
        # Speech is not recognized
        pass
    except sr.RequestError as error:
        # Error occurred during speech recognition
        print("Error: {}".format(error))

# Adjust the recognizer sensitivity to ambient noise and record audio from the microphone
with microphone as source:
    speech_recognizer.adjust_for_ambient_noise(source)

def start():
    asyncio.get_event_loop().run_until_complete(send_data())

start()