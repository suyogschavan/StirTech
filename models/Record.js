const mongoose = require('mongoose');

const record = new mongoose.Schema({
    trend1: {type:String, required:false},
    trend2: {type:String, required:false},
    trend3: {type:String, required:false},
    trend4: {type:String, required:false},
    trend5: {type:String, required:false},
    timestamp: {type:Date, default:Date.now},
});

module.exports = mongoose.model("Records", record);