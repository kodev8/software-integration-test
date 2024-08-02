import mongoose from 'mongoose';
import UserModel, { IUser } from '../../models/userModel';

describe('User Model', () => {
    let mockUser: IUser;

    beforeEach(() => {
        mockUser = {
            username: '  johndoe     ',
            email: 'johnDoe@example.com',
            password: '  securepassword123 ',
            messages: [
                new mongoose.Types.ObjectId(),
                new mongoose.Types.ObjectId(),
            ],
        };

        UserModel.prototype.save = jest.fn().mockImplementation(() =>
            Promise.resolve({
                _id: new mongoose.Types.ObjectId(),
                ...mockUser,
                created_at: new Date(),
                updated_at: new Date(),
            })
        );
    });

    it('should throw an error if any of the required fields are missing', async () => {
        try {
            await new UserModel().validate();
        } catch (err) {
            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);

            if (err instanceof mongoose.Error.ValidationError) {
                expect(err.errors.email).toBeDefined();
                expect(err.errors.password).toBeDefined();
            } else {
                throw new Error('Expected a ValidationError');
            }
        }
    });

    it('should allow empty messages array', async () => {
        const user = new UserModel({ ...mockUser, messages: [] });
        await expect(user.validate()).resolves.toBeUndefined();
    });

    it('should create a formatted user if all required fields are present and valid', async () => {
        const user = new UserModel(mockUser);

        await expect(user.validate()).resolves.toBeUndefined();

        const savedUser = await user.save();

        expect(user.username).toBe(mockUser.username.trim());
        expect(user.email).toBe(mockUser.email.toLowerCase());
        expect(user.password).toBe(mockUser.password.trim());
        expect(user.messages).toStrictEqual(mockUser.messages);

        expect(savedUser.created_at).toBeDefined();
        expect(savedUser.updated_at).toBeDefined();
    });
});
