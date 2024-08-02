import { IMessage } from '../../models/messageModel';
import mongoose from 'mongoose';

const mockMessage1: IMessage = {
    name: 'John Doe',
    user: new mongoose.Types.ObjectId(),
};

const mockMessage2: IMessage = {
    name: 'Jane Doe',
    user: new mongoose.Types.ObjectId(),
};

const mockMessage3: IMessage = {
    name: 'Alice',
    user: new mongoose.Types.ObjectId(),
};

const mockMessage4: IMessage = {
    name: 'Bob',
    user: new mongoose.Types.ObjectId(),
};

const mockMessage5: IMessage = {
    name: 'Charlie',
    user: new mongoose.Types.ObjectId(),
};

const mockMessage6: IMessage = {
    name: 'Dave',
    user: new mongoose.Types.ObjectId(),
};

const mockMessage7: IMessage = {
    name: 'Eve',
    user: new mongoose.Types.ObjectId(),
};

const mockMessage8: IMessage = {
    name: 'Frank',
    user: new mongoose.Types.ObjectId(),
};

const mockMessage9: IMessage = {
    name: 'Grace',
    user: new mongoose.Types.ObjectId(),
};

const mockMessage10: IMessage = {
    name: 'Hank',
    user: new mongoose.Types.ObjectId(),
};

export const mockMessages = [
    mockMessage1,
    mockMessage2,
    mockMessage3,
    mockMessage4,
    mockMessage5,
    mockMessage6,
    mockMessage7,
    mockMessage8,
    mockMessage9,
    mockMessage10,
];
