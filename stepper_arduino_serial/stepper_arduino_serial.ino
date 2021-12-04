// There might be two modes
// * go for a specified amount of steps: could be a number
// * start spinning and stop only when prompted
// Message therefore can be string or number.
// incoming string messages:
//  "cw" set clockwise
//  "ccw" set counter-clockwise
//  "start" start the motor and dont stop
//  "stop" stop motor
//  "slowspeed" set delaytime to 5000
//  "mediumspeed" set delayTime to 2500
//  "fastspeed" set delayTime to 1500
//  1.. integer telling how many steps should it go
// outgoing string messages:
// "finished": finished going the required amount of steps

#define dirPin 3
#define stepPin 2
#define sleepPin 4
#define stepsPerRevolution 200

String inputString = "";
bool stringComplete = false;

bool ccw = false;
int stepDelayTime = 5000;
long doneSteps = 0;
bool motorMustBeSpinning = false;
bool stepperIsSleeping = true;

void setup() {
  pinMode(stepPin, OUTPUT);
  pinMode(dirPin, OUTPUT);
  pinMode(sleepPin, OUTPUT);
  setStepperToSleep();
  inputString.reserve(200);
  Serial.begin(9600);
}

void loop() {
  if (stringComplete) {
    if (inputString == "cw") {
      ccw = false;
    };
    if (inputString == "ccw") {
      ccw = true;
    };
    if (inputString == "start") {
      startMotor();
    };
    if (inputString == "stop") {
      stopMotor();
    };
    if (inputString == "slowspeed") {
      setSpeed(5000);
    };
    if (inputString == "mediumspeed") {
      setSpeed(2500);
    };
    if (inputString == "fastspeed") {
      setSpeed(1500);
    };
    if (isValidNumber(inputString)) {
      turnMotor(inputString.toInt());
    };
    inputString = "";
    stringComplete = false;
  }

  if (motorMustBeSpinning) {
    if (stepperIsSleeping) {
      setStepperToAwake();
    }
    goOneStep();
  } else {
    if (!stepperIsSleeping) {
      setStepperToSleep();
    }
  }
}

void turnMotor(int steps) {
  clearStepCounter();
  Serial.println("turning motor");
  setStepperToAwake();
  updateDirection();

  for (int i = 0; i < steps; i++) {
    goOneStep();
  }

  notifyFinished();
}

void notifyFinished() {
  Serial.println("finished");
  Serial.println(doneSteps);
  clearStepCounter();
  setStepperToSleep();
}

void setSpeed(int stepperSpeed) {
  Serial.println("setting speed");
  Serial.println(stepperSpeed);
  stepDelayTime = stepperSpeed;
}

void goOneStep() {
  digitalWrite(stepPin, HIGH);
  delayMicroseconds(stepDelayTime);
  digitalWrite(stepPin, LOW);
  delayMicroseconds(stepDelayTime);
  doneSteps++;
}

void clearStepCounter() {
  doneSteps = 0;
}

void updateDirection() {
  if (stepperIsSleeping) {
    setStepperToAwake();
  }
  Serial.println("updating direction");
  if (ccw) {
    digitalWrite(dirPin, LOW);
  } else {
    digitalWrite(dirPin, HIGH);
  }
}

void startMotor() {
  Serial.println("starting motor");
  updateDirection();
  motorMustBeSpinning = true;
}

void stopMotor() {
  Serial.println("stopping motor");
  motorMustBeSpinning = false;
  Serial.println(doneSteps);
  clearStepCounter();
}

void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    if (inChar == '\n') {
      stringComplete = true;
    } else {
      inputString += inChar;
    }
  }
}

void setStepperToSleep() {
  stepperIsSleeping = true;
  digitalWrite(sleepPin, LOW);
  delay(1);
}

void setStepperToAwake() {
  stepperIsSleeping = false;
  digitalWrite(sleepPin, HIGH);
  delay(1);
}

boolean isValidNumber(String str) {
  for (byte i=0;i<str.length();i++) {
    if (isDigit(str.charAt(i))) return true;
  }
  return false;
}
