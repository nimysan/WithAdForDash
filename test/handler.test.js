import { handler } from '../src/handler.js';
import viewerRequestEvent from './events/viewer-request.json' assert { type: 'json' };

describe('Lambda@Edge Viewer Request Handler', () => {
  test('should handle viewer request event', async () => {
    const result = await handler(viewerRequestEvent);
    expect(result).toBeDefined();
    // Add more specific assertions based on your handler's expected behavior
  });
});
