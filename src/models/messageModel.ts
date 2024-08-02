import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
    name: string;
    user: mongoose.Types.ObjectId;
    created_at?: Date;
    updated_at?: Date;
}

export interface IMessageResponse extends IMessage {
    _id: mongoose.Types.ObjectId | string;
}

export interface IMessageDocument extends IMessage, Document {}

const messageSchema: Schema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'name is required'] },
        user: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: [true, 'user is required'],
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
        toJSON: {
            transform: (
                _doc: IMessageDocument,
                ret: IMessageDocument
            ): void => {
                delete ret.__v;
            },
        },
    }
);

export default mongoose.model<IMessageDocument>('Message', messageSchema);
