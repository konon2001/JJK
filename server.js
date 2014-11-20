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
    socket2,
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
        password: db.pass,
        win: db.win,
        loss: db.loss
    };
}

var MAIN_PORT = 8080;
var DB_PORT = 27017;
var MAIN_DB = 'mongodb://localhost:'+DB_PORT+'/pingpong';
var roomArray = [];
var roomID = [];
var roomUser = [];
var bh = 0;
var posx=0,
    posy=0,
    posz=0;
var cnt1 = 0, cnt2 = 0;
var end1, end2, endname, scoreTemp;

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

app.get('/end', function(req,res){
    end = req.session.cnt1;
    console.log(end)
});

app.post('/test', function (req, res){
    //var x1 = req.param("x1")
    //var y1 = req.param("y1")
    //var z1 = req.param("z1")
    posx = req.param("x2")
    posy = req.param("y2")
    posz = req.param("z2")
    //var x3 = req.param("x3")
    //var y3 = req.param("y3")
    //var z3 = req.param("z3")

    //console.log("x1 : "+ x1)
    //console.log("y1 : "+ y1)
    //console.log("z1 : "+ z1)
    console.log("posx : "+ posx)
    console.log("posy : "+ posy)
    console.log("posz : "+ posz)
    //console.log("x3 : "+ x3)
    //console.log("y3 : "+ y3)
    //console.log("z3 : "+ z3)
 });

app.get('/tutorial', function(req,res){
    res.render('pingpong.ejs',
        {
            username : req.session.username,
            cnt2: req.session.cnt2,
            posx: posx
        }
    );
});

app.get('/', function(req, res) {

        res.render('index.ejs',
            {
                title: 'Ping-Pong',
                head1: 'On-line PingPong',
                head2: 'head2',
                tail: '2014 11 01',
                username: req.session.username
            });
});

app.get('/logout', function(req, res) {
        res.render('index.ejs',
            {
                title: 'Ping-Pong',
                head1: 'On-line PingPong',
                head2: 'head2',
                tail: '2014 11 01',
                username: 'undefined'
            })
})

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
            username : req.session.username,
            roomArray: roomArray, // 방이름
            roomID: roomID,  // 룸포트
            roomUser: roomUser // 방만든이
        }
    );
});

app.get('/game', function(req,res){
    res.render('client_pingpong.ejs',
        {
            username : req.session.username,
            roomArray: roomArray, // 방이름
            roomID: roomID,  // 룸포트
            roomUser: roomUser // 방만든이
        });
});

app.get('/join', function(req,res){
    res.render('join.ejs',
        {
            username : req.session.username, //접속한 내아이디
            roomArray: roomArray, // 방이름
            roomID: roomID,  // 룸포트
            roomUser: roomUser, // 방만든이
            win : req.session.win,
            loss : req.session.loss
        }
    );
});
//
var socketMap = [];

var chat = io.of('/socket').on('connection', function (socket) {
    // When the client emits the 'load' event, reply with the
    // number of people in this chat room

    socket.on('tuto', function( data ){
        socketMap.push( socket );
    });

    socket.on('bh', function( data ){
        bh = data.bh+1;

        socket.broadcast.emit('checkbh', {check: bh});
        //console.log('ingame : '+ roomID[0])
    });

    socket.on('game', function( data ){
        var posx = data.x;
        var posz = data.z;

        socket.broadcast.emit('pos', {x: data.x, z: data.z});
        //console.log('ingame : '+ roomID[0])
    });

    socket.on('ballpos', function(data){
        socket.broadcast.emit('bp', {ballposx:data.ballposx, ballposy:data.ballposy, ballposz:data.ballposz})
    });

    socket.on('addroom',function(data){
        /*var roomlist = data;
        socket.broadcast.emit('roomlist', roomlist);
        console.log(roomlist);*/
    });

    socket.on('end1', function(data){
        end1 = data.user1;
        endname = data.user1name;
        console.log('end1 : '+end1);
        console.log('name : '+endname);
        User.findById(data.user1name, function(user){
            if(user) {
                console.log(User.win);
                //User.update({win: scoreTemp});
            }
        })

    });

    socket.on('end2', function(data){
        end2 = data.user2;
        console.log('end2 : '+end2)
    });

    socket.on('andro', function(data){
        socket.emit('andpos', {
                    posx: posx,
                    posy: posy,
                    posz: posz
                });
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

        roomArray.push(data.room);
        roomID.push(data.id);
        roomUser.push(data.user);
        socketMap.push(socket.id);

        console.log('map : '+socketMap);
        console.log('ID : ' +roomID);
        console.log('User : ' +roomUser);

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

    socket.on('startGame', function(data){
        console.log(data)
    })

    // Handle the sending of messages
    socket.on('msg', function(data){

        // When the server receives a message, it sends it to the other person in the room.
        socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, user: data.user, img: data.img});
        console.log('msg : '+socket.room)
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