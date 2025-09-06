const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Teacher = require('./models/Teacher');

// Use your MongoDB Atlas URI here
const MONGODB_URI = 'mongodb+srv://skanda:umesh@cluster0.71icrb5.mongodb.net/IA?retryWrites=true&w=majority&appName=Cluster0';

async function seedTeachers() {
    try {
        // Connect to MongoDB
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB successfully');

        // Clear existing teachers
        console.log('🗑️ Clearing existing teachers...');
        await Teacher.deleteMany({});
        console.log('✅ Existing teachers cleared');

        // Hash password
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Sample teacher data with separate Firebase UIDs
        const sampleTeachers = [
            {
                // MongoDB ObjectId will be auto-generated
                firebaseUid: 'yiB48zYHfcOCzyX5g4GHFgb6jeh1', // Your Firebase UID format
                name: 'Dr. Sarah Johnson',
                email: 'sarah.johnson@university.edu',
                password: hashedPassword,
                createdSubjects: [
                    {
                        subjectId: new mongoose.Types.ObjectId(),
                        subjectName: 'Data Structures',
                        streamId: new mongoose.Types.ObjectId(),
                        streamName: 'BCA',
                        semester: 3,
                        semesterName: 'Semester 3'
                    },
                    {
                        subjectId: new mongoose.Types.ObjectId(),
                        subjectName: 'Database Management',
                        streamId: new mongoose.Types.ObjectId(),
                        streamName: 'BCA',
                        semester: 5,
                        semesterName: 'Semester 5'
                    }
                ]
            },
            {
                firebaseUid: 'aBc123XyZ789PqR456StU321VwX890', // Another Firebase UID
                name: 'Prof. Michael Chen',
                email: 'michael.chen@university.edu',
                password: hashedPassword,
                createdSubjects: [
                    {
                        subjectId: new mongoose.Types.ObjectId(),
                        subjectName: 'Financial Accounting',
                        streamId: new mongoose.Types.ObjectId(),
                        streamName: 'BCom',
                        semester: 1,
                        semesterName: 'Semester 1'
                    }
                ]
            },
            {
                firebaseUid: 'zZy987WvU654TsR321QpO098NmL765', // Another Firebase UID
                name: 'Dr. Emily Rodriguez',
                email: 'emily.rodriguez@university.edu',
                password: hashedPassword,
                createdSubjects: [
                    {
                        subjectId: new mongoose.Types.ObjectId(),
                        subjectName: 'Marketing Management',
                        streamId: new mongoose.Types.ObjectId(),
                        streamName: 'BBA',
                        semester: 2,
                        semesterName: 'Semester 2'
                    }
                ]
            }
        ];

        // Create teachers
        console.log('🔄 Creating teachers...');
        for (const teacherData of sampleTeachers) {
            const teacher = new Teacher(teacherData);
            await teacher.save();
            console.log(`✅ Created: ${teacher.name}`);
            console.log(`   MongoDB ID: ${teacher._id}`);
            console.log(`   Firebase UID: ${teacher.firebaseUid}`);
            console.log('   ---');
        }

        console.log('\n🎉 Seed completed successfully!');
        console.log(`📊 Total teachers created: ${sampleTeachers.length}`);

    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    } finally {
        // Close connection
        console.log('🔌 Closing database connection...');
        await mongoose.disconnect();
        console.log('✅ Database connection closed');
        process.exit(0);
    }
}

// Run the seed
seedTeachers();
