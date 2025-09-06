const mongoose = require('mongoose');

const teacherSubjectSchema = new mongoose.Schema({
    teacherId: {
        type: String,
        required: true
    },
    streamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stream',
        required: true
    },
    semesterNumber: {
        type: Number,
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    subjectName: {
        type: String,
        required: true
    },
    subjectCode: {
        type: String,
        required: true
    },
    streamName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'completed'],
        default: 'active'
    },
    studentCount: {
        type: Number,
        default: 0
    },
    students: [{
        uucmsRegNo: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        marks: {
            C1: {
                test1: { type: Number, default: null },
                scaledDown: { type: Number, default: null },
                activity: { type: Number, default: null },
                total: { type: Number, default: null }
            },
            C2: {
                test2: { type: Number, default: null },
                scaledDown: { type: Number, default: null },
                activity: { type: Number, default: null },
                total: { type: Number, default: null }
            },
            grandTotal: { type: Number, default: null }
        }
    }],
    iaTests: [{
        name: String,
        date: Date,
        maxMarks: Number,
        status: {
            type: String,
            enum: ['scheduled', 'ongoing', 'completed'],
            default: 'scheduled'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TeacherSubject', teacherSubjectSchema);
