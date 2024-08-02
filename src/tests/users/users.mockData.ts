import { IPGUser } from '../../types/pguser.interface';

export const mockUser1: IPGUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123',
    country: 'Testland',
    creation_date: '2021-09-01',
    city: 'Test City',
    street: 'Test Street',
};

export const mockUser2: IPGUser = {
    email: 'test2@example.com',
    username: 'testuser2',
    password: 'password123',
    country: 'Testland',
    creation_date: '2021-09-01',
    city: 'Test City',
    street: 'Test Street',
};

export const stableUser1: IPGUser = {
    email: 'stable1@example.com',
    username: 'stableuser1',
    password: 'password123',
    country: 'Testland',
    creation_date: new Date().toISOString().split('T')[0],
    city: 'Test City',
    street: 'Test Street',
};

export const stableUser2: IPGUser = {
    email: 'stable2@example.com',
    username: 'stableuser2',
    password: 'password123',
    country: 'Testland',
    creation_date: new Date().toISOString().split('T')[0],
    city: 'Test City',
    street: 'Test Street',
};
