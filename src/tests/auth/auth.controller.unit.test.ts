import { Request, Response } from 'express';
import userModel, { IUser } from '../../models/userModel';
import authController from '../../controllers/auth.controller';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../../types/customRequests.interface';
import { Session, SessionData } from 'express-session';
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
            session: {
                user: {
                    _id: 'mockId',
                },
                cookie: {
                    originalMaxAge: 1000,
                    expires: new Date('2022-01-01'),
                },
            } as Session & SessionData,
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

    describe('signin', () => {
        it('should return 400 if missing information', async () => {
            req.body = {
                email: 'test123@gmail.com',
            };

            await authController.signin(req as AuthRequest, res as Response);

            expect(bcrypt.compareSync).not.toHaveBeenCalled();
            expect(userModel.findOne).not.toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                error: 'missing information',
            });
        });

        it('should return 400 if user not found', async () => {
            req.body = {
                email: 'test123@gmail.com',
                password: 'test',
            };

            (userModel.findOne as jest.Mock).mockResolvedValueOnce(null);

            await authController.signin(req as AuthRequest, res as Response);

            expect(bcrypt.compareSync).not.toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);

            expect(res.json).toHaveBeenCalledWith({
                message: 'User not found',
            });
        });

        it("should return 400 if email or password don't match", async () => {
            req.body = {
                email: 'test123@gmail.com',
                password: 'wrongpassword',
            };
            const mockUser = {
                _id: 'mockId',
                email: 'test@example.com',
                username: 'testuser',
                password: 'hashedpassword123',
            };

            (userModel.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

            (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

            await authController.signin(req as AuthRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                message: "Email or password don't match",
            });
        });

        it('should return 500 if failed to sign in', async () => {
            req.body = {
                email: 'test123@gmail.com',
                password: 'test',
            };

            (userModel.findOne as jest.Mock).mockRejectedValueOnce(
                new Error('Failed to get user')
            );
            await authController.signin(req as AuthRequest, res as Response);
            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Failed to get user',
            });
        });

        it('should set session and return token', async () => {
            req.body = {
                email: 'test123@gmail.com',
                password: 'test',
            };

            const mockUser: IUser = {
                _id: 'mockId',
                email: 'test123@gmail.com',
                username: 'test',
                password: 'hashedpassword123',
            } as IUser;

            (userModel.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

            (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('mockToken');

            await authController.signin(req as AuthRequest, res as Response);

            expect(bcrypt.compareSync).toHaveBeenCalledWith(
                'test',
                'hashedpassword123'
            );
            expect(jwt.sign).toHaveBeenCalledWith(
                { user: { id: 'mockId', email: 'test123@gmail.com' } },
                process.env.JWT_SECRET_KEY as string,
                { expiresIn: '1h' }
            );

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({ token: 'mockToken' });
            expect(req.session.user).toEqual({ _id: 'mockId' });
        });
    });

    describe('getUser', () => {
        it('should return 401 if not authenticated', async () => {
            req.session.user = undefined;

            await authController.getUser(req as Request, res as Response);

            expect(userModel.findById).not.toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(statusCodes.unauthorized);
            expect(res.json).toHaveBeenCalledWith({
                error: 'You are not authenticated',
            });
        });

        it('should return 400 if user is not found', async () => {
            (userModel.findById as jest.Mock).mockReturnValueOnce({
                populate: jest.fn().mockResolvedValueOnce(null),
            });

            await authController.getUser(req as AuthRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User not found',
            });
        });

        it('should return 500 if failed to get user', async () => {
            (userModel.findById as jest.Mock).mockReturnValueOnce({
                populate: jest
                    .fn()
                    .mockRejectedValueOnce(new Error('Failed to get user')),
            });

            await authController.getUser(req as AuthRequest, res as Response);
            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Failed to get user',
            });
        });

        it('should return 200 and the user', async () => {
            const mockUser: IUser = {
                _id: 'mockId',
                email: 'test@example.com',
                username: 'testuser',
                password: 'hashedpassword123',
                messages: [],
            } as IUser;
            (userModel.findById as jest.Mock).mockReturnValueOnce({
                populate: jest.fn().mockResolvedValueOnce(mockUser),
            });

            await authController.getUser(req as AuthRequest, res as Response);
            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });
    });

    describe('logout', () => {
        it('should return 200 and destroy session', () => {
            req.session.user = {
                _id: 'testing',
            };

            authController.logout(req as AuthRequest, res as Response);
            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({ message: 'Disconnected' });
            expect(req.session.user).toBeUndefined();
        });

        it('should return 200 when no user in session', () => {
            authController.logout(req as AuthRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({ message: 'Disconnected' });
        });
    });
});
