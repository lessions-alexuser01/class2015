/*

  Database
  ====

  Redis backend
  ----

  - load state from redis on startup.
  - periodically save state if anything has changed.

*/
var redis = require('redis');

function connect (config, callback) {
  var client = redis.createClient(config.port, config.host, {'return_buffers': true});

  client.on('error', function (err) {
    console.error('Redis error:', err);
  });

  if (config.password) {
    client.auth(config.password, function (err) {
      return callback(err, client);
    });
  }
  else {
    callback(null, client);
  }
}

module.exports = function setup (config, db, cb) {
  var lastChange = 0;
  var redisClient;
  connect(config, function (err, client) {
    if (err) { throw err; }

    var data;
    client.hgetall('images', function (err, res) {
      if (res) {
        try {
          Object.keys(res).forEach(function (key) {
            //db.images[key] = JSON.parse(res[key]);
            db.images[key] = {
              mimeType: 'image/png',
              data: res[key]
            };
          });
        }
        catch (e) {
          console.error('Invalid json in redis images', res, e);
        }
      }

      client.get('state', function (err, res) {
        if (res) {
          try {
            data = JSON.parse(res);
            db.importDump({
              users: data.users.state,
              divs: data.divs.state
            });
          }
          catch (e) {
            console.error('Invalid json in redis dump', res, e);
          }
        }

        setInterval(function () {
          db.dump(function (err, data) {
            if (err) {
              return console.error('Failed dumping data', err);
            }

            //> only save state if there has been a change
            if (lastChange === data.divs.head) { return; }
            lastChange = data.divs.head;

            client.set('state', JSON.stringify(data));

            var images = db.images;
            Object.keys(images).forEach(function (key) {
              var image = images[key];
              client.hset('images', key, image.data);
            });
          });
        }, 5000);
      });

      cb(null, client);
    });
  });
};
