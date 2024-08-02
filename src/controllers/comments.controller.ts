import { Response } from 'express';
import logger from '../middleware/winston';
import statusCodes from '../constants/statusCodes';
import commentModel from '../models/commentModel';
import { CommentRequest } from '../types/customRequests.interface';

export const addComment = async (
    req: CommentRequest,
    res: Response
): Promise<Response> => {
    const { movie_id } = req.params;
    const { rating, username, comment, title } = req.body;

    const movieId = parseInt(movie_id);

    if (
        !movie_id ||
        isNaN(movieId) ||
        !rating ||
        !username ||
        !comment ||
        !title
    ) {
        return res
            .status(statusCodes.badRequest)
            .json({ message: 'Missing parameters' });
    }

    try {
        const commentObj = new commentModel({
            movie_id: movieId,
            rating,
            username,
            comment,
            title,
        });

        await commentObj.save();

        return res
            .status(statusCodes.success)
            .json({ message: 'Comment added' });
    } catch (error) {
        logger.error(error.stack);
        return res
            .status(statusCodes.queryError)
            .json({ error: 'Exception occurred while adding comment' });
    }
};

export default {
    addComment,
};
