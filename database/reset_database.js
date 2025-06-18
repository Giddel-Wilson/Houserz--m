import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const dbPath = path.join(__dirname, '..', 'src', 'lib', 'database.db');

// SQL files
const schemaPath = path.join(__dirname, 'schema.sql');
const sampleDataPath = path.join(__dirname, 'sample_data.sql');

function resetDatabase() {
    return new Promise((resolve, reject) => {
        // Remove existing database file
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('Existing database removed.');
        }

        // Create new database
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('Connected to SQLite database.');
        });

        // Read and execute schema
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        db.exec(schema, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('Database schema created successfully.');

            // Read and execute sample data
            const sampleData = fs.readFileSync(sampleDataPath, 'utf8');
            
            db.exec(sampleData, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('Sample data inserted successfully.');

                db.close((err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log('Database connection closed.');
                    resolve();
                });
            });
        });
    });
}

// Run the reset
resetDatabase()
    .then(() => {
        console.log('Database reset completed successfully!');
        console.log('\nDefault login credentials:');
        console.log('Admin: admin@houserz.com / admin123');
        console.log('Agent: agent@houserz.com / agent123');
        console.log('Client: client@houserz.com / client123');
    })
    .catch((error) => {
        console.error('Error resetting database:', error);
    });
