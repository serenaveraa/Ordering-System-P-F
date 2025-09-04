import { Order } from '../types/models';
import { FilterResult, OrderFilter, ProcessingContext } from '../types/pipeline';

function ok(order: Order, name: string, start: number, warnings: string[] = []): FilterResult {
  return { success: true, order, errors: [], warnings, name, durationMs: Date.now() - start };
}

function fail(order: Order, name: string, start: number, errors: string[]): FilterResult {
  return { success: false, order, errors, warnings: [], name, durationMs: Date.now() - start };
}

export const DataIntegrityFilter: OrderFilter = {
  name: 'DataIntegrityFilter',
  async process(order, _context): Promise<FilterResult> {
    const start = Date.now();
    const errors: string[] = [];
    if (!order.customerId) errors.push('customerId is required');
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) errors.push('items are required');
    if (order.items?.some((i) => typeof i.quantity !== 'number' || i.quantity <= 0)) errors.push('invalid item quantity');
    return errors.length ? fail(order, this.name, start, errors) : ok(order, this.name, start);
  },
};

export const CustomerValidationFilter: OrderFilter = {
  name: 'CustomerValidationFilter',
  async process(order, context): Promise<FilterResult> {
    const start = Date.now();
    const customer = await context.store.getCustomerById(order.customerId);
    if (!customer) return fail(order, this.name, start, ['customer not found']);
    if (!customer.isActive) return fail(order, this.name, start, ['customer inactive']);
    const emailValid = /.+@.+\..+/.test(customer.email);
    if (!emailValid) return fail(order, this.name, start, ['invalid customer email']);
    return ok(order, this.name, start);
  },
};

export const ProductValidationFilter: OrderFilter = {
  name: 'ProductValidationFilter',
  async process(order, context): Promise<FilterResult> {
    const start = Date.now();
    const warnings: string[] = [];
    for (const item of order.items) {
      const product = await context.store.getProductById(item.productId);
      if (!product) return fail(order, this.name, start, [`product ${item.productId} not found`]);
      if (item.quantity > product.stock) return fail(order, this.name, start, [`insufficient stock for ${item.productId}`]);
      if (item.quantity <= 0) return fail(order, this.name, start, [`invalid quantity for ${item.productId}`]);
      if (product.stock < 10) warnings.push(`low stock for ${item.productId}`);
    }
    return ok(order, this.name, start, warnings);
  },
};


