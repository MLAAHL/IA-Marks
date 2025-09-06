const express = require('express');
const router = express.Router();
const Stream = require('../models/Stream');
const Subject = require('../models/Subject');

// GET all streams (fetch from database only)
router.get('/streams', async (req, res) => {
    try {
        console.log('📚 Fetching streams from database...');
        
        const streams = await Stream.find({}).sort({ name: 1 });
        
        console.log(`✅ Found ${streams.length} streams`);
        
        res.json(streams);
    } catch (error) {
        console.error('❌ Error fetching streams:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching streams from database',
            error: error.message 
        });
    }
});

// GET specific stream by ID
router.get('/streams/:streamId', async (req, res) => {
    try {
        const stream = await Stream.findById(req.params.streamId);
        
        if (!stream) {
            return res.status(404).json({ 
                success: false, 
                message: 'Stream not found' 
            });
        }
        
        res.json({
            success: true,
            stream: stream
        });
    } catch (error) {
        console.error('❌ Error fetching stream:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching stream',
            error: error.message 
        });
    }
});

// GET subjects for specific stream and semester
router.get('/streams/:streamId/semester/:semester/subjects', async (req, res) => {
    try {
        const { streamId, semester } = req.params;
        
        console.log(`🔍 Fetching subjects for stream ${streamId}, semester ${semester}`);
        
        const subjects = await Subject.find({
            streamId: streamId,
            semester: parseInt(semester)
        }).sort({ name: 1 });

        console.log(`✅ Found ${subjects.length} subjects`);

        res.json(subjects);
    } catch (error) {
        console.error('❌ Error fetching subjects:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching subjects',
            error: error.message 
        });
    }
});

// GET semesters for a specific stream
router.get('/streams/:streamId/semesters', async (req, res) => {
    try {
        const { streamId } = req.params;
        
        console.log(`🔍 Fetching semesters for stream ${streamId}`);
        
        // Get unique semesters from subjects for this stream
        const semesters = await Subject.distinct('semester', { streamId: streamId });
        
        const semesterObjects = semesters.sort().map(sem => ({ number: sem }));
        
        console.log(`✅ Found ${semesterObjects.length} semesters`);

        res.json(semesterObjects);
    } catch (error) {
        console.error('❌ Error fetching semesters:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching semesters',
            error: error.message 
        });
    }
});

// GET all subjects (for debugging)
router.get('/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find({})
            .populate('streamId', 'name')
            .sort({ streamId: 1, semester: 1, name: 1 });
        
        res.json({
            success: true,
            subjects: subjects,
            count: subjects.length
        });
    } catch (error) {
        console.error('❌ Error fetching all subjects:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching subjects' 
        });
    }
});

// Check database status
router.get('/status', async (req, res) => {
    try {
        const streamCount = await Stream.countDocuments();
        const subjectCount = await Subject.countDocuments();
        
        res.json({
            success: true,
            database: {
                streams: streamCount,
                subjects: subjectCount,
                status: streamCount > 0 && subjectCount > 0 ? 'ready' : 'empty'
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Database connection error' 
        });
    }
});

module.exports = router;
