import express, { Request, Response } from 'express';
import { PipelineConfig } from '../types/pipeline';

export const pipelineRouter = express.Router();

let currentConfig: PipelineConfig = { enabledFilters: {} };

pipelineRouter.get('/config', (_req: Request, res: Response) => {
  res.json(currentConfig);
});

pipelineRouter.put('/config', (req: Request, res: Response) => {
  const cfg = req.body as PipelineConfig;
  currentConfig = cfg ?? { enabledFilters: {} };
  res.json(currentConfig);
});


