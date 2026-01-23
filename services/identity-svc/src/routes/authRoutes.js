import express from 'express';
import * as AuController from '../controllers/AuthController.js';

const router = express.Router();

router.post('/register', AuController.register);
router.post('/login', AuController.login);
router.post('/logout', AuController.logout);

router.get('/introspect', AuController.verifyInternalToken);

export default router;