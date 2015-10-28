/*

Http server
====


*/

var concat = require('concat-stream');
var ecstatic = require('ecstatic');
var fs = require('fs');
var http = require('http');
var paramify = require('paramify');

var config = require('./config');
var db = require('./db');


function isReqAuthed (req) {
  var authSecret = req.headers.authentication;
  return (authSecret === config.authSecret);
}

function sendJson (res, data) {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendNotAuthedResponse (res) {
  res.statusCode = 401;
  res.end('not authorized');
}

function sendNotFoundResponse (res) {
  res.statusCode = 404;
  res.end('not found');
}

/*

Static files
----

Any http requests to the `/static` path are handled as static files in the `ROOT/static` directory.

*/
var ROOT = __dirname + '/../';
var serveStaticFiles = ecstatic({
  root: ROOT + '/static',
  baseDir: '/static'
});

/*

Page template
----

Options:
- `initJs`: js to run before any other scripts are loaded.

*/
var _template;
function renderPage (opts) {
  if (!opts) { opts = {}; }

  if (!_template) {
    _template = fs.readFileSync(ROOT + '/static/template.html', 'utf8');
  }

  var initJs = '';
  if (opts.initJs) {
    initJs = '<script>' + opts.initJs + '</script>';
  }

  return _template.replace('{{ initJs }}', initJs);
}

/*

Index page
----

The index page just bootstraps the app js.

*/
function handleGetIndex (req, res) {
  res.end(renderPage());
}

/*

Edit page
----

The edit page is the same as the index page, but we have some extra config (secret key)

*/
function handleGetEditPage (key, req, res) {
  db.getUserByKey(key, function (err, info) {
    if (err) {
      res.statusCode = 404;
      return res.end(err.message);
    }

    var user = {
      key: key,
      name: info.name
    };
    res.end(renderPage({
      initJs: 'var user=' + JSON.stringify(user) + ';'
    }));
  });
}

/*

Image endpoint
----

Each div can have an image stored for it.

*/
function handleGetImage (username, i, req, res) {
  var key = username + ':' + i;
  var image = db.images[key];

  if (!image) {
    res.statusCode = 404;
    return res.end('not found');
  }

  res.writeHead(200, {
    'Content-Type': image.mimeType
  });
  res.end(image.data);
}

/*

User action: set styles
----

Set styles for a user's divs

*/
function handleSet (key, req, res) {
  req.pipe(concat(function (raw) {
    var data;
    try {
      data = JSON.parse(raw);
    }
    catch (e) {
      res.statusCode = 500;
      return res.end('invalid json');
    }

    if (data.divs && data.divs.length) {
      db.setDivs(key, data.divs);
    }

    res.end('ok');
  }));
}

/*

Admin action: dump
----

Get a snapshot of the current state that we can use to restore later.

*/
function handleGetDump (req, res) {
  if (!isReqAuthed(req)) { return sendNotAuthedResponse(res); }

  db.dump(function (err, data) {
    if (err) {
      res.statusCode = 500;
      return res.end(err.message);
    }

    sendJson(res, data);
  });
}

/*

Admin action: import
----

Restore the db to a previous snapshot.

*/
function handleAdminImport (req, res) {
  if (!isReqAuthed(req)) { return sendNotAuthedResponse(res); }

  req.pipe(concat(function (raw) {
    var data;
    try {
      data = JSON.parse(raw);
    }
    catch (e) {
      res.statusCode = 500;
      return res.end('invalid json');
    }

    db.importDump(data, function (err) {
      if (err) {
        res.statusCode = 500;
        return res.end(err.message);
      }

      res.end('ok');
    });
  }));
}


/*

Admin action: set
----

Set data, and create the user if it doesn't exist

*/
function handleAdminSet (username, req, res) {
  if (!isReqAuthed(req)) { return sendNotAuthedResponse(res); }

  var sendError = function (err) {
    res.statusCode = 500;
    res.end(err.message || err);
  };

  req.pipe(concat(function (raw) {
    var data;
    try {
      data = JSON.parse(raw);
    }
    catch (e) {
      return sendError('invalid json');
    }

    //> when the user is ready we'll set images and divs
    var userReady = function (user) {
      var images = data.images || {};
      var divs = data.divs || {};

      try {
        images.forEach(function (img, i) {
          //> null means "skip". If we want to clear an existing item we set to an empty string.
          if (img === null) { return; }

          var key = user.name + ':' + i;
          db.images[key] = {
            mimeType: img.mimeType,
            data: new Buffer(img.data, 'base64')
          };
        });

        db.setDivs(user.key, divs);
      }
      catch(e) {
        return sendError(e);
      }

      res.end('key:' + user.key);
    };

    //> check if the user exists, and create if needed.
    var existing = db.getUserByUsername(username);
    if (existing) {
      userReady(existing);
    }
    else {
      db.registerUser({ name: username }, function (err, key) {
        if (err) { return sendError(err); }

        userReady({ name: username, key: key });
      });
    }
  }));
}

/*

User registration
----

*/
function handleRegisterUser (req, res) {
  if (!isReqAuthed(req)) { return sendNotAuthedResponse(res); }

  req.pipe(concat(function (raw) {
    var data;
    try {
      data = JSON.parse(raw);
    }
    catch (e) {
      res.statusCode = 500;
      return res.end('invalid json');
    }

    db.registerUser(data, function (err, key) {
      res.end('key: ' + key);
    });
  }));
}

/*

Delete a user
----

*/
function handleDeleteUser (key, req, res) {
  if (!isReqAuthed(req)) { return sendNotAuthedResponse(res); }

  db.deleteUser(key, function (err) {
    if (err) {
      res.statusCode = 500;
      return res.end(err.message);
    }

    res.end('ok');
  });
}

/*

Http routes
----

*/

var routes = {};

routes.GET = function (req, res) {
  var match = paramify(req.url);

  if (req.url === '/') {
    return handleGetIndex(req, res);
  }

  if (match('image/:username/:i/:rev')) {
    return handleGetImage(match.params.username, match.params.i, req, res);
  }

  if (match('edit/:key')) {
    return handleGetEditPage(match.params.key, req, res);
  }

  if (req.url.indexOf('/static/') === 0) {
    return serveStaticFiles(req, res);
  }

  if (match('admin/dump')) {
    return handleGetDump(req, res);
  }

  return sendNotFoundResponse(res);
};

routes.POST = function (req, res) {
  if (req.url.indexOf('/register') === 0) {
    return handleRegisterUser(req, res);
  }

  return sendNotFoundResponse(res);
};

routes.PUT = function (req, res) {
  var match = paramify(req.url);

  if (req.url.indexOf('/admin/import') === 0) {
    return handleAdminImport(req, res);
  }

  if (match('admin/set/:username')) {
    return handleAdminSet(match.params.username, req, res);
  }

  if (match('set/:key')) {
    return handleSet(match.params.key, req, res);
  }

  return sendNotFoundResponse(res);
};

routes.DELETE = function (req, res) {
  var match = paramify(req.url);

  if (match('users/:key')) {
    return handleDeleteUser(match.params.key, req, res);
  }

  return sendNotFoundResponse(res);
};

module.exports = function createHttpServer () {
  //> Create the http server but don't start listening on a port (this is the responsibility of the parent).
  return http.createServer(function (req, res) {
    return routes[req.method](req, res);
  });
};
