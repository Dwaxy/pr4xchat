const _ = require('lodash');
var redis = require("redis").createClient({db: 1});
redis.on('error', function(err) {
    console.log(err);
});
var ChatHistory = function() {
};

ChatHistory.prototype.log = function(type, msg) {
    redis.incr("chat.message.id", function(err, id) {
        if (err) {
            console.log(err);
            return;
        }
        msg.time = Date.now();
        redis.hmset("chat.message.id:"+id, "type", type.toString(), "msg", JSON.stringify(msg));
        redis.zadd("chat.history", Date.now(), id);
    });
};
ChatHistory.prototype.history = function(cb) {
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
module.exports = ChatHistory;