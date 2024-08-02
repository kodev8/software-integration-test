import { Request, Response, NextFunction } from 'express';
import validator from '../../middleware/validator';
import logger from '../../middleware/winston';
import statusCodes from '../../constants/statusCodes';

jest.mock('../../middleware/winston');

describe('validator middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            body: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should delete the creation_date if it exists in the request body', () => {
        req.body.creation_date = '2022-01-01';
        validator(req as Request, res as Response, next);
        expect(req.body.creation_date).toBe(new Date().toJSON().slice(0, 10));
    });

    it('should set creation_date to the current date', () => {
        validator(req as Request, res as Response, next);
        expect(req.body.creation_date).toBe(new Date().toJSON().slice(0, 10));
    });

    it('should set empty string values to null', () => {
        req.body = { name: '', email: 'johndoe@email.com' };
        validator(req as Request, res as Response, next);
        expect(req.body).toEqual({
            name: null,
            email: 'johndoe@email.com',
            creation_date: new Date().toJSON().slice(0, 10),
        });
    });

    it('should call next() if no error occurs', () => {
        validator(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
    });

    it('should log an error and send a 400 status code if an error occurs', () => {
        const error = new Error('Test error');
        jest.spyOn(Object, 'entries').mockImplementationOnce(() => {
            throw error;
        });
        validator(req as Request, res as Response, next);
        expect(logger.error).toHaveBeenCalledWith(error);
        expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
        expect(res.json).toHaveBeenCalledWith({ error: 'Bad request' });
    });

    it('should return 500 status code if an error occurs', () => {
        const error = new Error('Test error');
        jest.spyOn(Object, 'entries').mockImplementationOnce(() => {
            throw error;
        });
        validator(req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
    });
});
