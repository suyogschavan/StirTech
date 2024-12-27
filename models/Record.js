const mongoose = require('mongoose');

const record = new mongoose.Schema({
    trend1: {type:String, required:true},
    trend2: {type:String, required:true},
    trend3: {type:String, required:true},
    trend4: {type:String, required:true},
    trend5: {type:String, required:true},
    timestamp: {type:Date, default:Date.now},
});

module.exports = mongoose.model("Records", record);