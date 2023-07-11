import asyncio
import json
import time

import websockets
import face_detection

interval_start = time.time()

collectors = {"emotions": face_detection}

uid = input("UID: ")


def collect():
    data = {"start": interval_start}
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
                    for name in collectors:
                        print(f"Starting {name} collector")
                        collectors[name].start()
            except Exception as ex:
                print(f"Error parsing incoming WebSocket message {message}: {ex}")


try:
    asyncio.get_event_loop().run_until_complete(connect())
except KeyboardInterrupt:
    pass
