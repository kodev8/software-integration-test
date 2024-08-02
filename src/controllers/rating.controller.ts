import { Response } from 'express';
import pool from '../boot/database/db_connect';
import logger from '../middleware/winston';
import statusCodes from '../constants/statusCodes';
import ratingModel, { IRatingDocument } from '../models/ratingModel';
import { AddRatingRequest } from '../types/customRequests.interface';

export const addRating = async (
    req: AddRatingRequest,
    res: Response
): Promise<Response> => {
    const { movieId } = req.params;
    const { rating } = req.body;

    const movie_id: number = parseInt(movieId);

    if (isNaN(movie_id) || !rating) {
        return res.status(statusCodes.badRequest).json({
            message: 'Missing parameters',
        });
    } else {
        try {
            const ratingObj = new ratingModel({
                email: req.user.email,
                movie_id,
                rating,
            });

            await ratingObj.save();

            const ratings: Partial<IRatingDocument>[] = await ratingModel.find(
                { movie_id },
                { rating: 1 }
            );

            const averageRating =
                ratings.reduce(
                    (acc: number, rating: { rating: number }) =>
                        acc + rating.rating,
                    0
                ) / ratings.length;

            await pool.query(
                'UPDATE movies SET rating = $1 WHERE movie_id = $2;',
                [averageRating, movie_id]
            );
            return res
                .status(statusCodes.success)
                .json({ message: 'Rating added' });
        } catch (error) {
            logger.error(error.stack);
            return res.status(statusCodes.queryError).json({
                error: 'Exception occurred while adding rating',
            });
        }
    }
};
