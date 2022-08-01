import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Observable, Subject } from 'rxjs';

export enum Message {
    START_SCAN = 'startScan',
    STOP_SCAN = 'stopScan',
    SCAN_STARTED = 'scanStarted',
    SCAN_STOPPED = 'scanStopped',
    FINISHED_SCAN = 'finishedScan',
    SCAN_STATUS = '',
}

// WebApp starts a server and exposes an Observable that lets everyone know about what the frontend is requesting

export class WebApp {
    express = express();
    server: http.Server;
    io: Server;
    clientMessagesSubject$ = new Subject<any>();
    
    constructor() {
      this.express.use(express.static('frontend'));
      this.express.get('/', (req, res) => {
        res.sendFile(__dirname + '/frontend/index.html');
      });
      this.server = http.createServer(this.express);
      this.io = new Server(this.server);
      this.server.listen(3000, () => {
        console.log('listening on *:3000');
      });
  
      this.io.on('connection', (socket) => {
  
        this.notifyOfStatus({
          currentScanNumber: 0,
          scanningInProgress: false,
          elapsedTime: 0,
        });
        
        socket.on(Message.START_SCAN, (message) => {
          this.clientMessagesSubject$.next({ message: Message.START_SCAN, options: message });
        });
      
        socket.on(Message.STOP_SCAN, () => {
          this.clientMessagesSubject$.next({ message: Message.STOP_SCAN });
        });
      
      });
    };
  
    getMessagesObservable(): Observable<any> {
      return this.clientMessagesSubject$.pipe();
    }
  
    notifyScanStart() {
      this.io.emit(Message.SCAN_STARTED, { success: true });
    }
  
    notifyScanStop() {
      this.io.emit(Message.SCAN_STOPPED, {});
    }
  
    notifyScanFinish(number: number) {
      this.io.emit(Message.FINISHED_SCAN, { number: number, elapsedTime: 0 });
    }
  
    notifyOfStatus(statusObject) {
      this.io.emit(Message.SCAN_STATUS, statusObject);
    }
  }
