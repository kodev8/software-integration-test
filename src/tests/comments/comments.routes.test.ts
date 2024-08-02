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
    getCommentsByMovieId,
} from './comments.mockData';

describe('comments  routes', () => {
    let app: Application;
    let commentModelSaveSpy: jest.SpyInstance;
    let commentModelFindSpy: jest.SpyInstance;
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
        commentModelFindSpy = jest.spyOn(commentModel, 'find');
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    afterAll(async () => {
        await teardownConnections();
    });

    describe(' Unauthorized access', () => {
        it('should return an error when no token is provided', async () => {
            const response = await request(app).get('/comments/1');

            expect(response.status).toBe(statusCodes.unauthorized);
            expect(response.body).toEqual({ error: 'Unauthorized' });
        });

        it('should return an error when an invalid token is provided', async () => {
            const response = await request(app)
                .get('/comments/1')
                .set('Authorization', 'Bearer invalidtoken');

            expect(response.status).toBe(statusCodes.unauthorized);
            expect(response.body).toEqual({ error: 'Invalid token' });
        });
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

    describe('GET /comments/:movieId', () => {
        it('should return 400 if movie_id is not a number ', async () => {
            const res = await request(app)
                .get(`/comments/abc`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(commentModelFindSpy).not.toHaveBeenCalled();

            expect(res.status).toBe(statusCodes.badRequest);
            expect(res.body).toEqual({ message: 'movie id missing' });
        });

        it('should return an empty array if no comments are found', async () => {
            const res = await request(app)
                .get(`/comments/100`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(commentModelFindSpy).toHaveBeenCalled();
            expect(res.status).toBe(statusCodes.success);
            expect(res.body).toEqual({ comments: [] });
        });

        it('should return comments if found', async () => {
            const res = await request(app)
                .get(`/comments/${mockComments[0].movie_id}`)
                .set('Authorization', `Bearer ${testToken}`);

            const expectedComments = getCommentsByMovieId(
                mockComments[0].movie_id
            );

            expect(commentModelFindSpy).toHaveBeenCalledWith({
                movie_id: mockComments[0].movie_id,
            });
            expect(res.status).toBe(statusCodes.success);
            expect(res.body).toHaveProperty('comments');
            for (const comment of res.body.comments) {
                expect(comment).toHaveProperty('createdAt');
                expect(comment).toHaveProperty('updatedAt');

                expect(comment).not.toHaveProperty('_id');
                expect(comment).not.toHaveProperty('__v');

                delete comment.createdAt;
                delete comment.updatedAt;
            }

            expect(res.body.comments).toEqual(
                expect.arrayContaining(expectedComments)
            );
        });

        it('should return 500 if error occurs', async () => {
            commentModelFindSpy.mockRejectedValueOnce(
                new Error('Error occurred')
            );
            const res = await request(app)
                .get(`/comments/1`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(commentModelFindSpy).toHaveBeenCalled();

            expect(res.status).toBe(statusCodes.queryError);
            expect(res.body).toEqual({
                error: 'Exception occurred while fetching comments',
            });
        });
    });
});
