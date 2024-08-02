import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();
export const registerCoreMiddleWare = (): Application => {
    // TODO
    app.use(express.json());
    app.use(cors());
    app.use(helmet());

    return app;
};

const handleError = (): void => {
    // TODO
};

export const startApp = (): void => {
    // register core application level middleware
    registerCoreMiddleWare();

    app.listen(PORT, () => {
        // TODO
    });

    // exit on uncaught exception
    handleError();
};
