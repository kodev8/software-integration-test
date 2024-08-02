import mongoose from 'mongoose';
const ValidationError = mongoose.Error.ValidationError;
import messageModel, { IMessage } from '../../models/messageModel';

describe('Message model', () => {
    let mockMessage: IMessage;

    beforeEach(() => {
        mockMessage = {
            name: 'testuser',
            user: new mongoose.Types.ObjectId(),
        };

        messageModel.prototype.save = jest.fn().mockImplementation(() =>
            Promise.resolve({
                _id: new mongoose.Types.ObjectId(),
                ...mockMessage,
                created_at: new Date(),
                updated_at: new Date(),
            })
        );
    });

    it('should throw an error if any of the required fields are missing', async () => {
        try {
            await new messageModel().validate();
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationError);

            if (err instanceof ValidationError) {
                expect(err.errors.name).toBeDefined();
            } else {
                throw new Error('Expected a ValidationError');
            }
        }
    });

    it('should throw an error if the user field is invalid', async () => {
        try {
            await new messageModel({
                ...mockMessage,
                user: 'invalid',
            }).validate();
        } catch (err) {
            expect(err).toBeInstanceOf(ValidationError);

            if (err instanceof ValidationError) {
                expect(err.errors.user).toBeDefined();
            } else {
                throw new Error('Expected a ValidationError');
            }
        }
    });

    it('should create a message if all required fields are present and valid', async () => {
        const message = new messageModel(mockMessage);
        await expect(message.validate()).resolves.toBeUndefined();
        const savedMessage = await message.save();

        expect(savedMessage.name).toBe(mockMessage.name);

        expect(savedMessage.created_at).toBeDefined();
        expect(savedMessage.updated_at).toBeDefined();
    });

    it('should not include __v when transformed to JSON', async () => {
        const message = new messageModel(mockMessage);
        await expect(message.validate()).resolves.toBeUndefined();
        const json = message.toJSON();
        expect(json.__v).toBeUndefined();
    });
});
