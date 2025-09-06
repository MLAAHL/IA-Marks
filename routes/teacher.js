// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Teacher = require('../models/Teacher');
const TeacherSubject = require('../models/TeacherSubject');
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

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.csv', '.xlsx', '.xls'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Route to upload student list for a subject
router.post('/upload-students/:subjectId', verifyFirebaseToken, upload.single('studentFile'), async (req, res) => {
    try {
        const { subjectId } = req.params;
        const firebaseUid = req.firebaseUser.uid;
        
        console.log('📤 Upload request for subjectId:', subjectId, 'teacherId:', firebaseUid);
        
        // Validate subjectId
        if (!subjectId || subjectId === 'undefined') {
            return res.status(400).json({
                success: false,
                error: 'Invalid subject ID provided'
            });
        }

        // Check if subjectId is a valid ObjectId
        if (!subjectId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subject ID format'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        // Find the teacher's subject
        const teacherSubject = await TeacherSubject.findOne({
            _id: subjectId,
            teacherId: firebaseUid
        });

        if (!teacherSubject) {
            return res.status(404).json({
                success: false,
                error: 'Subject not found or access denied'
            });
        }

        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let students = [];

        try {
            if (fileExt === '.csv') {
                // Parse CSV file
                students = await parseCSVFile(filePath);
            } else if (fileExt === '.xlsx' || fileExt === '.xls') {
                // Parse Excel file
                students = await parseExcelFile(filePath);
            }

            // Validate student data
            const validatedStudents = validateStudentData(students);
            
            if (validatedStudents.length === 0) {
                throw new Error('No valid student records found in the file');
            }

            // Update the subject with student data
            teacherSubject.students = validatedStudents.map(student => ({
                uucmsRegNo: student.uucmsRegNo,
                name: student.name,
                phone: student.phone,
                marks: {
                    C1: {
                        test1: null,
                        scaledDown: null,
                        activity: null,
                        total: null
                    },
                    C2: {
                        test2: null,
                        scaledDown: null,
                        activity: null,
                        total: null
                    },
                    grandTotal: null
                }
            }));

            teacherSubject.studentCount = validatedStudents.length;
            teacherSubject.updatedAt = new Date();

            await teacherSubject.save();

            // Clean up uploaded file
            fs.unlinkSync(filePath);

            res.json({
                success: true,
                message: `Successfully uploaded ${validatedStudents.length} students`,
                data: {
                    studentCount: validatedStudents.length,
                    students: teacherSubject.students
                }
            });

        } catch (parseError) {
            // Clean up uploaded file on error
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw parseError;
        }

    } catch (error) {
        console.error('Error uploading students:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload student list'
        });
    }
});

// Route to get students for a subject
router.get('/subject/:subjectId/students', verifyFirebaseToken, async (req, res) => {
    try {
        const { subjectId } = req.params;
        const firebaseUid = req.firebaseUser.uid;

        console.log('📋 Fetching students for subjectId:', subjectId, 'teacherId:', firebaseUid);

        // Validate subjectId
        if (!subjectId || subjectId === 'undefined') {
            return res.status(400).json({
                success: false,
                error: 'Invalid subject ID provided'
            });
        }

        // Check if subjectId is a valid ObjectId
        if (!subjectId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subject ID format'
            });
        }

        const teacherSubject = await TeacherSubject.findOne({
            _id: subjectId,
            teacherId: firebaseUid
        });

        if (!teacherSubject) {
            return res.status(404).json({
                success: false,
                error: 'Subject not found or access denied'
            });
        }

        console.log('✅ Found subject:', teacherSubject.subjectName, 'with', teacherSubject.students?.length || 0, 'students');

        res.json({
            success: true,
            data: {
                subjectName: teacherSubject.subjectName,
                studentCount: teacherSubject.studentCount,
                students: teacherSubject.students || []
            }
        });

    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch students'
        });
    }
});

// Route to update student marks
router.put('/subject/:subjectId/student/:studentIndex/marks', verifyFirebaseToken, async (req, res) => {
    try {
        const { subjectId, studentIndex } = req.params;
        const { markType, value } = req.body; // markType: 'C1.test1', 'C1.activity', 'C2.test2', etc.
        const firebaseUid = req.firebaseUser.uid;

        const teacherSubject = await TeacherSubject.findOne({
            _id: subjectId,
            teacherId: firebaseUid
        });

        if (!teacherSubject) {
            return res.status(404).json({
                success: false,
                error: 'Subject not found or access denied'
            });
        }

        const studentIdx = parseInt(studentIndex);
        if (studentIdx < 0 || studentIdx >= teacherSubject.students.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid student index'
            });
        }

        const student = teacherSubject.students[studentIdx];
        const [component, field] = markType.split('.');

        // Update the specific mark
        if (component === 'C1' || component === 'C2') {
            student.marks[component][field] = value;

            // Auto-calculate scaled down marks
            if (field === 'test1' && component === 'C1') {
                student.marks.C1.scaledDown = value ? Math.round(value / 2) : null;
            } else if (field === 'test2' && component === 'C2') {
                student.marks.C2.scaledDown = value ? Math.round(value / 2) : null;
            }

            // Calculate component totals
            if (component === 'C1') {
                const scaledDown = student.marks.C1.scaledDown;
                const activity = student.marks.C1.activity;
                if (scaledDown !== null && activity !== null) {
                    student.marks.C1.total = scaledDown + activity;
                }
            } else if (component === 'C2') {
                const scaledDown = student.marks.C2.scaledDown;
                const activity = student.marks.C2.activity;
                if (scaledDown !== null && activity !== null) {
                    student.marks.C2.total = scaledDown + activity;
                }
            }

            // Calculate grand total
            const c1Total = student.marks.C1.total;
            const c2Total = student.marks.C2.total;
            if (c1Total !== null && c2Total !== null) {
                student.marks.grandTotal = c1Total + c2Total;
            }
        }

        teacherSubject.updatedAt = new Date();
        await teacherSubject.save();

        res.json({
            success: true,
            message: 'Marks updated successfully',
            data: {
                student: student,
                updatedMarks: student.marks
            }
        });

    } catch (error) {
        console.error('Error updating marks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update marks'
        });
    }
});

