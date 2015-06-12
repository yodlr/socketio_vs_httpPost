var server = process.env.SERVER || 'http://localhost:3000';

var async = require('async');
var fs = require('fs');
var request = require('request');
var io = require('socket.io-client');
var ss = require('socket.io-stream');

var iter = process.env.ITER || 10;

var filename = process.env.FILENAME || 'creepy_smile.gif';
var stats = fs.statSync(filename);
var fileBytes = stats.size;

console.log('Starting upload test to '+server);
console.log('File size is '+fileBytes/1000 + 'KB');

var socketSummary, postSummary;

async.series([
  socketioTest,
  postTest
], function() {
  console.log('\n\nSummary:');
  console.log(socketSummary);
  console.log(postSummary);
});

function postTest(callback) {
  var startTime = new Date();
  console.log('Starting HTTP POST upload test');
  async.timesSeries(iter, function(n, callback) {
    var start = new Date();
    var formData = {
      file: fs.createReadStream(filename)
    }
    request.post({url: server, formData: formData}, function(err, httpResponse, body) {
      var end = new Date();
      var time = end - start;
      console.log('Upload [' + n + '] completed in '+time+'ms, '+(fileBytes/1000)/(time/1000)+' KB/second');
      callback();
    });
  },
  function() {
    var endTime = new Date();
    var totalTime = endTime - startTime;
    console.log(iter + ' uploads completed in ' + totalTime + 'ms');
    postSummary = 'HTTP Post average upload speed [n='+iter+']: '+ Math.round((iter*fileBytes/1000) / (totalTime / 1000)) + 'KB/second';
    console.log(postSummary);
    callback();
  });
}

function socketioTest(callback) {
  var startTime = new Date();
  console.log('Starting socket.io streaming upload test');
  async.timesSeries(iter, function(n, callback) {
    var start = new Date();
    var socket = io.connect(server, {
      transports: ['websocket'],
      multiplex: false
    });

    var stream = ss.createStream({hightWaterMark: 16 * 1024});
    ss(socket).emit('upload', stream, {name: filename});
    fs.createReadStream(filename).pipe(stream);
    socket.on('disconnect', function() {
      var end = new Date();
      var time = end - start;
      console.log('Upload [' + n + '] completed in '+time+'ms, '+(fileBytes/1000)/(time/1000)+' KB/second');
      callback();
    })
  },
  function() {
    var endTime = new Date();
    var totalTime = endTime - startTime;
    console.log(iter + ' uploads completed in ' + totalTime + 'ms');
    socketSummary = 'socket.io average upload speed [n='+iter+']: '+ Math.round((iter*fileBytes/1000) / (totalTime / 1000)) + 'KB/second';
    console.log(socketSummary);
    callback();
  });
}
