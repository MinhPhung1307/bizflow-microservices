import express from 'express';
import { register, verifyInternalToken } from '../controllers/AuthController.js';

const router = express.Router();

router.post('/register', register);
router.get('/introspect', verifyInternalToken);

export default router;