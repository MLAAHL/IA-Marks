const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// Import models
const Stream = require('./models/Stream');
const Subject = require('./models/Subject');

async function insertDataFromJSON() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️ Clearing existing data...');
        await Stream.deleteMany({});
        await Subject.deleteMany({});
        console.log('✅ Cleared existing data');

        // Insert Streams
        console.log('📚 Inserting streams...');
        const streamsData = [
            { "name": "BCA", "semesters": [1, 2, 3, 4, 5, 6] },
            { "name": "BBA", "semesters": [1, 2, 3, 4, 5, 6] },
            { "name": "BCom", "semesters": [1, 2, 3, 4, 5, 6] },
            { "name": "BDA", "semesters": [1, 2, 3, 4, 5, 6] },
            { "name": "BCom A and F", "semesters": [1, 2, 3, 4, 5, 6] }
        ];

        const insertedStreams = await Stream.insertMany(streamsData);
        console.log(`✅ Inserted ${insertedStreams.length} streams`);

        // Create subjects data
        console.log('📖 Creating subjects data...');
        const subjectsData = [];

        // Define subjects for each stream
        const streamSubjects = {
            "BCA": {
                1: ["Programming Fundamentals", "Mathematics-I", "Digital Electronics", "Computer Fundamentals"],
                2: ["Data Structures", "Mathematics-II", "Object Oriented Programming", "Database Management"],
                3: ["Web Development", "Software Engineering", "Computer Networks", "Operating Systems"],
                4: ["Java Programming", "System Analysis", "Mobile Computing", "Artificial Intelligence"],
                5: ["Project Management", "E-Commerce", "Cyber Security", "Cloud Computing"],
                6: ["Final Year Project", "Internship", "Seminar", "Comprehensive Viva"]
            },
            "BBA": {
                1: ["Principles of Management", "Business Mathematics", "Financial Accounting", "Business Communication"],
                2: ["Marketing Management", "Human Resource Management", "Business Statistics", "Organizational Behavior"],
                3: ["Financial Management", "Operations Management", "Business Law", "Research Methodology"],
                4: ["Strategic Management", "International Business", "Entrepreneurship", "Business Ethics"],
                5: ["Digital Marketing", "Supply Chain Management", "Corporate Governance", "Investment Analysis"],
                6: ["Project Work", "Internship", "Comprehensive Exam", "Business Simulation"]
            },
            "BCom": {
                1: ["Financial Accounting", "Business Organization", "Business Mathematics", "English Communication"],
                2: ["Cost Accounting", "Business Law", "Economics", "Business Statistics"],
                3: ["Management Accounting", "Income Tax", "Banking", "Insurance"],
                4: ["Auditing", "Corporate Accounting", "Financial Management", "Marketing"],
                5: ["Advanced Accounting", "Goods and Services Tax", "International Trade", "E-Commerce"],
                6: ["Project Work", "Comprehensive Exam", "Practical Training", "Seminar"]
            },
            "BDA": {
                1: ["Statistics Fundamentals", "Programming for Data Science", "Mathematics for Data Science", "Data Visualization"],
                2: ["Machine Learning Basics", "Database Systems", "Python Programming", "R Programming"],
                3: ["Advanced Statistics", "Big Data Analytics", "Data Mining", "Business Intelligence"],
                4: ["Deep Learning", "Natural Language Processing", "Time Series Analysis", "Predictive Analytics"],
                5: ["Advanced Machine Learning", "Data Engineering", "Cloud Analytics", "Industry Project"],
                6: ["Capstone Project", "Research Methodology", "Professional Ethics", "Internship"]
            },
            "BCom A and F": {
                1: ["Advanced Financial Accounting", "Financial Markets", "Investment Analysis", "Corporate Finance"],
                2: ["Risk Management", "Financial Planning", "Portfolio Management", "Derivatives"],
                3: ["International Finance", "Merger and Acquisitions", "Financial Modeling", "Behavioral Finance"],
                4: ["Advanced Corporate Finance", "Financial Econometrics", "Credit Analysis", "Islamic Finance"],
                5: ["Financial Technology", "Sustainable Finance", "Alternative Investments", "Research Project"],
                6: ["Dissertation", "Professional Certification", "Industry Internship", "Comprehensive Exam"]
            }
        };

        // Generate subjects for each stream
        for (const stream of insertedStreams) {
            const streamName = stream.name;
            const streamId = stream._id;
            
            if (streamSubjects[streamName]) {
                for (const semester of stream.semesters) {
                    const semesterSubjects = streamSubjects[streamName][semester] || [];
                    
                    for (const subjectName of semesterSubjects) {
                        subjectsData.push({
                            name: subjectName,
                            streamId: streamId,
                            semester: semester
                        });
                    }
                }
            }
        }

        // Insert subjects
        console.log('📖 Inserting subjects...');
        const insertedSubjects = await Subject.insertMany(subjectsData);
        console.log(`✅ Inserted ${insertedSubjects.length} subjects`);

        // Summary
        console.log('\n🎉 DATA INSERTION COMPLETE!');
        console.log('==================================');
        console.log(`📚 Streams: ${insertedStreams.length}`);
        console.log(`📖 Subjects: ${insertedSubjects.length}`);
        console.log('==================================');
        
        // Display breakdown
        for (const stream of insertedStreams) {
            const count = await Subject.countDocuments({ streamId: stream._id });
            console.log(`${stream.name}: ${count} subjects`);
        }

        console.log('\n⚠️  IMPORTANT: Delete this file (TEMP-insert-data.js) now!');
        
    } catch (error) {
        console.error('❌ Error inserting data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit();
    }
}

// Run the insertion
insertDataFromJSON();
