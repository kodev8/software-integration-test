import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/setup';
import statusCodes from '../../constants/statusCodes';
import { buildDB, teardownConnections } from '../../../utils/config/buildDB';
import { Application } from 'express';
import { mockUser1, stableUser1 } from '../users/users.mockData';
jest.mock('../../middleware/winston');

describe('Auth Routes', () => {
    let app: Application;

    beforeAll(async () => {
        await buildDB({ users: true });
        app = registerCoreMiddleWare();
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
});
