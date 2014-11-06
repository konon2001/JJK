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
            title:'Docker',
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

require('./config')(app, io);
require('./routes')(app, io);

function handler(){
    console.log('Express server listening on port ' + app.set('port'));
}