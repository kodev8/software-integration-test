import 'jsonwebtoken';

declare module 'jsonwebtoken' {
    export interface UserJwtPayload {
        user: {
            email: string;
            id: string;
        };
    }
}
