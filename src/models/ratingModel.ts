import mongoose, { Schema, Document } from 'mongoose';

export interface IRating {
    movie_id: number;
    email: string;
    rating: number;
    created_at: Date;
}

export interface IRatingDocument extends IRating, Document {}

const ratingSchema = new Schema<IRatingDocument>(
    {
        movie_id: {
            type: Number,
            required: [true, 'movie is required'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            required: [true, 'rating is required'],
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
        },
    }
);

export default mongoose.model<IRatingDocument>('Rating', ratingSchema);
