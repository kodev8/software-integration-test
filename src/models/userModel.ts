import mongoose, { Document, Schema } from 'mongoose';

// Define an interface for the user document
export interface IUser {
    username: string;
    email: string;
    password: string;
    messages?: mongoose.Types.ObjectId[];
    created_at?: Date;
    updated_at?: Date;
}

export interface IUserDocument extends IUser, Document {}

// Define the user schema
const userSchema = new Schema<IUserDocument>(
    {
        username: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            required: true,
        },
        password: {
            type: String,
            trim: true,
            required: true,
        },
        messages: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Message', // Assuming you have a 'Message' model
            },
        ],
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

// Export the model
const UserModel = mongoose.model<IUserDocument>('User', userSchema);

export default UserModel;
