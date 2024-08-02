import request from 'supertest';
import { Application } from 'express';
import statusCodes from '../../constants/statusCodes';
import { buildDB, teardownConnections } from '../../../utils/config/buildDB';
import { registerCoreMiddleWare } from '../../boot/setup';
import { stableUser1 } from '../users/users.mockData';
import messageModel, { IMessageResponse } from '../../models/messageModel';
jest.mock('../../middleware/winston');

describe('Message Routes', () => {
    let app: Application;
    //   let message: IMessage;
    let testToken: string;
    let instertedMessages: IMessageResponse[];
    let cookies: string | string[] | undefined;

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
        cookies = loginResponse.header['set-cookie'];
        instertedMessages = [];
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

    describe('POST /messages', () => {
        it('should add messages', async () => {
            const res = await request(app)
                .post('/messages/add/message')
                .set('Authorization', `Bearer ${testToken}`)
                .set('Cookie', cookies?.[0])
                .send({ message: { name: 'test message' } });
            expect(res.status).toBe(statusCodes.success);
            expect(res.body).toHaveProperty('name');
            expect(res.body.name).toBe('test message');
            instertedMessages.push(res.body);

            const res2 = await request(app)
                .post('/messages/add/message')
                .set('Authorization', `Bearer ${testToken}`)
                .set('Cookie', cookies?.[0])
                .send({ message: { name: 'test message 2' } });
            expect(res2.status).toBe(statusCodes.success);
            expect(res2.body).toHaveProperty('name');
            expect(res2.body.name).toBe('test message 2');
            instertedMessages.push(res2.body);

            const res3 = await request(app)
                .post('/messages/add/message')
                .set('Authorization', `Bearer ${testToken}`)
                .set('Cookie', cookies?.[0])
                .send({ message: { name: 'test message 3' } });
            expect(res3.status).toBe(statusCodes.success);
            expect(res3.body).toHaveProperty('name');
            expect(res3.body.name).toBe('test message 3');
            instertedMessages.push(res3.body);
        });

        it('should return 400 if message is missing', async () => {
            const res = await request(app)
                .post('/messages/add/message')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ message: { name: '' } });
            expect(res.status).toBe(statusCodes.badRequest);
        });

        it('should return 500 if user is not authenticated', async () => {
            const res = await request(app)
                .post('/messages/add/message')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ message: { name: 'test message' } });
            expect(res.status).toBe(statusCodes.queryError);
        });

        it('should return 500 if error occurs', async () => {
            jest.spyOn(messageModel.prototype, 'save').mockRejectedValue(
                new Error('Save failed')
            );
            const res = await request(app)
                .post('/messages/add/message')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ message: { name: 'test message' } });
            expect(res.status).toBe(statusCodes.queryError);
        });
    });
});
