export function initTracing(): void {
  if (process.env.DATADOG_API_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tracer = require('dd-trace');
    tracer.init({
      service: 'forge-api',
      env: process.env.ENVIRONMENT ?? 'development',
    });
  }
}
