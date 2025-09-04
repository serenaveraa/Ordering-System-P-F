import { Discount, Order } from '../types/models';
import { FilterResult, OrderFilter, ProcessingContext } from '../types/pipeline';

function ok(order: Order, name: string, start: number, warnings: string[] = []): FilterResult {
  return { success: true, order, errors: [], warnings, name, durationMs: Date.now() - start };
}

function fail(order: Order, name: string, start: number, errors: string[]): FilterResult {
  return { success: false, order, errors, warnings: [], name, durationMs: Date.now() - start };
}

export const PriceCalculationFilter: OrderFilter = {
  name: 'PriceCalculationFilter',
  async process(order, context): Promise<FilterResult> {
    const start = Date.now();
    let subtotal = 0;
    for (const item of order.items) {
      const product = await context.store.getProductById(item.productId);
      if (!product) return fail(order, this.name, start, [`product ${item.productId} not found`]);
      item.unitPrice = product.price;
      item.totalPrice = product.price * item.quantity;
      subtotal += item.totalPrice;
    }
    order.subtotal = Number(subtotal.toFixed(2));
    order.discounts = order.discounts ?? [];
    return ok(order, this.name, start);
  },
};

export const MembershipDiscountFilter: OrderFilter = {
  name: 'MembershipDiscountFilter',
  async process(order, context): Promise<FilterResult> {
    const start = Date.now();
    const customer = await context.store.getCustomerById(order.customerId);
    if (!customer) return fail(order, this.name, start, ['customer not found']);
    const rate = context.config.discounts?.membership?.[customer.membership] ?? 0;
    if (rate > 0 && order.subtotal) {
      const amount = Number((order.subtotal * rate).toFixed(2));
      const discount: Discount = { code: `MEM-${customer.membership.toUpperCase()}`, type: 'membership', percentage: rate, amount, description: 'Membership discount' };
      order.discounts = [...(order.discounts ?? []), discount];
    }
    return ok(order, this.name, start);
  },
};

export const VolumeDiscountFilter: OrderFilter = {
  name: 'VolumeDiscountFilter',
  async process(order, context): Promise<FilterResult> {
    const start = Date.now();
    const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = order.subtotal ?? 0;
    const volumeRules = context.config.discounts?.volume;
    if (volumeRules) {
      let appliedRate = 0;
      for (const rule of volumeRules.items.sort((a, b) => a.threshold - b.threshold)) {
        if (totalItems > rule.threshold) appliedRate = rule.rate;
      }
      for (const rule of volumeRules.amount.sort((a, b) => a.threshold - b.threshold)) {
        if (subtotal > rule.threshold) appliedRate = Math.max(appliedRate, rule.rate);
      }
      if (appliedRate > 0 && subtotal > 0) {
        const amount = Number((subtotal * appliedRate).toFixed(2));
        const discount: Discount = { code: `VOL-${Math.round(appliedRate * 100)}`, type: 'volume', percentage: appliedRate, amount, description: 'Volume discount' };
        order.discounts = [...(order.discounts ?? []), discount];
      }
    }
    return ok(order, this.name, start);
  },
};

export const TaxCalculationFilter: OrderFilter = {
  name: 'TaxCalculationFilter',
  async process(order, context): Promise<FilterResult> {
    const start = Date.now();
    const defaultRate = context.config.tax?.defaultRate ?? 0.21;
    let taxes = 0;
    for (const item of order.items) {
      const product = await context.store.getProductById(item.productId);
      if (!product) continue;
      const categoryRate = context.config.tax?.categoryRates?.[product.category] ?? product.taxRate ?? defaultRate;
      taxes += (item.totalPrice ?? 0) * categoryRate;
    }
    const discountTotal = (order.discounts ?? []).reduce((sum, d) => sum + (d.amount ?? 0), 0);
    taxes = Math.max(0, taxes - discountTotal * (context.config.tax?.regionalRate ?? 0));
    order.taxes = Number(taxes.toFixed(2));
    const preTotal = (order.subtotal ?? 0) - discountTotal + (order.shipping ?? 0) + (order.taxes ?? 0);
    order.total = Number(preTotal.toFixed(2));
    return ok(order, this.name, start);
  },
};


