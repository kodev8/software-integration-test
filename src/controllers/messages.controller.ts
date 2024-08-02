import { Request, Response } from 'express';
import messageModel, { IMessageDocument } from '../models/messageModel';

import statusCodes from '../constants/statusCodes';

const getMessages = async (_req: Request, res: Response): Promise<Response> => {
    const messages: IMessageDocument[] = await messageModel.find();
    return res.status(statusCodes.success).json(messages);
};

export { getMessages };
