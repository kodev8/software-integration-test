import dotenv from 'dotenv';
dotenv.config();
import { startApp } from './boot/setup';

((): void => {
    try {
        startApp();
    } catch (error) {
        // TODO
    }
})();
