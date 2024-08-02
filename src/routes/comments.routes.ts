import { Router } from 'express';
import { addComment } from '../controllers/comments.controller';

const router = Router();

router.post('/:movie_id', addComment);

export default router;
