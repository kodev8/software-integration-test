import { stableUser1, stableUser2 } from '../../src/tests/users/users.mockData';
import bcrypt from 'bcryptjs';
import logger from '../../src/middleware/winston';
import mongoose from 'mongoose';
import messageModel from '../../src/models/messageModel';

import userModel, { IUserDocument } from '../../src/models/userModel';

interface IExpectedBuildDB {
    users?: boolean;
    messages?: boolean;
}

export const buildDB = async ({
    users = false,
    messages = false,
}: IExpectedBuildDB): Promise<void> => {
    if (users) {
        const stableUsers = [stableUser1, stableUser2];
        const users: IUserDocument[] = [];
        await userModel.deleteMany({});
        for (const user of stableUsers) {
            const userObj = new userModel({
                email: user.email,
                username: user.username,
                password: bcrypt.hashSync(user.password, 10),
                creation_date: user.creation_date,
            });

            const newUser = await userObj.save();
            users.push(newUser);
        }

        // message MODEL
        if (messages) {
            // clear messages
            await messageModel.deleteMany({});
        }
    }
};

export const teardownConnections = async (): Promise<void> => {
    try {
        await cleanModels();
        mongoose.connection.close();
    } catch (error) {
        logger.error(error.stack);
    }
};

const cleanModels = async (): Promise<void> => {
    try {
        await userModel.deleteMany({});
    } catch (error) {
        logger.error(error.stack);
    }
};
