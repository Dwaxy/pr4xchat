const _ = require('lodash');

var ChatUsers = function(chatService) {
    this.chatService = chatService;
    this.users ={};
    this.add = function(user) {
        this.users[user.socket.id] = user;
    };
    this.rename = function(socket, nickname) {
        var user = this.user(socket);
        var previousName = user.nickname;
        if (previousName != nickname && this.nickname_exists(nickname)) {
            socket.emit('chat notice', 'This nickname is already used.');
            return;
        }
        user.nickname = nickname;
        this.send_list();
        socket.handshake.session.nickname = nickname;
        socket.handshake.session.save(function (err) { if (err) {console.log(err)} });
    };
    this.disconnect = function(socket) {
        var user = this.users[socket.id];
        user.broadcast('chat notice', "User "+user.nickname+" disconnected!");
        console.log('user ',user.nickname,' disconnected');
        delete this.users[socket.id];
        this.send_list();
    };
    this.send_list = function() {
        var userNickNames = [];
        _.forOwn(this.users, (user, socketId) => {
            userNickNames.push(user.nickname);
        });
        this.chatService.broadcast("users list", userNickNames);
    };
    this.login = function(socket) {
        var nickname;
        if (socket.handshake.session.nickname) {
            nickname = socket.handshake.session.nickname;
        } else {
            nickname = "Anonymous" + Math.floor((Math.random() * 999) + 1);
        }
        this.rename(socket, nickname);
        socket.emit("youare", nickname);
        var user = this.users[socket.id];
        user.broadcast('chat notice', "User "+nickname+" joined!");
        this.chatService.history(function(replies) {
            replies.forEach(function(chat) {
                chat.msg = JSON.parse(chat.msg);
                chat.msg.time = parseInt(chat.time);
                user.emit(chat.type, chat.msg)
            })
        });
    };
    this.user = function(socket) {
        return(this.users[socket.id]);
    };
    this.nickname_exists = function(nickname) {
        var result = _.filter(this.users, (user) => {
            return(user.nickname == nickname);
        });
        return(!_.isEmpty(result));
    };
    this.new_nickname = function(socket, new_nickname) {
        var user = this.user(socket);
        var previousName = user.nickname;
        this.rename(socket, new_nickname);
        user.broadcast('chat notice', previousName + " changed his name to " + new_nickname);
    };
};
module.exports = ChatUsers;