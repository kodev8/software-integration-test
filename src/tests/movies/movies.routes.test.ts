import request from 'supertest';
import { Application } from 'express';
import statusCodes from '../../constants/statusCodes';

import logger from '../../middleware/winston';
import {
    actionMovies,
    romanceMovies,
    dramaMovies,
    moviesAsResp,
    getMoviesSortedByMovieId,
    getTopRatedMovies,
    lowestRatedMovie,
    mockMovies,
} from './movies.mockData';

import { registerCoreMiddleWare } from '../../boot/setup';
import { buildDB, teardownConnections } from '../../../utils/config/buildDB';
import { IMovieResponse } from '../../types/movie.interface';
import { stableUser1 } from '../users/users.mockData';
import pool from '../../boot/database/db_connect';

describe('Movies Routes', () => {
    let app: Application;
    let actionMoviesAsResp: IMovieResponse[],
        dramaMoviesAsResp: IMovieResponse[],
        romanceMoviesAsResp: IMovieResponse[];

    let poolQuerySpy: jest.SpyInstance;
    let testToken: string;

    beforeAll(async () => {
        await buildDB({ users: true, movies: true });
        app = registerCoreMiddleWare();

        actionMoviesAsResp = moviesAsResp(actionMovies);
        dramaMoviesAsResp = moviesAsResp(dramaMovies);
        romanceMoviesAsResp = moviesAsResp(romanceMovies);

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({ email: stableUser1.email, password: stableUser1.password });

        testToken = loginResponse.body.token;
    });

    beforeEach(() => {
        logger.info = jest.fn();
        logger.error = jest.fn();
        poolQuerySpy = jest.spyOn(pool, 'query');
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await teardownConnections();
    });

    describe('GET /movies', () => {
        it('should return movies grouped by type when no category is provided', async () => {
            const response = await request(app)
                .get('/movies')
                .set('Authorization', `Bearer ${testToken}`);

            expect(poolQuerySpy).toHaveBeenCalledWith(
                'SELECT * FROM movies GROUP BY type, movie_id;'
            );

            expect(response.status).toBe(statusCodes.success);

            expect(response.body).toHaveProperty('movies');
            expect(response.body.movies).toHaveProperty('action');
            expect(response.body.movies).toHaveProperty('drama');
            expect(response.body.movies).toHaveProperty('romance');

            expect(
                getMoviesSortedByMovieId(response.body.movies.action)
            ).toEqual(getMoviesSortedByMovieId(actionMoviesAsResp));
            expect(
                getMoviesSortedByMovieId(response.body.movies.drama)
            ).toEqual(getMoviesSortedByMovieId(dramaMoviesAsResp));
            expect(
                getMoviesSortedByMovieId(response.body.movies.romance)
            ).toEqual(getMoviesSortedByMovieId(romanceMoviesAsResp));
        });

        it('should return movies of a specific category', async () => {
            const category = 'action';

            const response = await request(app)
                .get('/movies')
                .query({ category })
                .set('Authorization', `Bearer ${testToken}`);

            expect(poolQuerySpy).toHaveBeenCalledWith(
                'SELECT * FROM movies WHERE type = $1 ORDER BY release_date DESC;',
                [category]
            );

            expect(response.status).toBe(statusCodes.success);
            expect(response.body).toHaveProperty('movies');
            expect(getMoviesSortedByMovieId(response.body.movies)).toEqual(
                getMoviesSortedByMovieId(actionMoviesAsResp)
            );
        });

        it('should return an empty array when there are no movies of a specific category', async () => {
            const category = 'comedy';

            const response = await request(app)
                .get('/movies')
                .query({ category })
                .set('Authorization', `Bearer ${testToken}`);

            expect(poolQuerySpy).toHaveBeenCalledWith(
                'SELECT * FROM movies WHERE type = $1 ORDER BY release_date DESC;',
                [category]
            );

            expect(response.status).toBe(statusCodes.success);
            expect(response.body).toHaveProperty('movies');
            expect(response.body.movies).toEqual([]);
        });

        it('should return an error when there is a database error', async () => {
            (logger.error as jest.Mock).mockImplementationOnce(() => {});
            poolQuerySpy.mockRejectedValueOnce(new Error('Database error'));
            const response = await request(app)
                .get('/movies')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(statusCodes.queryError);
            expect(response.body).toEqual({
                error: 'Exception occured while fetching movies',
            });
        });

        it('should return an empty array when there is a database error while checking category', async () => {
            (logger.error as jest.Mock).mockImplementationOnce(() => {});
            poolQuerySpy.mockRejectedValueOnce(new Error('Database error'));
            const response = await request(app)
                .get('/movies')
                .query({ category: 'action' })
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(statusCodes.success);
            expect(response.body).toEqual({ movies: [] });
        });
    });

    describe('GET /movies/top', () => {
        it('should return top 10 rated movies', async () => {
            const response = await request(app)
                .get('/movies/top')
                .set('Authorization', `Bearer ${testToken}`);

            const topRatedMovies = moviesAsResp(getTopRatedMovies(mockMovies));
            const lowestRated = lowestRatedMovie(mockMovies);

            expect(poolQuerySpy).toHaveBeenCalledWith(
                'SELECT * FROM movies ORDER BY rating DESC LIMIT 10;'
            );

            expect(response.status).toBe(statusCodes.success);
            expect(response.body).toHaveProperty('movies');
            expect(getMoviesSortedByMovieId(response.body.movies)).toEqual(
                getMoviesSortedByMovieId(topRatedMovies)
            );
            expect(response.body.movies).not.toContainEqual(lowestRated);
        });

        it('should return an error when there is a database error', async () => {
            (logger.error as jest.Mock).mockImplementationOnce(() => {});
            poolQuerySpy.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/movies/top')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(statusCodes.queryError);
            expect(response.body).toEqual({
                error: 'Exception occured while fetching top rated movies',
            });
        });
    });
});
