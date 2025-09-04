import { CustomerValidationFilter, DataIntegrityFilter, ProductValidationFilter } from '../src/filters/validation';
import { InMemoryStore } from '../src/store/memory';

const store = InMemoryStore.getInstance();
const baseContext = {
  services: { now: () => new Date() },
  store: {
    getCustomerById: (id: string) => store.getCustomerById(id),
    getProductById: (id: string) => store.getProductById(id),
  },
  config: { enabledFilters: {} },
};

describe('Validation Filters', () => {
  test('DataIntegrityFilter should fail on missing items', async () => {
    const order: any = { id: 'o1', customerId: 'c1', items: [], status: 'pending', createdAt: new Date() };
    const res = await DataIntegrityFilter.process(order, baseContext as any);
    expect(res.success).toBe(false);
  });

  test('CustomerValidationFilter should pass for active customer', async () => {
    const order: any = { id: 'o2', customerId: 'c1', items: [{ productId: 'p1', quantity: 1 }], status: 'pending', createdAt: new Date() };
    const res = await CustomerValidationFilter.process(order, baseContext as any);
    expect(res.success).toBe(true);
  });

  test('CustomerValidationFilter should fail for inactive customer', async () => {
    const order: any = { id: 'o3', customerId: 'c2', items: [{ productId: 'p1', quantity: 1 }], status: 'pending', createdAt: new Date() };
    const res = await CustomerValidationFilter.process(order, baseContext as any);
    expect(res.success).toBe(false);
  });

  test('ProductValidationFilter should fail for insufficient stock', async () => {
    const order: any = { id: 'o4', customerId: 'c1', items: [{ productId: 'p2', quantity: 999 }], status: 'pending', createdAt: new Date() };
    const res = await ProductValidationFilter.process(order, baseContext as any);
    expect(res.success).toBe(false);
  });
});


