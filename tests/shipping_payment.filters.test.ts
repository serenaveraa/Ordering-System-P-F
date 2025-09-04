import { ShippingCostFilter, PaymentProcessingFilter } from '../src/filters/shipping_payment';
import { InMemoryStore } from '../src/store/memory';

const store = InMemoryStore.getInstance();
const baseContext = {
  services: { now: () => new Date() },
  store: {
    getCustomerById: (id: string) => store.getCustomerById(id),
    getProductById: (id: string) => store.getProductById(id),
  },
  config: {
    enabledFilters: {},
    shipping: { flatRate: 10, freeThreshold: 200, tiered: [ { threshold: 100, amount: 5 } ] },
    payment: { simulate: 'success' }
  },
};

describe('Shipping & Payment Filters', () => {
  test('ShippingCostFilter applies flat/tiered/free rules', async () => {
    const order: any = { id: 'o20', customerId: 'c1', items: [{ productId: 'p1', quantity: 1 }], status: 'pending', createdAt: new Date(), subtotal: 150, discounts: [] };
    const res = await ShippingCostFilter.process(order, baseContext as any);
    expect(res.success).toBe(true);
    expect(res.order.shipping).toBe(5);
  });

  test('PaymentProcessingFilter success adds metadata', async () => {
    const order: any = { id: 'o21', customerId: 'c1', items: [{ productId: 'p1', quantity: 1 }], status: 'pending', createdAt: new Date(), subtotal: 20 };
    const res = await PaymentProcessingFilter.process(order, baseContext as any);
    expect(res.success).toBe(true);
    expect(res.order.metadata?.payment?.status).toBe('captured');
  });

  test('PaymentProcessingFilter fail returns error', async () => {
    const order: any = { id: 'o22', customerId: 'c1', items: [{ productId: 'p1', quantity: 1 }], status: 'pending', createdAt: new Date(), subtotal: 20 };
    const ctx = { ...baseContext, config: { ...baseContext.config, payment: { simulate: 'fail' } } } as any;
    const res = await PaymentProcessingFilter.process(order, ctx);
    expect(res.success).toBe(false);
  });

  test('PaymentProcessingFilter timeout returns error', async () => {
    const order: any = { id: 'o23', customerId: 'c1', items: [{ productId: 'p1', quantity: 1 }], status: 'pending', createdAt: new Date(), subtotal: 20 };
    const ctx = { ...baseContext, config: { ...baseContext.config, payment: { simulate: 'timeout', timeoutMs: 20 } } } as any;
    const res = await PaymentProcessingFilter.process(order, ctx);
    expect(res.success).toBe(false);
  });
});


