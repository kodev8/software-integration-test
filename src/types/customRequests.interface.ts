import { Request } from 'express';
import { IPGUser } from './pguser.interface';

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

export interface RegisterRequest extends Request {
    body: IPGUser;
}

export interface LoginRequest extends Request {
    body: {
        email: string;
        password: string;
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

// profile
export interface EditPasswordRequest extends UserRequest {
    body: {
        oldPassword?: string;
        newPassword?: string;
    };
}
