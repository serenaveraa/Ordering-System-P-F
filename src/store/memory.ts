import { Customer, Product } from '../types/models';

export class InMemoryStore {
  private static instance: InMemoryStore;

  private customers: Map<string, Customer> = new Map();
  private products: Map<string, Product> = new Map();

  private constructor() {
    // seed data
    const customers: Customer[] = [
      {
        id: 'c1',
        name: 'Alice',
        email: 'alice@example.com',
        membership: 'gold',
        address: { street: '1 Main', city: 'City', country: 'AR', zip: '1000' },
        isActive: true,
      },
      {
        id: 'c2',
        name: 'Bob',
        email: 'bob@example.com',
        membership: 'silver',
        address: { street: '2 Main', city: 'City', country: 'AR', zip: '1000' },
        isActive: false,
      },
    ];

    const products: Product[] = [
      { id: 'p1', name: 'T-Shirt', category: 'clothing', price: 20, stock: 100 },
      { id: 'p2', name: 'Laptop', category: 'electronics', price: 1200, stock: 5, taxRate: 0.27 },
      { id: 'p3', name: 'Bread', category: 'food', price: 2.5, stock: 1000, taxRate: 0.1 },
    ];

    customers.forEach((c) => this.customers.set(c.id, c));
    products.forEach((p) => this.products.set(p.id, p));
  }

  static getInstance(): InMemoryStore {
    if (!InMemoryStore.instance) {
      InMemoryStore.instance = new InMemoryStore();
    }
    return InMemoryStore.instance;
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }
}


