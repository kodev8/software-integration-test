import { Request, Response } from 'express';
import {
    getMessages,
    getMessageById,
    addMessage,
    editMessage,
    deleteMessage,
} from '../../controllers/messages.controller';
import messageModel, { IMessage } from '../../models/messageModel';
import statusCodes from '../../constants/statusCodes';
import { mockMessages } from './message.mockData';
import {
    EditMessageRequest,
    MessageRequest,
} from '../../types/customRequests.interface';
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

    describe('getMessageById', () => {
        it('should return a message by ID', async () => {
            req.params.messageId = '1';
            (messageModel.findById as jest.Mock).mockResolvedValue(mockMessage);

            await getMessageById(req as MessageRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith(mockMessage);
        });

        it('should return 404 if message not found', async () => {
            req.params.messageId = '1';
            (messageModel.findById as jest.Mock).mockResolvedValue(null);

            await getMessageById(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Message not found',
            });
        });

        it('should handle errors', async () => {
            req.params.messageId = '1';
            (messageModel.findById as jest.Mock).mockRejectedValue(
                new Error('Find failed')
            );

            await getMessageById(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Error while getting message',
            });
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

    describe('editMessage', () => {
        it('should update a message', async () => {
            req.params.messageId = '1';
            req.body = {
                name: 'John',
            };

            (messageModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
                mockMessages[1]
            );

            await editMessage(req as EditMessageRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith(mockMessages[1]);
        });

        it('should return 400 if missing information', async () => {
            req.params.messageId = '1';
            req.body = {};

            await editMessage(req as EditMessageRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                error: 'missing information',
            });
        });

        it('should return 200 even if message not found', async () => {
            req.params.messageId = '1';
            req.body = mockMessages[1];
            (messageModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
                null
            );

            await editMessage(req as EditMessageRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith(null);
        });

        it('should handle errors', async () => {
            req.params.messageId = '1';
            req.body = mockMessages[1];
            (messageModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(
                new Error('Update failed')
            );

            await editMessage(req as EditMessageRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Failed to update message',
            });
        });
    });

    describe('deleteMessage', () => {
        it('should return 400 if missing information', async () => {
            req.params.messageId = undefined;

            await deleteMessage(req as MessageRequest, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
            expect(res.json).toHaveBeenCalledWith({
                error: 'missing information',
            });
        });

        it('should delete a message', async () => {
            req.params.messageId = '1';

            (messageModel.findByIdAndDelete as jest.Mock).mockResolvedValue(
                '1'
            );

            await deleteMessage(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Message deleted',
            });
        });

        it('should return 200 even if message not found', async () => {
            req.params.messageId = '1';
            (messageModel.findByIdAndDelete as jest.Mock).mockResolvedValue(
                null
            );

            await deleteMessage(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.success);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Message deleted',
            });
        });

        it('should handle errors', async () => {
            req.params.messageId = '1';
            (messageModel.findByIdAndDelete as jest.Mock).mockRejectedValue(
                new Error('Delete failed')
            );

            await deleteMessage(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Failed to delete message',
            });
        });
    });
});
