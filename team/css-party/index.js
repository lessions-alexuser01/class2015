/*

css-party
====

Startup
----

A few things need to be booted up before we begin:

*/

var config = require('./server/config');

if (config.useRepl) {
  console.log('- starting repl');
  var repl = require('repl');
  var r = repl.start('> ');
}

//> - setup the database.
var db = require('./server/db');

//> - setup optional redis support for db persistence
if (config.redis) {
  console.log('- starting redis');
  require('./server/db-redis')(config.redis, db, function (err, client) {
    if (config.useRepl) {
      r.context.redisClient = client;
    }
  });
}

//> - create the http server.
console.log('- starting http');
var httpServer = require('./server/http')();
httpServer.listen(config.port);

//> - create the socket server and install it on the http server.
console.log('- starting websocket server');
var socketServer = require('./server/socket')(httpServer);

if (config.useRepl) {
  r.context.db = db;
  r.context.socket = socketServer;

  r.on('exit', function () {
    console.log('- repl exiting');
    process.exit();
  });
}

console.log('Ready on :%d', config.port);
