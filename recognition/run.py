import asyncio
import json
import time
import threading
import traceback
import sys

import websockets
import face_detection
import speech_detection
import keystroke_counter

interval_start = time.time() * 1000

collectors = {
    "emotions": face_detection.FaceDetection(),
    "utterances": speech_detection.SpeechDetection(),
}

uid = sys.argv[1]
# uid = input("Enter your unique ID: ")

current_position = None

def collect():
    """Data collection for the current interval.

    Returns:
        dict: The collected data for the current interval.
    """
    data = {"start": interval_start, "status": current_position}
    for name in collectors:
        data[name] = collectors[name].collect()

    return {"action": "provide_data", "data": data}


def reset_state():
    """Reset the state of all collectors to prepare for a new interval."""
    for name in collectors:
        collectors[name].reset_state()


def start_functions():
    for collector_name in collectors:
        tasks = threading.Thread(target=collectors[collector_name].start)
        tasks.start()


async def connect():
    """Connect to the WebSocket server and await commands."""
    global interval_start, uid, current_position
    async with websockets.connect("ws://lin-res128.csc.ncsu.edu:3030") as ws:
        print("Connected to WebSocket and awaiting commands.")
        while not ws.closed:
            message_str = await ws.recv()
            try:
                message = json.loads(message_str)
                print(f"Received: {message}")
                if message["action"] == "hello":
                    # Reply to the server with the user's unique ID
                    await ws.send(json.dumps({"action": "hello", "uid": uid}))
                    print("Replied to hello")
                if message["action"] == "request_data":
                    # The navigator requested to switch with the driver
                    # Reply with statistics for this interval
                    print("Providing interval data")
                    response = collect()
                    await ws.send(json.dumps(response))
                    print(f"Data sent: {response}")
                elif message["action"] == "switch":
                    # Partners switched between driver & navigator
                    print("Switching positions")
                    interval_start = message.start
                    current_position = message["status"]
                    reset_state()

                elif message["action"] == "start":
                    current_position = message["status"]
                    collectors["keystrokes"] = keystroke_counter.KeyStrokeCounter(current_position)
                    start_functions()

                if message["action"] == "end":
                    # send appropriate data
                    print("Providing interval data")
                    response = collect()
                    await ws.send(json.dumps(response))

                    # end functions and close websocket
                    for collector_name in collectors:
                        collectors[collector_name].stop()

                    ws.close()
                    print("Websocket closed")

            except Exception as ex:
                traceback.print_exc(file=sys.stdout)
                print(f"Error parsing incoming WebSocket message {message}: {ex}")

try:
    asyncio.run(connect())
except KeyboardInterrupt:
    pass
