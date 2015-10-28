var key = 'user';

module.exports.clear = function clear () {
  localStorage.clear(key);
};

module.exports.getKey = function get () {
  return localStorage.getItem(key);
};

module.exports.setKey = function set (value) {
  localStorage.setItem(key, value);
};
