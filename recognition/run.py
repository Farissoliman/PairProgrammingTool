import asyncio
import json
import time
import multiprocessing
import threading
import traceback
import sys

import websockets
import face_detection
import speech_detection

interval_start = time.time()

collectors = {"emotions": face_detection.FaceDetection(),
              "utterances" : speech_detection.SpeechDetection()}

uid = input("UID: ")


def collect():
    data = {"action": "provide_data", "start": interval_start}
    for name in collectors:
        data[name] = collectors[name].collect()

    return data


def reset_state():
    for name in collectors:
        collectors[name].reset_state()


async def connect():
    global interval_start, uid
    async with websockets.connect("ws://127.0.0.1:3030") as ws:
        print("Connected to WebSocket and awaiting commands.")
        while True:
            if ws.closed:
                break
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
                    reset_state()
                elif message["action"] == "start":
                    # The session has started; start collecting data
                    
                    # asyncio.create_task(collectors["utterances"].start())
                    # asyncio.create_task(collectors["emotions"].start())
                    
                    # await asyncio.gather(collectors["emotions"].start(), collectors["utterances"].start())
                    
                    # Create a process for each collector and start them
                    # processes = []
                    # for collector_name in collectors:
                    #     process = multiprocessing.Process(target=collectors[collector_name].)
                    #     processes.append(process)
                    #     process.start()

                    # Wait for all processes to finish
                    # for process in processes:
                    #     process.join()
                    
                    for collector_name in collectors:
                        tasks = threading.Thread(target=collectors[collector_name].start)
                        tasks.start()
                    
            except Exception as ex:
                traceback.print_exc(file=sys.stdout)
                print(f"Error parsing incoming WebSocket message {message}: {ex}")

try:
    asyncio.get_event_loop().run_until_complete(connect())
except KeyboardInterrupt:
    pass
