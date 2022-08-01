import { STEPS_PER_DEGREE } from './config/constants';
import { spawn } from 'child_process';
import { WebApp } from './classes/web-app';
import { MotorController } from './classes/motor-controller';

let currentScanNumber = 0;
let currentOptions = {};
let scanningInProgress = false;

const webApp = new WebApp();
const motorController = new MotorController();


webApp.getMessagesObservable().subscribe((data) => {
  if (data.message === 'startScan') {
    startScan(data.options);
  }

  if (data.message === 'stopScan') {
    stopScan();
  }
});

function startScan(options) {
  console.log('starting scan with options', options);
  scanningInProgress = true;
  currentOptions = options;
  webApp.notifyScanStart();
  runScans(options).then(() => {
    stopScan();
  });
}

function stopScan() {
  scanningInProgress = false;
  currentScanNumber = 0;
  webApp.notifyScanStop();
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

function turnPlate(degrees, direction) {
  console.log('turning plate with degrees', degrees, 'direction', direction);
  return new Promise(resolve => {
    motorController.updateDirection(direction).then(() => {
      motorController.sendSteps(degrees.toString()).then(() => resolve('done'));
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
    webApp.notifyScanFinish(i);
    await turnPlate(options.scanDegrees, options.direction);
  }
}