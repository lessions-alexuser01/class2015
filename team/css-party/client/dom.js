/*

  Simple virtual dom for div elements

*/

var styleAttr = require('style-attr');
var sanitizeText = require('./sanitize-text');
var config = require('../server/config');

var divs = {};
var divsByUsername = {};
var elems = {};

/*

  Update a div element's style attribute

*/
function updateElemStyle (key, style) {
  elems[key].setAttribute('style', style);
}

/*

  Update a div element's text

*/
function updateElemText (key, text) {
  elems[key].innerHTML = text;
}

/*

  Create a new div element

*/
function createElem (key, div) {
  var elem = document.createElement('div');
  elem.setAttribute('id', key);
  elem.setAttribute('data-owner', div.username);
  elem.setAttribute('data-i', div.i);

  document.getElementById('divs').appendChild(elem);
  elems[key] = elem;

  updateElemStyle(key, div.style);
  updateElemText(key, div.text);
}

/*

  Remove a div element

*/
function removeElem (key) {
  var elem = elems[key];
  elem.parentNode.removeChild(elem);
}

// ----

/*

  Create a key that we can use to target an individual div

*/
function createKey (username, i) {
  return username + ':' + i;
}

function normalizeText (text) {
  return sanitizeText (text);
}

function normalizeStyle (style) {
  var styleData = styleAttr.parse(style);

  //> divs must always be absolute position with top/left values
  styleData.position = 'absolute';
  if (styleData.left === undefined) { styleData.left = '0px'; }
  if (styleData.top === undefined) { styleData.top = '0px'; }

  //> divs must always enforce max dimensions with no overflow
  styleData.overflow = 'hidden';
  styleData['max-width'] = styleData['max-height'] = (config.divMaxDimensions + 'px');

  return styleAttr.stringify(styleData);
}

/*

  Index a div by username

*/
function indexByUsername (div) {
  if (divsByUsername[div.username] === undefined) {
    divsByUsername[div.username] = [];
  }

  divsByUsername[div.username][div.i] = div;
}

/*

  Set the data of the virtual div, but don't make any changes to the real dom.
  Return a summary of changes.

*/
function setVirtual (key, data) {
  var div = divs[key];
  var parts = key.split(':');
  var username = parts[0];
  var i = parseInt(parts[1], 10);

  // normalize
  var text = normalizeText(data.text);
  var style = normalizeStyle(data.style);

  // create a new div
  if (!div) {
    div = divs[key] = {
      key: key,
      username: username,
      i: i,
      style: style,
      text: text
    };

    indexByUsername(div);

    return { isNew: true };
  }


  var changes = {};

  // update changed values
  if (div.style !== style) {
    div.style = style;
    changes.style = true;
  }

  if (div.text !== text) {
    div.text = text;
    changes.text = true;
  }

  return changes;
}

/*

  Set the data of a div

*/
function set (key, data) {
  var changes = setVirtual(key, data);
  var div = divs[key];

  if (changes.isNew) {
    return createElem(key, div);
  }

  // update changed values
  if (changes.style) {
    updateElemStyle(key, div.style);
  }

  if (changes.text) {
    updateElemText(key, div.text);
  }
}

/*

  Get data from a div

*/
function get (username, i) {
  var key = createKey(username, i);
  return divs[key];
}

/*

  Remove an element

*/
function remove (key) {
  if (!divs[key]) { return; }
  delete divs[key];

  removeElem(key);
}

function findByUsername (username) {
  return divsByUsername[username] || [];
}

function getElem (key) {
  return elems[key];
}

function readElemState (key) {
  var elem = elems[key];
  return {
    style: normalizeStyle(elem.getAttribute('style')),
    text: normalizeText(elem.innerHTML)
  };
}

module.exports.createKey = createKey;
module.exports.set = set;
module.exports.setVirtual = setVirtual;
module.exports.get = get;
module.exports.remove = remove;
module.exports.findByUsername = findByUsername;
module.exports.readElemState = readElemState;
module.exports.getElem = getElem;
