// Lưu thông tin cơ bản về sản phẩm.

import database from '../database/db.js';

export const createProductUomTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS product_uom (
                id SERIAL PRIMARY KEY,
                product_id UUID REFERENCES product(id) ON DELETE CASCADE,
                uom_id INTEGER REFERENCES uom(id),
                conversion_factor DECIMAL(10, 2) NOT NULL, -- 1 đơn vị này = bao nhiêu đơn vị cơ sở?
                is_base_unit BOOLEAN DEFAULT false, -- Có phải đơn vị nhỏ nhất để tính kho không?
                selling_price DECIMAL(15, 2), -- Giá bán riêng cho đơn vị này (ví dụ mua cả tấn rẻ hơn mua lẻ kg)

                CONSTRAINT unique_product_uom UNIQUE (product_id, uom_id)
            );
        `;
        await database.query(query);

        const seedQuery = `
            DO $$
            DECLARE
                v_prod_id UUID;
                v_uom_id INTEGER;
            BEGIN
                -- 1. GIẢ SỬ CÓ SẢN PHẨM 'Xi măng' (Đơn vị gốc là Kg)
                SELECT id INTO v_prod_id FROM product WHERE name ILIKE '%Xi măng%' LIMIT 1;
                
                IF v_prod_id IS NOT NULL THEN
                    -- Thêm đơn vị gốc: 1 Kg = 1 Kg
                    SELECT id INTO v_uom_id FROM uom WHERE uom_name = 'Kg' LIMIT 1;
                    INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit)
                    VALUES (v_prod_id, v_uom_id, 1, true) ON CONFLICT DO NOTHING;

                    -- Thêm quy đổi: 1 Bao = 50 Kg
                    SELECT id INTO v_uom_id FROM uom WHERE uom_name = 'Bao' LIMIT 1;
                    INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit)
                    VALUES (v_prod_id, v_uom_id, 50.00, false) ON CONFLICT DO NOTHING;

                    -- Thêm quy đổi: 1 Tấn = 1000 Kg
                    SELECT id INTO v_uom_id FROM uom WHERE uom_name = 'Tấn' LIMIT 1;
                    INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit)
                    VALUES (v_prod_id, v_uom_id, 1000.00, false) ON CONFLICT DO NOTHING;
                END IF;

                -- 2. GIẢ SỬ CÓ SẢN PHẨM 'Sắt' hoặc 'Ống nhựa' (Đơn vị gốc là Mét)
                SELECT id INTO v_prod_id FROM product WHERE name ILIKE '%Sắt%' OR name ILIKE '%Ống%' LIMIT 1;

                IF v_prod_id IS NOT NULL THEN
                    -- Thêm đơn vị gốc: 1 Mét = 1 Mét
                    SELECT id INTO v_uom_id FROM uom WHERE uom_name = 'Mét' LIMIT 1;
                    INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit)
                    VALUES (v_prod_id, v_uom_id, 1, true) ON CONFLICT DO NOTHING;

                    -- Thêm quy đổi: 1 Cây = 6 Mét
                    SELECT id INTO v_uom_id FROM uom WHERE uom_name = 'Cây' LIMIT 1;
                    INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit)
                    VALUES (v_prod_id, v_uom_id, 6.00, false) ON CONFLICT DO NOTHING;
                END IF;

                -- 3. GIẢ SỬ CÓ SẢN PHẨM 'Sơn' (Đơn vị gốc là Lít)
                SELECT id INTO v_prod_id FROM product WHERE name ILIKE '%Sơn%' LIMIT 1;

                IF v_prod_id IS NOT NULL THEN
                    -- Thêm đơn vị gốc: 1 Lít = 1 Lít
                    SELECT id INTO v_uom_id FROM uom WHERE uom_name = 'Lít' LIMIT 1;
                    INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit)
                    VALUES (v_prod_id, v_uom_id, 1, true) ON CONFLICT DO NOTHING;

                    -- Thêm quy đổi: 1 Can = 5 Lít
                    SELECT id INTO v_uom_id FROM uom WHERE uom_name = 'Can' LIMIT 1;
                    INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit)
                    VALUES (v_prod_id, v_uom_id, 5.00, false) ON CONFLICT DO NOTHING;
                END IF;

            END $$;
        `;
        await database.query(seedQuery);
    } catch (error) {
        console.error('Error creating product_uom table:', error); 
        process.exit(1);
    }
}