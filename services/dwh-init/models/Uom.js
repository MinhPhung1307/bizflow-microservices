// Lưu thông tin cơ bản về sản phẩm.

import database from '../database/db.js';

export const createUomTable = async () => {
    try {
        // 1. Tạo bảng uom
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS uom (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                uom_name VARCHAR(50) NOT NULL, -- Ví dụ: 'Tấn', 'Bao'
                base_unit VARCHAR(50),
                owner_id UUID, -- Đơn vị này thuộc về hộ kinh doanh nào
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        await database.query(createTableQuery);

        // 2. Tạo UNIQUE INDEX để tránh trùng lặp dữ liệu hệ thống (owner_id IS NULL)
        const createIndexQuery = `
            CREATE UNIQUE INDEX IF NOT EXISTS idx_uom_system_unique 
            ON uom (uom_name) WHERE owner_id IS NULL;
        `;
        await database.query(createIndexQuery);

        // 3. Dữ liệu mẫu (Seed Data) dùng chung cho tất cả Owner
        const seedUnits = [
            { name: 'Kg', base: 'Kg' },
            { name: 'Tấn', base: 'Kg' },
            { name: 'Tạ', base: 'Kg' },
            { name: 'Yến', base: 'Kg' },
            { name: 'Bao', base: 'Kg' },
            { name: 'Thùng', base: 'Cái' },
            { name: 'Hộp', base: 'Cái' },
            { name: 'Cuộn', base: 'Mét' },
            { name: 'Lít', base: 'Lít' },
            { name: 'Can', base: 'Lít' },
            { name: 'Phuy', base: 'Lít' },
            { name: 'Mét', base: 'Mét' },
            { name: 'Cây', base: 'Mét' },
            { name: 'Thanh', base: 'Mét' },
            { name: 'Túi', base: 'Cái' },
            { name: 'Vỉ', base: 'Cái' },
            { name: 'Lốc', base: 'Cái' },
            { name: 'Kiện', base: 'Cái' },
            { name: 'Thiên', base: 'Viên' },
            { name: 'Chuyến', base: 'Khối (m3)' },
            { name: 'Xe', base: 'Khối (m3)' },
        ];
    
        // Chuyển mảng thành định dạng: ('Kg', NULL), ('Tấn', NULL)...
        const values = seedUnits.map(unit => `('${unit.name}', '${unit.base}', NULL)`).join(', ');

        const seedQuery = `
            INSERT INTO uom (uom_name, base_unit, owner_id) 
            VALUES ${values}
            ON CONFLICT (uom_name) WHERE owner_id IS NULL DO NOTHING;
        `;
        await database.query(seedQuery);
    } catch (error) {
        console.error('Error creating Uom table:', error); 
        process.exit(1);
    }
}