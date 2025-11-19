import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';

const router = Router();

router.post('/create-checkout-session', PaymentController.createCheckoutSession);
router.get('/confirm', PaymentController.confirmSession);

export default router;
