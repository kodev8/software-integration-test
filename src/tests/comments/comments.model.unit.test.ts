import mongoose from 'mongoose';
const ValidationError = mongoose.Error.ValidationError;
import Comment from '../../models/commentModel';
// import { comments } from './mock';

describe('Comment model', () => {
    const mockComment = {
        movie_id: 1,
        username: 'testuser',
        comment: 'This is a test comment',
        title: 'Test Title',
        rating: 4,
        downvotes: 0,
        upvotes: 0,
        createdAt: new Date(),
    };

    it('should throw an error if any of the required fields are missing', async () => {
        try {
            await new Comment().validate();
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationError);

            if (err instanceof ValidationError) {
                expect(err.errors.movie_id).toBeDefined();
                expect(err.errors.username).toBeDefined();
                expect(err.errors.comment).toBeDefined();
                expect(err.errors.title).toBeDefined();
                expect(err.errors.rating).toBeDefined();
            } else {
                throw new Error('Expected a ValidationError');
            }
        }
    });

    it('should create a comment if all required fields are present and valid', async () => {
        const comment = new Comment(mockComment);
        await expect(comment.validate()).resolves.toBeUndefined();

        expect(comment.movie_id).toBe(mockComment.movie_id);
        expect(comment.username).toBe(mockComment.username);
        expect(comment.comment).toBe(mockComment.comment);
        expect(comment.title).toBe(mockComment.title);
        expect(comment.rating).toBe(mockComment.rating);
        expect(comment.downvotes).toBe(mockComment.downvotes);
        expect(comment.upvotes).toBe(mockComment.upvotes);
        expect(comment.createdAt).toBeDefined();
    });

    it('should throw an error if the rating is not between 0 and 5', async () => {
        try {
            await new Comment({ ...mockComment, rating: 6 }).validate();
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationError);

            if (err instanceof ValidationError) {
                expect(err.errors.rating).toBeDefined();
                expect(err.errors.username).toBeUndefined();
                expect(err.errors.movie_id).toBeUndefined();
                expect(err.errors.comment).toBeUndefined();
                expect(err.errors.title).toBeUndefined();
            } else {
                throw new Error('Expected a ValidationError');
            }
        }

        try {
            await new Comment({ ...mockComment, rating: -1 }).validate();
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationError);

            if (err instanceof ValidationError) {
                expect(err.errors.rating).toBeDefined();
            } else {
                throw new Error('Expected a ValidationError');
            }
        }
    });

    it('should set default values for downvotes and upvotes', async () => {
        const comment = new Comment({
            movie_id: 1,
            username: 'testuser',
            comment: 'This is a test comment',
            title: 'Test Title',
            rating: 3,
        });
        await expect(comment.validate()).resolves.toBeUndefined();
        // const savedComment = await comment.validate();
        expect(comment.downvotes).toBe(0);
        expect(comment.upvotes).toBe(0);
    });

    it('should respect the minimum value for upvotes and downvotes', async () => {
        const invalidComment = new Comment({
            movie_id: 1,
            username: 'testuser',
            comment: 'This is a test comment',
            title: 'Test Title',
            rating: 3,
            upvotes: -1,
        });
        let err;
        try {
            await invalidComment.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(ValidationError);
        // expect(err.errors.downvotes).toBeDefined();
        // expect(err.errors.downvotes.kind).toBe('min');
        expect(err.errors.upvotes).toBeDefined();
        expect(err.errors.upvotes.kind).toBe('min');
    });

    it('should not include _id and __v in the toJSON output', async () => {
        const comment = new Comment(mockComment);
        await expect(comment.validate()).resolves.toBeUndefined();
        const json = comment.toJSON();
        expect(json._id).toBeUndefined();
        expect(json.__v).toBeUndefined();
    });
});
