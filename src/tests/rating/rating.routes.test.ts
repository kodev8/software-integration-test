import request from 'supertest';
import { Application } from 'express';

import statusCodes from '../../constants/statusCodes';
import { avgRating, latestRating } from './rating.mockData';
import logger from '../../middleware/winston';
import { registerCoreMiddleWare } from '../../boot/setup';
import ratingModel, { IRating } from '../../models/ratingModel';
import { buildDB, teardownConnections } from '../../../utils/config/buildDB';
import pool from '../../boot/database/db_connect';
import { stableUser1 } from '../users/users.mockData';

describe('addRating controller', () => {
    let app: Application;
    let singleRating: IRating;
    let ratingModelSaveSpy: jest.SpyInstance;
    let ratingModelFindSpy: jest.SpyInstance;
    let poolQuerySpy: jest.SpyInstance;
    let testToken: string;

    beforeAll(async () => {
        await buildDB({ users: true, movies: true, ratings: true });
        app = registerCoreMiddleWare();
        singleRating = latestRating;

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({ email: stableUser1.email, password: stableUser1.password });

        testToken = loginResponse.body.token;
    });

    beforeEach(() => {
        logger.info = jest.fn();
        logger.error = jest.fn();

        ratingModelSaveSpy = jest.spyOn(ratingModel.prototype, 'save');
        ratingModelFindSpy = jest.spyOn(ratingModel, 'find');
        poolQuerySpy = jest.spyOn(pool, 'query');
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
            const response = await request(app).get(
                `/ratings/${singleRating.movie_id}`
            );

            expect(response.status).toBe(statusCodes.unauthorized);
            expect(response.body).toEqual({ error: 'Unauthorized' });
        });

        it('should return an error when an invalid token is provided', async () => {
            const response = await request(app)
                .get(`/ratings/${singleRating.movie_id}`)
                .set('Authorization', 'Bearer invalidtoken');

            expect(response.status).toBe(statusCodes.unauthorized);
            expect(response.body).toEqual({ error: 'Invalid token' });
        });
    });

    it('should return 400 if rating is missing', async () => {
        const res = await request(app)
            .post(`/ratings/${singleRating.movie_id}`)
            .send({})
            .set('Authorization', `Bearer ${testToken}`);

        expect(ratingModelSaveSpy).not.toHaveBeenCalled();
        expect(ratingModelFindSpy).not.toHaveBeenCalled();
        expect(poolQuerySpy).not.toHaveBeenCalled();

        expect(res.status).toBe(statusCodes.badRequest);
        expect(res.body).toEqual({ message: 'Missing parameters' });
    });

    it('should return 400 if movieId is not a number', async () => {
        const res = await request(app)
            .post('/ratings/abc')
            .send({ rating: 5 })
            .set('Authorization', `Bearer ${testToken}`);

        expect(ratingModelSaveSpy).not.toHaveBeenCalled();
        expect(ratingModelFindSpy).not.toHaveBeenCalled();
        expect(poolQuerySpy).not.toHaveBeenCalled();

        expect(res.status).toBe(statusCodes.badRequest);
        expect(res.body).toEqual({ message: 'Missing parameters' });
    });

    it('should return 400 if rating is 0', async () => {
        const res = await request(app)
            .post(`/ratings/${singleRating.movie_id}`)
            .send({ rating: 0 })
            .set('Authorization', `Bearer ${testToken}`);

        expect(ratingModelSaveSpy).not.toHaveBeenCalled();
        expect(ratingModelFindSpy).not.toHaveBeenCalled();
        expect(poolQuerySpy).not.toHaveBeenCalled();

        expect(res.status).toBe(statusCodes.badRequest);
        expect(res.body).toEqual({ message: 'Missing parameters' });
    });

    it('should return 500 if rating is not between 1 and 5 (fails mongoose validation)', async () => {
        const res = await request(app)
            .post(`/ratings/${singleRating.movie_id}`)
            .send({ rating: 6 })
            .set('Authorization', `Bearer ${testToken}`);

        expect(ratingModelSaveSpy).toHaveBeenCalled();
        expect(ratingModelFindSpy).not.toHaveBeenCalled();
        expect(poolQuerySpy).not.toHaveBeenCalled();

        expect(res.status).toBe(statusCodes.queryError);
        expect(res.body).toEqual({
            error: 'Exception occurred while adding rating',
        });
    });

    it('should add rating and return 200 if successful', async () => {
        const res = await request(app)
            .post(`/ratings/${singleRating.movie_id}`)
            .send({ rating: singleRating.rating })
            .set('Authorization', `Bearer ${testToken}`);

        const avgerageRating = avgRating(singleRating.movie_id, true);

        expect(ratingModelSaveSpy).toHaveBeenCalled();
        expect(ratingModelFindSpy).toHaveBeenCalledWith(
            { movie_id: singleRating.movie_id },
            { rating: 1 }
        );

        expect(poolQuerySpy).toHaveBeenCalledWith(
            'UPDATE movies SET rating = $1 WHERE movie_id = $2;',
            [avgerageRating, singleRating.movie_id]
        );

        expect(res.status).toBe(statusCodes.success);
        expect(res.body).toEqual({ message: 'Rating added' });
    });

    it('should return 500 if an exception occurs', async () => {
        jest.spyOn(ratingModel, 'find').mockRejectedValueOnce(
            new Error('Error occurred')
        );

        const res = await request(app)
            .post(`/ratings/${singleRating.movie_id}`)
            .send({ rating: singleRating.rating })
            .set('Authorization', `Bearer ${testToken}`);

        expect(ratingModelSaveSpy).toHaveBeenCalled();
        expect(ratingModelFindSpy).toHaveBeenCalled();
        expect(poolQuerySpy).not.toHaveBeenCalled();

        expect(res.status).toBe(statusCodes.queryError);
        expect(res.body).toEqual({
            error: 'Exception occurred while adding rating',
        });

        expect(logger.error).toHaveBeenCalled();
    });
});
