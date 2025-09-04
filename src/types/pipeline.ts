import { Customer, Order, Product } from './models';

export interface ProcessingContext {
  // place for dependencies and shared state
  services: {
    now: () => Date;
    logger?: (level: 'info' | 'warn' | 'error', message: string, meta?: any) => void;
  };
  store: {
    getCustomerById: (id: string) => Promise<Customer | undefined>;
    getProductById: (id: string) => Promise<Product | undefined>;
  };
  config: PipelineConfig;
}

export interface FilterResult {
  success: boolean;
  order: Order;
  errors: string[];
  warnings: string[];
  name?: string;
  durationMs?: number;
}

export interface OrderFilter {
  name: string;
  process(order: Order, context: ProcessingContext): Promise<FilterResult>;
}

export interface PipelineConfig {
  enabledFilters: Record<string, boolean>;
  tax?: {
    defaultRate: number; // e.g. 0.21
    categoryRates?: Record<string, number>;
    regionalRate?: number; // optional extra
  };
  discounts?: {
    membership: Record<'bronze' | 'silver' | 'gold' | 'platinum', number>;
    volume: { items: { threshold: number; rate: number }[]; amount: { threshold: number; rate: number }[] };
  };
  shipping?: {
    flatRate?: number;
    freeThreshold?: number;
    tiered?: { threshold: number; amount: number }[];
  };
  payment?: {
    simulate?: 'success' | 'fail' | 'timeout';
    timeoutMs?: number;
  };
}

export interface PipelineResult {
  success: boolean;
  finalOrder: Order;
  filterResults: FilterResult[];
  executionTime: number;
  failedAt?: string;
}

export interface OrderPipeline {
  filters: OrderFilter[];
  addFilter(filter: OrderFilter): void;
  removeFilter(filterName: string): void;
  process(order: Order, config: PipelineConfig): Promise<PipelineResult>;
}


