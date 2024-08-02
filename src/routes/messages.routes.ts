import { Router } from 'express';
import {
    getMessages,
    addMessage,
    editMessage,
} from '../controllers/messages.controller';

const router: Router = Router();

router.get('/', getMessages);
router.post('/add/message', addMessage);
router.put('/edit/:messageId', editMessage);

export default router;
