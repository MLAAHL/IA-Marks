const mongoose = require('mongoose');

const createdSubjectSchema = new mongoose.Schema({
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    streamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stream',
        required: true
    },
    semester: {
        type: Number,
        required: true
    }
}, { _id: false });

const teacherSchema = new mongoose.Schema({
    _id: {
        type: String, // Firebase UID as _id
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    createdSubjects: [createdSubjectSchema]
}, {
    timestamps: true,
    _id: false // Don't auto-generate _id since we're using Firebase UID
});

// Add validation to ensure _id is not null
teacherSchema.pre('save', function(next) {
    if (!this._id || this._id === null || this._id === '') {
        return next(new Error('Teacher _id (Firebase UID) is required and cannot be null'));
    }
    next();
});

module.exports = mongoose.model('Teacher', teacherSchema);
