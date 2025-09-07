const express = require('express');
const router = express.Router();

// Teacher's subjects management
const Teacher = require('../models/Teacher');

// Add subject to teacher's queue
router.post('/add-to-queue', async (req, res) => {
    try {
        const { streamId, semesterNumber, subjectId, teacherId } = req.body;
        
        // Find the teacher
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        // Check if subject already added
        const existingSubject = teacher.createdSubjects.find(subject => 
            subject.streamId.toString() === streamId &&
            subject.semesterNumber === semesterNumber &&
            subject.subjectId.toString() === subjectId
        );
        
        if (existingSubject) {
            return res.status(400).json({ message: 'Subject already added to your queue' });
        }
        
        // Add subject to teacher's createdSubjects array
        const newSubject = {
            streamId,
            semesterNumber,
            subjectId,
            status: 'active',
            studentCount: 0,
            students: [],
            iaTests: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        teacher.createdSubjects.push(newSubject);
        await teacher.save();
        
        res.status(201).json({
            message: 'Subject added to queue successfully',
            subject: teacher.createdSubjects[teacher.createdSubjects.length - 1]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get teacher's subjects
router.get('/teacher/:teacherId', async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.teacherId)
            .populate('createdSubjects.streamId')
            .populate('createdSubjects.subjectId');
        
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        const activeSubjects = teacher.createdSubjects.filter(subject => subject.status === 'active');
        
        res.json(activeSubjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
