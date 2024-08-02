import { Router, Request, Response } from 'express';
import statusCodes from '../constants/statusCodes';

const router = Router();

export const healthCheck = (_req: Request, res: Response): void => {
    res.status(statusCodes.success).json({
        message: 'All up and running !!',
    });
};
router.get('/api/health', healthCheck);

export default router;
