import { Response } from 'express';
import statusCodes from '../constants/statusCodes';
import logger from '../middleware/winston';
import pool from '../boot/database/db_connect';
import { RegisterRequest } from '../types/customRequests.interface';

const register = async (req: RegisterRequest, res: Response): Promise<void> => {
    const { email, username, password, country, city, street } = req.body;

    if (!email || !username || !password || !country) {
        res.status(statusCodes.badRequest).json({
            message: 'Missing parameters',
        });
    } else {
        const client = await pool.connect();

        try {
            const result = await client.query(
                'SELECT * FROM users WHERE email = $1;',
                [email]
            );
            if (result.rowCount) {
                res.status(statusCodes.userAlreadyExists).json({
                    message: 'User already has an account',
                });
            } else {
                await client.query('BEGIN');
                const addedUser = await client.query(
                    `INSERT INTO users(email, username, password, creation_date) VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
                    [email, username, password, req.body.creation_date]
                );

                logger.info('USER ADDED', addedUser.rowCount);

                const address = await client.query(
                    `INSERT INTO addresses(email, country, street, city) VALUES ($1, $2, $3, $4);`,
                    [email, country, street, city]
                );
                logger.info('ADDRESS ADDED', address.rowCount);

                res.status(statusCodes.success).json({
                    message: 'User created',
                });
                await client.query('COMMIT');
            }
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(error.stack);
            res.status(statusCodes.queryError).json({
                message: 'Exception occurred while registering',
            });
        } finally {
            client.release();
        }
    }
};

export { register };
