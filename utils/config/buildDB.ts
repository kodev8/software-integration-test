import { stableUser1, stableUser2 } from '../../src/tests/users/users.mockData';
import bcrypt from 'bcryptjs';
import { mockMovies } from '../../src/tests/movies/movies.mockData';
import logger from '../../src/middleware/winston';
import mongoose from 'mongoose';
import messageModel from '../../src/models/messageModel';
import { Client, ClientConfig } from 'pg';
import userModel, { IUserDocument } from '../../src/models/userModel';
import * as fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();
interface IExpectedBuildDB {
    users?: boolean;
    messages?: boolean;
    movies?: boolean;
}

const clearSchema = async (
    thisClient: Client | undefined | null
): Promise<void> => {
    try {
        if (!thisClient) return;
        await thisClient.query(`
                            DROP SCHEMA public CASCADE;
                            CREATE SCHEMA public;
                            GRANT ALL ON SCHEMA public TO postgres;
                            GRANT ALL ON SCHEMA public TO public;`);
    } catch (error) {
        logger.error(error.stack);
    }
};

let dbClient: Client;

export const createDB = async (): Promise<void> => {
    const clientConfig: ClientConfig = {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        password: process.env.DB_PASSWORD,
        port: 5432,
        database: 'postgres',
    };

    if (process.env.NODE_ENV === 'test') {
        clientConfig.ssl = {
            rejectUnauthorized: false,
        };
    }

    const client = new Client(clientConfig);

    const dbName = process.env.DB_NAME;

    try {
        await client.connect();

        // Check if the database exists
        const res = await client.query(
            `SELECT datname FROM pg_database WHERE datname = $1`,
            [dbName]
        );

        if (res.rowCount !== 0) {
            if (process.env.NODE_ENV === 'test') {
                dbClient = new Client({ ...clientConfig, database: dbName });
                await dbClient.connect();
                // db exists so clear all tables to ensure a clean slate when running tests
                await clearSchema(dbClient);
                logger.info(`Database ${dbName} cleared successfully.`);
            }
        } else {
            // Database does not exist, so create it
            await client.query(`CREATE DATABASE $1`, [dbName]);
            dbClient = new Client({ ...clientConfig, database: dbName });
            await dbClient.connect();
            logger.info(`Database ${dbName} created successfully.`);
        }
    } catch (err) {
        logger.error(err.stack);
        process.exit(1);
    }

    client.end();
};

import pool from '../../src/boot/database/db_connect';
const sql = fs.readFileSync(path.join(__dirname, 'setup.sql')).toString();

export const buildDB = async ({
    users = false,
    messages = false,
    movies = false,
}: IExpectedBuildDB): Promise<void> => {
    await createDB();
    await pool.query(sql);

    if (users) {
        const stableUsers = [stableUser1, stableUser2];
        const client = await pool.connect();
        for (const user of stableUsers) {
            try {
                await client.query('BEGIN');
                await client.query(
                    `INSERT INTO users(email, username, password, creation_date) VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
                    [
                        user.email,
                        user.username,
                        user.password,
                        user.creation_date,
                    ]
                );

                await client.query(
                    'INSERT INTO addresses (email,  country, street, city) VALUES ($1, $2, $3, $4);',
                    [user.email, user.country, user.street, user.city]
                );
                await client.query('COMMIT');
            } catch (error) {
                if (error.code !== '23505') {
                    // if not unique constraint violation
                    client.query('ROLLBACK');
                    throw error;
                } else {
                    await client.query('ROLLBACK');
                }
            }
        }

        client.release();

        const users: IUserDocument[] = [];
        await userModel.deleteMany({});
        for (const user of stableUsers) {
            const userObj = new userModel({
                email: user.email,
                username: user.username,
                password: bcrypt.hashSync(user.password, 10),
                creation_date: user.creation_date,
            });

            const newUser = await userObj.save();
            users.push(newUser);
        }

        // message MODEL
        if (messages) {
            // clear messages
            await messageModel.deleteMany({});
        }
    }

    const movieQuery =
        'INSERT INTO movies (movie_id, title, release_date, author, type, poster, backdrop_poster, overview, rating) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);';

    if (movies) {
        for (const movie of mockMovies) {
            try {
                await pool.query(movieQuery, [
                    movie.movie_id,
                    movie.title,
                    movie.release_date,
                    movie.author,
                    movie.type,
                    movie.poster,
                    movie.backdrop_poster,
                    movie.overview,
                    movie.rating,
                ]);

                const user =
                    movie.movie_id % 2 === 0 ? stableUser2 : stableUser1;
                await pool.query(
                    'INSERT INTO seen_movies (email, movie_id) VALUES ($1, $2);',
                    [user.email, movie.movie_id]
                );
            } catch (error) {
                if (error.code !== '23505') {
                    // if not unique constraint violation
                    throw error;
                }
            }
        }
    }
};

const cleanModels = async (): Promise<void> => {
    try {
        await userModel.deleteMany({});
    } catch (error) {
        logger.error(error.stack);
    }
};

export const teardownConnections = async (): Promise<void> => {
    try {
        await clearSchema(dbClient);
        await cleanModels();
        await pool.end();
        mongoose.connection.close();
        await dbClient.end();
    } catch (error) {
        logger.error(error.stack);
    }
};
