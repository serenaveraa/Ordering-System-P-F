# 🚀 Ordering System - Pipes & Filters (Express + TypeScript)

Backend demo of an e-commerce order processing system using the Pipes & Filters architecture. Orders pass through validation and pricing filters (prices, membership and volume discounts, taxes). Includes REST API, in-memory data, Jest tests, and a Postman collection (Newman).

## 🧰 Tech stack
- Node.js + Express
- TypeScript
- Jest + ts-jest
- Postman + Newman (CLI)

## 📁 File structure
```
.
├─ src/
│  ├─ app.ts
│  ├─ server.ts
│  ├─ routes/
│  │  ├─ orders.ts
│  │  └─ pipeline.ts
│  ├─ filters/
│  │  ├─ validation.ts          # DataIntegrity, CustomerValidation, ProductValidation
│  │  ├─ pricing.ts             # PriceCalculation, MembershipDiscount, VolumeDiscount, TaxCalculation
│  │  └─ shipping_payment.ts    # ShippingCost, PaymentProcessing
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
│  ├─ shipping_payment.filters.test.ts
│  ├─ pipeline.integration.test.ts
│  └─ postman/
│     ├─ collection.json
│     ├─ environment.json
│     └─ environment-3001.json
│
├─ package.json
├─ tsconfig.json
├─ jest.config.ts
└─ .gitignore
```

## 📦 Install
```
npm install
```

## 🧪 Run (development)
```
npm run dev
```
Server: http://localhost:3000

## 🏗️ Build + run (production-like)
```
npm run build
npm start
```

## 🔌 Endpoints
- GET /health
- GET /pipeline/config
- PUT /pipeline/config
- POST /orders/process
- GET /orders/:id/status

## 📤 Example: POST /orders/process
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
    "shipping": { "flatRate": 10, "freeThreshold": 300 },
    "payment": { "simulate": "success" },
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

## 🧪 Testing (Jest)
```
npm test
```
Includes unit tests for all filters and integration tests for the full pipeline (success/failure/timeout).

## 🧭 Postman / Newman
- Collection and environment in `tests/postman/`
- Run (server must be running):
```
npm run postman
```
- If running on port 3001 (alternative env):
```
npm run postman -- -e tests/postman/environment-3001.json
```
Covers:
- ✅ Config GET/PUT
- ✅ Successful order processing
- ✅ Order status lookup
- ❌ Invalid customer (rejection)
- ⏱️ Payment timeout (rejection at `PaymentProcessingFilter`)

## 🧱 Architecture notes
- Filters implement `OrderFilter.process(order, context)` and are stateless/isolated.
- The master pipeline runs filters sequentially and stops on first failure (returns `failedAt`).
- `PipelineConfig` toggles filters and sets tax/discount, shipping, and payment rules.

### 🧮 Pricing filters
- `PriceCalculationFilter` sets unit and total per item and subtotal
- `MembershipDiscountFilter` applies membership discount (bronze/silver/gold/platinum)
- `VolumeDiscountFilter` applies by items and amount thresholds
- `TaxCalculationFilter` applies product category and regional rates

### 📦 Shipping filter
- `ShippingCostFilter`: supports `flatRate`, `freeThreshold`, and `tiered` pricing

### 💳 Payment filter
- `PaymentProcessingFilter`: configurable via `payment.simulate` = `success` | `fail` | `timeout`
- On success, adds `metadata.payment.status = captured`
- On `fail`/`timeout`, the pipeline stops with `failedAt = PaymentProcessingFilter`

## ➕ Extending
- Add filters under `src/filters/` and register in `src/pipelines/master.ts`.
- Ideas: Shipping zones, multiple tax regions, promotion codes, async inventory reservation.
