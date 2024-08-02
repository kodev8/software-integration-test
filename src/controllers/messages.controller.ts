import { Request, Response } from 'express';
import messageModel, { IMessage } from '../models/messageModel';
import {
    MessageRequest,
    AddMessageRequest,
    EditMessageRequest,
} from '../types/customRequests.interface';
import statusCodes from '../constants/statusCodes';
import logger from '../middleware/winston';

const getMessages = async (_req: Request, res: Response): Promise<Response> => {
    const messages: IMessage[] = await messageModel.find();
    return res.status(statusCodes.success).json(messages);
};

const getMessageById = async (
    req: MessageRequest,
    res: Response
): Promise<Response> => {
    const { messageId } = req.params;

    try {
        const message: IMessage = await messageModel.findById(messageId);
        if (!message) {
            return res
                .status(statusCodes.notFound)
                .json({ error: 'Message not found' });
        }
        return res.status(statusCodes.success).json(message);
    } catch (error) {
        logger.error(error.stack);
        return res
            .status(statusCodes.queryError)
            .json({ error: 'Error while getting message' });
    }
};

const addMessage = async (
    req: AddMessageRequest,
    res: Response
): Promise<Response> => {
    const { message } = req.body;

    if (!message || !message.name) {
        return res
            .status(statusCodes.badRequest)
            .json({ error: 'missing information' });
    }

    if (!req.session.user) {
        return res
            .status(statusCodes.queryError)
            .json({ error: 'You are not authenticated' });
    }

    // check this
    try {
        const messageObj = new messageModel({
            name: message.name,
            user: req.session.user._id,
        });
        const savedMessage = await messageObj.save();
        return res.status(statusCodes.success).json(savedMessage);
    } catch (error) {
        logger.error(error.stack);
        return res
            .status(statusCodes.queryError)
            .json({ error: 'Failed to add message' });
    }
};

const editMessage = async (
    req: EditMessageRequest,
    res: Response
): Promise<Response> => {
    const { messageId } = req.params;
    const { name } = req.body;

    if (!name || !messageId)
        return res
            .status(statusCodes.badRequest)
            .json({ error: 'missing information' });

    try {
        const editMessage: IMessage = await messageModel.findByIdAndUpdate(
            messageId,
            { name },
            { new: true }
        );

        return res.status(statusCodes.success).json(editMessage);
    } catch (error) {
        logger.error(error.stack);
        return res
            .status(statusCodes.queryError)
            .json({ error: 'Failed to update message' });
    }
};

const deleteMessage = async (
    req: MessageRequest,
    res: Response
): Promise<Response> => {
    const { messageId } = req.params;

    if (!messageId)
        return res
            .status(statusCodes.badRequest)
            .json({ error: 'missing information' });

    try {
        await messageModel.findByIdAndDelete(messageId);
        return res
            .status(statusCodes.success)
            .json({ message: 'Message deleted' });
    } catch (error) {
        logger.error(error.stack);
        return res
            .status(statusCodes.queryError)
            .json({ error: 'Failed to delete message' });
    }
};

export { getMessages, getMessageById, addMessage, editMessage, deleteMessage };
