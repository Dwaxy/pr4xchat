const RedisServer = require('redis-server');
 // Simply pass the port that you want a Redis server to listen on.
const server = new RedisServer({
    port: 6379,
    bin: '/usr/bin/redis-server'
    });

server.open((err) => {
  if (err) {
      console.error(err);
  }
});

module.exports = server