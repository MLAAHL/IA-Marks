const express = require('express');
const router = express.Router();

// Teacher's subjects management
const TeacherSubject = require('../models/TeacherSubject');

// Add subject to teacher's queue
router.post('/add-to-queue', async (req, res) => {
    try {
        const { streamId, semesterNumber, subjectId, teacherId } = req.body;
        
        // Check if subject already added
        const existingSubject = await TeacherSubject.findOne({
            teacherId,
            streamId,
            semesterNumber,
            subjectId
        });
        
        if (existingSubject) {
            return res.status(400).json({ message: 'Subject already added to your queue' });
        }
        
        const teacherSubject = new TeacherSubject({
            teacherId,
            streamId,
            semesterNumber,
            subjectId,
            status: 'active',
            createdAt: new Date()
        });
        
        await teacherSubject.save();
        res.json({ message: 'Subject added to queue successfully', subject: teacherSubject });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get teacher's subjects
router.get('/teacher/:teacherId', async (req, res) => {
    try {
        const subjects = await TeacherSubject.find({ 
            teacherId: req.params.teacherId,
            status: 'active'
        }).populate('streamId').populate('subjectId');
        
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
