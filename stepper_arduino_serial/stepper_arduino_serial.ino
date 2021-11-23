/*Example sketch to control a stepper motor with A4988/DRV8825 stepper motor driver and Arduino without a library. More info: https://www.makerguides.com */

// Define stepper motor connections and steps per revolution:
#define dirPin 3
#define stepPin 2
#define stepsPerRevolution 200
String incomingString;

void setup() {
  // Declare pins as output:
  pinMode(stepPin, OUTPUT);
  pinMode(dirPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  while(Serial.available()) {

    incomingString = Serial.readString();
    
    switch (incomingString) {
      case "200/1500/cw":
        turnMotor(200, 1500, true);
      break;
      case "200/1500/ccw":
        turnMotor(200, 1500, false);
      break;
      case "600/1500/cw":
        turnMotor(600, 1500, true);
      break;
      case "600/1500/ccw":
        turnMotor(600, 1500, false);
      break;
      default:
      break;
    }
    
   }
}

void turnMotor(int steps, int delayTime, bool directionClockWise) {
  if (directionClockWise) {
    digitalWrite(dirPin, HIGH);
  } else {
    digitalWrite(dirPin, LOW);
  }

  for (int i = 0; i < steps; i++) {
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(delayTime);
    digitalWrite(stepPin, LOW);
    delayMicroseconds(delayTime);
  }

  notifyFinished();

  
}

void notifyFinished() {
  Serial.write(1);
}
