import logger from '../../middleware/winston';
import { Pool, types, PoolConfig, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const db_config: PoolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
};

if (process.env.NODE_ENV === 'test') {
    db_config.ssl = {
        rejectUnauthorized: false,
    };
}

let db_connection: Pool;
function startConnection(): void {
    // type parsers here
    types.setTypeParser(1082, function (stringValue: string): string {
        return stringValue; // 1082 is for date type
    });

    db_connection = new Pool(db_config);

    db_connection.connect((err: Error, client: PoolClient) => {
        if (!err) {
            logger.info('PostgreSQL Connected');
            client.release();
        } else {
            logger.error('PostgreSQL Connection Failed ');
            db_connection.on('error', (err: Error) => {
                logger.error('Unexpected error on idle client', err);
            });
        }
    });
}

startConnection();

export default db_connection;
