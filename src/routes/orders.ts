import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { InMemoryStore } from '../store/memory';
import { buildMasterPipeline } from '../pipelines/master';
import { PipelineConfig } from '../types/pipeline';
import { Order } from '../types/models';

export const ordersRouter = express.Router();

// In-memory status registry
const processingStatus = new Map<string, any>();

ordersRouter.post('/process', async (req: Request, res: Response) => {
  const order: Order = {
    ...req.body,
    id: req.body?.id ?? uuidv4(),
    status: 'pending',
    createdAt: req.body?.createdAt ? new Date(req.body.createdAt) : new Date(),
  };

  const config: PipelineConfig = req.body?.config ?? { enabledFilters: {} };

  const store = InMemoryStore.getInstance();
  const pipeline = buildMasterPipeline(store);

  processingStatus.set(order.id, { status: 'processing' });

  try {
    const result = await pipeline.process(order, config);
    processingStatus.set(order.id, result);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    processingStatus.set(order.id, { success: false, error: err?.message ?? 'unknown' });
    res.status(500).json({ error: 'Pipeline failed', details: err?.message ?? 'unknown' });
  }
});

ordersRouter.get('/:id/status', (req: Request, res: Response) => {
  const id = req.params.id;
  const status = processingStatus.get(id);
  if (!status) return res.status(404).json({ error: 'Order not found' });
  res.json(status);
});


