const STEPS_PER_DEGREE = 290;

const present = require('present');
const { spawn } = require("child_process");
const express = require('express');
const SerialPort = require('serialport')
const http = require('http');

const app = express();
app.use(express.static('frontend'));
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

let port;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/frontend/index.html');
});

var timeNow = 0;

let elapsedTime = 0; // seconds

let currentScanNumber = 0;
let currentOptions = {};
let scanningInProgress = false;

async function getArduinoSerialPort() {
  return await SerialPort.list().then((ports, err) => {
    if (err) {
      throw new Error('Could not list ports');
    }
    const port = ports.find(port => port.manufacturer && port.manufacturer.includes('ino'));
    if (port) {
      return port.path;
    }
    throw new Error('No Arduino ports found');
  })
};

getArduinoSerialPort()
  .then((path) => {
    port = new SerialPort(path);
  })
  .catch((err) => {
    console.log('Failed to set port:', err);
  });

io.on('connection', (socket) => {

  // Notify client of the current status
  notifyOfStatus();
  
  socket.on('startScan', (message) => {
    startScan(message);
  });

  socket.on('stopScan', () => {
    stopScan();
  });

});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

function startScan(options) {
  console.log('starting scan with options', options);
  timeNow = present();
  console.log(timeNow);
  scanningInProgress = true;
  currentOptions = options;
  io.emit('scanStarted', { success: true });
  runScans(options).then(() => {
    stopScan();
  });
}

function stopScan() {
  scanningInProgress = false;
  currentScanNumber = 0;
  elapsedTime = 0;
  io.emit('scanStopped', {});
}

function notifyScanProgress(number) {
  console.log(elapsedTime);
  io.emit('finishedScan', { number, elapsedTime });
}

function notifyOfStatus() {
  let statusObject = {
    currentScanNumber,
    scanningInProgress,
    elapsedTime
  };
  io.emit('scanStatus', statusObject);
}

function executeScan(options) {
  return new Promise(resolve => {
    const scanJob = spawn("/Users/karliscaune/scanline_build/scanline", ["-flatbed", ...options]);
    scanJob.on('close', () => {
      resolve('done scanning');
    })
  });
}

function turnPlate(degrees, direction) {
  return new Promise(resolve => {
    const steps = degrees * STEPS_PER_DEGREE;

    // Set direction

    port.write(direction == 'left' ? 'ccw' : 'cw');

    port.write(steps, () => {
      port.on('data', function (data) {
        console.log(data);
        resolve('done');
      });
    });
  });
}

async function runScans(options) {
  for (let i = 1; i < options.numberOfScans; i++) {
    const scanningOptions = [
      `-resolution ${options.scanResolution}`,
      `-${options.fileType}`,
      `-name ${options.fileName}_${String(i).padStart(4, '0')}`, 
      `${options.dirName}`,
    ];
    await executeScan(scanningOptions);
    notifyScanProgress(i);
    await turnPlate(options.scanDegrees, options.direction);
  }
}