module.exports = function (key_code) {
  switch (key_code) {
  case 219: /* [ */ return -1;
  case 221: /* ] */ return 1;
  default: return 0;
  }
};
