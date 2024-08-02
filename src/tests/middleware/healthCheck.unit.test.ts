import { Request, Response } from 'express';
import { healthCheck } from '../../middleware/healthCheck';
import statusCodes from '../../constants/statusCodes';

jest.mock('../../middleware/winston');

describe('health check middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        req = {
            body: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    it('should notify that api is healthy', () => {
        healthCheck(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(statusCodes.success);
        expect(res.json).toHaveBeenCalledWith({
            message: 'All up and running !!',
        });
    });
});
