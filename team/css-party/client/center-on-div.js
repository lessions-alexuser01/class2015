/*

Center on a div
====

Smooth-scroll to bring the div into focus.

*/

var smoothScroll = require('scroll');

var scrollOpts = {
  duration: 500,
  ease: 'in-out-quad'
};

module.exports = function (elem) {
  var divsHolder = document.getElementById('divs');
  var rect = elem.getBoundingClientRect();
  var holderRect = divsHolder.getBoundingClientRect();
  var targetPos = {
    left: parseInt(elem.style.left, 10) - (holderRect.width * 0.5) + (rect.width * 0.5),
    top: parseInt(elem.style.top, 10) - (holderRect.height * 0.5) + (rect.height * 0.5)
  };

  smoothScroll.left(divsHolder, targetPos.left, scrollOpts);
  smoothScroll.top(divsHolder, targetPos.top, scrollOpts);
};
