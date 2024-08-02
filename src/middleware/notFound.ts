import { Request, Response } from 'express';
import statusCodes from '../constants/statusCodes';

const notFound = (_req: Request, res: Response): void => {
    const error = new Error('Not Found');
    res.status(statusCodes.notFound).json({ message: error.message });
};

export default notFound;
