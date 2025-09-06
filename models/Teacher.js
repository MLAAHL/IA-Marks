const mongoose = require('mongoose');

const createdSubjectSchema = new mongoose.Schema({
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    subjectName: {
        type: String,
        required: true
    },
    streamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stream',
        required: true
    },
    streamName: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    semesterName: {
        type: String,
        required: true
    }
}, { _id: false });

const teacherSchema = new mongoose.Schema({
    // MongoDB ObjectId (auto-generated)
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    
    // Firebase UID (separate field)
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
        index: true
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
    timestamps: true
});

// Add validation for Firebase UID
teacherSchema.pre('save', function(next) {
    if (!this.firebaseUid || this.firebaseUid === null || this.firebaseUid === '') {
        return next(new Error('Firebase UID is required and cannot be null'));
    }
    next();
});

// Static method to find by Firebase UID
teacherSchema.statics.findByFirebaseUid = function(firebaseUid) {
    return this.findOne({ firebaseUid: firebaseUid });
};

module.exports = mongoose.model('Teacher', teacherSchema);
