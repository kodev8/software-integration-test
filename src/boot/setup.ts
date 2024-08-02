import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import session from 'express-session';
import morgan from 'morgan';
import logger, { stream } from '../middleware/winston';

// routes
import moviesRoutes from '../routes/movies.routes';
import ratingRoutes from '../routes/rating.routes';
import authRoutes from '../routes/auth.routes';
import commentsRoutes from '../routes/comments.routes';
import messagesRoutes from '../routes/messages.routes';
import usersRoutes from '../routes/users.routes';
import profileRoutes from '../routes/profile.routes';

// middleware
import validator from '../middleware/validator';
import healthCeck from '../middleware/healthCheck';
import verifyToken from '../middleware/authentication';
import notFound from '../middleware/notFound';

import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();

try {
    mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB Connected');
} catch (error) {
    logger.error('Error connecting to DB' + error);
}

declare module 'express-session' {
    export interface SessionData {
        user: {
            email?: string;
            _id?: string;
        };
    }
}

declare module 'jsonwebtoken' {
    export interface UserJwtPayload {
        user: {
            email: string;
            id: string;
        };
    }
}

// MIDDLEWARE
export const registerCoreMiddleWare = (): Application => {
    try {
        // using our session
        app.use(
            session({
                secret: process.env.SESSION_SECRET,
                resave: false,
                saveUninitialized: true,
                cookie: {
                    secure: false,
                    httpOnly: true,
                },
            })
        );

        app.use(morgan('combined', { stream }));
        app.use(express.json()); // returning middleware that only parses Json
        app.use(cors({})); // enabling CORS
        app.use(helmet()); // enabling helmet -> setting response headers

        app.use(validator);
        app.use(healthCeck);

        app.use('/auth', authRoutes);
        app.use('/users', usersRoutes);

        app.use('/movies', verifyToken, moviesRoutes);
        app.use('/ratings', verifyToken, ratingRoutes);
        app.use('/profile', verifyToken, profileRoutes);
        app.use('/comments', verifyToken, commentsRoutes);
        app.use('/messages', verifyToken, messagesRoutes);

        app.use(notFound);

        logger.http('Done registering all middlewares');
        return app;
    } catch (err) {
        logger.error('Error thrown while executing registerCoreMiddleWare');
        process.exit(1);
    }
};

// handling uncaught exceptions
const handleError = (): void => {
    // 'process' is a built it object in nodejs
    // if uncaught exceptoin, then we execute this
    //
    process.on('uncaughtException', (err) => {
        logger.error(
            `UNCAUGHT_EXCEPTION OCCURED : ${JSON.stringify(err.stack)}`
        );
    });
};

// start applicatoin
export const startApp = (): void => {
    try {
        // register core application level middleware
        registerCoreMiddleWare();

        app.listen(PORT, () => {
            logger.info('Listening on 127.0.0.1:' + PORT);
        });

        // exit on uncaught exception
        handleError();
    } catch (err) {
        logger.error(
            `startup :: Error while booting the applicaiton ${JSON.stringify(
                err,
                undefined,
                2
            )}`
        );
        throw err;
    }
};
