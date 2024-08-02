jest.mock('winston', () => ({
    createLogger: jest.fn().mockReturnValue({
        transports: [],
        exitOnError: false,
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }),
    format: {
        combine: jest.fn(),
        timestamp: jest.fn(),
        json: jest.fn(),
        colorize: jest.fn(),
        simple: jest.fn(),
    },
    transports: {
        File: jest.fn(),
        Console: jest.fn(),
    },
}));

import { transports, format, createLogger } from 'winston';
import logger, { stream, options } from '../../middleware/winston';

describe('Logger configuration', () => {
    it('createLogger is called with correct parameters', () => {
        expect(createLogger).toHaveBeenCalledWith({
            transports: [
                new transports.File(options.file),
                new transports.Console(options.console),
            ],
            exitOnError: false,
        });
    });

    it('File transport is configured correctly', () => {
        expect(transports.File).toHaveBeenCalledWith(options.file);
    });

    test('Console transport is configured correctly', () => {
        expect(transports.Console).toHaveBeenCalledWith(options.console);
    });

    it('File transport format is correctly combined', () => {
        expect(format.combine).toHaveBeenCalledWith(
            format.timestamp(),
            format.json()
        );
    });

    it('Console transport format is correctly combined', () => {
        expect(format.combine).toHaveBeenCalledWith(
            format.colorize(),
            format.simple()
        );
    });
});

describe('Logger stream', () => {
    it('should write message using logger.info', () => {
        const infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {
            // mock implementation
            return logger;
        });

        stream.write('test message');

        expect(infoSpy).toHaveBeenCalledWith('test message');

        infoSpy.mockRestore();
    });

    it('should not write message using logger.error', () => {
        const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {
            // mock implementation
            return logger;
        });

        stream.write('test message');

        expect(errorSpy).not.toHaveBeenCalled();

        errorSpy.mockRestore();
    });

    it('should not write message using logger.warn', () => {
        const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {
            return logger;
        });

        stream.write('test message');

        expect(warnSpy).not.toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    it('should log error messages correctly', () => {
        const errorMessage = 'This is an error message';
        logger.error(errorMessage);
        expect(logger.error).toHaveBeenCalledWith(errorMessage);
    });

    it('should log warn messages correctly', () => {
        const warnMessage = 'This is a warning message';
        logger.warn(warnMessage);
        expect(logger.warn).toHaveBeenCalledWith(warnMessage);
    });

    it('should log info messages correctly', () => {
        const infoMessage = 'This is an info message';
        logger.info(infoMessage);
        expect(logger.info).toHaveBeenCalledWith(infoMessage);
    });

    // Optional: test debug if you're using it
    it('should log debug messages correctly', () => {
        const debugMessage = 'This is a debug message';
        logger.debug(debugMessage);
        expect(logger.debug).toHaveBeenCalledWith(debugMessage);
    });

    // Test with objects
    it('should log objects correctly', () => {
        const obj = { key: 'value' };
        logger.info(obj);
        expect(logger.info).toHaveBeenCalledWith(obj);
    });

    // Test with multiple arguments
    it('should log multiple arguments correctly', () => {
        logger.error('Error occurred', { details: 'Some details' });
        expect(logger.error).toHaveBeenCalledWith('Error occurred', {
            details: 'Some details',
        });
    });
});
