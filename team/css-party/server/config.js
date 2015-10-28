/*

Config
----

- map environment vars to the config module
- define defaults

*/

function getRedisInfo () {
  var info = {
    host: process.env.PARTY_REDIS_HOST,
    port: process.env.PARTY_REDIS_PORT,
    password: process.env.PARTY_REDIS_PASSWORD
  };

  // only use if there is a host set
  return info.host ? info : null;
}

module.exports = {
  //> http port to listen on:
  port: process.env.PORT || 5000,

  //> auth secret for admin access:
  authSecret: process.env.SECRET,

  //> enable the repl
  useRepl: process.env.PARTY_REPL,

  //> redis info (optional):
  redis: getRedisInfo(),

  //> max history length for watchobs
  maxHistoryLength: 50,

  //> number of divs available to each user:
  divsPerUser: 10,

  //> divs: max bytes of storage per user
  divBytesPerUser: 50 * 1024,

  //> images: max bytes of storage per user
  imageBytesPerUser: 300 * 1024,

  //> divs: max pixel dimensions of any div
  divMaxDimensions: 300
};
