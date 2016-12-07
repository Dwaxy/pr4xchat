const ChatHistory = require('./chat_history');
var ChatService = function(io) {
    this.io = io;
};
ChatService.prototype.send_notice = function (message) {
    this.broadcast('chat notice', message);
};
ChatService.prototype.broadcast = function(type, msg) {
    this.io.emit(type, msg);
};
ChatService.prototype.history = function(cb) {
    (new ChatHistory()).history(cb);
};
module.exports = ChatService;