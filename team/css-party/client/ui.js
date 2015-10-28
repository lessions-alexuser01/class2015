var dom = require('./dom');
var movementKeys = require('./movement-keys');
var rotationKeys = require('./rotation-keys');
var sanitizeText = require('./sanitize-text');
var centerOnDiv = require('./center-on-div');
var elemClass = require('element-class');
var styleAttr = require('style-attr');

function elemsByUsername (username) {
  var elems = document.querySelectorAll('[data-owner=' + username + ']');
  return Array.prototype.slice.call(elems);
}

module.exports = function setupUi (user) {
  var body = document.body;
  var controlsHolder = document.getElementById('controls');
  var divsHolder = document.getElementById('divs');
  var pluginsHolder = controlsHolder.querySelector('.plugins');
  var activePlugin;
  var divSelector = controlsHolder.querySelector('[name=div]');

  // use arrow keys to nudge
  body.addEventListener('keydown', function (event) {
    // don't touch the event if an input is focussed
    if (document.querySelector('input:focus')) { return; }

    // ignore if there's no div selected
    var elem = getSelectedDiv();
    if (!elem) { return; }

    var delta = movementKeys(event.keyCode);
    var rotation = rotationKeys(event.keyCode);
    var multiplier;

    if (delta) {

      // stop the cursor from moving
      event.preventDefault();

      // shift key moves by 10px instead of 1px
      if (event.shiftKey) {
        multiplier = 10;
        delta[0] *= multiplier;
        delta[1] *= multiplier;
      }

      // update the position field
      if (delta[0] !== 0) {
        elem.style.left = parseInt(elem.style.left, 10) + delta[0] + 'px';
      }

      if (delta[1] !== 0) {
        elem.style.top = parseInt(elem.style.top, 10) + delta[1] + 'px';
      }
    }
    else if (rotation) {

      // stop the cursor from moving
      event.preventDefault();

      var existing = 0;
      try {
        var matches = elem.style.transform.match(/rotate\(([0-9\-\.]+)deg/);
        existing = (matches && parseFloat(matches[1], 10)) || 0;
      } catch (e) {}

      // shift key moves by 45deg instead of 1deg
      if (event.shiftKey) {
        var step = 22.5;

        // snap to the nearest 16th
        existing /= step;
        existing = Math.round(existing);
        existing += rotation;
        existing *= step;
      }
      else {
        existing += rotation;
      }

      elem.style.transform = 'rotate(' + existing + 'deg)';
    }
  });

  function getSelectedDiv () {
    return elemsByUsername(user.name)[divSelector.selectedIndex];
  }

  var plugins = {};

  plugins.text = (function () {
    var holder;
    var input;

    function populateInput () {
      //> populate the text input
      input.value = sanitizeText(getSelectedDiv().innerHTML);
    }

    return {
      name: 'Text',

      onDivSelected: function () {
        populateInput();
      },

      setupOnce: function () {
        holder = document.createElement('div');
        input = document.createElement('input');

        //> auto-populate the element with text changes
        input.addEventListener('change', function () {
          var elem = getSelectedDiv();
          if (!elem) { return; }

          elem.innerHTML = sanitizeText(input.value);
        });

        input.type = 'text';
        holder.appendChild(input);
        this.setupOnce = function () { return holder; };
        return holder;
      },

      setup: function () {
        var holder = this.setupOnce();
        populateInput();
        return holder;
      }
    };
  }());

  plugins.image = (function () {
    var holder;
    var loadButton;
    var cancelButton;
    var input;
    var img;

    function hide (elem) {
      elem.style.display = 'none';
    }

    function show (elem) {
      elem.style.display = 'inline-block';
    }

    function redraw () {
      var divElem = getSelectedDiv();

      //> when there is already a background image, we hide the input and give the option to clear it
      if (divElem.style['background-image']) {
        loadButton.innerHTML = 'Clear';
        input.value = '';
        hide(input);
      }
      else {
        loadButton.innerHTML = 'Load';
        show(input);
      }
    }

    function startLoading () {
      hide(loadButton);
      show(cancelButton);
    }

    function stopLoading () {
      hide(cancelButton);
      show(loadButton);

      redraw();
    }

    return {
      name: 'Image',

      onDivSelected: function () {
        redraw();
      },

      setupOnce: function () {
        holder = document.createElement('form');
        input = document.createElement('input');
        loadButton = document.createElement('button');
        cancelButton = document.createElement('button');
        img = new Image();

        cancelButton.addEventListener('click', function (event) {
          event.preventDefault();

          img.onload = img.onerror = function () {};
          img.src = '';
          stopLoading();
        });

        holder.addEventListener('submit', function (event) {
          event.preventDefault();

          var divElem = getSelectedDiv();

          //> clicking "Load / Clear" with an empty input will remove the existing image
          if (input.value === '') {
            divElem.style['background-image'] = '';
            redraw();
            return;
          }

          startLoading();

          img.onload = function () {
            divElem.style['background-image'] = 'url(' + img.src + ')';
            divElem.style['background-repeat'] = 'no-repeat';
            divElem.style.width = img.width + 'px';
            divElem.style.height = img.height + 'px';

            stopLoading();
          };
          img.onerror = function () {
            stopLoading();
          };
          img.src = input.value;

          // handle the case where the image is already loaded in cache
          if (img.complete) { img.onload(); }
        });

        input.type = 'text';
        input.setAttribute('placeholder', 'Image URL');

        loadButton.type = 'submit';
        cancelButton.innerHTML = '<span class="spinner">|</span> Cancel';
        hide(cancelButton);

        redraw();

        holder.appendChild(input);
        holder.appendChild(loadButton);
        holder.appendChild(cancelButton);

        this.setupOnce = function () { return holder; };
        return holder;
      },

      setup: function () {
        var holder = this.setupOnce();
        redraw();
        return holder;
      }
    };
  }());

  plugins.rotate = (function () {
    var holder;
    var input;

    function getCurrentRotation () {
      var divElem = getSelectedDiv();
      var val = divElem.style.transform;
      var matches = val.match(/rotate\((\d+)deg\)/);
      return matches && matches[1] || 0;
    }

    return {
      name: 'Rotate',

      onDivSelected: function () {
        input.value = getCurrentRotation();
      },

      setupOnce: function () {
        holder = document.createElement('div');
        input = document.createElement('input');
        input.type = 'range';
        input.min = -360;
        input.max = 360;
        input.value = getCurrentRotation();

        function update () {
          var divElem = getSelectedDiv();
          divElem.style.transform = 'rotate(' + input.value + 'deg)';
        }
        input.addEventListener('input', update);

        holder.appendChild(input);
        this.setupOnce = function () { return holder; };
        return holder;
      },

      setup: function () {
        var holder = this.setupOnce();
        return holder;
      }
    };
  }());

  plugins.selfie = (function () {
    var webcam = require('./webcam');
    var holder;
    var startButton;
    var snapButton;
    var webcamController;
    var videoElem;

    function hide (elem) {
      elem.style.display = 'none';
    }

    function show (elem) {
      elem.style.display = 'inline-block';
    }

    function teardown () {
      if (webcamController) {
        webcamController.stop();
      }

      show(startButton);
      hide(snapButton);
    }

    function start () {
      hide(startButton);
      show(snapButton);

      webcam(videoElem, function (err, controller) {
        webcamController = controller;

        if (err) {
          teardown();
          return console.error(err);
        }

        snapButton.addEventListener('click', function (event) {
          event.preventDefault();

          var img = controller.takeSnapshot();
          var divElem = getSelectedDiv();

          divElem.style.background = 'url(' + img.src + ') 0 0 no-repeat';
          divElem.style.width = img.width + 'px';
          divElem.style.height = img.height + 'px';
          divElem.style.transform = 'scaleX(-1)';
        });
      });

    }

    return {
      name: 'Selfie!',

      onDivSelected: function () {

      },

      teardown: teardown,

      setupOnce: function () {
        holder = document.createElement('form');
        startButton = document.createElement('button');
        snapButton = document.createElement('button');
        videoElem  = webcam.createVideoElem();

        startButton.addEventListener('click', function (event) {
          event.preventDefault();
          start();
        });

        videoElem.style.display = 'block';
        startButton.innerHTML = 'Start';
        snapButton.innerHTML = 'Snap';

        hide(startButton);

        holder.appendChild(videoElem);
        holder.appendChild(startButton);
        holder.appendChild(snapButton);

        start();

        this.setupOnce = function () { return holder; };
        return holder;
      },

      setup: function () {
        var holder = this.setupOnce();
        return holder;
      }
    };
  }());

  // ----
  // setup plugins

  var pluginSelector = pluginsHolder.querySelector('[name=plugin]');

  Object.keys(plugins).forEach(function (key) {
    var plugin = plugins[key];
    var option = document.createElement('option');
    option.value = key;
    option.innerHTML = plugin.name;

    pluginSelector.appendChild(option);
  });

  pluginSelector.addEventListener('change', function () {
    var i = pluginSelector.selectedIndex;
    var key = pluginSelector.options[i].value;

    if (!key) { return; }

    //> previously loaded plugin controls are removed
    if (activePlugin) {
      if (activePlugin.teardown) { activePlugin.teardown(); }

      var holder = activePlugin.setup();
      if (holder.parentNode) {
        holder.parentNode.removeChild(holder);
      }
    }

    var plugin = plugins[key];
    var pluginElem = plugin.setup();
    elemClass(pluginElem).add('plugin-controls');
    pluginsHolder.appendChild(pluginElem);

    // keep a reference
    activePlugin = plugin;
  });

  // ----

  var open = function (event) {
    event.preventDefault();
    elemClass(body).add('show-controls');
  };

  var close = function (event) {
    if (event) { event.preventDefault(); }

    elemClass(body).remove('show-controls');
    elemClass(divsHolder.querySelector('.selected')).remove('selected');
  };

  controlsHolder.querySelector('button[name=open]').addEventListener('click', open);
  controlsHolder.querySelector('button[name=close]').addEventListener('click', close);

  function onElementSelected (i) {
    var div = dom.get(user.name, i);
    var elemState = dom.readElemState(div.key);
    var elem = elemsByUsername(user.name)[i];

    //> the selected element gets logged to the console
    console.log('SELECTED', elem);

    //> flag the element
    elemClass(divsHolder.querySelector('.selected')).remove('selected');
    elemClass(elem).add('selected');

    //> update the selector
    divSelector.selectedIndex = i;

    //> update the active plugin
    if (activePlugin) {
      activePlugin.setup();
      activePlugin.onDivSelected();
    }

    centerOnDiv(elem);

    //> activate the controls
    elemClass(body).add('show-controls');
  }

  // ----
  // create the selector

  elemsByUsername(user.name).forEach(function (elem, i) {
    var option = document.createElement('option');
    option.value = i;
    option.innerHTML = i;

    divSelector.appendChild(option);
  });

  //> select an element by choosing it in the selector
  divSelector.addEventListener('change', function () {
    var i = divSelector.selectedIndex;
    onElementSelected(i);
  });

  //> select an element by clicking on it
  divsHolder.addEventListener('click', function (event) {
    event.preventDefault();
    var elem = event.target;

    if (elem.getAttribute('data-owner') !== user.name) { return; }

    var i = elem.getAttribute('data-i');
    onElementSelected(i);

    return false;
  });

  //> populate for the first element (but close the tools popup)
  onElementSelected(0);
  close();
};
