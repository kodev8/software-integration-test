import { Response, NextFunction } from 'express';
import jwt, { UserJwtPayload } from 'jsonwebtoken';
import statusCodes from '../constants/statusCodes';
import logger from './winston';
import { UserRequest } from '../types/customRequests.interface';

const verifyToken = (
    req: UserRequest,
    res: Response,
    next: NextFunction
): Response => {
    const token = req.header('Authorization');

    if (!token) {
        return res
            .status(statusCodes.unauthorized)
            .json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(
            token.split(' ')[1],
            process.env.JWT_SECRET_KEY as string
        ) as UserJwtPayload;
        req.user = decoded.user;

        logger.info('TOKEN USER: ', req.user);
        next();
    } catch (error) {
        logger.error(error);
        return res
            .status(statusCodes.unauthorized)
            .json({ error: 'Invalid token' });
    }
};

export default verifyToken;
