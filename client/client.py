#!/usr/bin/env python

import json
from math import floor
import time
from typing import Callable, LiteralString
from websockets.sync.client import connect

interval_start = floor(time.now() * 1000)

def collect() -> dict[LiteralString, any]:
    """Collects the necessary data to be sent to the server."""
    return {
        "start": interval_start,
        "status": "driver", # "driver" or "navigator"
        "lines_written": 7, # lines of code written for the session
        "utterances": [] # list of Unix timestamps (including milliseconds) for each utterance
    } # We should also collect facial expression data, I'm just not sure how it should be formatted.

def start_interval():
    """Starts a new interval. Called immediately after the previous interval's statistics are sent."""
    interval_start = floor(time.now() * 1000)
    

def subscribe(collect: Callable[[], dict[LiteralString, any]]):
    """Connects to the WebSocket server and listens for a request for data."""
    with connect("ws://127.0.0.1:3000") as websocket:
        while True:
            message = websocket.recv()
            try:
                obj = json.loads(message)
                print(f"Received: {message}")
                if obj.action == "switch":
                    # Partners switched between driver & navigator
                    # Reply with statistics for this interval
                    print("Switching positions")
                    response = collect()
                    websocket.send(str(response))
            except:
                print(f"Error parsing incoming WebSocket message {message}")

subscribe(collect)