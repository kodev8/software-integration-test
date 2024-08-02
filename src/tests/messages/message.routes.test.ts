import request from 'supertest';
import { Application } from 'express';
import statusCodes from '../../constants/statusCodes';
import { buildDB, teardownConnections } from '../../../utils/config/buildDB';
import { registerCoreMiddleWare } from '../../boot/setup';
import { stableUser1 } from '../users/users.mockData';
jest.mock('../../middleware/winston');

describe('Message Routes', () => {
    let app: Application;
    //   let message: IMessage;
    let testToken: string;

    beforeAll(async () => {
        await buildDB({ users: true, messages: true });
        app = registerCoreMiddleWare();
        jest.clearAllMocks();

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({ email: stableUser1.email, password: stableUser1.password });

        const { token } = loginResponse.body;
        if (!token) throw new Error('Token not found');
        testToken = loginResponse.body.token;
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    afterAll(async () => {
        await teardownConnections();
    });

    describe('GET /messages (empty)', () => {
        it('should return empty messages array', async () => {
            const res = await request(app)
                .get('/messages')
                .set('Authorization', `Bearer ${testToken}`);
            expect(res.status).toBe(statusCodes.success);
            expect(res.body).toEqual([]);
        });
    });
});
