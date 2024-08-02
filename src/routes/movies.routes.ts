import { Router } from 'express';
import { getMovies, getTopRatedMovies } from '../controllers/movies.controller';

const router = Router();
router.get('/', getMovies);
router.get('/top', getTopRatedMovies);

export default router;
