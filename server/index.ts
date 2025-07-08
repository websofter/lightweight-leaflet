import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { fetchAndParseContent } from './utils/fetchers';

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Маршруты
app.get('/', (c) => {
  return c.json({
    message: 'Apple MapKit Parser Server',
    version: '1.0.0',
    endpoints: {
      '/parse/csr': 'GET - Parse CSR JavaScript only',
      '/parse/mapkit': 'GET - Parse MapKit JavaScript only',
      '/health': 'GET - Health check'
    }
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/parse/csr', async (c) => {
  const csrUrl = 'https://cdn.apple-mapkit.com/ti/csr/1.x.x/mk-csr.js?mapkitVersion=5.72.53';
  
  try {
    const content = await fetchAndParseContent(csrUrl);
    // return c.json({ content });
    return c.text(content, 200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Content-Disposition': 'inline', // Принудительно показать в браузере
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
  } catch (error) {
    return c.json({
      error: 'Failed to parse CSR data',
      details: error instanceof Error ? error.message : String(error)    
    }, 500);
  }
});

app.get('/parse/mapkit', async (c) => {
  const mapkitUrl = 'https://cdn.apple-mapkit.com/mk/5.72.53/mapkit.js';
  
  try {
    let content = await fetchAndParseContent(mapkitUrl);
    content = content.replaceAll('https://cdn.apple-mapkit.com/ma/bootstrap', `http://${host}:3000/parse/mapkit/ma/bootstrap`)
    return c.text(content, 200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Content-Disposition': 'inline', // Принудительно показать в браузере
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
  } catch (error) {
    return c.json({
      error: 'Failed to parse MapKit data',
      details: error instanceof Error ? error.message : String(error)    
    }, 500)
  }
});

app.get('/parse/mapkit/ma/bootstrap', async (c) => {
  const mapkitUrl = 'https://cdn.apple-mapkit.com/ma/bootstrap?apiVersion=2&countryCode=NL&mkjsVersion=5.72.53&poi=1';
  const headers = {
    'Authorization': 'Bearer eyJraWQiOiJEWjdCMllHNjI5IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJGUzNZTDRCOFZZIiwiaWF0IjoxNzI2MDUxNjQxLCJleHAiOjE3NTcxNTU2NDEsIm9yaWdpbiI6Imh0dHBzOi8vc2F0ZWxsaXRlcy5wcm8ifQ.TQRfj1QKXWHMDHPNErlzD2DoQrZTLVvNH9GDZFK4aeRKLAuRkaDU6iNIfKIHHTkMMHsQGbSU06hYW_AkbdRZZw',
    'Content-Type': 'application/json',
    'User-Agent': 'MyApp/1.0',
    'Accept': 'application/json'
  };

  try {
    const content = await fetchAndParseContent(mapkitUrl, headers);
    // return c.json({ content });
    return c.text(content, 200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Content-Disposition': 'inline', // Принудительно показать в браузере
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
  } catch (error) {
    return c.json({
      error: 'Failed to parse MapKit data',
      details: error instanceof Error ? error.message : String(error)    
    }, 500)
  }
});

// Обработка 404
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  }, 404);
});

// Обработка ошибок
app.onError((err, c) => {
  console.error(err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message
  }, 500);
});

console.log(`🚀 Server starting on port ${port}`);
console.log(`📍 Available endpoints:`);
console.log(`   GET  http://${host}:${port}/`);
console.log(`   GET  http://${host}:${port}/parse/csr`);
console.log(`   GET  http://${host}:${port}/parse/mapkit`);
console.log(`   GET  http://${host}:${port}/parse/mapkit/ma/bootstrap`);
console.log(`   GET  http://${host}:${port}/health`);

export default {
  port,
  fetch: app.fetch,
};