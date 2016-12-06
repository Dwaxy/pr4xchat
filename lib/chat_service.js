const _ = require('lodash');
var redis = require("redis").createClient();
redis.on('error', function(err) {
    console.log(err);
});
var ChatService = function(io) {
    this.io = io;
};
ChatService.prototype.send_notice = function (message) {
    this.broadcast('chat notice', message);
};
ChatService.prototype.broadcast = function(type, msg) {
    if (type == "chat message" || type == "chat notice") {
        redis.incr("chat.message.id", function(err, id) {
            if (err) {
                console.log(err);
                return;
            }
            redis.hmset("chat.message.id:"+id, "type", type.toString(), "msg", JSON.stringify(msg), "time", Date.now());
            redis.zadd("chat.history", Date.now(), id);
        });
    }
    this.io.emit(type, msg);
};
ChatService.prototype.history = function(cb) {
    redis.zrevrange("chat.history", 0, 15, function(err, ids) {
        if (err) {
            console.log(err);
            return;
        }
        var commands = [];
        ids.forEach(function(id) {
            commands.push(["hgetall", "chat.message.id:"+id]);
        });
        redis.multi(commands).exec(function(err, replies) {
            if (err) {
                console.log(err);
                return;
            }
            cb(_.reverse(replies));
        });
    });
};
module.exports = ChatService;