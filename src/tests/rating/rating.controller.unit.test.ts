import { Response } from 'express';
import type { AddRatingRequest } from '../../types/customRequests.interface';
import { addRating } from '../../controllers/rating.controller';
import { ratings, avgRating } from './rating.mockData';

jest.mock('../../boot/database/db_connect', () => ({
    query: jest.fn(),
}));

jest.mock('../../middleware/winston');

import ratingModel, { IRating } from '../../models/ratingModel';
import pool from '../../boot/database/db_connect';
import statusCodes from '../../constants/statusCodes';
import logger from '../../middleware/winston';

describe('Rating Controller', () => {
    let req: Partial<AddRatingRequest>;
    let res: Partial<Response>;

    let singleRating: IRating;

    beforeEach(() => {
        singleRating = ratings[0];

        req = {
            params: { movieId: singleRating.movie_id.toString() },
            body: { rating: singleRating.rating },
            user: { email: singleRating.email },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        jest.spyOn(ratingModel, 'find').mockResolvedValueOnce(
            ratings.filter((r) => r.movie_id === singleRating.movie_id)
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addRating', () => {
        it('should add a rating to a movie', async () => {
            jest.spyOn(ratingModel.prototype, 'save').mockResolvedValueOnce({});
            (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

            await addRating(req as AddRatingRequest, res as Response);

            expect(ratingModel.prototype.save).toHaveBeenCalledTimes(1);

            expect(ratingModel.find).toHaveBeenCalledTimes(1);
            expect(ratingModel.find).toHaveBeenCalledWith(
                { movie_id: singleRating.movie_id },
                { rating: 1 }
            );

            const averageRating = avgRating(singleRating.movie_id);

            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE movies SET rating = $1 WHERE movie_id = $2;',
                [averageRating, singleRating.movie_id]
            );

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({ message: 'Rating added' });
        });

        it('should return a bad request when the movie id is not a number', async () => {
            req.params.movieId = 'a';
            await addRating(req as AddRatingRequest, res as Response);
            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Missing parameters',
            });
        });

        it('should return a bad request when there are missing parameters', async () => {
            req.body = {};
            await addRating(req as AddRatingRequest, res as Response);
            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Missing parameters',
            });
        });

        it('should return a bad request when the rating is 0', async () => {
            req.body.rating = 0;

            await addRating(req as AddRatingRequest, res as Response);

            expect(ratingModel.prototype.save).not.toHaveBeenCalled();
            expect(ratingModel.find).not.toHaveBeenCalled();

            expect(pool.query).not.toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Missing parameters',
            });
        });

        it('should return an error if the rating is not between 1 and 5', async () => {
            req.body.rating = 6;

            jest.spyOn(ratingModel.prototype, 'save').mockRejectedValueOnce(
                new Error('Rating must be between 0 and 5')
            );

            await addRating(req as AddRatingRequest, res as Response);

            expect(ratingModel.prototype.save).toHaveBeenCalledTimes(1);

            expect(ratingModel.find).not.toHaveBeenCalled();
            expect(pool.query).not.toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Exception occurred while adding rating',
            });
        });

        it('should return an error when there is a database or unexpected error', async () => {
            jest.spyOn(ratingModel.prototype, 'save').mockResolvedValueOnce({});

            (pool.query as jest.Mock).mockRejectedValueOnce(new Error());

            await addRating(req as AddRatingRequest, res as Response);
            expect(pool.query).toHaveBeenCalledTimes(1);

            expect(ratingModel.prototype.save).toHaveBeenCalledTimes(1);

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Exception occurred while adding rating',
            });
            expect(logger.error).toHaveBeenCalledTimes(1);
        });
    });
});
