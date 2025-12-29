/**
 * MSW Server Configuration
 * 
 * This server intercepts HTTP requests during tests
 * and returns mocked responses.
 * 
 * @see https://mswjs.io/docs/getting-started
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server with default handlers
export const server = setupServer(...handlers);

