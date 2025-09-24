const prometheus = require('prom-client');
const logger = require('../../utils/logger');

// Create a Registry to register the metrics
const register = new prometheus.Registry();

// Add a default label which is added to all metrics
prometheus.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDurationMicroseconds = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestCounter = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Register the custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  const route = req.path;
  const method = req.method;
  
  // Record end time and metrics when response is finished
  res.on('finish', () => {
    const responseTimeInSec = (Date.now() - start) / 1000;
    const statusCode = res.statusCode.toString();
    
    // Increment the request counter
    httpRequestCounter.inc({ method, route, status_code: statusCode });
    
    // Observe the request duration
    httpRequestDurationMicroseconds.observe(
      { method, route, status_code: statusCode },
      responseTimeInSec
    );
    
    logger.debug(`${method} ${route} ${statusCode} - ${responseTimeInSec.toFixed(3)}s`);
  });
  
  next();
};

// Metrics endpoint to expose Prometheus metrics
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    logger.error('Error generating metrics:', err);
    res.status(500).send('Error generating metrics');
  }
};

module.exports = { metricsMiddleware, metricsEndpoint, register };