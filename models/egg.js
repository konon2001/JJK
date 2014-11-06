/**
 * Created by shinsungho on 14. 10. 28..
 */
var mongoose = require('mongoose'),
    crypto = require('crypto');

var Schema = mongoose.Schema;
var uuid = require('node-uuid');

require('date-utils');

var Egg = new Schema({
    owner : {type:String},
    uuid : {type:String},
    name : {type:String, unique:true},
    cpu : {type:Number},
    ram : {type:Number},
    ip : {type:String},
    spawn : { type: Date, default: Date.now }
});

Egg.methods.initialize = function(){
    this.uuid = uuid.v4();
    this.ip = "";
}

mongoose.model('Egg', Egg);
exports.Egg = function(db){
    return db.model('Egg');
};