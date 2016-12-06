const _ = require('lodash');

var ChatService = require('./chat_service');
var ChatUser = require('./chat_user');
var ChatUsers = require('./chat_users');

module.exports = function(server, session) {
    var io = require('socket.io')(server);
    var chatService = new ChatService(io);
    io.use(session); // Share session with express
    var allUsers = new ChatUsers(chatService);
    io.on('connection', function(socket){
        allUsers.add(new ChatUser(chatService, socket));
        console.log('a user connected');
        socket.on('disconnect', function(){
            allUsers.disconnect(socket);
        });
        socket.on("login", function() {
            allUsers.login(socket);
        });
        socket.on('chat message', function(msg){
            allUsers.user(socket).broadcast('chat message', msg);
        });
        socket.on('chat notice', function(notice) {
            io.emit('chat notice', notice);
        });
        socket.on('iam', function(nickname){
            console.log("it's "+nickname);
            allUsers.rename(socket, nickname);
        });
        socket.on('new nickname', function(nickname){
            allUsers.new_nickname(socket, nickname);
        });
    
    });
};