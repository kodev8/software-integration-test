import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger, { stream } from '../middleware/winston';
import mongoose from 'mongoose';
import session from 'express-session';

//routes
import authRoutes from '../routes/auth.routes';
import moviesRoutes from '../routes/movies.routes';
import usersRoutes from '../routes/users.routes';
import ratingRoutes from '../routes/rating.routes';
import messagesRoutes from '../routes/messages.routes';
import profileRoutes from '../routes/profile.routes';

//middlewares
import verifyToken from '../middleware/authentication';
import validator from '../middleware/validator';
import healthCeck from '../middleware/healthCheck';
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

// for nodemon
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

export const registerCoreMiddleWare = (): Application => {
    try {
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
        app.use(express.json());
        app.use(cors());
        app.use(helmet());
        app.use(validator);
        app.use(healthCeck);

        app.use('/users', usersRoutes);

        app.use('/auth', authRoutes);
        app.use('/movies', verifyToken, moviesRoutes);
        app.use('/ratings', verifyToken, ratingRoutes);
        app.use('/messages', verifyToken, messagesRoutes);
        app.use('/profile', verifyToken, profileRoutes);

        app.use(notFound);

        logger.http('Done registering all middlewares');
        return app;
    } catch (err) {
        logger.error('Error thrown while executing registerCoreMiddleWare');
        process.exit(1);
    }
};

const handleError = (): void => {
    process.on('uncaughtException', (err) => {
        logger.error(
            `UNCAUGHT_EXCEPTION OCCURED : ${JSON.stringify(err.stack)}`
        );
    });
};

export const startApp = (): void => {
    // register core application level middleware
    registerCoreMiddleWare();
    try {
        app.listen(PORT, () => {
            logger.info('Listening on 127.0.0.1:' + PORT);
        });
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

    // exit on uncaught exception
    handleError();
};
