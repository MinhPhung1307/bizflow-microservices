export const UomModel = `
DO $$ 
BEGIN
    -- 1. Tạo bảng uom (Đơn vị tính)
    CREATE TABLE IF NOT EXISTS uom (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        uom_name VARCHAR(50) NOT NULL, -- Ví dụ: 'Tấn', 'Bao'
        base_unit VARCHAR(50),
        owner_id UUID, -- Đơn vị này thuộc về hộ kinh doanh nào

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Tạo UNIQUE INDEX để tránh trùng lặp dữ liệu hệ thống (owner_id IS NULL)
    CREATE UNIQUE INDEX IF NOT EXISTS idx_uom_system_unique 
    ON uom (uom_name) WHERE owner_id IS NULL;

    -- 3. Chèn dữ liệu mẫu (Seed Data) dùng chung
    INSERT INTO uom (uom_name, base_unit, owner_id) 
    VALUES 
        ('Kg', 'Kg', NULL), ('Tấn', 'Kg', NULL), ('Tạ', 'Kg', NULL), ('Yến', 'Kg', NULL),
        ('Bao', 'Kg', NULL), ('Thùng', 'Cái', NULL), ('Hộp', 'Cái', NULL), ('Cuộn', 'Mét', NULL),
        ('Lít', 'Lít', NULL), ('Can', 'Lít', NULL), ('Phuy', 'Lít', NULL), ('Mét', 'Mét', NULL),
        ('Cây', 'Mét', NULL), ('Thanh', 'Mét', NULL), ('Túi', 'Cái', NULL), ('Vỉ', 'Cái', NULL),
        ('Lốc', 'Cái', NULL), ('Kiện', 'Cái', NULL), ('Thiên', 'Viên', NULL), ('Chuyến', 'Khối (m3)', NULL),
        ('Xe', 'Khối (m3)', NULL)
    ON CONFLICT (uom_name) WHERE owner_id IS NULL DO NOTHING;

END $$;
`;