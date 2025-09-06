const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabase() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Drop the entire streams collection to remove problematic indexes
        console.log('🗑️ Dropping streams collection...');
        await mongoose.connection.db.collection('streams').drop().catch(() => {
            console.log('Collection already empty or doesn\'t exist');
        });

        // Drop the subjects collection too for clean start
        console.log('🗑️ Dropping subjects collection...');
        await mongoose.connection.db.collection('subjects').drop().catch(() => {
            console.log('Collection already empty or doesn\'t exist');
        });

        console.log('✅ Database cleaned successfully!');
        console.log('📝 Now you can run the data insertion script');
        
    } catch (error) {
        console.error('❌ Error fixing database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit();
    }
}

fixDatabase();
