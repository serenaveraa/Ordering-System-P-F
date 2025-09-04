import { InMemoryStore } from '../src/store/memory';
import { buildMasterPipeline } from '../src/pipelines/master';

const store = InMemoryStore.getInstance();

describe('Master Pipeline Integration', () => {
  test('Processes a valid order successfully', async () => {
    const pipeline = buildMasterPipeline(store);
    const order: any = {
      id: 'o10',
      customerId: 'c1',
      items: [ { productId: 'p1', quantity: 12 }, { productId: 'p2', quantity: 1 } ],
      status: 'pending',
      createdAt: new Date()
    };
    const config = {
      enabledFilters: {},
      tax: { defaultRate: 0.21, categoryRates: { food: 0.1 } },
      shipping: { flatRate: 10, freeThreshold: 300 },
      payment: { simulate: 'success' },
      discounts: {
        membership: { bronze: 0.05, silver: 0.1, gold: 0.15, platinum: 0.2 },
        volume: {
          items: [ { threshold: 10, rate: 0.05 }, { threshold: 50, rate: 0.1 } ],
          amount: [ { threshold: 1000, rate: 0.05 }, { threshold: 5000, rate: 0.1 } ]
        }
      }
    } as any;

    const result = await pipeline.process(order, config);
    expect(result.success).toBe(true);
    expect(result.finalOrder.status).toBe('completed');
    expect(result.filterResults.length).toBeGreaterThan(0);
  });

  test('Fails when customer invalid', async () => {
    const pipeline = buildMasterPipeline(store);
    const order: any = { id: 'o11', customerId: 'unknown', items: [{ productId: 'p1', quantity: 1 }], status: 'pending', createdAt: new Date() };
    const config: any = { enabledFilters: {}, payment: { simulate: 'success' } };
    const result = await pipeline.process(order, config);
    expect(result.success).toBe(false);
    expect(result.finalOrder.status).toBe('rejected');
    expect(result.failedAt).toBeDefined();
  });

  test('Fails on payment timeout', async () => {
    const pipeline = buildMasterPipeline(store);
    const order: any = { id: 'o12', customerId: 'c1', items: [{ productId: 'p1', quantity: 1 }], status: 'pending', createdAt: new Date() };
    const config: any = { enabledFilters: {}, payment: { simulate: 'timeout', timeoutMs: 10 } };
    const result = await pipeline.process(order, config);
    expect(result.success).toBe(false);
    expect(result.failedAt).toBe('PaymentProcessingFilter');
  });
});


