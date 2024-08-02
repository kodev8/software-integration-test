import request from 'supertest';
import { Application } from 'express';

import statusCodes from '../../constants/statusCodes';
import logger from '../../middleware/winston';
import { registerCoreMiddleWare } from '../../boot/setup';
import { buildDB, teardownConnections } from '../../../utils/config/buildDB';
import commentModel from '../../models/commentModel';
import { mockUser1 } from '../users/users.mockData';

import {
    excessRatingComment,
    mockComments,
    zeroRatingComment,
} from './comments.mockData';

describe('comments  routes', () => {
    let app: Application;
    let commentModelSaveSpy: jest.SpyInstance;
    let testToken: string;

    beforeAll(async () => {
        await buildDB({ comments: true });
        app = registerCoreMiddleWare();

        await request(app).post('/auth/signup').send(mockUser1);

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({ email: mockUser1.email, password: mockUser1.password });

        testToken = loginResponse.body.token;
    });

    beforeEach(() => {
        logger.info = jest.fn();
        logger.error = jest.fn();

        commentModelSaveSpy = jest.spyOn(commentModel.prototype, 'save');
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    afterAll(async () => {
        await teardownConnections();
    });

    describe('POST /comments/:movie_id', () => {
        it('should return 400 if movie_id is not a number ', async () => {
            const res = await request(app)
                .post(`/comments/abc`)
                .send(mockComments[0])
                .set('Authorization', `Bearer ${testToken}`);

            expect(commentModelSaveSpy).not.toHaveBeenCalled();

            expect(res.status).toBe(statusCodes.badRequest);
            expect(res.body).toEqual({ message: 'Missing parameters' });
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/comments/1')
                .send({})
                .set('Authorization', `Bearer ${testToken}`);

            expect(commentModelSaveSpy).not.toHaveBeenCalled();
            expect(res.status).toBe(statusCodes.badRequest);
            expect(res.body).toEqual({ message: 'Missing parameters' });
        });

        it('should return 400 if comment rating is 0', async () => {
            const res = await request(app)
                .post(`/comments/1`)
                .send(zeroRatingComment)
                .set('Authorization', `Bearer ${testToken}`);

            expect(commentModelSaveSpy).not.toHaveBeenCalled();
            expect(res.status).toBe(statusCodes.badRequest);
            expect(res.body).toEqual({ message: 'Missing parameters' });
        });

        it('should return 500 if comment rating is above 5', async () => {
            const res = await request(app)
                .post(`/comments/1`)
                .send(excessRatingComment)
                .set('Authorization', `Bearer ${testToken}`);

            expect(commentModelSaveSpy).toHaveBeenCalled();
            expect(res.status).toBe(statusCodes.queryError);
            expect(res.body).toEqual({
                error: 'Exception occurred while adding comment',
            });
        });

        it('should return 500 if error occurs', async () => {
            commentModelSaveSpy.mockRejectedValueOnce(
                new Error('Error occurred')
            );

            const res = await request(app)
                .post(`/comments/1`)
                .send(mockComments[0])
                .set('Authorization', `Bearer ${testToken}`);

            expect(commentModelSaveSpy).toHaveBeenCalled();

            expect(res.status).toBe(statusCodes.queryError);
            expect(res.body).toEqual({
                error: 'Exception occurred while adding comment',
            });
        });

        it('should add comment and return 200 if successful', async () => {
            const res = await request(app)
                .post(`/comments/${mockComments[1].movie_id}`)
                .send(mockComments[1])
                .set('Authorization', `Bearer ${testToken}`);

            expect(commentModelSaveSpy).toHaveBeenCalled();
            expect(res.status).toBe(statusCodes.success);
            expect(res.body).toEqual({ message: 'Comment added' });
        });
    });
});
