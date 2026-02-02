import express from 'express';
import * as AuController from '../controllers/AuthController.js';
import { loginCounter } from '../index.js'; // Import bộ đếm đã tạo ở index.js

const router = express.Router();

router.post('/register', AuController.register);

// Sửa lại route login để đếm dữ liệu
router.post('/login', async (req, res, next) => {
    // Lưu lại hàm send gốc để kiểm tra status code sau khi Controller xử lý xong
    const originalSend = res.send;
    
    res.send = function (body) {
        if (res.statusCode === 200 || res.statusCode === 201) {
            loginCounter.inc({ status: 'success' });
        } else if (res.statusCode >= 400) {
            loginCounter.inc({ status: 'fail' });
        }
        return originalSend.apply(res, arguments);
    };
    
    // Gọi controller gốc
    return AuController.login(req, res, next);
});

router.post('/logout', AuController.logout);
router.get('/introspect', AuController.verifyInternalToken);

export default router;