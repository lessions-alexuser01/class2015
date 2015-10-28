/*

Socket server
====

*/

var bind = require('bind-fn');
var muxClient = require('ws-mux');
var Minipipe = require('minipipe');

var db = require('./db');
var DivSocket = require('./div-socket');

//> list to track connected clients
var clients = {};
var lastClient = 0;
var commands = {};

//> Save and broadcast a change
commands.saveChange = function (client, data) {
  db.setDiv(data.key, data.i, data.style, data.text, function (err) {
    if (err) {
      client.send(JSON.stringify({
        type: 'saveError',
        msg: err.message
      }));
    }
  });
};

function decode (raw) {
  try {
    return JSON.parse(raw);
  }
  catch (e) {
    console.error('invalid json');
    return null;
  }
}

function encode (data) {
  return JSON.stringify(data);
}

module.exports = function createSocketServer (httpServer) {
  var WebSocketServer = require('ws').Server;
  var wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', function (c) {
    var client = muxClient(c);

    //> new connections are assigned a unique client ID
    var clientId = lastClient;
    lastClient += 1;
    clients[clientId] = client;

    //> handle messages about divs
    client.namespace('divs', function (subClient) {

      function sendIfOpen (data) {
        // connection may have been closed
        try {
          subClient.send(data);
        } catch (e) {
          console.error('[divs] SEND FAILED, client %d', clientId, e);
        }
      }

      // pipe socket messages into the object, and back out to the socket
      var objSocket = new DivSocket(db);
      objSocket.minipipe
        .through(encode)
        //.peek(bind(console, 'log', '[divs] server -> client: '))
        .to(sendIfOpen);

      var pipe = new Minipipe();
      pipe
        /*.peek(function (raw) {
          console.log('[divs] client -> server: ', raw.substr(0, 50) + '...');
        })*/
        .through(decode)
        .to(objSocket.minipipe);
      subClient.on('message', bind(pipe, 'receive'));

      objSocket.setup();
    });

    //> handle messages about user session
    client.namespace('session', function (subClient) {
      //> pipe messages coming in from a client
      var inpipe = new Minipipe();

      //> pipe messages going out to a client
      var outpipe = new Minipipe();

      function sendIfOpen (data) {
        // connection may have been closed
        try {
          subClient.send(data);
        } catch (e) {
          console.error('[session] SEND FAILED, client %d', clientId, e);
        }
      }

      function handleCmd (data) {
        function sendAuthFailure () {
          outpipe.emit({
            type: 'authFail'
          });
        }

        switch (data.cmd) {
        case 'checkAuth':
          if (!data.userKey) { return sendAuthFailure(); }

          db.getUserByKey(data.userKey, function (err, user) {
            if (!user) { return sendAuthFailure(); }

            user.key = data.userKey;
            outpipe.emit({
              type: 'authSuccess',
              user: user
            });
          });
          break;

        default:
          console.error('Unknown cmd', data);
        }
      }

      inpipe
        .peek(bind(console, 'log', '[session] client -> server: '))
        .through(decode)
        .to(handleCmd);
      subClient.on('message', bind(inpipe, 'receive'));

      outpipe
        .through(encode)
        .peek(bind(console, 'log', '[session] server -> client: '))
        .to(sendIfOpen);
    });

    //> send an initial message to inform the client has connected
    client.namespace('_', function (subClient) {
      subClient.send('clientId:' + clientId);
    });

    c.on('close', function () {
      console.log('Closed client: %d', clientId);

      //> when the connection is closed we stop tracking the client.
      delete clients[clientId];
    });

    c.on('error', function () {
      console.error('SOCKET ERR', arguments);
    });
  });

  return {
    wss: wss,
    clients: clients
  };
};
