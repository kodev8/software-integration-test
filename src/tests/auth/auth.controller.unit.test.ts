import { Response } from 'express';
import userModel from '../../models/userModel';
import authController from '../../controllers/auth.controller';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../../types/customRequests.interface';
import statusCodes from '../../constants/statusCodes';

jest.mock('../../models/userModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../middleware/winston');

describe('Auth Controller', () => {
    let req: Partial<AuthRequest>;
    let res: Partial<Response>;

    beforeEach(() => {
        req = {
            body: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.clearAllMocks();
    });

    describe('signup', () => {
        it('should return 400 if missing information', async () => {
            req.body = {
                email: 'test123@gmail.com',
            };

            await authController.signup(req as AuthRequest, res as Response);

            expect(bcrypt.hashSync).not.toHaveBeenCalled();
            expect(userModel.prototype.save).not.toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                error: 'missing information',
            });
        });

        it('should return 500 if failed to save user', async () => {
            req.body = {
                username: 'test',
                email: 'test123@gmail.com',
                password: 'testpassword',
            };

            (bcrypt.hashSync as jest.Mock).mockReturnValue('test');

            (userModel.prototype.save as jest.Mock).mockRejectedValueOnce(
                new Error('failed to save user')
            );

            await authController.signup(req as AuthRequest, res as Response);

            expect(bcrypt.hashSync).toHaveBeenCalledWith('testpassword', 10);

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                message: 'failed to save user',
            });
        });

        it('should save user and return 200', async () => {
            req.body = {
                username: 'test',
                email: 'test123@gmail.com',
                password: 'test',
            };

            (bcrypt.hashSync as jest.Mock).mockReturnValue('test');

            (userModel.prototype.save as jest.Mock).mockResolvedValueOnce({
                _id: 'mockId',
                email: 'test@example.com',
                username: 'testuser',
            });

            await authController.signup(req as AuthRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({
                _id: 'mockId',
                email: 'test@example.com',
                username: 'testuser',
            });
        });
    });
});
