import db from '../config/db.js';
import { getChannel } from '../config/rabbitmq.js';

export const getAllProducts = async (req, res) => {
  try {
    const owner_id = req.user.owner_id ? req.user.owner_id : req.user.id;
    
    const result = await db.query(
      'SELECT * FROM product WHERE owner_id = $1 ORDER BY created_at DESC',
      [owner_id]
    );
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    res.status(500).json({ success: false, message: 'Lỗi Server' });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.id; // SỬA: id -> userId

  try {
    const result = await db.query('SELECT * FROM product WHERE id = $1 AND owner_id = $2', [id, owner_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    res.status(500).json({ success: false, message: 'Lỗi Server' });
  }
};

export const createProduct = async (req, res) => {
    try {
        const { name, price, stock, unit, category_id, description, code, images } = req.body;
        const owner_id = req.user.id;

        // 1. Bắt đầu Transaction
        await db.query('BEGIN');

        // 2. Thêm vào bảng Product
        const productQuery = `
            INSERT INTO product (name, price, stock, unit, category_id, description, images, owner_id, code) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *
        `;
        const values = [name, price, stock || 0, unit, category_id, description, images, owner_id, code];
        const newProductRes = await db.query(productQuery, values);
        const newProduct = newProductRes.rows[0];

        // 3. TỰ ĐỘNG THÊM VÀO BẢNG INVENTORY
        // Nếu người dùng nhập stock ban đầu thì dùng số đó, nếu không thì để 0
        const initialStock = stock ? parseInt(stock) : 0;
        
        const inventoryQuery = `
            INSERT INTO inventory (product_id, stock, last_updated_at)
            VALUES ($1, $2, NOW())
        `;
        await db.query(inventoryQuery, [newProduct.id, initialStock]);

        // 4. Lưu thành công -> Commit Transaction
        await db.query('COMMIT');

        // 5. Đồng bộ sang AI (RAG)
        // Lưu ý: Gọi sau khi commit để đảm bảo dữ liệu đã an toàn trong DB
        // AIService.syncProductsToAI(owner_id, [newProduct]);

        return res.status(201).json({ 
            success: true, 
            message: "Tạo sản phẩm và kho hàng thành công",
            data: newProduct 
        });

    } catch (error) {
        // 6. Nếu có lỗi -> Rollback (Hủy toàn bộ thay đổi)
        await db.query('ROLLBACK');
        console.error("Create Product Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID sản phẩm
        const { name, price, stock, unit, category_id, description, code, images } = req.body;
        const owner_id = req.user.id;
        const oldProductRes = await db.query('SELECT price, name FROM product WHERE id = $1', [id]);
        const oldData = oldProductRes.rows[0];

        // 1. Validate cơ bản
        if (!id) return res.status(400).json({ success: false, message: "Thiếu ID sản phẩm" });

        // 2. Bắt đầu Transaction
        await db.query('BEGIN');

        // 3. Cập nhật bảng PRODUCT
        // Lưu ý: Ta vẫn update cột stock ở đây để giữ dữ liệu hiển thị cũ
        const updateProductQuery = `
            UPDATE product 
            SET name = $1, price = $2, stock = $3, unit = $4, category_id = $5, 
                description = $6, images = $7, code = $8, updated_at = NOW()
            WHERE id = $9 AND owner_id = $10
            RETURNING *
        `;
        
        // Chuyển stock về số nguyên, nếu không nhập thì giữ nguyên giá trị cũ (logic này frontend nên gửi đủ)
        // Ở đây giả định req.body.stock luôn có giá trị mới nhất
        const stockVal = stock !== undefined ? parseInt(stock) : 0;

        const values = [name, price, stockVal, unit, category_id, description, images, code, id, owner_id];
        const result = await db.query(updateProductQuery, values);

        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm hoặc không có quyền sửa" });
        }

        const updatedProduct = result.rows[0];

        // 4. ĐỒNG BỘ CẬP NHẬT BẢNG INVENTORY
        // Nếu người dùng có gửi thông tin stock mới, ta cập nhật luôn bảng Inventory
        if (stock !== undefined) {
            // Kiểm tra xem đã có dòng inventory chưa
            const checkInv = await db.query(`SELECT id FROM inventory WHERE product_id = $1`, [id]);
            
            if (checkInv.rows.length > 0) {
                // Update
                await db.query(`UPDATE inventory SET stock = $1, last_updated_at = NOW() WHERE product_id = $2`, [stockVal, id]);
            } else {
                // Insert (phòng hờ dữ liệu cũ chưa có)
                await db.query(`INSERT INTO inventory (product_id, stock, last_updated_at) VALUES ($1, $2, NOW())`, [id, stockVal]);
            }
        }

        // await saveLog(database, {
        //   user_id: owner_id,
        //   action: 'UPDATE_PRODUCT',
        //   entity_type: 'product',
        //   entity_id: id,
        //   old_value: oldData,
        //   new_value: { name, price }
        // });

        // 5. Commit Transaction
        await db.query('COMMIT');

        // 6. Sync lại với AI (RAG)
        // AIService.syncProductsToAI(owner_id, [updatedProduct]);

        return res.status(200).json({ 
            success: true, 
            message: "Cập nhật sản phẩm thành công", 
            data: updatedProduct 
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Update Product Error:", error);
        return res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.id; // SỬA: id -> userId

  try {
    const productRes = await db.query(
        'SELECT name, price, code FROM product WHERE id = $1 AND owner_id = $2',
        [id, owner_id]
    );
    if (productRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    const oldData = productRes.rows[0];
    await db.query('DELETE FROM product WHERE id = $1 AND owner_id = $2 RETURNING id', [id, owner_id]);

    // await saveLog(database, {
    //     user_id: owner_id,
    //     action: 'DELETE_PRODUCT',
    //     entity_type: 'product',
    //     entity_id: id,
    //     old_value: oldData
    // });

    res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm'
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ success: false, message: 'Lỗi xóa sản phẩm' });
  }
};

// Lấy tất cả đơn vị tính (UoM) cho Owner
export const getAllUoms = async (req, res) => {
    const userId = req.user.id; 

    try {
        const query = `
            SELECT id, owner_id, uom_name
            FROM uom 
            WHERE owner_id = $1 OR owner_id IS NULL 
            ORDER BY 
                CASE WHEN owner_id IS NULL THEN 0 ELSE 1 END, -- Hiện đơn vị hệ thống lên trước
                uom_name ASC
        `;
        
        const result = await db.query(query, [userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error in getAllUoms:", error);
        res.status(500).json({ message: "Không thể lấy danh sách đơn vị tính" });
    }
};

// Lấy danh sách UoM thuộc về cửa hàng của Owner
export const getStoreUoms = async (req, res) => {
    const owner_id = req.user.id; // Lấy từ token
    try {
        // Lấy tất cả UoM thuộc về các sản phẩm của Owner này
        const query = `
            SELECT DISTINCT u.uom_name, u.base_unit, pu.conversion_factor, u.id as uom_id
            FROM product_uom pu
            JOIN uom u ON pu.uom_id = u.id
            JOIN product p ON pu.product_id = p.id
            WHERE p.owner_id = $1
        `;
        const result = await db.query(query, [owner_id]);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Get Store Uoms Error:", error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đơn vị' });
    }
};

export const importStock = async (req, res) => {
    const owner_id = req.user.id; 
    const { 
        id, isNewProduct, code, name, category, price, 
        quantity, importPrice, supplier, unit,
        newUomName, conversionFactor 
    } = req.body;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        let productId = id;

        // BƯỚC 1: Xử lý thông tin Sản phẩm
        if (isNewProduct || !productId) {
            const insertProductSql = `
                INSERT INTO product (owner_id, code, name, category, price, stock, unit, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, 0, $6, NOW(), NOW())
                RETURNING id;
            `;
            const productRes = await client.query(insertProductSql, [owner_id, code, name, category, price, unit]);
            productId = productRes.rows[0].id;
        } else {
            // Nếu sản phẩm cũ, cập nhật lại giá bán lẻ mới và đơn vị cơ sở nếu cần
            await client.query(
                `UPDATE product SET price = $1, unit = $2, updated_at = NOW() WHERE id = $3`,
                [price, unit, productId]
            );
        }

        // BƯỚC 2: Xử lý bảng UOM (Lưu mối quan hệ Đơn vị nhập -> Đơn vị cơ sở)
        const findUomSql = `
            SELECT id FROM uom 
            WHERE uom_name = $1 AND (owner_id = $2 OR owner_id IS NULL)
            LIMIT 1;
        `;
        let uomRes = await client.query(findUomSql, [newUomName, owner_id]);
        let uomId;

        if (uomRes.rows.length === 0) {
            // CẬP NHẬT: Thêm cả base_unit vào bảng uom khi tạo mới đơn vị cho Owner
            const insertUomSql = `
                INSERT INTO uom (uom_name, base_unit, owner_id) 
                VALUES ($1, $2, $3) 
                RETURNING id;
            `;
            const newUom = await client.query(insertUomSql, [newUomName, unit, owner_id]);
            uomId = newUom.rows[0].id;
        } else {
            uomId = uomRes.rows[0].id;
            await client.query(
                `UPDATE uom SET base_unit = $1 WHERE id = $2 AND owner_id = $3`,
                [unit, uomId, owner_id]
            );
        }

        // BƯỚC 3: Xử lý bảng PRODUCT_UOM (Quy đổi cho sản phẩm cụ thể)
        
        // 3.1. Đảm bảo đơn vị cơ sở (hệ số 1) luôn tồn tại cho sản phẩm này
        // Lấy ID của đơn vị cơ sở
        let baseUomRes = await client.query(findUomSql, [unit, owner_id]);
        if (baseUomRes.rows.length > 0) {
            await client.query(`
                INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit, selling_price)
                VALUES ($1, $2, 1, true, $3)
                ON CONFLICT (product_id, uom_id) DO UPDATE SET is_base_unit = true;
            `, [productId, baseUomRes.rows[0].id, price]);
        }

        // 3.2. Lưu/Cập nhật đơn vị quy đổi đang dùng để nhập hàng (ví dụ: Thùng)
        const upsertProductUomSql = `
            INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit, selling_price)
            VALUES ($1, $2, $3, false, $4)
            ON CONFLICT (product_id, uom_id) DO UPDATE 
            SET conversion_factor = EXCLUDED.conversion_factor,
                selling_price = EXCLUDED.selling_price;
        `;
        await client.query(upsertProductUomSql, [productId, uomId, conversionFactor, price]);

        // BƯỚC 4: Cập nhật tồn kho (quy đổi về đơn vị nhỏ nhất)
        const addedStock = Number(quantity) * Number(conversionFactor);
        await client.query(
            'UPDATE product SET stock = stock + $1 WHERE id = $2',
            [addedStock, productId]
        );

        // BƯỚC 5: Ghi lịch sử nhập kho
        const total_cost = Number(quantity) * Number(importPrice);
        await client.query(`
            INSERT INTO stock_import (product_id, owner_id, quantity, import_price, total_cost, supplier, uom_name, imported_by_user_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());
        `, [productId, owner_id, quantity, importPrice, total_cost, supplier, newUomName, owner_id]);

        const logData = {
            user_id: owner_id,
            action: 'IMPORT_STOCK',
            entity_type: 'inventory',
            entity_id: productId,
            new_value: { 
                productId,
                qty: quantity, 
                price: importPrice, 
                total: Number(quantity) * Number(importPrice) 
            },
            timestamp: new Date()
        };

        const mqChannel = getChannel();
        if (mqChannel) {
            const isSent = mqChannel.sendToQueue(
                'system_audit_logs',
                Buffer.from(JSON.stringify(logData)),
                { persistent: true } // Đảm bảo tin nhắn được lưu xuống đĩa nếu RabbitMQ restart
            );
            if (!isSent) {
                throw new Error("RabbitMQ buffer full - Không thể gửi log");
            }
            console.log("Đã đẩy log vào hàng đợi RabbitMQ");
        }
        else {
            throw new Error("Không thể kết nối RabbitMQ - Hủy giao dịch");
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Nhập hàng và cập nhật đơn vị thành công!' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Lỗi importStock:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    } finally {
        client.release();
    }
};

// Lấy danh sách đơn vị tính (UoM) của một sản phẩm cụ thể
export const getProductUoms = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            `SELECT pu.*, u.uom_name 
             FROM product_uom pu 
             JOIN uom u ON pu.uom_id = u.id 
             WHERE pu.product_id = $1`, 
            [id]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy đơn vị sản phẩm' });
    }
};