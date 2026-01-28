import express from 'express';
import { getCustomers, createCustomer, updateCustomer } from '../controllers/CustomerController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getCustomers);
router.post('/', verifyToken, createCustomer);
router.put('/:id', verifyToken, updateCustomer);

export default router;