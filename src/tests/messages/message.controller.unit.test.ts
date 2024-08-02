import { Request, Response } from 'express';
import { getMessages } from '../../controllers/messages.controller';
import messageModel from '../../models/messageModel';
import statusCodes from '../../constants/statusCodes';
import { mockMessages } from './message.mockData';
import { Session, SessionData } from 'express-session';

jest.mock('../../models/messageModel');
jest.mock('../../middleware/winston');

describe('Message Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        req = {
            session: {
                user: {
                    _id: '1',
                    email: 'anyemail',
                },
            } as Session & SessionData,
            params: {},
            body: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getMessages', () => {
        it('should return all messages', async () => {
            (messageModel.find as jest.Mock).mockResolvedValue(mockMessages);

            await getMessages(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith(mockMessages);
        });
    });
});
