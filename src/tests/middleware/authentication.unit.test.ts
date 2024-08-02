import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import verifyToken from '../../middleware/authentication';
import statusCodes from '../../constants/statusCodes';
import logger from '../../middleware/winston';
import { UserRequest } from '../../types/customRequests.interface';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../middleware/winston');

describe('verifyToken', () => {
    let req: Partial<UserRequest>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            header: jest.fn(),
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 401 if no token is provided', () => {
        req.header = jest.fn().mockReturnValueOnce(undefined);
        verifyToken(req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(statusCodes.unauthorized);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 401 if token is invalid', () => {
        req.header = jest.fn().mockReturnValueOnce('Bearer invalidToken');
        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
            throw new Error('Invalid token');
        });
        verifyToken(req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(statusCodes.unauthorized);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should set req.user and call next if the token is valid', () => {
        const decodedToken: jwt.UserJwtPayload = {
            user: {
                id: 'userId',
                email: 'user@example.com',
            },
        };
        (req.header as jest.Mock).mockReturnValue('Bearer validtoken');
        (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

        verifyToken(req as Request, res as Response, next);

        expect(req.user).toEqual(decodedToken.user);
        expect(logger.info).toHaveBeenCalledWith(
            'TOKEN USER: ',
            decodedToken.user
        );
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
