var dom = require('./dom');
var config = require('../server/config');
var calcWeight = require('../server/calc-div-weight');

module.exports = function doWatchLoop (user, ws) {
  var username = user.name;
  var loop = setTimeout.bind(null, function () { doWatchLoop(user, ws); }, 1000);
  var imagePackets = [];

  //> "name" is the public id, "key" is the secret needed for writes.
  var divs = dom.findByUsername(username);
  var changes = divs.map(function (div, i) {
    var elemState = dom.readElemState(div.key);

    // no change
    if (elemState.style === div.style &&
        elemState.text === div.text) { return null; }

    //> if any elements are using a data-uri background image,
    //> we'll send the data to the image endpoint
    var elem = dom.getElem(div.key);
    var background = elem.style['background-image'];

    if (background.indexOf('url(data:image') === 0) {
      // need to update the DOM here so we don't see a data-uri next time
      elem.style['background-image'] = '';

      imagePackets.push(JSON.stringify({
        cmd: 'saveImage',
        key: user.key,
        i: i,
        img: background.substring(4, background.length-1)
      }));

      // strip data-uri
      var pattern = /url\(data:[^\)]+\)/g;
      elemState.style = elemState.style.replace(pattern, '');
    }

    return elemState;
  });

  // no changes
  if (changes.filter(Boolean).length < 1) { return loop(); }

  var totalWeight = 0;
  changes.forEach(function (state, i) {
    if (!state) { state = dom.get(username, i); }

    totalWeight += calcWeight(state);
  });

  if (totalWeight > config.maxBytesPerUser) {
    console.error('Exceeded max size of %d (current: %d)', config.maxBytesPerUser, totalWeight);
    return loop();
  }

  // NOTE: we may run into issues here of exceeding max size, due to the order we send changes.
  // Would be more reliable to send all changes in a batch and check the size once.
  ws.send(JSON.stringify({
    cmd: 'saveChanges',
    key: user.key,
    changes: changes
  }));

  changes.forEach(function (change, i) {
    if (!change) { return; }

    //> update now to bring the virtual dom back in sync
    var key = dom.createKey(username, i);
    dom.setVirtual(key, change);
  });

  //> image packets are sent last (since they will overwrite the style)
  imagePackets.forEach(ws.send.bind(ws));

  return loop();
};
