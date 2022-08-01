import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import SerialPort from 'serialport';
import { BAUD_RATE, STEPS_PER_DEGREE } from '../config/constants';
import { CONSOLE_COLORS } from '../utils/console-colors';

export class MotorController {
    port: SerialPort;
    parser = new SerialPort.parsers.Readline({ delimiter: '\n'});
    controllerMessagesSubject$ = new Subject<void>();

    constructor() {;
        this.initializePort();
    }

    async initializePort() {
        this.port = new SerialPort(await this.getArduinoSerialPort(), { baudRate: BAUD_RATE });
        this.port.pipe(this.parser);
        this.port.on('open', () => { 
            console.log('Motor controller port is open');
        });
        this.parser.on('data', (data) => {
            console.log('Data from motor controller', CONSOLE_COLORS.yellow, `${data.toString()}`, CONSOLE_COLORS.reset);
            if (data.toString().includes('finished')) {
                this.controllerMessagesSubject$.next();
            }
        });
    }

    getArduinoSerialPort(): Promise<string> {
        return SerialPort.list().then((ports: SerialPort.PortInfo[]) => {
            const port = ports.find(port => port.manufacturer && port.manufacturer.includes('ino'));
            if (port) {
                console.log(CONSOLE_COLORS.green, 'Found Arduino at ', port.path, CONSOLE_COLORS.reset);
                return port.path;
            }
            throw new Error('No Arduino ports found');
        })
    };

    updateDirection(direction): Promise<void> {
        console.log('updating direction', direction);
        return new Promise<void>(resolve => {
            this.port.write(direction == 'left' ? 'ccw\n' : 'cw\n');
            setTimeout(() => {
              resolve();
            }, 400);
        })
    }

    sendSteps(degrees): Promise<void> {
        const steps = degrees * STEPS_PER_DEGREE;
        return new Promise<void>(resolve => {
          this.port.write(`${steps}\n`);
          this.controllerMessagesSubject$.pipe(take(1)).subscribe(() => resolve());
        });
    };
}
