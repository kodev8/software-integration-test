import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
    movie_id: number;
    username: string;
    comment: string;
    title: string;
    rating: number;
    downvotes?: number;
    upvotes?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICommentDocument extends IComment, Document {}

const commentSchema: Schema = new mongoose.Schema(
    {
        movie_id: { type: Number, required: [true, 'movie is required'] },
        username: { type: String, required: [true, 'username is required'] },
        comment: { type: String, required: [true, 'comment is required'] },
        title: { type: String, required: [true, 'title is required'] },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            required: [true, 'rating is required'],
        },
        downvotes: { type: Number, default: 0 },
        upvotes: { type: Number, min: 0, default: 0 },
    },
    {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
        },
        toJSON: {
            transform: (_doc, ret): void => {
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

export default mongoose.model<ICommentDocument>('Comment', commentSchema);
