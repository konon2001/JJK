/**
 * Created by shinsungho on 14. 10. 23..
 */
var models  = require('../models.js');
var User    = null;

var ERROR_SIGN_UP_INVALID_INPUT_DATA    = 551;
var ERROR_SIGN_UP_INTERNAL_DB           = 552;
var ERROR_SIGN_UP_USERNAME_DUPLICATED   = 553;
var ERROR_SIGN_UP_INTERNAL_SAVE         = 554;

var ERROR_SIGN_IN_INVALID_INPUT_DATA    = 561;
var ERROR_SIGN_IN_INTERNAL_DB           = 562;
var ERROR_SIGN_IN_USERNAME_NOT_FOUND    = 563;
var ERROR_SIGN_IN_AUTHENTICATION        = 564;

var ERROR_GET_USERNAME_INVALID_INPUT    = 571;
var ERROR_GET_USERNAME_INTERNAL_DB      = 572;
var ERROR_GET_USERNAME_DUPLICATED       = 573;



exports.initialize = function( db ){
    User 	= models.User(db);
}


exports.in = function( req, res ){
    if( req.body && req.body.username && req.body.password ){
        User.findOne({username:req.body.username}, function(err, user){
            if( err ) {
                res.status( ERROR_SIGN_IN_INTERNAL_DB ).send( {msg:"server error"} );
            } else if( !user ) { //not existed user
                res.status( ERROR_SIGN_IN_USERNAME_NOT_FOUND ).send( {msg:"could not find user id"} );
            } else if (user && user.authenticate(req.body.password)) { //username, password OK
                req.session.username = user.username;
                req.session.access_token = user.token;
                req.session.win = user.win;
                req.session.loss = user.loss;
                res.redirect('/main');
                //res.send( {msg:"sign in", token:user.token});
            } else {
                res.status( ERROR_SIGN_IN_AUTHENTICATION ).send( {msg:"auth fail"} );
            }
        });
    }else{
        res.status(ERROR_SIGN_IN_INVALID_INPUT_DATA).send( {msg:"request sign in : wrong data"} );
    }
}
exports.up = function( req, res ){

    if( req.body && req.body.username && req.body.password && req.body.win && req.body.loss){
        User.findOne( {username:req.body.username }, function( err, user ){
            if( err ){
                res.status( ERROR_SIGN_UP_INTERNAL_DB ).send( err );
            }else if( user ){
                res.status( ERROR_SIGN_UP_USERNAME_DUPLICATED).send( {msg:"already registered username"} );
            }else{
                var json = {
                    username : req.body.username,
                    password : req.body.password,
                    win : req.body.win,
                    loss : req.body.loss
                }

                var user = new User( json );
                user.saltPassword( req.body.password );
                user.makeAccessToken();
                user.save( function( err, room ){
                    if( err ){
                        res.status(ERROR_SIGN_UP_INTERNAL_SAVE).send( { msg:err } );
                    }else{
                        res.redirect( '/' );
                        //res.send( {msg:"sign up"} );
                    }
                });
            }
        });
    }else{
        res.status(ERROR_SIGN_UP_INVALID_INPUT_DATA).send( {msg:"request sign up : wrong data", data:req.body} );
    }
};
exports.username = function( req, res ){
    if( req.params && req.params.username ){
        User.findOne( {username:req.params.username }, function( err, user ){
            if( err ){
                res.status( ERROR_GET_USERNAME_INTERNAL_DB ).send( err );
            }else if( user ){
                res.status( ERROR_GET_USERNAME_DUPLICATED ).send( {msg:"already registered username"} );
            }else{
                res.send();
            }
        });
    }else{
        res.status(ERROR_GET_USERNAME_INVALID_INPUT).send( );
    }
}