import { Response } from 'express';
import { addComment } from '../../controllers/comments.controller';
import statusCodes from '../../constants/statusCodes';
import {
    excessRatingComment,
    mockComments,
    zeroRatingComment,
} from './comments.mockData';
jest.mock('../../middleware/winston');
import commentModel from '../../models/commentModel';
import { CommentRequest } from '../../types/customRequests.interface';

describe('Comment Controller', () => {
    let req: Partial<CommentRequest>;
    let res: Partial<Response>;

    beforeEach(() => {
        req = {
            params: {},
            body: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        commentModel.find = jest.fn();
        commentModel.prototype.save = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addComment controller', () => {
        it('should return 400 if movied is not a number', async () => {
            req.params.movie_id = 'abc';
            req.body = mockComments[0];

            await addComment(req as CommentRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Missing parameters',
            });
        });

        it('should return 400 if required parameters are missing', async () => {
            req.params.movie_id = '1';
            req.body = {};

            await addComment(req as CommentRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Missing parameters',
            });
        });

        it('should return 400 if rating is 0', async () => {
            req.params.movie_id = '1';
            req.body = zeroRatingComment;

            await addComment(req as CommentRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Missing parameters',
            });
        });

        it('should return 500 if rating is above 5', async () => {
            req.params.movie_id = '1';
            req.body = excessRatingComment;

            (commentModel.prototype.save as jest.Mock).mockRejectedValueOnce(
                new Error('Save failed')
            );

            await addComment(req as CommentRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Exception occurred while adding comment',
            });
        });

        it('should save the comment and return 200', async () => {
            req.params.movie_id = '1';
            req.body = mockComments[0];
            (commentModel.prototype.save as jest.Mock).mockResolvedValueOnce(
                {}
            );

            await addComment(req as CommentRequest, res as Response);

            expect(commentModel.prototype.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({ message: 'Comment added' });
        });

        it('should handle errors and return 500', async () => {
            req.params.movie_id = '1';
            req.body = mockComments[0];
            (commentModel.prototype.save as jest.Mock).mockRejectedValueOnce(
                new Error('Save failed')
            );

            await addComment(req as CommentRequest, res as Response);

            expect(commentModel.prototype.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Exception occurred while adding comment',
            });
        });
    });
});
