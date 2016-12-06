var ChatUser = function(chatService, socket) {
    this.chatService = chatService;
    this.socket = socket;
    this.nickname = "Anonymous" + Math.floor((Math.random() * 999) + 1);
    socket.emit('whoareyou');
    this.send_notice = function(message) {
        this.socket.emit('chat notice', message);
    };
    this.broadcast = function(type, msg) {
        this.socket.broadcast.emit(type, msg);
    };
};
module.exports = ChatUser;