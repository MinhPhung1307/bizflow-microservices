import database from './src/config/db.js';
import { createRoleTable } from './models/Role.js';
import { createUsersTable } from './models/Users.js';
import { createUomTable } from './models/Uom.js';
import { createProductTable } from './models/Product.js';
import { createCustomerTable } from './models/Customer.js';
import { createSubscriptionPlanTable } from './models/SubscriptionPlan.js';
import { createSystemConfigTable } from './models/SystemConfig.js';
import { createProductUomTable } from './models/ProductUom.js';
import { createInventoryTable } from './models/Inventory.js';
import { createSalesOrderTable } from './models/SalesOrder.js';
import { createOrderItemTable } from './models/OrderItem.js';
import { createStockImportTable } from './models/StockImport.js';
import { createAuditLogTable } from './models/AuditLog.js';
import { createDebtTransactionTable } from './models/DebtTransaction.js';
import { createDraftOrderTable } from './models/DraftOrder.js';
import { createUserApprovalTable } from './models/UserApproval.js';

const initDWH = async () => {
    console.log("🚀 Starting DWH Initialization on Neon...");
    try {
        await createRoleTable();         
        await createUsersTable();        
        await createUomTable();          
        await createProductTable();      
        await createCustomerTable();     
        await createSubscriptionPlanTable(); 
        await createSystemConfigTable(); 
        await createProductUomTable();   
        await createInventoryTable();    
        await createSalesOrderTable();   
        await createOrderItemTable();    
        await createStockImportTable();  
        await createAuditLogTable();     
        await createDebtTransactionTable(); 
        await createDraftOrderTable();   
        await createUserApprovalTable(); 

        console.log("✅ All DWH Tables Initialized Successfully on Neon.");
    } catch (error) {
        console.error("❌ Error during DWH Initialization:", error);
    } finally {
        process.exit();
    }
};

initDWH();