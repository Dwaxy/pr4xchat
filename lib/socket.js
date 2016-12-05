const _ = require('lodash')
module.exports = function(server, session) {
    var io = require('socket.io')(server);
    io.use(session); 
    var users = {};
    var allClients = {};
    io.on('connection', function(socket){
      allClients[socket.id] = {};
      //io.emit("chat message", "New user connected")
      console.log('a user connected');
      socket.emit('whoareyou');
      socket.on('disconnect', function(){
        //var i = allClients.indexOf(socket);
        if (!_.isEmpty(allClients[socket.id])) {
          console.log('user ',allClients[socket.id],' disconnected');
          io.emit('chat notice', "User "+allClients[socket.id]+" disconnected!");
          //io.emit("chat message", {message: "Disconnected!", nickname: allClients[socket.id]})
          //allClients.splice(i, 1);
          delete users[allClients[socket.id]];
          delete allClients[socket.id];
          io.emit("users list", Object.keys(users));
        }
    
      });
      socket.on("whoami", function() {
          //console.log("whoami", socket.handshake.session)
          var nickname;
          if (socket.handshake.session.nickname) {
              nickname = socket.handshake.session.nickname
          } else {
              nickname = "Anonymous" + Math.floor((Math.random() * 999) + 1);;
          }
          socket.emit("youare", nickname)
          allClients[socket.id] = nickname;
          users[nickname] = 1
          io.emit("users list", Object.keys(users))
          socket.broadcast.emit('chat notice', "User "+nickname+" joined!");
      })
      socket.on('chat message', function(msg){
        io.emit('chat message', msg);
      });
      socket.on('chat notice', function(notice) {
        io.emit('chat notice', notice);
      });
      socket.on('new user', function(nickname) {
        allClients[socket.id] = nickname;
        users[nickname] = 1
        io.emit("users list", Object.keys(users))
        socket.broadcast.emit('chat notice', "User "+nickname+" joined!");
      });
      socket.on('iam', function(nickname){
          //console.log("iam:" + nickname)
          allClients[socket.id] = nickname;
          users[nickname] = 1
          io.emit("users list", Object.keys(users))
          console.log("it's "+nickname);
      });
      socket.on('new nickname', function(nickname){
        //io.emit('chat message', nickname);
        //console.log(socket.id);
        var previousName;
        if (users[allClients[socket.id]]) {
          previousName = allClients[socket.id]
          //console.log("Previous name: "+previousName)
        }
        //console.log("users: ", users);
        //console.log("new nickname: "+nickname);
        if (_.includes(Object.keys(users), nickname)) {
            socket.emit('chat notice', 'This nickname is already used.')
            return;
        }
        if (previousName) {
          delete users[previousName];
        }
        allClients[socket.id] = nickname;
        users[nickname] = 1
        //console.log("New Name: "+nickname)
        //console.log(users)
        io.emit("users list", Object.keys(users))
        if (previousName) {
          //io.emit("chat message", {message: previousName + " changed his name to " + nickname, nickname: allClients[socket.id]})
          socket.broadcast.emit('chat notice', previousName + " changed his name to " + nickname);
        }
        socket.handshake.session.nickname = nickname;
        socket.handshake.session.save(function (err) { if (err) {console.log(err)} })
      });
    
    });
}