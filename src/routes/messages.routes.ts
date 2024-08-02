import { Router } from 'express';
import {
    getMessages,
    addMessage,
    editMessage,
    deleteMessage,
    getMessageById,
} from '../controllers/messages.controller';

const router: Router = Router();

router.get('/', getMessages);
router.post('/add/message', addMessage);
router.put('/edit/:messageId', editMessage);
router.delete('/delete/:messageId', deleteMessage);
router.get('/:messageId', getMessageById);

export default router;
