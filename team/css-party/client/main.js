var config = require('../server/config');
var dom = require('./dom');
var doWatchLoop = require('./watch-loop');
var drag = require('./drag');
var userStore = require('./user');
var setupUi = require('./ui');

var user = window.user || {};

//> when the page is loaded with a user key in the URL, store it and redirect
if (user.key) {
  userStore.setKey(user.key);
  location.replace('/');
  return;
}

function elemsByUsername (username) {
  var elems = document.querySelectorAll('[data-owner=' + username + ']');
  return Array.prototype.slice.call(elems);
}

// ----

var applyPatch = require('watchob/apply-patch');

var divs = window.divs = {};

var dom = require('./dom');
function redraw (divs, rev) {
  Object.keys(divs).forEach(function (id) {
    dom.set(id, divs[id]);
  });
}

function redrawPatch (type, key, val) {
  // TODO:
  //> changes originating from this user are not applied, to avoid disrupting ongoing edits
  //if (user.name && data.username === user.name) { return; }

  switch (type) {
  case 'set':
    dom.set(key, val);
    break;

  case 'del':
    dom.remove(key);
    break;
  }
}

function setupDivSocket (subWs) {
  subWs.addEventListener('message', function (event) {
    var data;
    try {
      data = JSON.parse(event.data);
    }
    catch (e) {
      console.error('invalid json', e);
      return;
    }

    switch (data.type) {
    case 'refresh':
      divs.state = data.state;
      divs.rev = data.rev;

      redraw(divs.state, divs.rev);
      break;

    case 'patches':
      (data.items || []).forEach(function (patch) {
        applyPatch.apply(divs.state, patch.op);
        redrawPatch.apply(null, patch.op);
        divs.rev = patch.head + 1;
      });

      break;

    case 'saveFail':
      alert("Sorry, your last change couldn't be saved: " + data.error);
      break;

    default:
      console.error('Unknown message:', data);
    }

    // ask for the next patch
    subWs.send(JSON.stringify({
      cmd: 'patchesSince',
      rev: divs.rev
    }));
  });
}

function setupSessionController (ws) {
  var subWs = ws.namespace('session');

  function checkAuth (userKey) {
    if (!userKey) { return; }

    subWs.send(JSON.stringify({
      cmd: 'checkAuth',
      userKey: userKey
    }));
  }

  /*

    Edit mode
    ----

  */
  function handleAuthSuccess (data) {
    user = data.user;

    //> initialize user info
    document.querySelector('#user-controls [data-hook=username]').innerHTML = user.name;
    document.body.className += ' is-logged-in';

    //> handle logout
    document.querySelector('#user-controls [name=logout]').addEventListener('click', function (event) {
      event.preventDefault();

      userStore.clear();
      location.reload();
    });

    //> setup drag functionality
    drag.setup();
    elemsByUsername(user.name).forEach(drag.makeDraggable);

    //> elements belonging to the current user are watched for changes
    doWatchLoop(user, ws.namespace('divs'));

    //> setup the ui for authed users
    setupUi(user);
  }

  subWs.addEventListener('message', function (event) {
    var data;
    try {
      data = JSON.parse(event.data);
    }
    catch (e) {
      console.error('invalid json', e);
      return;
    }

    switch (data.type) {
    case 'authFail':
      alert('Sorry, unable to authenticate you');
      userStore.clear();
      break;

    case 'authSuccess':
      handleAuthSuccess(data);
      break;

    default:
      console.error('Unknown message:', data);
    }
  });

  // ----

  //> send a message to initialize with the current user (or anonymous)
  var userKey = userStore.getKey();
  checkAuth(userKey);

  //> handle login
  document.querySelector('#user-controls [name=login]').addEventListener('click', function (event) {
    event.preventDefault();

    var key = prompt('Enter your secret user key:');
    userStore.setKey(key);
    checkAuth(key);
  });
}

// ----

require('./setup-socket')(function (err, ws, plainWs) {
  setupDivSocket(ws.namespace('divs'));

  setupSessionController(ws);

  window.ws = plainWs;

  ws.namespace('_').addEventListener('message', function (event) {
    console.log('got normal message:', event.data);
  });
});

// helper functions
window.myDivs = function () {
  return elemsByUsername(user.name);
};

// help
window.help = function () {
  console.log([
    '%% CSS PARTY %%',
    '- contact the site owner to register a new account',
    '- when you login you can find your divs by entering myDivs() in the console',
    '- or click the (+) button to open UI',
    '- make some changes with devtools!',
    '- anything you set in the style attribute or the text content of your divs will be broadcast to everyone else',
    '- HINT: for more help try running helpTangram() in the console'
  ].join('\n'));
  return '';
};

window.helpTangram = function () {
  console.log([
    '%% TANGRAM!! %%',
    '- https://en.wikipedia.org/wiki/Tangram',
    '- run tangram() in your console to get your own sweet tangram set',
    '- to make a picture, first click a piece to select it',
    '- arrow keys shift the position, [ and ] rotate (hold shift for faster movement)'
  ].join('\n'));
  return '';
};

var styleAttr = require('style-attr');
window.tangram = function () {
  var divs = myDivs();

  require('./tangram')().forEach(function (data, i) {
    if (!data) { return; }
    divs[i].innerHTML = '';
    divs[i].setAttribute('style', data.style);
  });

  require('./center-on-div')(divs[0]);
};


var sizer = document.createElement('div');
sizer.setAttribute('style', 'position:absolute;top:5000px;left:5000px;background:transparent;width:1px;height:1px;');
sizer.className = 'sizer';
document.getElementById('divs').appendChild(sizer);
