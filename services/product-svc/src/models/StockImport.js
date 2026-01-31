export const StockImportModel = `
  CREATE TABLE IF NOT EXISTS stock_import (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INT NOT NULL,
    total_cost DECIMAL(19, 2) NOT NULL,
    import_price DECIMAL(15, 2) NOT NULL,
    supplier VARCHAR(255),
    uom_name VARCHAR(50),
    imported_by_user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
  );
`;