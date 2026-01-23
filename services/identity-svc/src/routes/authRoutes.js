import express from 'express';
import { register, login, verifyInternalToken } from '../controllers/AuthController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/introspect', verifyInternalToken);

export default router;