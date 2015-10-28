/*

  Database
  ====

  In this initial prototype the database is stored in memory, with optional redis.

*/

var cuid = require('cuid');
var Watchob = require('watchob');
var parseDataUri = require('parse-data-uri');
var styleAttr = require('style-attr');

var calcDivWeight = require('./calc-div-weight');
var config = require('./config');

var db = {
  // users, indexed by secret key
  users: new Watchob({}, { maxLength: config.maxHistoryLength }),

  // divs, indexed by username:i
  divs: new Watchob({}, { maxLength: config.maxHistoryLength }),

  images: {},

  getUserByKey: function (key, cb) {
    var info = this.users.get(key);
    if (!info) { return cb(new Error('user not found')); }

    //> user data includes the key
    info.key = key;
    cb(null, info);
  },

  getUserByUsername: function (username) {
    var all = this.users.getState();
    var found = null;
    Object.keys(all).forEach(function (key) {
      if (found) { return; }

      var user = all[key];
      if (user.name === username) {
        found = user;

        //> user data includes the key
        user.key = key;
      }
    });

    return found;
  },

  dump: function (cb) {
    cb(null, {
      users: {
        state: this.users.getState(),
        head: this.users.getHeadRev()
      },
      divs: {
        state: this.divs.getState(),
        head: this.divs.getHeadRev()
      }
    });
  },

  importDump: function (data, cb) {
    this.users = new Watchob(data.users || {}, { maxLength: config.maxHistoryLength });
    this.divs = new Watchob(data.divs || {}, { maxLength: config.maxHistoryLength });

    if (cb) { cb(); }
  },

  setDiv: function (userKey, i, style, text, cb) {
    // set noop so we don't have to check later
    if (!cb) { cb = function () {}; }

    var user = this.users.get(userKey);
    if (!user) {
      return console.error('Unknown user: %s', userKey);
    }

    var username = user.name;
    if (!username) { return; }

    //> divs are stored by their owner's username and array index
    var divKey = username + ':' + i;
    this.divs.set(divKey, {
      style: style,
      text: text
    });

    cb();
  },

  setDivs: function (userKey, changes) {
    var user = this.users.get(userKey);
    if (!user) {
      throw new Error('Unknown user (1): ' + userKey);
    }

    var username = user.name;
    var sizes = [];
    var i;
    var divKey;
    var div;
    for (i=0; i<config.divsPerUser; i+=1) {
      divKey = username + ':' + i;

      // tally the sizes of existing divs, substituting changes where available
      div = changes[i] || this.divs.get(divKey);
      sizes.push(calcDivWeight(div));
    }

    //> ensure we haven't gone above the allocated storage for divs
    var totalSize = sizes.reduce(function (val, acc) { return val + acc; }, 0);

    console.log('DIV storage for %s [%d / %d]', username, totalSize, config.divBytesPerUser);
    if (totalSize > config.divBytesPerUser) {
      throw new Error('Max div storage exceeded');
    }

    var headRev = this.divs.getHeadRev();

    var self = this;
    changes.forEach(function (change, i) {
      //> null means "skip". If we want to clear an existing item we set to an empty string.
      if (!change) { return; }

      var divKey = username + ':' + i;
      self.divs.set(divKey, {
        style: change.style,
        text: change.text
      });
    });
  },

  setImage: function (userKey, imageIndex, raw) {
    var user = this.users.get(userKey);
    if (!user) {
      return console.error('Unknown user: %s', userKey);
    }

    var parsedImage = parseDataUri(raw);

    var username = user.name;
    var sizes = [];
    var i;
    var divKey;
    var image;
    for (i=0; i<config.divsPerUser; i+=1) {
      divKey = username + ':' + i;

      // tally the sizes of existing divs, substituting changes where available
      image = (i === imageIndex) ? parsedImage : this.images[divKey];
      if (!image) { continue; }

      sizes.push(image.data.length);
    }

    //> ensure we haven't gone above the allocated storage for images
    var totalSize = sizes.reduce(function (val, acc) { return val + acc; }, 0);

    console.log('IMG storage for %s [%d / %d]', username, totalSize, config.imageBytesPerUser);
    if (totalSize > config.imageBytesPerUser) {
      throw new Error('Max image storage exceeded');
    }

    //> divs are stored by their owner's username and array index
    var key = username + ':' + imageIndex;
    this.images[key] = parsedImage;

    //> add the background image
    var div = this.divs.get(key);
    this.divs.set(key, {
      style: div.style + ';background:url(/image/' + username + '/' + imageIndex + '/' + this.divs.getHeadRev() + ')',
      text: div.text
    });
  },

  registerUser: function (data, cb) {
    // TODO: assert that email and name are unique
    // ...

    //> we're using cuid to generate a key, but later something else will be more suitable
    var key = data.key || cuid();

    //> key must be unique
    if (this.users.get(key)) {
      return cb(new Error('existing user with key'));
    }

    this.users.set(key, {
      name: data.name,
      email: data.email
    });

    // TODO: initialize divs for the new user
    var i;
    for (i=0; i<config.divsPerUser; i+=1) {
      this.setDiv(key, i, '', '');
    }

    cb(null, key);
  },

  deleteUser: function (key, cb) {
    var user = this.users.get(key);
    if (!user) {
      return cb(new Error('user not found'));
    }

    this.users.del(key);
    var i;
    for (i=0; i<config.divsPerUser; i+=1) {
      this.divs.del(key + ':' + i);
    }

    cb();
  }
};

module.exports = db;
