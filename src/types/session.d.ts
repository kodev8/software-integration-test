import 'express-session';

// can't we do this herer?
// do what?

declare module 'express-session' {
    export interface SessionData {
        user: {
            email?: string;
            _id?: string;
        };
    }
}
