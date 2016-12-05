var session = require("express-session")
var RedisStore = require("connect-redis")(session);
var middleware = session({
    store: new RedisStore({host:'localhost',port:6379}),
    secret: "my-secret",
    resave: true,
    saveUninitialized: true,
    //cookie: {httpOnly: true, secure: true}
});
module.exports = {
    session: middleware,
    io: require("socket.io-express-session")(middleware)
}