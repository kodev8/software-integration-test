import { Router } from 'express';
import { getMessages, addMessage } from '../controllers/messages.controller';

const router: Router = Router();

router.get('/', getMessages);
router.post('/add/message', addMessage);

export default router;
