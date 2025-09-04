import { Order } from '../types/models';
import { FilterResult, OrderFilter } from '../types/pipeline';

function ok(order: Order, name: string, start: number, warnings: string[] = []): FilterResult {
  return { success: true, order, errors: [], warnings, name, durationMs: Date.now() - start };
}
function fail(order: Order, name: string, start: number, errors: string[]): FilterResult {
  return { success: false, order, errors, warnings: [], name, durationMs: Date.now() - start };
}

export const ShippingCostFilter: OrderFilter = {
  name: 'ShippingCostFilter',
  async process(order, context): Promise<FilterResult> {
    const start = Date.now();
    const subtotal = order.subtotal ?? 0;
    const cfg = context.config.shipping ?? {};
    let shipping = cfg.flatRate ?? 0;
    if (cfg.tiered && cfg.tiered.length > 0) {
      // pick highest threshold under subtotal
      let selected = 0;
      for (const tier of cfg.tiered.sort((a, b) => a.threshold - b.threshold)) {
        if (subtotal >= tier.threshold) selected = tier.amount;
      }
      shipping = selected;
    }
    if (cfg.freeThreshold && subtotal >= cfg.freeThreshold) {
      shipping = 0;
    }
    order.shipping = Number((shipping || 0).toFixed(2));
    // Recompute total shadow (will be finalized by TaxCalculation)
    const discountTotal = (order.discounts ?? []).reduce((s, d) => s + (d.amount ?? 0), 0);
    const preTotal = (order.subtotal ?? 0) - discountTotal + (order.shipping ?? 0) + (order.taxes ?? 0);
    order.total = Number(preTotal.toFixed(2));
    return ok(order, this.name, start);
  },
};

export const PaymentProcessingFilter: OrderFilter = {
  name: 'PaymentProcessingFilter',
  async process(order, context): Promise<FilterResult> {
    const start = Date.now();
    const simulate = context.config.payment?.simulate ?? 'success';
    const timeoutMs = context.config.payment?.timeoutMs ?? 0;

    if (simulate === 'timeout') {
      await new Promise((resolve) => setTimeout(resolve, Math.max(10, timeoutMs)));
      return fail(order, this.name, start, ['payment timeout']);
    }
    if (simulate === 'fail') {
      return fail(order, this.name, start, ['payment declined']);
    }

    order.metadata = { ...(order.metadata ?? {}), payment: { status: 'captured', at: new Date().toISOString() } };
    return ok(order, this.name, start);
  },
};


