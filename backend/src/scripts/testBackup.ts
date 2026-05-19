import { runBackup } from '../services/backupService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function test() {
    console.log('🧪 Starting manual backup integration test...');
    try {
        const filePath = await runBackup();
        console.log(`🎉 Success! Backup file created at: ${filePath}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Backup test failed:', error);
        process.exit(1);
    }
}

test();
