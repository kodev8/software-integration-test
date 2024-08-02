import { Request, Response } from 'express';
import userModel, { IUser, IUserDocument } from '../models/userModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import { Session, SessionData } from 'express-session';
import { AuthRequest } from '../types/customRequests.interface';
import statusCodes from '../constants/statusCodes';
import logger from '../middleware/winston';

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

const signin = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res
            .status(statusCodes.badRequest)
            .json({ error: 'missing information' });
    }

    try {
        const user: IUserDocument | null = await userModel.findOne({ email });

        if (!user) {
            return res
                .status(statusCodes.badRequest)
                .json({ message: 'User not found' });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            return res
                .status(statusCodes.badRequest)
                .json({ message: "Email or password don't match" });
        }

        req.session.user = {
            _id: user._id.toString(),
        };

        const token = jwt.sign(
            { user: { id: user._id, email: user.email } },
            process.env.JWT_SECRET_KEY as string,
            {
                expiresIn: '1h',
            }
        );

        return res.status(statusCodes.success).json({ token });
    } catch (error) {
        logger.error('Error while getting user from DB', error.message);
        return res
            .status(statusCodes.queryError)
            .json({ error: 'Failed to get user' });
    }
};

const getUser = async (req: Request, res: Response): Promise<Response> => {
    if (!req.session.user) {
        return res
            .status(statusCodes.unauthorized)
            .json({ error: 'You are not authenticated' });
    }

    try {
        const user: IUser | null = await userModel
            .findById(req.session.user._id, {
                password: 0,
            })
            .populate('messages');

        if (!user) {
            return res
                .status(statusCodes.badRequest)
                .json({ message: 'User not found' });
        }

        return res.status(statusCodes.success).json(user);
    } catch (error) {
        logger.error('Error while getting user from DB', error.message);
        return res
            .status(statusCodes.queryError)
            .json({ error: 'Failed to get user' });
    }
};

export default {
    signup,
    signin,
    getUser,
};
