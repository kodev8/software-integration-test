import request from 'supertest';
import { Application } from 'express';
import { buildDB, teardownConnections } from '../../../utils/config/buildDB';
import { registerCoreMiddleWare } from '../../boot/setup';
import { mockUser1, mockUser2, stableUser1 } from './users.mockData';
import logger from '../../middleware/winston';
import statusCodes from '../../constants/statusCodes';
import pool from '../../boot/database/db_connect';
import jwt from 'jsonwebtoken';

describe('Users Routes Integration Tests', () => {
    let app: Application;
    let poolQuerySpy: jest.SpyInstance;
    let poolConnectSpy: jest.SpyInstance;
    let clientQuerySpy: jest.SpyInstance;
    let jwtSignSpy: jest.SpyInstance;
    beforeAll(async () => {
        await buildDB({ users: true });
        app = registerCoreMiddleWare();

        poolQuerySpy = jest.spyOn(pool, 'query');
        jwtSignSpy = jest.spyOn(jwt, 'sign');
    });

    beforeEach(async () => {
        logger.info = jest.fn();
        logger.error = jest.fn();
    });

    afterEach(async () => {
        // jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await teardownConnections();
    });

    describe('POST /users/register', () => {
        beforeEach(() => {
            const originalPoolConnect = pool.connect;
            poolConnectSpy = jest.spyOn(pool, 'connect');
            poolConnectSpy.mockImplementationOnce(async () => {
                try {
                    // Call the original pool.connect and await the result
                    const client = await originalPoolConnect.call(pool);

                    // Ensure client is valid before spying on client.query
                    if (client && typeof client.query === 'function') {
                        // Spy on client.query
                        clientQuerySpy = jest.spyOn(client, 'query');
                    } else {
                        throw new Error('Client or client.query is not valid');
                    }

                    // Return the client
                    return client;
                } catch (error) {
                    logger.error(
                        'Error in pool.connect mock implementation:',
                        error
                    );
                    throw error;
                }
            });
        });

        afterAll(() => {
            poolConnectSpy.mockRestore();
        });

        it('should successfully register a user', async () => {
            const response = await request(app)
                .post('/users/register')
                .send(mockUser1);

            expect(clientQuerySpy).toHaveBeenCalledTimes(5);
            expect(clientQuerySpy).toHaveBeenNthCalledWith(
                1,
                'SELECT * FROM users WHERE email = $1;',
                [mockUser1.email]
            );
            expect(clientQuerySpy).toHaveBeenNthCalledWith(2, 'BEGIN');

            const checkCreationDate = [
                mockUser1.email,
                mockUser1.username,
                mockUser1.password,
            ];

            expect(clientQuerySpy).toHaveBeenNthCalledWith(
                3,
                `INSERT INTO users(email, username, password, creation_date) VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
                [
                    ...checkCreationDate,
                    expect.stringMatching(
                        new Date().toISOString().split('T')[0]
                    ),
                ]
            );
            expect(clientQuerySpy).toHaveBeenNthCalledWith(
                3,
                `INSERT INTO users(email, username, password, creation_date) VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
                [
                    ...checkCreationDate,
                    expect.not.stringMatching(
                        new Date(mockUser1.creation_date)
                            .toISOString()
                            .split('T')[0]
                    ),
                ]
            );

            expect(clientQuerySpy).toHaveBeenNthCalledWith(
                4,
                `INSERT INTO addresses(email, country, street, city) VALUES ($1, $2, $3, $4);`,
                [
                    mockUser1.email,
                    mockUser1.country,
                    mockUser1.street,
                    mockUser1.city,
                ]
            );
            expect(clientQuerySpy).toHaveBeenNthCalledWith(5, 'COMMIT');

            expect(response.status).toBe(statusCodes.success);
            expect(response.body).toEqual({ message: 'User created' });
        });

        it('should return a 400 error if missing parameters', async () => {
            const response = await request(app).post('/users/register').send();

            expect(clientQuerySpy).not.toHaveBeenCalled();

            expect(response.status).toBe(statusCodes.badRequest);
            expect(response.body).toEqual({ message: 'Missing parameters' });
        });

        it('should return a 409 error if user already exists', async () => {
            const response = await request(app)
                .post('/users/register')
                .send(stableUser1);

            expect(clientQuerySpy).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE email = $1;',
                [stableUser1.email]
            );

            expect(response.status).toBe(statusCodes.userAlreadyExists);
            expect(response.body).toEqual({
                message: 'User already has an account',
            });
        });

        it('should return a 500 error if an error occurs during registration', async () => {
            poolConnectSpy.mockImplementation(() => ({
                query: jest.fn().mockImplementation(async (sql: string) => {
                    if (sql.includes('INSERT')) {
                        throw new Error('Error inserting user');
                    }
                    return { rowCount: 0 };
                }),
                release: jest.fn(),
            }));

            const response = await request(app)
                .post('/users/register')
                .send(mockUser2);

            expect(clientQuerySpy).toHaveBeenCalledTimes(4);

            expect(clientQuerySpy).toHaveBeenNthCalledWith(
                1,
                'SELECT * FROM users WHERE email = $1;',
                [mockUser2.email]
            );

            expect(clientQuerySpy).toHaveBeenNthCalledWith(2, 'BEGIN');
            const checkCreationDate = [
                mockUser2.email,
                mockUser2.username,
                mockUser2.password,
            ];

            expect(clientQuerySpy).toHaveBeenNthCalledWith(
                3,
                `INSERT INTO users(email, username, password, creation_date) VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
                [
                    ...checkCreationDate,
                    expect.stringMatching(
                        new Date().toISOString().split('T')[0]
                    ),
                ]
            );
            expect(clientQuerySpy).toHaveBeenNthCalledWith(
                3,
                `INSERT INTO users(email, username, password, creation_date) VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
                [
                    ...checkCreationDate,
                    expect.not.stringMatching(
                        new Date(mockUser2.creation_date)
                            .toISOString()
                            .split('T')[0]
                    ),
                ]
            );

            expect(clientQuerySpy).toHaveBeenNthCalledWith(4, 'ROLLBACK');

            expect(response.status).toBe(statusCodes.queryError);
            expect(response.body).toEqual({
                message: 'Exception occurred while registering',
            });
        });
    });

    describe('POST /users/login', () => {
        it('POST /users/login shoul log in stable user from db build', async () => {
            const response = await request(app).post('/users/login').send({
                email: stableUser1.email,
                password: stableUser1.password,
            });

            expect(poolQuerySpy).toHaveBeenCalledTimes(1);
            expect(poolQuerySpy).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
                [stableUser1.email, stableUser1.password],
                expect.any(Function)
            );

            expect(response.status).toBe(statusCodes.success);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('username');

            expect(response.body.username).toEqual(stableUser1.username);

            const decoded = <jwt.UserJwtPayload>jwt.decode(response.body.token);

            expect(decoded).toHaveProperty('user');
            expect(decoded.user).toHaveProperty('email', stableUser1.email);

            expect(jwtSignSpy).toHaveBeenCalledTimes(1);
            expect(jwtSignSpy).toHaveBeenCalledWith(
                { user: { email: stableUser1.email } },
                process.env.JWT_SECRET_KEY as string,
                { expiresIn: '1h' }
            );
        });

        it('POST /users/login should successfully log in the recently added user', async () => {
            const response = await request(app).post('/users/login').send({
                email: mockUser1.email,
                password: mockUser1.password,
            });

            expect(poolQuerySpy).toHaveBeenCalledTimes(1);
            expect(poolQuerySpy).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
                [mockUser1.email, mockUser1.password],
                expect.any(Function)
            );

            expect(response.status).toBe(statusCodes.success);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('username');

            expect(response.body.username).toEqual(mockUser1.username);

            const decoded = <jwt.UserJwtPayload>jwt.decode(response.body.token);

            expect(decoded).toHaveProperty('user');
            expect(decoded.user).toHaveProperty('email', mockUser1.email);

            expect(jwtSignSpy).toHaveBeenCalledTimes(1);
            expect(jwtSignSpy).toHaveBeenCalledWith(
                { user: { email: mockUser1.email } },
                process.env.JWT_SECRET_KEY as string,
                { expiresIn: '1h' }
            );
        });

        it('should return a 400 error if missing parameters', async () => {
            const response = await request(app).post('/users/login').send();

            expect(response.status).toBe(statusCodes.badRequest);
            expect(response.body).toEqual({ message: 'Missing parameters' });
        });

        it('should return a 404 error if user is not found', async () => {
            const response = await request(app).post('/users/login').send({
                email: 'notemail',
                password: 'notpassword',
            });

            expect(response.status).toBe(statusCodes.notFound);
            expect(response.body).toEqual({
                message: 'Incorrect email/password',
            });

            expect(poolQuerySpy).toHaveBeenCalledTimes(1);
            expect(poolQuerySpy).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
                ['notemail', 'notpassword'],
                expect.any(Function)
            );
            expect(jwtSignSpy).not.toHaveBeenCalled();
        });

        it('should return error if database query fails', async () => {
            poolQuerySpy.mockImplementationOnce((_query, _values, callback) => {
                callback(new Error('Database error'), null);
            });

            const response = await request(app).post('/users/login').send({
                email: 'notemail',
                password: 'notpassword',
            });

            expect(response.status).toBe(statusCodes.queryError);
            expect(response.body).toEqual({
                error: 'Exception occurred while logging in',
            });

            expect(poolQuerySpy).toHaveBeenCalledTimes(1);
            expect(poolQuerySpy).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
                ['notemail', 'notpassword'],
                expect.any(Function)
            );
            expect(jwtSignSpy).not.toHaveBeenCalled();
        });
    });
});
