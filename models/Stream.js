const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    semesters: [{
        type: Number,
        required: true
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Stream', streamSchema);
