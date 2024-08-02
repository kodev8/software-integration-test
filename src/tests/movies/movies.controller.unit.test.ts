import { Request, Response } from 'express';
import {
    getMovies,
    getMoviesByCategory,
    getTopRatedMovies,
    getSeenMovies,
} from '../../controllers/movies.controller';
import type { UserRequest } from '../../types/customRequests.interface';
import * as movieService from '../../controllers/movies.controller';
import {
    mockMovies,
    actionMovies,
    dramaMovies,
    romanceMovies,
} from './movies.mockData';

jest.mock('../../boot/database/db_connect', () => ({
    query: jest.fn(),
}));

jest.mock('../../middleware/winston');

import pool from '../../boot/database/db_connect';
import statusCodes from '../../constants/statusCodes';
import { mockUser1 } from '../users/users.mockData';
import logger from '../../middleware/winston';

describe('Movie Controller', () => {
    let req: Partial<UserRequest>;
    let res: Partial<Response>;

    beforeEach(() => {
        req = {
            query: {},
            user: mockUser1,
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('get Movies', () => {
        it('should return movies grouped by type when no category is provided', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: mockMovies,
            });

            await getMovies(req as Request, res as Response);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM movies GROUP BY type, movie_id;'
            );
            expect(pool.query).toHaveBeenCalledTimes(1);

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({
                movies: {
                    action: actionMovies,
                    drama: dramaMovies,
                    romance: romanceMovies,
                },
            });
        });

        it('should return movies of a specific category from get movies wrapper', async () => {
            const cat = 'action';
            req.query = { category: cat };

            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: actionMovies,
            });

            jest.spyOn(movieService, 'getMoviesByCategory');

            await getMovies(req as Request, res as Response);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM movies WHERE type = $1 ORDER BY release_date DESC;',
                [cat]
            );
            expect(pool.query).toHaveBeenCalledTimes(1);

            expect(movieService.getMoviesByCategory).toHaveBeenCalledWith(cat);
            expect(movieService.getMoviesByCategory).toHaveBeenCalledTimes(1);

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({ movies: actionMovies });
        });

        it('should return an error when there is a database or unexpected error', async () => {
            (pool.query as jest.Mock).mockRejectedValueOnce(
                new Error('Database or unexpected error')
            );

            await getMovies(req as Request, res as Response);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM movies GROUP BY type, movie_id;'
            );
            expect(pool.query).toHaveBeenCalledTimes(1);

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Exception occured while fetching movies',
            });
        });
    });

    describe('getMoviesByCategory', () => {
        it('should return movies of a specific category', async () => {
            const cat = 'romance';

            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: romanceMovies,
            });

            const result = await getMoviesByCategory(cat);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM movies WHERE type = $1 ORDER BY release_date DESC;',
                [cat]
            );
            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(romanceMovies);
        });

        it('should return an empty array when there is a database or unexpected error', async () => {
            (pool.query as jest.Mock).mockRejectedValueOnce(
                new Error('Database or unexpected error')
            );

            const result = await getMoviesByCategory('action');

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM movies WHERE type = $1 ORDER BY release_date DESC;',
                ['action']
            );
            expect(pool.query).toHaveBeenCalledTimes(1);

            expect(result).toEqual([]);
        });
    });

    describe('getTopRatedMovies', () => {
        it('should return top rated movies', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: mockMovies,
            });

            await getTopRatedMovies(req as Request, res as Response);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM movies ORDER BY rating DESC LIMIT 10;'
            );
            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({ movies: mockMovies });
        });

        it('should return an error when there is a database or unexpected error', async () => {
            (pool.query as jest.Mock).mockRejectedValueOnce(
                new Error('Database or unexpected error')
            );

            await getTopRatedMovies(req as Request, res as Response);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM movies ORDER BY rating DESC LIMIT 10;'
            );
            expect(pool.query).toHaveBeenCalledTimes(1);

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Exception occured while fetching top rated movies',
            });
        });
    });

    describe('getSeenMovies', () => {
        it('should return seen movies for a user', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({
                rows: mockMovies,
            });

            await getSeenMovies(req as Request, res as Response);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM seen_movies S JOIN movies M ON S.movie_id = M.movie_id WHERE email = $1;',
                [mockUser1.email]
            );
            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({ movies: mockMovies });
        });

        it('should return an empty array when there are no seen movies for a user', async () => {
            (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

            await getSeenMovies(req as Request, res as Response);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM seen_movies S JOIN movies M ON S.movie_id = M.movie_id WHERE email = $1;',
                [mockUser1.email]
            );
            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({ movies: [] });
        });

        it('should return an error if no user is in the request object', async () => {
            req.user = undefined;

            await getSeenMovies(req as Request, res as Response);

            expect(pool.query).not.toHaveBeenCalled();
        });

        it('should return an error when there is a database or unexpected error', async () => {
            (pool.query as jest.Mock).mockRejectedValueOnce(
                new Error('Database or unexpected error')
            );

            await getSeenMovies(req as Request, res as Response);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM seen_movies S JOIN movies M ON S.movie_id = M.movie_id WHERE email = $1;',
                [mockUser1.email]
            );
            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Exception occured while fetching seen movies',
            });

            expect(logger.error).toHaveBeenCalledTimes(1);
        });
    });
});
