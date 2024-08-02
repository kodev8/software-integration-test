export interface IPGUser {
    user_id?: number;
    username: string;
    email: string;
    password: string;
    country?: string;
    city?: string;
    street?: string;
    creation_date?: Date | string;
}
