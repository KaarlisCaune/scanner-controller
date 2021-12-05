# Scanner controller

This repo contains frontend (Vue), backend (Node + socket.io + express + serialport) and Arduino code for controlling a flatbed scanner and a rotating plate powered by a stepper motor.

## Architecture
* Frontend (hosted on localhost:3000) contains an interface to set multiple options for scanning and rotating the plate. It sends these options to backend and receives live updates on progress.
* Backend controls the scanner (via [scanline](https://github.com/klep/scanline) cli tool) and stepper motor (via serialport).
* Arduino microcontroller receives commands from backend, executes them, and sends status updates back.

## Arduino stepper controller

Arduino controls a A4988 stepper driver. It sets the driver to SLEEP mode inbetween running. Messages are received over USB.

### Incoming messages
* `cw` set direction clockwise
* `ccw` set direction counter-clockwise
* `start` start the stepper motor and run indefinitely
* `stop` stop stepper motor
* `slowspeed` set motor speed to slow
* `mediumspeed` set motor speed to medium
* `fastspeed` set motor speed to fast
* `1..32767` if numeric value is sent, motor will go the specified number of steps and stop

### Outgoing messages
* `finished` has finished executing the specified amount of steps