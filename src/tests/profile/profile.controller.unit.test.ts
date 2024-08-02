import { Response } from 'express';
import { editPassword } from '../../controllers/profile.controller';
import logger from '../../middleware/winston';
import statusCodes from '../../constants/statusCodes';
import { Session, SessionData } from 'express-session';
import { UserRequest } from '../../types/customRequests.interface';
import { mockUser1 } from '../users/users.mockData';

jest.mock('../../boot/database/db_connect', () => ({
    query: jest.fn(),
}));
jest.mock('../../middleware/winston', () => ({
    error: jest.fn(),
}));

import pool from '../../boot/database/db_connect';

describe('Profile Controller', () => {
    let req: Partial<UserRequest>;
    let res: Partial<Response>;

    beforeEach(() => {
        req = {
            user: { email: mockUser1.email },
            body: {},
            session: {} as Session & SessionData,
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('editPassword', () => {
        it('should return 400 if parameters are missing', async () => {
            await editPassword(req as UserRequest, res as Response);

            expect(pool.query).not.toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Missing parameters',
            });
        });

        it('should return 400 if old password and new password are the same', async () => {
            req.body = { oldPassword: 'password', newPassword: 'password' };
            await editPassword(req as UserRequest, res as Response);

            expect(pool.query).not.toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                message: 'New password cannot be equal to old password',
            });
        });

        it('should update password successfully', async () => {
            req.body = {
                oldPassword: mockUser1.password,
                newPassword: 'newpassword',
            };

            (pool.query as jest.Mock)
                .mockImplementationOnce((_sql, _params, callback) =>
                    callback(null, {
                        rows: [{ email: mockUser1.email }],
                        rowCount: 1,
                    })
                )
                .mockImplementationOnce((_sql, _params, callback) =>
                    callback(null, { rowCount: 1 })
                );

            await editPassword(req as UserRequest, res as Response);

            expect(pool.query).toHaveBeenCalledTimes(2);

            expect(pool.query).toHaveBeenNthCalledWith(
                1,
                'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
                [mockUser1.email, mockUser1.password],
                expect.any(Function)
            );
            expect(pool.query).toHaveBeenNthCalledWith(
                2,
                "UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE email = $2;",
                [req.body.newPassword, mockUser1.email],
                expect.any(Function)
            );

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Password updated',
            });
        });

        it('should handle errors during the password update process', async () => {
            req.body = {
                oldPassword: 'oldpassword',
                newPassword: 'newpassword',
            };
            (pool.query as jest.Mock)
                .mockImplementationOnce((_sql, _params, callback) =>
                    callback(null, {
                        rows: [{ email: 'user@example.com' }],
                        rowCount: 1,
                    })
                )
                .mockImplementationOnce((_sql, _params, callback) =>
                    callback(new Error('Update password failed'), null)
                );

            await editPassword(req as UserRequest, res as Response);

            expect(pool.query).toHaveBeenCalledTimes(2);

            expect(logger.error).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Exception occurred while updating password',
            });
        });

        it('should handle SQL errors during password update', async () => {
            req.body = {
                oldPassword: 'oldpassword',
                newPassword: 'newpassword',
            };
            (pool.query as jest.Mock).mockImplementationOnce(
                (_sql, _params, callback) =>
                    callback(new Error('DB error'), null)
            );

            await editPassword(req as UserRequest, res as Response);

            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(logger.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Exception occurred while updating password',
            });
        });

        it('should return 400 if old password is incorrect', async () => {
            req.body = {
                oldPassword: 'oldpassword',
                newPassword: 'newpassword',
            };
            (pool.query as jest.Mock).mockImplementationOnce(
                (_sql, _params, callback) =>
                    callback(null, { rows: [], rowCount: 0 })
            );

            await editPassword(req as UserRequest, res as Response);

            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Incorrect password',
            });
        });
    });
});
