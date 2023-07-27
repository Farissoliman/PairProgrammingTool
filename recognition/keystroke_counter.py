from pynput import keyboard
import asyncio


class KeyStrokeCounter():
    
    keystroke_counter = 0
    running = False
    
    def __init__(self, current_position):
        self.current_position = current_position
    
    def set_current_position(self, current_position):
        setattr(self, "current_position", current_position)
        
    def on_press(self, key):
        if self.current_position == "driver":
            self.keystroke_counter += 1

    # Define the main function to connect to the WebSocket server and run the program
    def main(self):
        if self.running:
            with keyboard.Listener(on_press=self.on_press) as listener:
                listener.join()
            
    def reset_state(self):
        self.keystroke_counter = 0

    def collect(self):
        return self.keystroke_counter
    
    def start(self):
        self.running = True
        asyncio.run(self.main())
    
    def stop(self):
        self.running = False