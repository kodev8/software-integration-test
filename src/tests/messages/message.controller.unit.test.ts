import { Request, Response } from 'express';
import { getMessages, addMessage } from '../../controllers/messages.controller';
import messageModel, { IMessage } from '../../models/messageModel';
import statusCodes from '../../constants/statusCodes';
import { mockMessages } from './message.mockData';

import { Session, SessionData } from 'express-session';

jest.mock('../../models/messageModel');
jest.mock('../../middleware/winston');

describe('Message Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let mockMessage: IMessage;

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

        mockMessage = mockMessages[0];
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

    describe('addMessage', () => {
        it('should add a new message', async () => {
            req.params.messageId = '1';
            req.body = {
                message: {
                    name: mockMessage.name,
                },
            };

            (messageModel.prototype.save as jest.Mock).mockResolvedValue(
                mockMessage
            );

            await addMessage(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith(mockMessage);
        });

        it('should return 400 if missing information', async () => {
            req.body = {};

            await addMessage(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                error: 'missing information',
            });
        });

        it('should handle errors', async () => {
            req.params.messageId = '1';
            req.body = {
                message: {
                    name: mockMessage.name,
                },
            };

            (messageModel.prototype.save as jest.Mock).mockRejectedValue(
                new Error('Save failed')
            );

            await addMessage(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Failed to add message',
            });
        });

        it('should return 500 if user is not authenticated', async () => {
            req.session.user = undefined;
            req.body = {
                message: {
                    name: mockMessage.name,
                },
            };

            await addMessage(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'You are not authenticated',
            });
        });
    });
});
