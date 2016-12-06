var ChatService = function(io) {
    this.io = io;
};
ChatService.prototype.send_notice = function (message) {
    this.broadcast('chat notice', message);
};
ChatService.prototype.broadcast = function(type, msg) {
    this.io.emit(type, msg);
};
module.exports = ChatService;