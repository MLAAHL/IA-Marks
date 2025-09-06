const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Stream = require('../models/Stream');

// POST - Add subject to teacher's createdSubjects
router.post('/add-subject', async (req, res) => {
    try {
        const { teacherId, streamId, semester, subjectId } = req.body;

        // Validate all required fields
        if (!teacherId || !streamId || !semester || !subjectId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Validate teacherId is not null or empty
        if (teacherId === 'null' || teacherId === 'undefined' || teacherId.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid teacher ID. Please ensure you are properly logged in.' 
            });
        }

        console.log('🔍 Looking for teacher with ID:', teacherId);

        // Find teacher by Firebase UID
        let teacher = await Teacher.findById(teacherId);
        
        if (!teacher) {
            console.log('👤 Creating new teacher record for:', teacherId);
            
            // Create teacher with proper Firebase UID
            teacher = new Teacher({
                _id: teacherId, // Use Firebase UID as _id
                name: 'Teacher',
                email: `${teacherId}@example.com`, // Temporary email
                password: 'hashed_password',
                createdSubjects: []
            });
        }

        // Check for duplicates
        const existingSubject = teacher.createdSubjects.find(cs => 
            cs.subjectId.toString() === subjectId && 
            cs.streamId.toString() === streamId && 
            cs.semester === parseInt(semester)
        );

        if (existingSubject) {
            return res.status(400).json({ 
                success: false, 
                message: 'Subject already added to your queue' 
            });
        }

        // Add subject reference
        teacher.createdSubjects.push({
            subjectId: new mongoose.Types.ObjectId(subjectId),
            streamId: new mongoose.Types.ObjectId(streamId),
            semester: parseInt(semester)
        });

        const savedTeacher = await teacher.save();
        
        console.log('✅ Subject added to teacher:', teacherId);
        console.log('📝 Total subjects:', savedTeacher.createdSubjects.length);

        res.json({
            success: true,
            message: 'Subject added successfully',
            totalSubjects: savedTeacher.createdSubjects.length
        });

    } catch (error) {
        console.error('❌ Error adding subject:', error);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Duplicate key error. Please try logging out and logging back in.' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// GET - Fetch teacher's created subjects
router.get('/:teacherId/subjects', async (req, res) => {
    try {
        const teacherId = req.params.teacherId;
        
        console.log('🔍 Fetching subjects for teacher:', teacherId);

        const teacher = await Teacher.findById(teacherId)
            .populate({
                path: 'createdSubjects.subjectId',
                select: 'name'
            })
            .populate({
                path: 'createdSubjects.streamId',
                select: 'name'
            });

        if (!teacher) {
            console.log('⚠️ Teacher not found:', teacherId);
            return res.json({ 
                success: true, 
                subjects: [],
                totalSubjects: 0,
                message: 'No teacher found'
            });
        }

        console.log('📚 Found teacher with', teacher.createdSubjects.length, 'subjects');

        // Filter valid subjects
        const validSubjects = teacher.createdSubjects.filter(cs => 
            cs.subjectId && cs.streamId
        );

        // Format subjects for frontend
        const formattedSubjects = validSubjects.map((cs, index) => ({
            id: cs.subjectId._id.toString(),
            serialNumber: index + 1,
            name: cs.subjectId.name.toUpperCase(),
            code: `${cs.streamId.name}${cs.semester}01`,
            stream: cs.streamId.name,
            streamColor: getStreamColor(cs.streamId.name),
            streamIcon: getStreamIcon(cs.streamId.name),
            semester: cs.semester,
            addedTime: new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        }));

        res.json({
            success: true,
            subjects: formattedSubjects,
            totalSubjects: formattedSubjects.length
        });

    } catch (error) {
        console.error('❌ Error fetching subjects:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// DELETE - Remove subject from teacher's createdSubjects
router.delete('/:teacherId/subjects/:subjectId', async (req, res) => {
    try {
        const { teacherId, subjectId } = req.params;
        
        console.log('🗑️ Removing subject:', subjectId, 'for teacher:', teacherId);

        // Find teacher by Firebase UID
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            console.log('❌ Teacher not found:', teacherId);
            return res.status(404).json({ 
                success: false, 
                message: 'Teacher not found' 
            });
        }

        console.log('📚 Teacher has', teacher.createdSubjects.length, 'subjects before removal');

        // Find the subject in createdSubjects array
        const subjectIndex = teacher.createdSubjects.findIndex(cs => 
            cs.subjectId.toString() === subjectId
        );

        if (subjectIndex === -1) {
            console.log('❌ Subject not found in queue:', subjectId);
            return res.status(404).json({
                success: false,
                message: 'Subject not found in queue'
            });
        }

        // Remove the subject from array
        teacher.createdSubjects.splice(subjectIndex, 1);
        
        // Mark as modified (important for Mongoose arrays)
        teacher.markModified('createdSubjects');

        // Save the updated teacher document
        await teacher.save();
        
        console.log('✅ Subject removed successfully');
        console.log('📚 Teacher now has', teacher.createdSubjects.length, 'subjects');

        res.json({
            success: true,
            message: 'Subject removed successfully',
            remainingSubjects: teacher.createdSubjects.length
        });

    } catch (error) {
        console.error('❌ Error removing subject:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});


// Helper functions for stream colors and icons
function getStreamColor(streamName) {
    const colors = {
        'BCA': '#8b5cf6',
        'BBA': '#10b981',
        'BCom': '#f59e0b',
        'BDA': '#ec4899',
        'BCom A and F': '#3b82f6'
    };
    return colors[streamName] || '#6366f1';
}

function getStreamIcon(streamName) {
    const icons = {
        'BCA': 'fas fa-laptop-code',
        'BBA': 'fas fa-chart-line',
        'BCom': 'fas fa-coins',
        'BDA': 'fas fa-database',
        'BCom A and F': 'fas fa-calculator'
    };
    return icons[streamName] || 'fas fa-graduation-cap';
}

module.exports = router;
