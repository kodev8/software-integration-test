import { Request } from 'express';
export interface UserRequest extends Request {
    user?: {
        email: string;
    };
}
export interface AuthRequest extends Request {
    username?: string;
    email: string;
    password: string;
}
