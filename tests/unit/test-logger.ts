import { logger } from '../../server/lib/logger';

// Test the logger with different log levels
logger.debug('This is a debug message');
logger.info('This is an info message');
logger.warn('This is a warning message');
logger.error('This is an error message');

// Test nested function calls
function nestedFunction() {
  logger.info('This is a message from a nested function');
}

nestedFunction();