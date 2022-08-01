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

let Readline = SerialPort.parsers.Readline; 
let parser = new Readline();

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
      console.log(port);
      return port.path;
    }
    throw new Error('No Arduino ports found');
  })
};

getArduinoSerialPort()
  .then((path) => {
    port = new SerialPort(path, { baudRate: 9600 });
    port.pipe(parser);
    port.on('open', () => { 
      console.log('Port open');
    });
    // port.on('data', function (data) {
    //   console.log('port on data', data.toString('utf8'));
    // });
    parser.on('data', function (data) {
      console.log('parser on data', data.toString('utf8'));
    })
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
      console.log('done scanning!');
      resolve('done scanning');
    })
  });
}

function updateDirection(direction) {
  console.log('updating direction');
  return new Promise(resolve => {
    port.write(direction == 'left' ? 'ccw\n' : 'cw\n');
    setTimeout(() => {
      resolve();
    }, 400);
  })
}

function sendSteps(steps) {
  return new Promise(resolve => {
    port.write(`${steps}\n`);
    setTimeout(() => {
      resolve();
    }, 400);
  })
}

async function turnPlate(degrees, direction) {
  console.log('turning plate with degrees', degrees, 'direction', direction);
  return new Promise(resolve => {
    const steps = degrees * STEPS_PER_DEGREE;

    updateDirection(direction).then(() => {
      sendSteps(steps.toString()).then(() => { resolve('done') });
      // .then(() => {
      //   port.on('data', function (data) {
      //     console.log('arduino is done');
      //     port.flush((err, results) => {});
      //     resolve('done');
      //   });
      // });
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
    console.log(scanningOptions);
    await executeScan(scanningOptions);
    notifyScanProgress(i);
    await turnPlate(options.scanDegrees, options.direction);
  }
}