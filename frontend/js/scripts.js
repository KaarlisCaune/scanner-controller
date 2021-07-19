var socket = io();

var app = new Vue({
    el: '#app',
    data: {
      scanningInProgress: false,
      fileName: 'scan',
      dirName: 'scantest',
      scanResolutions: [
          { resolution: 150, time: 2 },
          { resolution: 200, time: 2 },
          { resolution: 300, time: 3 },
          { resolution: 400, time: 4 },
      ],
      scanResolution: 200,
      fileType: 'jpeg',
      scanDegrees: '1.5',
      numberOfScans: 5,
      direction: 'left',
      currentScanInProgress: 1,
      timeElapsed: 0,
    },
    methods: {
        startScan: function() {
            socket.emit('startScan', { 
                scanResolution: this.scanResolution,
                numberOfScans: this.numberOfScans,
                fileName: this.fileName,
                dirName: this.dirName,
                fileType: this.fileType,
                scanDegrees: this.scanDegrees,
                numberOfScans: this.numberOfScans,
                direction: this.direction
            });
        },
        stopScan: function() {
            socket.emit('stopScan', true);
        },
    },
    computed: {
        estimatedTime: function() {
            const predefinedTime = this.scanResolutions.find(obj => obj.resolution === this.scanResolution).time;
            return this.numberOfScans * predefinedTime;
        },
        totalDegreesScanned: function() {
            return this.numberOfScans * parseFloat(this.scanDegrees);
        },
        scanProgress: function() {
            return (this.currentScanInProgress * 100) / this.numberOfScans;
        },

    }
  })

socket.on('scanStarted', function(message) {
    app.scanningInProgress = true;
});

socket.on('scanStopped', function(message) {
    app.scanningInProgress = false;
    app.timeElapsed = 0;
});

socket.on('finishedScan', function(message) {
    app.currentScanInProgress = message.number + 1;
    app.timeElapsed = message.elapsedTime;
});

socket.on('scanStatus', function(status) {
    app.currentScanInProgress = status.currentScanNumber;
    app.scanningInProgress = status.scanningInProgress;
    app.timeElapsed = status.elapsedTime;
});


/// utilities

Vue.filter('formatSeconds', function(seconds) {
    if (seconds) {
        return new Date(seconds * 1000).toISOString().substr(11, 8);
    }
})