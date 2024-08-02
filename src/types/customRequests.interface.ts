import { Request } from 'express';
import { IPGUser } from './pguser.interface';

// auth
export interface AuthRequest extends Request {
    username?: string;
    email: string;
    password: string;
}

// uses
export interface RegisterRequest extends Request {
    body: IPGUser;
}

export interface LoginRequest extends Request {
    body: {
        email: string;
        password: string;
    };
}

export interface UserRequest extends Request {
    user?: {
        email: string;
    };
}

// profile
export interface EditPasswordRequest extends UserRequest {
    body: {
        oldPassword?: string;
        newPassword?: string;
    };
}

// rating
export interface AddRatingRequest extends UserRequest {
    params: {
        movieId?: string;
    };
    body: {
        rating?: number;
    };
}

// messages

export interface AddMessageRequest extends Request {
    body: {
        message: {
            name: string;
        };
    };
}

export interface EditMessageRequest extends Request {
    params: {
        messageId: string;
    };
    body: {
        name: string;
    };
}
