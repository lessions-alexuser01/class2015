/*

Socket client
====

*/

var muxClient = require('ws-mux');

module.exports = function setupSocketClient (cb) {

  var delay = 5;
  var host = location.origin.replace(/^http/, 'ws');
  var ws;

  function connect () {
    ws = new WebSocket(host);

    ws.addEventListener('error', reconnect);
    ws.addEventListener('close', reconnect);

    ws.addEventListener('open', function () {
      cb(null, muxClient(ws), ws);
    });
  }

  function reconnect () {
    ws.removeEventListener('error', reconnect);
    ws.removeEventListener('close', reconnect);

    console.log('Reconnecting in %d seconds...', delay);
    setTimeout(connect, delay*1000);
  }

  connect();
};
