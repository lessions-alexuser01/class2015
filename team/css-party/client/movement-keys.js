module.exports = function (key_code) {
  var dx = 0;
  var dy = 0;

  switch (key_code) {
  case 37: dx = -1; break;
  case 38: dy = -1; break;
  case 39: dx = 1; break;
  case 40: dy = 1; break;
  }

  // not a movement key
  if (!dx && !dy) { return null; }

  return [dx, dy];
};
