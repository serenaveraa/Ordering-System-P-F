# Ordering System - Pipes & Filters (Express + TypeScript)

Backend demo of an e-commerce order processing system using the Pipes & Filters architecture. Orders pass through validation and pricing filters (prices, membership and volume discounts, taxes). Includes REST API, in-memory data, Jest tests, and a Postman collection (Newman).

## Tech stack
- Node.js + Express
- TypeScript
- Jest + ts-jest
- Postman + Newman (CLI)

## File structure
```
.
├─ src/
│  ├─ app.ts
│  ├─ server.ts
│  ├─ routes/
│  │  ├─ orders.ts
│  │  └─ pipeline.ts
│  ├─ filters/
│  │  ├─ validation.ts
│  │  └─ pricing.ts
│  ├─ pipelines/
│  │  └─ master.ts
│  ├─ store/
│  │  └─ memory.ts
│  └─ types/
│     ├─ models.ts
│     └─ pipeline.ts
│
├─ tests/
│  ├─ validation.filters.test.ts
│  ├─ pricing.filters.test.ts
│  ├─ pipeline.integration.test.ts
│  └─ postman/
│     ├─ collection.json
│     └─ environment.json
│
├─ package.json
├─ tsconfig.json
├─ jest.config.ts
└─ .gitignore
```

## Install
```
npm install
```

## Run (development)
```
npm run dev
```
Server: http://localhost:3000

## Build + run (production-like)
```
npm run build
npm start
```

## Endpoints
- GET /health
- GET /pipeline/config
- PUT /pipeline/config
- POST /orders/process
- GET /orders/:id/status

## Example: POST /orders/process
```
POST http://localhost:3000/orders/process
Content-Type: application/json

{
  "customerId": "c1",
  "items": [
    { "productId": "p1", "quantity": 12 },
    { "productId": "p2", "quantity": 1 }
  ],
  "config": {
    "enabledFilters": {},
    "tax": { "defaultRate": 0.21, "categoryRates": { "food": 0.1 }, "regionalRate": 0 },
    "discounts": {
      "membership": { "bronze": 0.05, "silver": 0.1, "gold": 0.15, "platinum": 0.2 },
      "volume": {
        "items": [ { "threshold": 10, "rate": 0.05 }, { "threshold": 50, "rate": 0.1 } ],
        "amount": [ { "threshold": 1000, "rate": 0.05 }, { "threshold": 5000, "rate": 0.1 } ]
      }
    }
  }
}
```

## Demo data
- Customers: c1 (active, gold), c2 (inactive)
- Products: p1 (clothing), p2 (electronics), p3 (food)

## Testing (Jest)
```
npm test
```

## Postman / Newman
- Collection and environment in tests/postman/
- Run (server must be running):
```
npm run postman
```
Covers: config GET/PUT, successful order, order status, invalid customer.

## Architecture notes
- Filters implement OrderFilter.process(order, context) and are pure/isolated.
- The master pipeline runs filters sequentially and stops on first failure (returns failedAt).
- PipelineConfig toggles filters and sets tax/discount rules.

## Extending
- Add filters under src/filters/ and register in src/pipelines/master.ts.
- Ideas: Shipping cost filter, Payment filter (simulate timeout/errors) + tests.
