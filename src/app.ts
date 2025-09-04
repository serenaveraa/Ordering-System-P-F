import express from 'express';
import { ordersRouter } from './routes/orders';
import { pipelineRouter } from './routes/pipeline';

export const app = express();

app.use(express.json());

// Basic health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/orders', ordersRouter);
app.use('/pipeline', pipelineRouter);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err?.message ?? 'unknown' });
});


