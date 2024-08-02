import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger, { stream } from '../middleware/winston';

//middlewares
// import verifyToken from '../middleware/authentication';

import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();
export const registerCoreMiddleWare = (): Application => {
    app.use(morgan('combined', { stream }));
    app.use(express.json());
    app.use(cors());
    app.use(helmet());

    return app;
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
