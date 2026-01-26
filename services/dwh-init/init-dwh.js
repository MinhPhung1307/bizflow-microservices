import { createRoleTable } from './models/Role.js';
import { createSubscriptionPlanTable } from './models/SubscriptionPlan.js';
import { createSystemConfigTable } from './models/SystemConfig.js';
import { createUsersTable } from './models/Users.js';
import { createUomTable } from './models/Uom.js';
import { createProductTable } from './models/Product.js';
import { createCustomerTable } from './models/Customer.js';
import { createAuditLogTable } from './models/AuditLog.js';
import { createUserApprovalTable } from './models/UserApproval.js';
import { createDraftOrderTable } from './models/DraftOrder.js';
import { createInventoryTable } from './models/Inventory.js';
import { createDebtTransactionTable } from './models/DebtTransaction.js';
import { createSalesOrderTable } from './models/SalesOrder.js';
import { createOrderItemTable } from './models/OrderItem.js';
import { createProductUomTable } from './models/ProductUom.js';
import { createStockImportTable } from './models/StockImport.js';
import { createTempSyncIdsTable } from './models/TempSynsId.js';

const runMigration = async () => {
    console.log("--- Bắt đầu khởi tạo cấu trúc DWH trên Neon ---");
    try {
        // Thứ tự 1: Các bảng danh mục cơ bản không có khóa ngoại phức tạp
        await createRoleTable();
        await createSubscriptionPlanTable();
        await createSystemConfigTable();

        // Thứ tự 2: Bảng người dùng (phụ thuộc vào Role)
        await createUsersTable();

        // Thứ tự 3: Các bảng phụ thuộc trực tiếp vào Users
        await createUomTable();
        await createProductTable();
        await createCustomerTable();
        await createAuditLogTable();
        await createUserApprovalTable();
        await createDraftOrderTable();

        // Thứ tự 4: Các bảng nghiệp vụ kho và tài chính
        await createInventoryTable();
        await createDebtTransactionTable();
        await createSalesOrderTable();
        await createOrderItemTable();
        await createProductUomTable();
        await createStockImportTable();

        await createTempSyncIdsTable();

        console.log("--- Khởi tạo DWH thành công ---");
    } catch (error) {
        console.error("Lỗi khi tạo schema DWH:", error);
    } finally {
        process.exit();
    }
};

runMigration();