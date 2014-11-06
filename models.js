/**
 * Created by sungho on 2014-07-21.
 */
var mongoose = require('mongoose'),
    crypto = require('crypto');

var Schema = mongoose.Schema;
var uuid = require('node-uuid');

require('date-utils');

var User = new Schema(
    {
        username : { type : String, unique: true },
        password : { type : String },
        salt : {type:String},
        level : {type : Number },
        token : {type:String},
    }
);

User.path('username').get( function(v){
    return v;
});

User.methods.saltPassword = function(v){
    //this._password = v;
    this.salt = this.makeSalt();
    this.password = this.encryptPassword(v);
}


User.methods.authenticate = function(plainText) {
    var ps1 = this.encryptPassword(plainText);
    console.log('ps1', ps1);
    console.log('ps2', this.password);
    return ps1 === this.password;
}
User.methods.makeSalt = function() {
        return Math.round((new Date().valueOf() * Math.random())) + '';
}
User.methods.encryptPassword = function(password) {

    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');

}

User.methods.isValid = function() {
        // TODO: Better validation
    return this.username && this.username.length > 0 && this.username.length < 255
        && this.password && this.password.length > 0 && this.password.length < 255;
}
User.methods.triggerSave = function(okFn, failedFn) {
    if (this.isValid()) {
        this.save(okFn);
    } else {
        failedFn();
    }
}
User.methods.makeAccessToken =  function(){
    this.token = uuid.v4();
};


mongoose.model('User', User );

exports.User = function(db) {
    return db.model('User');
};
