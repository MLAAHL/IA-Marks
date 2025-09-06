const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    uucmsRegNo: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
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
}, {
    timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
