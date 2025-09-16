const mongoose = require('mongoose')

const urlSchema = new mongoose.Schema({
    shortCode : {type:String,required:true,unique:true},
    longUrl : {type:String,required:true},
    createAt : {type:Date,default:Date.now}
});

module.exports = mongoose.model("Url",urlSchema);