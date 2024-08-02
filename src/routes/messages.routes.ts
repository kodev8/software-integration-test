import { Router } from 'express';
import { getMessages } from '../controllers/messages.controller';

const router: Router = Router();

router.get('/', getMessages);

export default router;
