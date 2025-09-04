import { Order } from '../types/models';
import { FilterResult, OrderFilter, OrderPipeline, PipelineConfig, PipelineResult, ProcessingContext } from '../types/pipeline';
import { DataIntegrityFilter, CustomerValidationFilter, ProductValidationFilter } from '../filters/validation';
import { MembershipDiscountFilter, PriceCalculationFilter, TaxCalculationFilter, VolumeDiscountFilter } from '../filters/pricing';
import { InMemoryStore } from '../store/memory';

export function buildMasterPipeline(store: InMemoryStore): OrderPipeline {
  const filters: OrderFilter[] = [
    DataIntegrityFilter,
    CustomerValidationFilter,
    ProductValidationFilter,
    PriceCalculationFilter,
    MembershipDiscountFilter,
    VolumeDiscountFilter,
    TaxCalculationFilter,
  ];

  const pipeline: OrderPipeline = {
    filters,
    addFilter(filter: OrderFilter) {
      this.filters.push(filter);
    },
    removeFilter(filterName: string) {
      this.filters = this.filters.filter((f) => f.name !== filterName);
    },
    async process(order: Order, config: PipelineConfig): Promise<PipelineResult> {
      const start = Date.now();
      const results: FilterResult[] = [];
      let currentOrder: Order = { ...order, status: 'processing' };

      const context: ProcessingContext = {
        services: {
          now: () => new Date(),
          logger: (level, message, meta) => {
            // eslint-disable-next-line no-console
            console[level](`[${level}] ${message}`, meta ?? '');
          },
        },
        store: {
          getCustomerById: (id) => store.getCustomerById(id),
          getProductById: (id) => store.getProductById(id),
        },
        config,
      };

      for (const filter of this.filters) {
        if (config.enabledFilters && config.enabledFilters[filter.name] === false) {
          continue; // disabled
        }
        try {
          const result = await filter.process(currentOrder, context);
          results.push({ ...result, name: filter.name });
          if (!result.success) {
            return {
              success: false,
              finalOrder: { ...currentOrder, status: 'rejected' },
              filterResults: results,
              executionTime: Date.now() - start,
              failedAt: filter.name,
            };
          }
          currentOrder = result.order;
        } catch (err: any) {
          return {
            success: false,
            finalOrder: { ...currentOrder, status: 'rejected' },
            filterResults: results,
            executionTime: Date.now() - start,
            failedAt: filter.name,
          };
        }
      }

      return {
        success: true,
        finalOrder: { ...currentOrder, status: 'completed' },
        filterResults: results,
        executionTime: Date.now() - start,
      };
    },
  };

  return pipeline;
}


