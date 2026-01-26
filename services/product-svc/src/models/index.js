import pool from '../config/db.js';
import { ProductModel } from './Product.js';
import { InventoryModel } from './Inventory.js';
import { UomModel } from './Uom.js';
import { ProductUomModel } from './ProductUom.js';
import { StockImportModel } from './StockImport.js';

export const initTables = async () => {
  try {

    console.log("Starting DB Initialization...");

    await pool.query(ProductModel);
    await pool.query(InventoryModel);
    await pool.query(UomModel);
    await pool.query(ProductUomModel);
    await pool.query(StockImportModel);

    console.log("All Product DB Tables Initialized Successfully.");
  } catch (err) {
    console.error("Critical Error during Product DB Initialization:", err);
    // Trong môi trường production, bạn có thể muốn dừng app nếu lỗi DB
    process.exit(1); 
  }
};