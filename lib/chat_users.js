const _ = require('lodash');
const ChatHistory = require('./chat_history');

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
        var notice = {
            text: "User "+user.nickname+" disconnected!",
            time: Date.now(),
            to: "All",
            from: user.nickname
        };
        (new ChatHistory()).log('chat notice', notice);
        user.broadcast('chat notice', notice);
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
        var notice = {
            text: "User "+user.nickname+" joined!",
            time: Date.now(),
            to: "All",
            from: nickname
        };
        (new ChatHistory()).log('chat notice', notice);
        user.broadcast('chat notice', notice);
        this.chatService.history(function(replies) {
            replies.forEach(function(chat) {
                chat.msg = JSON.parse(chat.msg);
                //chat.msg.time = parseInt(chat.time);
                console.log(chat.msg);
                if (chat.msg.to == undefined || chat.msg.to == "All" || chat.msg.to == user.nickname || chat.msg.from == user.nickname) {
                    user.emit(chat.type, chat.msg);
                }
            });
        });
    };
    this.user = function(socket) {
        return(this.users[socket.id]);
    };
    this.byName = function(name) {
        var found = _.find(this.users, {nickname: name});
        if (found) {
            return(found);
        }
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
        var notice = {
            text: previousName + " changed his name to " + new_nickname,
            time: Date.now(),
            to: "All",
            from: new_nickname
        };
        (new ChatHistory()).log('chat notice', notice);
        user.broadcast('chat notice', notice);
    };
};
ChatUsers.prototype.chat = function(msg, socket) {
    var type = "chat message";
    msg.time = _.now();
    (new ChatHistory()).log(type, msg);
    if (msg.to == "All") {
        this.chatService.broadcast(type, msg);
    } else {
        if (this.nickname_exists(msg.to)) {
            var user = this.byName(msg.to);
            if (user) {
                user.emit('chat message', msg);
                this.user(socket).emit(type, msg);
            } else {
                this.user(socket).send_notice('Unable to send message to ' + msg.to);
            }
        } else {
            this.user(socket).send_notice('Unable to send message to ' + msg.to);
        }
    }
};
module.exports = ChatUsers;