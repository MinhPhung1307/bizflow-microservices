import database from '../database/db.js';

export const createTempSyncIdsTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS temp_sync_ids (
                id SERIAL PRIMARY KEY,
                record_id TEXT,      -- Lưu UUID hoặc ID số
                table_name VARCHAR(50),
                synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating Temp syns ids table:', error); 
        process.exit(1);
    }
}