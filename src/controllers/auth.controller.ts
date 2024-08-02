import { Response } from 'express';
import userModel from '../models/userModel';
import bcrypt from 'bcryptjs';
// import { Session, SessionData } from 'express-session';
import { AuthRequest } from '../types/customRequests.interface';
import statusCodes from '../constants/statusCodes';

const signup = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { username, email, password } = req.body;

    if (!username || !password || !email) {
        return res
            .status(statusCodes.badRequest)
            .json({ error: 'missing information' });
    }

    const hash = bcrypt.hashSync(password, 10);

    try {
        const User = new userModel({
            email,
            username,
            password: hash,
        });
        const savedUser = await User.save();
        return res.status(statusCodes.success).json(savedUser);
    } catch (error) {
        return res
            .status(statusCodes.queryError)
            .json({ message: 'failed to save user' });
    }
};

export default {
    signup,
};
