export const ProductModel = `
  CREATE TABLE IF NOT EXISTS product (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL,
      code VARCHAR(50), -- Mã sản phẩm hoặc Barcode
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      price DECIMAL(19, 2) NOT NULL CHECK (price >= 0),
      stock INT NOT NULL CHECK (stock >= 0),
      unit VARCHAR(50) NOT NULL,
      images JSONB DEFAULT '[]'::JSONB, -- Mảng lưu trữ các URL hình ảnh sản phẩm
      is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Sản phẩm có đang hoạt động hay không

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;