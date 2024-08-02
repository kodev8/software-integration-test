import { Request, Response } from 'express';
import { register } from '../../controllers/users.controller';

import statusCodes from '../../constants/statusCodes';

jest.mock('../../boot/database/db_connect', () => ({
    query: jest.fn(),
    connect: jest.fn(),
}));
jest.mock('jsonwebtoken');
jest.mock('../../middleware/winston', () => ({
    info: jest.fn(),
    error: jest.fn(),
}));

import pool from '../../boot/database/db_connect';
import logger from '../../middleware/winston';
import { Session, SessionData } from 'express-session';
import { PoolClient } from 'pg';
import { mockUser1 } from './users.mockData';

describe('User Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let client: Partial<PoolClient>;

    beforeEach(() => {
        req = {
            body: {},
            session: {} as Session & SessionData,
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        client = {
            query: jest.fn(),
            release: jest.fn(),
        };
        (pool.connect as jest.Mock).mockImplementation(() => client);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should return 400 if email, username, password, or country is missing', async () => {
            await register(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Missing parameters',
            });
            expect(client.query).not.toHaveBeenCalled();
            expect(client.release).not.toHaveBeenCalled();
        });

        it('should return 409 if user already exists', async () => {
            req.body = mockUser1;

            (client.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

            await register(req as Request, res as Response);

            expect(pool.connect).toHaveBeenCalledTimes(1);
            expect(client.query).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE email = $1;',
                [mockUser1.email]
            );
            expect(res.status).toHaveBeenCalledWith(
                statusCodes.userAlreadyExists
            );
            expect(res.json).toHaveBeenCalledWith({
                message: 'User already has an account',
            });
            expect(client.query).toHaveBeenCalledTimes(1);
            expect(client.release).toHaveBeenCalledTimes(1);
        });

        it('should return 200 and create user if new', async () => {
            req.body = mockUser1;
            (client.query as jest.Mock)
                .mockResolvedValueOnce({ rowCount: 0 }) // No existing user
                .mockResolvedValueOnce({ rowCount: 1 }) // User creation (insert into users)
                .mockResolvedValueOnce({ rowCount: 1 }) // Address creation (insert into addresses)
                .mockResolvedValueOnce({ rowCount: 1 }); // Commit transaction

            await register(req as Request, res as Response);

            expect(client.query).toHaveBeenNthCalledWith(
                1,
                'SELECT * FROM users WHERE email = $1;',
                [mockUser1.email]
            );
            expect(client.query).toHaveBeenNthCalledWith(2, 'BEGIN');
            expect(client.query).toHaveBeenNthCalledWith(
                3,
                `INSERT INTO users(email, username, password, creation_date) VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
                [
                    mockUser1.email,
                    mockUser1.username,
                    mockUser1.password,
                    mockUser1.creation_date,
                ]
            );
            expect(client.query).toHaveBeenNthCalledWith(
                4,
                `INSERT INTO addresses(email, country, street, city) VALUES ($1, $2, $3, $4);`,
                [
                    req.body.email,
                    req.body.country,
                    req.body.street,
                    req.body.city,
                ]
            );
            expect(client.query).toHaveBeenNthCalledWith(5, 'COMMIT');

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({ message: 'User created' });

            expect(logger.info).toHaveBeenCalledTimes(2);
            expect(logger.info).toHaveBeenNthCalledWith(1, 'USER ADDED', 1);
            expect(logger.info).toHaveBeenNthCalledWith(2, 'ADDRESS ADDED', 1);

            expect(client.query).toHaveBeenCalledTimes(5); // Check user, BEGIN, Add user, Add address, COMMIT

            expect(client.query).toHaveBeenNthCalledWith(
                1,
                'SELECT * FROM users WHERE email = $1;',
                [mockUser1.email]
            );
            expect(client.query).toHaveBeenNthCalledWith(2, 'BEGIN');
            expect(client.query).toHaveBeenNthCalledWith(
                3,
                `INSERT INTO users(email, username, password, creation_date) VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
                [
                    mockUser1.email,
                    mockUser1.username,
                    mockUser1.password,
                    mockUser1.creation_date,
                ]
            );
            expect(client.query).toHaveBeenNthCalledWith(
                4,
                `INSERT INTO addresses(email, country, street, city) VALUES ($1, $2, $3, $4);`,
                [
                    mockUser1.email,
                    mockUser1.country,
                    mockUser1.street,
                    mockUser1.city,
                ]
            );
            expect(client.query).toHaveBeenNthCalledWith(5, 'COMMIT');

            expect(client.release).toHaveBeenCalledTimes(1);
        });

        it('should return 500 and rollback on user creation error', async () => {
            req.body = mockUser1;
            (client.query as jest.Mock)
                .mockResolvedValueOnce({ rowCount: 0 }) // No existing user
                .mockRejectedValueOnce(new Error('User creation error'))
                .mockResolvedValueOnce({ rowCount: 1 }); // Rollback

            await register(req as Request, res as Response);

            expect(client.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');

            expect(logger.error).toHaveBeenCalledTimes(1);

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Exception occurred while registering',
            });
        });

        it('should return 500 and rollback on address creation error', async () => {
            req.body = mockUser1;
            (client.query as jest.Mock)
                .mockResolvedValueOnce({ rowCount: 0 }) // No existing user
                .mockResolvedValueOnce({ rowCount: 1 }) // User creation
                .mockRejectedValueOnce(new Error('Address creation error'))
                .mockResolvedValueOnce({ rowCount: 1 }); // Rollback

            await register(req as Request, res as Response);

            expect(client.query).toHaveBeenNthCalledWith(4, 'ROLLBACK');

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Exception occurred while registering',
            });

            expect(logger.error).toHaveBeenCalledTimes(1);

            expect(client.release).toHaveBeenCalledTimes(1);
        });
    });
});
