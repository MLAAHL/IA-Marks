const mongoose = require('mongoose');

// Subject Schema
const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    credits: {
        type: Number,
        default: 3
    }
});

// Semester Schema
const semesterSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true
    },
    subjects: [subjectSchema]
});

// Stream Schema
const streamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#6366f1'
    },
    icon: {
        type: String,
        default: 'fas fa-graduation-cap'
    },
    totalSemesters: {
        type: Number,
        required: true
    },
    semesters: [semesterSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Stream', streamSchema);
