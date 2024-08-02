import { Router } from 'express';
import {
    getMessages,
    addMessage,
    editMessage,
    deleteMessage,
} from '../controllers/messages.controller';

const router: Router = Router();

router.get('/', getMessages);
router.post('/add/message', addMessage);
router.put('/edit/:messageId', editMessage);
router.delete('/delete/:messageId', deleteMessage);

export default router;
