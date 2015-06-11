var http = require('http');
var socketio = require('socket.io');
var iostream = require('socket.io-stream');
var fs = require('fs');
var path = require('path');
var Busboy = require('busboy');

var app = http.createServer(function (req, res) {
  if (req.method === 'POST') {
    var timeStart = new Date();
    var busboy = new Busboy({ headers: req.headers });
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      //console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
      var filename = 'post_test_' + counter + '_' + filename;
      file.on('end', function() {
        var timeEnd = new Date();
        var duration = timeEnd - timeStart;
        console.log('HTTP streaming upload complete in ' + duration + 'ms');
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('okay');
      });
      file.on('data', function() {});
      counter++;
    });
    req.pipe(busboy);
  }
});

var io = socketio(app);

var counter = 0;
io.on('connection', function(socket) {
  iostream(socket).on('upload', function(stream, data) {
    var timeStart = new Date();
    var filename = 'socket_test_' + counter + '_' + path.basename(data.name);
    stream.on('end', function() {
      var timeEnd = new Date();
      var duration = timeEnd - timeStart;
      console.log('socket.io streaming upload complete in ' + duration + 'ms');
      socket.disconnect();
    });
    stream.on('data', function() {})
    counter++;
  });
});

app.listen(process.env.PORT || 3000);
