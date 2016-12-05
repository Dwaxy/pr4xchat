const _ = require('lodash');

var ChatService = function(io) {
    this.io = io;
    this.send_notice = function (message) {
        this.io.emit('chat notice', message);
    };
};

var ChatUser = function(chatService, socket) {
    this.chatService = chatService;
    this.socket = socket;
    this.nickname = "Anonymous" + Math.floor((Math.random() * 999) + 1);
    this.send_notice = function(message) {
        this.socket.emit('chat notice', message);
    };
};

var ChatUsers = function(chatService) {
    this.chatService = chatService;
    this.users ={};
    this.add = function(user) {
        this.users[user.socket.id] = user
    };
    this.rename = function(socket, nickname) {
        var user = this.users[socket.id];
        user.nickname = nickname;
    };
    this.disconnect = function(socket) {
        var user = this.users[socket.id];
        console.log('user ',user.nickname,' disconnected');
        this.chatService.send_notice("User "+user.nickname+" disconnected!")
        delete this.users[socket.id]
        this.send_list();
    };
    this.send_list = function() {
        var userNickNames = [];
        _.forOwn(this.users, (user, socketId) => {
            userNickNames.push(user.nickname);
        });
        this.chatService.io.emit("users list", userNickNames);
    };
};

module.exports = function(server, session) {
    var io = require('socket.io')(server);
    var chatService = new ChatService(io);
    io.use(session); 
    var users = {};
    var allClients = {};
    var allUsers = new ChatUsers(chatService);
    io.on('connection', function(socket){
        allUsers.add(new ChatUser(chatService, socket));
        allClients[socket.id] = {};
        console.log('a user connected');
        socket.emit('whoareyou');
        socket.on('disconnect', function(){
            allUsers.disconnect(socket)
            if (!_.isEmpty(allClients[socket.id])) {
                delete users[allClients[socket.id]];
                delete allClients[socket.id];
            }
    
        });
        socket.on("whoami", function() {
            //console.log("whoami", socket.handshake.session)
            var nickname;
            if (socket.handshake.session.nickname) {
                nickname = socket.handshake.session.nickname;
            } else {
                nickname = "Anonymous" + Math.floor((Math.random() * 999) + 1);
            }
            socket.emit("youare", nickname);
            allClients[socket.id] = nickname;
            users[nickname] = 1;
            io.emit("users list", Object.keys(users));
            socket.broadcast.emit('chat notice', "User "+nickname+" joined!");
        });
        socket.on('chat message', function(msg){
            io.emit('chat message', msg);
        });
        socket.on('chat notice', function(notice) {
            io.emit('chat notice', notice);
        });
        socket.on('new user', function(nickname) {
            allClients[socket.id] = nickname;
            users[nickname] = 1;
            io.emit("users list", Object.keys(users));
            socket.broadcast.emit('chat notice', "User "+nickname+" joined!");
        });
        socket.on('iam', function(nickname){
            //console.log("iam:" + nickname)
            allClients[socket.id] = nickname;
            users[nickname] = 1;
            io.emit("users list", Object.keys(users));
            console.log("it's "+nickname);
            allUsers.rename(socket, nickname);
        });
        socket.on('new nickname', function(nickname){
            //io.emit('chat message', nickname);
            //console.log(socket.id);
            var previousName;
            if (users[allClients[socket.id]]) {
                previousName = allClients[socket.id];
                //console.log("Previous name: "+previousName)
            }
            //console.log("users: ", users);
            //console.log("new nickname: "+nickname);
            if (_.includes(Object.keys(users), nickname)) {
                socket.emit('chat notice', 'This nickname is already used.');
                return;
            }
            if (previousName) {
                delete users[previousName];
            }
            allClients[socket.id] = nickname;
            users[nickname] = 1;
            //console.log("New Name: "+nickname)
            //console.log(users)
            io.emit("users list", Object.keys(users));
            if (previousName) {
                //io.emit("chat message", {message: previousName + " changed his name to " + nickname, nickname: allClients[socket.id]})
                socket.broadcast.emit('chat notice', previousName + " changed his name to " + nickname);
            }
            socket.handshake.session.nickname = nickname;
            socket.handshake.session.save(function (err) { if (err) {console.log(err)} });
        });
    
    });
};