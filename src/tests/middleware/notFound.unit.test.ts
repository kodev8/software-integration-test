import { Request, Response } from 'express';
import notFound from '../../middleware/notFound';
import statusCodes from '../../constants/statusCodes';

describe('notFound Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    it('should return a 404 error with message "Not Found"', () => {
        notFound(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(statusCodes.notFound);
        expect(res.json).toHaveBeenCalledWith({ message: 'Not Found' });
    });
});
