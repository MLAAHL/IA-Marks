// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (add this to your main server file)
const serviceAccount = require('../config/firebase-service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Middleware to verify Firebase token
async function verifyFirebaseToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No authorization token provided'
            });
        }
        
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        req.firebaseUser = decodedToken;
        next();
        
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
}

// Route to check if teacher exists and create if first time
router.post('/checkOrCreate', verifyFirebaseToken, async (req, res) => {
    try {
        const { firebaseUid, email, name, photoURL, phoneNumber } = req.body;
        
        // Validate required fields
        if (!firebaseUid || !email) {
            return res.status(400).json({
                success: false,
                error: 'Firebase UID and email are required'
            });
        }
        
        console.log(`🔍 Checking teacher with Firebase UID: ${firebaseUid}`);
        
        // Check if teacher already exists
        let teacher = await Teacher.findOne({ firebaseUid: firebaseUid });
        
        if (teacher) {
            // Teacher exists - update last login
            teacher.lastLogin = new Date();
            await teacher.save();
            
            console.log(`✅ Existing teacher logged in: ${teacher.email}`);
            
            return res.json({
                success: true,
                message: `Welcome back, ${teacher.name}!`,
                isNewUser: false,
                data: {
                    _id: teacher._id,
                    firebaseUid: teacher.firebaseUid,
                    name: teacher.name,
                    email: teacher.email,
                    photoURL: teacher.photoURL,
                    createdSubjects: teacher.createdSubjects,
                    lastLogin: teacher.lastLogin,
                    createdAt: teacher.createdAt
                }
            });
        } else {
            // First time login - create new teacher
            const newTeacher = new Teacher({
                firebaseUid: firebaseUid,
                name: name || email.split('@')[0],
                email: email,
                displayName: name,
                photoURL: photoURL || '',
                phoneNumber: phoneNumber || '',
                password: '', // Empty since Firebase handles auth
                createdSubjects: [],
                profileCompleted: false,
                isActive: true,
                role: 'teacher',
                lastLogin: new Date()
            });
            
            await newTeacher.save();
            
            console.log(`🎉 New teacher created: ${newTeacher.email}`);
            
            return res.json({
                success: true,
                message: `Welcome to IA Marks Management, ${newTeacher.name}!`,
                isNewUser: true,
                data: {
                    _id: newTeacher._id,
                    firebaseUid: newTeacher.firebaseUid,
                    name: newTeacher.name,
                    email: newTeacher.email,
                    photoURL: newTeacher.photoURL,
                    createdSubjects: newTeacher.createdSubjects,
                    lastLogin: newTeacher.lastLogin,
                    createdAt: newTeacher.createdAt
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Error in checkOrCreate:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Failed to process login. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Route to get teacher profile
router.get('/profile', verifyFirebaseToken, async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ 
            firebaseUid: req.firebaseUser.uid 
        });
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }
        
        res.json({
            success: true,
            data: teacher
        });
        
    } catch (error) {
        console.error('Error fetching teacher profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile'
        });
    }
});

module.exports = router;
