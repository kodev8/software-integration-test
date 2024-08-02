import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/setup';
import UserModel from '../../models/userModel';
import statusCodes from '../../constants/statusCodes';
import { buildDB, teardownConnections } from '../../../utils/config/buildDB';
import { Application } from 'express';
import { mockUser1, stableUser1 } from '../users/users.mockData';
jest.mock('../../middleware/winston');

describe('Auth Routes', () => {
    let app: Application;
    let testUnknownUser: { email: string; password: string };

    beforeAll(async () => {
        await buildDB({ users: true });
        app = registerCoreMiddleWare();
        testUnknownUser = {
            email: 'test123@gmail.com',
            password: 'test',
        };
    });

    beforeEach(async () => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await teardownConnections();
    });

    describe('POST /signup', () => {
        it('should return 400 if missing information', async () => {
            const res = await request(app).post('/auth/signup').send({
                email: '',
            });

            expect(res.status).toBe(statusCodes.badRequest);
            expect(res.body).toEqual({ error: 'missing information' });
        });

        it('should save user and return 200', async () => {
            const res = await request(app).post('/auth/signup').send(mockUser1);
            expect(res.status).toBe(statusCodes.success);
            expect(res.body).toEqual({
                __v: expect.any(Number),
                _id: expect.any(String),
                created_at: expect.any(String),
                email: mockUser1.email,
                messages: [],
                password: expect.any(String),
                updated_at: expect.any(String),
                username: mockUser1.username,
            });
        });

        it('should return 500 if failed to save user (duplicated)', async () => {
            // triggering duplicate error from previous test
            const res = await request(app).post('/auth/signup').send(mockUser1);
            expect(res.status).toBe(statusCodes.queryError);
            expect(res.body).toEqual({ message: 'failed to save user' });

            const res2 = await request(app)
                .post('/auth/signup')
                .send(stableUser1); // trigger duplicate from buildDB
            expect(res2.status).toBe(statusCodes.queryError);
            expect(res2.body).toEqual({ message: 'failed to save user' });
        });
    });

    describe('POST /signin', () => {
        it('should return 400 if missing information', async () => {
            const res = await request(app).post('/auth/login').send({
                email: 'test',
            });
            expect(res.status).toBe(statusCodes.badRequest);
            expect(res.body).toEqual({ error: 'missing information' });
        });

        it('should return 400 if user not found', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send(testUnknownUser);
            expect(res.status).toBe(statusCodes.badRequest);
            expect(res.body).toEqual({ message: 'User not found' });
        });

        it('should return 400 if password is incorrect', async () => {
            const res = await request(app).post('/auth/login').send({
                email: mockUser1.email, // already signed up from previous test
                password: 'wrongpassword',
            });

            expect(res.status).toBe(statusCodes.badRequest);
            expect(res.body).toEqual({
                message: "Email or password don't match",
            });
        });

        it('should return 500 if failed to save session', async () => {
            jest.spyOn(UserModel, 'findOne').mockRejectedValueOnce(
                new Error('failed to get user')
            );
            const res = await request(app)
                .post('/auth/login')
                .send(testUnknownUser);
            expect(res.status).toBe(statusCodes.queryError);
            expect(res.body).toEqual({ error: 'Failed to get user' });
        });

        it('should return 200 and token', async () => {
            const { email, password } = mockUser1;
            const res = await request(app)
                .post('/auth/login')
                .send({ email, password });
            expect(res.status).toBe(statusCodes.success);
            expect(res.body).toEqual({ token: expect.any(String) });
        });
    });

    describe('GET /me', () => {
        it('should return 401 if not authenticated', async () => {
            const res = await request(app).get('/auth/me');
            expect(res.status).toBe(statusCodes.unauthorized);
            expect(res.body).toEqual({ error: 'You are not authenticated' });
        });

        it('should return 400 if user not found', async () => {
            // await request(app).post('/auth/signup').send(testUserSignup);
            const loginRes = await request(app)
                .post('/auth/login')
                .send(mockUser1);

            const cookies = loginRes.headers['set-cookie'];

            const mockFindById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            jest.spyOn(UserModel, 'findById').mockImplementation(mockFindById);

            const res = await request(app)
                .get('/auth/me')
                .set('Cookie', cookies);

            expect(res.status).toBe(statusCodes.badRequest);
            expect(res.body).toEqual({ message: 'User not found' });
        });

        it('should return 500 if failed to get user', async () => {
            // await request(app).post('/auth/signup').send(testUserSignup);
            const loginRes = await request(app)
                .post('/auth/login')
                .send(mockUser1);
            const cookies = loginRes.headers['set-cookie'];
            const mockFindById = jest.fn().mockReturnValue({
                populate: jest
                    .fn()
                    .mockRejectedValue(new Error('Failed to get user')),
            });

            jest.spyOn(UserModel, 'findById').mockImplementation(mockFindById);
            const res = await request(app)
                .get('/auth/me')
                .set('Cookie', cookies?.[0]);
            expect(res.status).toBe(statusCodes.queryError);
            expect(res.body).toEqual({ error: 'Failed to get user' });
        });

        it('should return 200 and user', async () => {
            // Log in the user
            const loginRes = await request(app)
                .post('/auth/login')
                .send(mockUser1);

            expect(loginRes.status).toBe(statusCodes.success);

            const cookies = loginRes.headers['set-cookie'];
            // Fetch the user
            const res = await request(app)
                .get('/auth/me')
                .set('Cookie', cookies?.[0]);

            expect(res.status).toBe(statusCodes.success);
            expect(res.body).toEqual({
                __v: expect.any(Number),
                _id: expect.any(String),
                created_at: expect.any(String),
                email: mockUser1.email,
                messages: [],
                updated_at: expect.any(String),
                username: mockUser1.username,
            });
        });
    });

    describe('POST /logout', () => {
        it('should return 200 and destroy session', async () => {
            // await request(app).post('/auth/signup').send(testUserSignup);
            const loginRes = await request(app)
                .post('/auth/login')
                .send(mockUser1);
            const cookies = loginRes.headers['set-cookie'];
            const res = await request(app)
                .get('/auth/logout')
                .set('Cookie', cookies?.[0]);
            expect(res.status).toBe(statusCodes.success);
            expect(res.body).toEqual({ message: 'Disconnected' });
        });
    });
});
