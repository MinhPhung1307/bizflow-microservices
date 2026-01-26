export const InventoryModel = `
  CREATE TABLE IF NOT EXISTS inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID UNIQUE NOT NULL,
      stock INT NOT NULL CHECK (stock >= 0),
      average_cost DECIMAL(15, 2) DEFAULT 0,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
  );
`;