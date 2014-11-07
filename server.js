/**
 * Created by sungho on 2014-07-22.
 */
var express = require('express'),
    app = module.exports = express(),
    mongoose = require('mongoose'),
    mongoStore = require('connect-mongodb'),
    socket = require('socket.io'),
    db,
    io,
    server,
    Document,
    User,
    Whales,
    Pages,
    Settings = { development: {}, test: {}, production: {} };


var http = require('http');
var path = require('path');
var gravatar = require('gravatar');

// Converts a database connection URI string to
// the format connect-mongodb expects
function mongoStoreConnectionArgs() {
    return { dbname: db.db.databaseName,
        host: db.db.serverConfig.host,
        port: db.db.serverConfig.port,
        username: db.user,
        password: db.pass };
}

var MAIN_PORT = 8080;
var DB_PORT = 27017;
var MAIN_DB = 'mongodb://localhost:'+DB_PORT+'/pingpong';


app.set('port', MAIN_PORT);
app.set('db-uri', MAIN_DB);

db = (mongoose.connect(app.set('db-uri')));
if( !db.db ) db = db.connections[0];

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var bodyParser = require('body-parser');
var favicon = require( 'serve-favicon' );
var cookieParser = require('cookie-parser');
var logger = require( 'morgan' );
var methodOverride = require( 'method-override' );
var session = require('express-session');

//app.use(favicon());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded( {extended:true}));
app.use(cookieParser('optional secret string'));

//app.use(express.cookieDecoder());
app.use(session({
    secret: 'keyboard cat',
    store: mongoStore(mongoStoreConnectionArgs()),
    resave: true,
    saveUninitialized: true
}));
//app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }));
app.use(logger('dev'));
app.use(methodOverride());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '/')));

// model
var models = require('./models.js');
app.User 	= User 		= models.User(db);

var sign = require('./routes/sign');
var main = require('./routes/main');

sign.initialize(db);

app.post('/users/signup', sign.up );
app.post('/users/signin', sign.in );
app.get('/users/:username', sign.username );
app.get('/main*', loadUser, main.main );

app.get('/tutorial', function(req,res){
    res.render('pingpong.ejs',
        {
            username : req.session.username
        }
    );
});

function loadUser(req, res, next) {
    if (req.session.username) {
        User.findById(req.session.username, function(user) {
            if (user) {
                req.currentUser = user;
                next();
            } else {
                res.redirect('/');
            }
        });
    } else {
        res.redirect('/');
    }
}

app.get('/', function(req, res) {
    res.render( 'index.ejs',
        {
            title:'Ping-Pong',
            head1 :'On-line PingPong',
            head2 : 'head2',
            tail : '2014 11 01'
        } );
});

app.delete('/sessions', loadUser, function(req, res) {
    if (req.session) {
        req.session.destroy(function() {});
    }
    res.redirect('/sessions/new');
});

if (!module.parent) {
    server = http.createServer(app).listen(app.set('port'), handler );
    io = socket.listen( server );
}

app.get('/create', function(req,res){

    // Generate unique id for the room
    var id = Math.round((Math.random() * 10000));

    // Redirect to the random room
    res.redirect('/chat/'+id);
});

app.get('/chat/:id', function(req,res){

    // Render the chant.html view
    res.render('chat.ejs',
        {
            username : req.session.username
        }
    );
});

var chat = io.of('/socket').on('connection', function (socket) {

    // When the client emits the 'load' event, reply with the
    // number of people in this chat room

    socket.on('addroom',function(data){
        var roomlist = [];

        roomlist.push(data);

        console.log(roomlist);
    });

    socket.on('load',function(data){

        var room = findClientsSocket(io,data,'/socket');

        if(room.length === 0 ) {

            socket.emit('peopleinchat', {number: 0});
        }
        else if(room.length === 1) {

            socket.emit('peopleinchat', {
                number: 1,
                user: room[0].username,
                avatar: room[0].avatar,
                id: data
            });
        }
        else if(room.length >= 2) {

            chat.emit('tooMany', {boolean: true});
        }
    });

    // When the client emits 'login', save his name and avatar,
    // and add them to the room
    socket.on('login', function(data) {

        var room = findClientsSocket(io, data.id, '/socket');
        // Only two people per room are allowed
        if (room.length < 2) {

            // Use the socket object to store data. Each client gets
            // their own unique socket object

            socket.username = data.user;
            socket.room = data.id;
            socket.avatar = gravatar.url(data.avatar, {s: '140', r: 'x', d: 'mm'});

            // Tell the person what he should use for an avatar
            socket.emit('img', socket.avatar);


            // Add the client to the room
            socket.join(data.id);

            if (room.length == 1) {

                var usernames = [],
                    avatars = [];

                usernames.push(room[0].username);
                usernames.push(socket.username);

                avatars.push(room[0].avatar);
                avatars.push(socket.avatar);

                // Send the startChat event to all the people in the
                // room, along with a list of people that are in it.

                chat.in(data.id).emit('startChat', {
                    boolean: true,
                    id: data.id,
                    users: usernames,
                    avatars: avatars
                });
            }
        }
        else {
            socket.emit('tooMany', {boolean: true});
        }
    });

    // Somebody left the chat
    socket.on('disconnect', function() {

        // Notify the other person in the chat room
        // that his partner has left

        socket.broadcast.to(this.room).emit('leave', {
            boolean: true,
            room: this.room,
            user: this.username,
            avatar: this.avatar
        });

        // leave the room
        socket.leave(socket.room);
    });


    // Handle the sending of messages
    socket.on('msg', function(data){

        // When the server receives a message, it sends it to the other person in the room.
        socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, user: data.user, img: data.img});
    });
});

function findClientsSocket(io,roomId, namespace) {
    var res = [],
        ns = io.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
        for (var id in ns.connected) {
            if(roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId) ;
                if(index !== -1) {
                    res.push(ns.connected[id]);
                }
            }
            else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}

require('./config')(app, io);
require('./routes')(app, io);

function handler(){
    console.log('Express server listening on port ' + app.set('port'));
}