// Helper function to parse CSV file
function parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        const students = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                students.push(row);
            })
            .on('end', () => {
                resolve(students);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Helper function to parse Excel file
function parseExcelFile(filePath) {
    return new Promise((resolve, reject) => {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const students = XLSX.utils.sheet_to_json(worksheet);
            resolve(students);
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to validate student data
function validateStudentData(students) {
    const validStudents = [];
    const requiredFields = ['uucmsRegNo', 'name', 'phone'];
    
    students.forEach((student, index) => {
        // Normalize field names (handle different possible column names)
        const normalizedStudent = {};
        
        // Map various possible column names to our standard fields
        Object.keys(student).forEach(key => {
            const lowerKey = key.toLowerCase().trim();
            if (lowerKey.includes('uucms') || lowerKey.includes('reg') || lowerKey.includes('registration')) {
                normalizedStudent.uucmsRegNo = student[key]?.toString().trim();
            } else if (lowerKey.includes('name') || lowerKey === 'student name') {
                normalizedStudent.name = student[key]?.toString().trim();
            } else if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('contact')) {
                normalizedStudent.phone = student[key]?.toString().trim();
            }
        });

        // Validate required fields
        const isValid = requiredFields.every(field => 
            normalizedStudent[field] && normalizedStudent[field] !== ''
        );

        if (isValid) {
            validStudents.push(normalizedStudent);
        } else {
            console.warn(`Invalid student data at row ${index + 1}:`, normalizedStudent);
        }
    });

    return validStudents;
}

// Route to add subject to teacher's dashboard
router.post('/add-subject', verifyFirebaseToken, async (req, res) => {
    try {
        const { streamId, streamName, semesterNumber, subjectId, subjectName, subjectCode } = req.body;
        const firebaseUid = req.firebaseUser.uid;
        
        console.log('📝 Adding subject for teacher:', firebaseUid, 'Subject:', subjectName);
        
        // Check if subject already exists for this teacher
        const existingSubject = await TeacherSubject.findOne({
            teacherId: firebaseUid,
            streamId: streamId,
            semesterNumber: semesterNumber,
            subjectId: subjectId
        });
        
        if (existingSubject) {
            return res.status(400).json({
                success: false,
                error: 'Subject already added to your dashboard'
            });
        }
        
        // Create new TeacherSubject document
        const teacherSubject = new TeacherSubject({
            teacherId: firebaseUid,
            streamId: streamId,
            streamName: streamName,
            semesterNumber: semesterNumber,
            subjectId: subjectId,
            subjectName: subjectName,
            subjectCode: subjectCode,
            status: 'active',
            studentCount: 0,
            students: []
        });
        
        await teacherSubject.save();
        
        console.log('✅ Subject added successfully:', teacherSubject._id);
        
        res.json({
            success: true,
            message: 'Subject added successfully',
            data: teacherSubject
        });
        
    } catch (error) {
        console.error('Error adding subject:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add subject'
        });
    }
});

// Route to get teacher's subjects (TeacherSubject documents)
router.get('/subjects', verifyFirebaseToken, async (req, res) => {
    try {
        const firebaseUid = req.firebaseUser.uid;
        
        // Fetch TeacherSubject documents for this teacher
        const teacherSubjects = await TeacherSubject.find({
            teacherId: firebaseUid,
            status: 'active'
        });

        console.log(`📚 Found ${teacherSubjects.length} subjects for teacher:`, firebaseUid);

        res.json({
            success: true,
            data: teacherSubjects
        });
        
    } catch (error) {
        console.error('Error fetching teacher subjects:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subjects'
        });
    }
});

// Route to remove subject from teacher's dashboard
router.delete('/remove-subject', verifyFirebaseToken, async (req, res) => {
    try {
        const { subjectId, streamId, semester } = req.body;
        const firebaseUid = req.firebaseUser.uid;
        
        console.log('🗑️ Removing subject for teacher:', firebaseUid, 'Subject ID:', subjectId);
        
        // Find and delete the TeacherSubject document
        const result = await TeacherSubject.findOneAndDelete({
            teacherId: firebaseUid,
            subjectId: subjectId,
            streamId: streamId,
            semesterNumber: semester
        });
        
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Subject not found in your dashboard'
            });
        }
        
        console.log('✅ Subject removed successfully:', result._id);
        
        res.json({
            success: true,
            message: 'Subject removed successfully'
        });
        
    } catch (error) {
        console.error('Error removing subject:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove subject'
        });
    }
});

module.exports = router;
