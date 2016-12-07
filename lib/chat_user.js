const ChatHistory = require('./chat_history');
var ChatUser = function(chatService, socket) {
    this.chatService = chatService;
    this.socket = socket;
    this.nickname = "Uknown";
    this.send_notice = function(message) {
        var type = 'chat notice';
        (new ChatHistory()).log(type, message);
        this.emit(type, message);
    };
    this.emit = function(type, message) {
        this.socket.emit(type, message);
    };
    this.broadcast = function(type, msg) {
        this.socket.broadcast.emit(type, msg);
    };
};
module.exports = ChatUser;