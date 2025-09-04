import { MembershipDiscountFilter, PriceCalculationFilter, TaxCalculationFilter, VolumeDiscountFilter } from '../src/filters/pricing';
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
    tax: { defaultRate: 0.21, categoryRates: { food: 0.1 } },
    discounts: {
      membership: { bronze: 0.05, silver: 0.1, gold: 0.15, platinum: 0.2 },
      volume: {
        items: [ { threshold: 10, rate: 0.05 }, { threshold: 50, rate: 0.1 } ],
        amount: [ { threshold: 1000, rate: 0.05 }, { threshold: 5000, rate: 0.1 } ]
      }
    }
  },
};

describe('Pricing Filters', () => {
  test('PriceCalculation sets unit and totals, subtotal computed', async () => {
    const order: any = { id: 'o5', customerId: 'c1', items: [{ productId: 'p1', quantity: 2 }], status: 'pending', createdAt: new Date() };
    const res = await PriceCalculationFilter.process(order, baseContext as any);
    expect(res.success).toBe(true);
    expect(res.order.subtotal).toBeGreaterThan(0);
    expect(res.order.items[0].unitPrice).toBeGreaterThan(0);
  });

  test('MembershipDiscount applies for gold', async () => {
    const order: any = { id: 'o6', customerId: 'c1', items: [{ productId: 'p1', quantity: 10 }], status: 'pending', createdAt: new Date(), subtotal: 200 };
    const res = await MembershipDiscountFilter.process(order, baseContext as any);
    expect(res.success).toBe(true);
    expect(res.order.discounts?.length).toBeGreaterThan(0);
  });

  test('VolumeDiscount applies for items and amount', async () => {
    const order: any = { id: 'o7', customerId: 'c1', items: [{ productId: 'p1', quantity: 60 }], status: 'pending', createdAt: new Date(), subtotal: 1200 };
    const res = await VolumeDiscountFilter.process(order, baseContext as any);
    expect(res.success).toBe(true);
    expect(res.order.discounts?.some(d => d.type === 'volume')).toBe(true);
  });

  test('TaxCalculation computes taxes and total', async () => {
    const order: any = { id: 'o8', customerId: 'c1', items: [{ productId: 'p3', quantity: 10, unitPrice: 2.5, totalPrice: 25 }], status: 'pending', createdAt: new Date(), subtotal: 25, discounts: [] };
    const res = await TaxCalculationFilter.process(order, baseContext as any);
    expect(res.success).toBe(true);
    expect(res.order.taxes).toBeGreaterThanOrEqual(0);
    expect(res.order.total).toBeGreaterThan(0);
  });
});


