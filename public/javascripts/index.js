/* global $ io */
var nickname; // = "Anonymous" + Math.floor((Math.random() * 999) + 1);
var socket = io();
var status = "unknown";
// Called when the user submit a new nickname
function submit_new_nickname(event) {
    var newNickname = $('#nickname').val();
    if (newNickname != "" && newNickname != undefined && newNickname != nickname) {
        nickname = newNickname;
        socket.emit('new nickname', nickname);
        $('.saved').fadeIn('slow', function() {
            setTimeout(function() {$('.saved').fadeOut('slow')}, 2000);
        });
    }
    event.preventDefault();
    return false;
}
// Called when the user submit a new message
function submit_message(event) {
    var m = $('#m').val();
    if (m != "" && m != undefined) {
        var chat = {message: m, from: nickname, to: $('#to').val()};
        socket.emit('chat message', chat);
        $('#m').val('');
    }
    event.preventDefault();
    return false;
}
// Called when the server sends a notice
// i.e.: User login, Disconnect, changes his name
function on_chat_notice(notice) {
    $('#messages').append($('<li>').
        append($('<div>').text(notice.text).addClass('notice')).
        append($('<div>').text(new Date(notice.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})).addClass('time')));
}
// Called when a new message from another user comes in.
function on_chat_message(msg) {
    if (msg.message && msg.from) {
        console.log("Chat Message!");
        console.log(msg.from);
        var dateElement = $('<div>').text(new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})).addClass('time');
        var nicknameElement;
        if (msg.to != "All") {
            nicknameElement = $('<div>').text(msg.from+" -> "+msg.to).addClass('from');
        } else {
            nicknameElement = $('<div>').text(msg.from).addClass('from');
        }
        var messageElement = $('<div>').text(msg.message).addClass('message');
        var chatElement = $('<li>').append(dateElement).append(nicknameElement).append(messageElement);
        chatElement.addClass("chat-item");
        $('#messages').append(chatElement);//+" " + msg.from+": "+msg.message));
    } else if(msg) {
      $('#messages').append($('<li>').text(msg));
    }
}
// Called when there's a change in the list of users.
// Receives the whole list of users.
function on_users_list(userslist) {
    //console.log(userslist);
    $('#users').empty();
    $('#to').empty();
    $('#to').append($('<option />').text('All'));
   userslist.forEach(function(each_nickname) {
        $('#users').append($('<li>').text(each_nickname));
        if (each_nickname != nickname) {
            $('#to').append($('<option />').text(each_nickname));
        }
    });
    $('#users').find("li:contains('"+nickname+"')").filter(function() {
        return $(this).text() === nickname;
    }).addClass("me");
}
function on_whoareyou() {
    if (nickname) {
        socket.emit('iam', nickname);
    }
}
$(document).ready(function() {
    //socket.emit('new user', nickname);
    //socket.emit('chat message', {message: "Connected", nickname: nickname});
    $('form#submit-message').submit(submit_message);
    $('form#submit-nickname').submit(submit_new_nickname);
    socket.on('connect', function() {
        if (status == "disconnected") {
            $('#status').text("Server back up! Enjoy").fadeOut('slow');
            socket.emit("relogin", nickname);
        } else {
            socket.emit("login");
        }
        status = "connected";
    });
    socket.on('disconnect', function(reason) {
        status = "disconnected";
        $('#status').text("Server is down... Please wait").fadeIn('slow');
    });
    socket.on('chat notice', on_chat_notice);
    socket.on('chat message', on_chat_message);
    socket.on('users list', on_users_list);
    socket.on('whoareyou', on_whoareyou);
    
    socket.on("youare", function(mynickname) {
        nickname = mynickname;
         $('#nickname').val(mynickname);
    });
    $('#m').keydown(function (e){
        socket.emit("typing", nickname);
    });
    var typingTimeouts = {};
    socket.on("typing", function(nickname) {
        if (typingTimeouts[nickname]) {
            clearTimeout(typingTimeouts[nickname]);
            delete typingTimeouts[nickname];
        } else {
          $('#typing').append('<div id="typing-'+nickname+'">'+nickname+' is typing...</div>');
        }
        typingTimeouts[nickname] = setTimeout(function() {
            $("#typing-"+nickname).remove();
            delete typingTimeouts[nickname];
        }, 2000);
    });
    $("#users").on('click', 'li', function(event) {
        var existing = $("#m").val();
        if (existing.length > 1 && existing[-1] != " ") {
            existing += " ";
        }
        $("#m").val(existing + "@" + $(event.target).text()+' ');
        $("#m").focus();
    });
    $("#m").focus();
}) ;
