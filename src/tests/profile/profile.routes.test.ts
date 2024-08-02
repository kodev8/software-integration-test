import request from 'supertest';
import { Application } from 'express';
// import { pool, setupDatabase, teardownDatabase, createTestUser } from '../setup/testSetup';
import { registerCoreMiddleWare } from '../../boot/setup';
import logger from '../../middleware/winston';
import statusCodes from '../../constants/statusCodes';
import { buildDB, teardownConnections } from '../../../utils/config/buildDB';
import { stableUser1 } from '../users/users.mockData';
import pool from '../../boot/database/db_connect';

describe('Profile Routes Integration Tests', () => {
    let app: Application;
    let testToken: string;
    let poolQuerySpy: jest.SpyInstance;

    beforeAll(async () => {
        await buildDB({ users: true });
        app = registerCoreMiddleWare();

        // login the user
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({ email: stableUser1.email, password: stableUser1.password });

        testToken = loginResponse.body.token;
    });

    beforeEach(async () => {
        logger.info = jest.fn();
        logger.error = jest.fn();
        poolQuerySpy = jest.spyOn(pool, 'query');
    });

    afterAll(async () => {
        await teardownConnections();
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe('PUT /profile', () => {
        it('should return 400 if parameters are missing', async () => {
            const response = await request(app)
                .put('/profile')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(statusCodes.badRequest);
            expect(response.body).toEqual({ message: 'Missing parameters' });
        });

        it('should return 400 if old password and new password are the same', async () => {
            const userCredentials = {
                oldPassword: 'password123',
                newPassword: 'password123',
            };
            const response = await request(app)
                .put('/profile')
                .send(userCredentials)
                .set('Authorization', `Bearer ${testToken}`); // Test later --remember to add a valid token using

            expect(response.status).toBe(statusCodes.badRequest);
            expect(response.body).toEqual({
                message: 'New password cannot be equal to old password',
            });
        });

        it('should return 400 if old password is incorrect', async () => {
            const userCredentials = {
                oldPassword: 'wrongpassword',
                newPassword: 'newpassword123',
            };
            const response = await request(app)
                .put('/profile')
                .send(userCredentials)
                .set('Authorization', `Bearer ${testToken}`); // Test later --remember to add a valid token using verifyToken

            expect(response.status).toBe(statusCodes.badRequest);
            expect(response.body).toEqual({ message: 'Incorrect password' });
        });

        it('should update the password correctly', async () => {
            const userCredentials = {
                oldPassword: stableUser1.password,
                newPassword: 'newpassword123',
            };
            const response = await request(app)
                .put('/profile')
                .send(userCredentials)
                .set('Authorization', `Bearer ${testToken}`); //  Test later --remember to add a valid token using verifyToken

            expect(response.status).toBe(statusCodes.success);
            expect(response.body.message).toEqual('Password updated');
        });

        it('should handle database errors during password check', async () => {
            // const userCredentials = { oldPassword: 'password123', newPassword: 'newpassword123' };
            (logger.error as jest.Mock).mockImplementationOnce(() => {}); // Mock the logger.error function to prevent it from throwing an error

            poolQuerySpy.mockImplementation((_query, _params, callback) => {
                callback(new Error('Query error'), null);
            });

            const response = await request(app)
                .put('/profile')
                .send({
                    oldPassword: 'password123',
                    newPassword: 'newpassword123',
                })
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(statusCodes.queryError);
            expect(response.body).toEqual({
                error: 'Exception occurred while updating password',
            });
        });

        it('should handle database errors during password update', async () => {
            // const userCredentials = { oldPassword: 'password
            (logger.error as jest.Mock).mockImplementationOnce(() => {}); // Mock the logger.error function to prevent it from throwing an error
            poolQuerySpy
                .mockImplementationOnce((_query, _params, callback) => {
                    callback(null, { rows: ['any'] });
                })
                .mockImplementationOnce((_query, _params, callback) => {
                    callback(new Error('Query error'), null);
                });

            const response = await request(app)
                .put('/profile')
                .send({
                    oldPassword: 'password123',
                    newPassword: 'newpassword',
                })
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(statusCodes.queryError);
            expect(response.body).toEqual({
                error: 'Exception occurred while updating password',
            });
        });
    });

    describe('POST /profile', () => {
        it('should logout the user and clear the session', async () => {
            const response = await request(app)
                .post('/profile')
                .set('Authorization', `Bearer ${testToken}`); // Ensure a session is established first in the test setup

            expect(response.status).toBe(statusCodes.success);
            expect(response.body).toEqual({ message: 'Disconnected' });
        });
    });
});
