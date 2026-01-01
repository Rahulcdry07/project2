# DSR (Detailed Schedule of Rates) Implementation Guide

## Overview

Complete implementation of DSR functionality for construction cost estimation based on PDF conversion and fuzzy matching with rate database.

## Features Implemented

### 1. Database Schema

**File:** `src/migrations/20251214000000-create-dsr-items.js`

- Table: `DSRItems`
- Fields:
  - `item_code` (unique): DSR item code
  - `description`: Item description
  - `unit`: Measurement unit (sqm, cum, rmt, kg, nos, etc.)
  - `rate`: Per unit rate
  - `category`: Main category (Earthwork, Concrete, Steel, etc.)
  - `sub_category`: Sub-category
  - `material_cost`: Material cost component
  - `labor_cost`: Labor cost component
  - `equipment_cost`: Equipment cost component
  - `overhead_percentage`: Overhead percentage
  - `notes`: Additional notes
  - `is_active`: Active status

### 2. DSR Data Model

**File:** `src/models/DSRItem.js`

- Sequelize model with validations
- Supported units: sqm, cum, rmt, kg, nos, sqft, cft, ton, ltr, bag, set, each, pair, dozen
- Rate validation (minimum 0)
- Overhead percentage validation (0-100%)

### 3. DSR Matching Service

**File:** `src/services/dsrMatchingService.js`

#### Key Methods:

1. **extractLineItems(pdfData)**
   - Extracts line items from PDF JSON data
   - Parses both text lines and table rows
   - Normalizes units and quantities

2. **parseLineItem(line)**
   - Pattern matching for construction item descriptions
   - Regex patterns:
     - `Description - Quantity Unit`
     - `Description Quantity Unit`
   - Extracts quantity, unit, and description

3. **matchWithDSR(extractedItems)**
   - Fuzzy matching against DSR database
   - Uses PostgreSQL ILIKE queries
   - Keyword-based similarity scoring
   - Returns matched and unmatched items

4. **calculateSimilarity(str1, str2)**
   - Keyword extraction and comparison
   - Stopword removal
   - Scoring:
     - 1.0: Exact match
     - 0.9: Contains match
     - Keyword overlap ratio

5. **calculateCost(matches)**
   - Generates detailed cost breakdown
   - Categories: Material, Labor, Equipment
   - Includes matched and unmatched items summary

### 4. API Endpoints

**File:** `src/routes/v1/dsrRoutes.js`

#### Routes:

1. **POST /api/dsr/estimate**
   - Calculate cost from PDF JSON data
   - Request: `{ pdfData: <converted JSON> }`
   - Response: Cost breakdown with matched items
   - Authentication required

2. **GET /api/dsr/items**
   - List DSR items with pagination
   - Query params: `search`, `category`, `page`, `limit`
   - Authentication required

3. **POST /api/dsr/items**
   - Create new DSR item
   - Admin only
   - Validates all fields

4. **PUT /api/dsr/items/:id**
   - Update existing DSR item
   - Admin only
   - Partial updates supported

5. **GET /api/dsr/categories**
   - List all unique categories
   - Authentication required

### 5. Frontend Integration

**File:** `public/dashboard-app/src/components/Upload.jsx`

#### Features:

1. **Cost Estimation Button**
   - Appears after PDF conversion
   - Calls `/api/dsr/estimate` endpoint
   - Shows loading spinner during calculation

2. **Cost Display**
   - Material cost breakdown
   - Labor cost breakdown
   - Equipment cost breakdown
   - Total cost
   - Matched vs unmatched items count

3. **LocalStorage Persistence**
   - Saves cost estimates
   - Persists across page reloads
   - Cleared when file is deleted

4. **Download Cost Estimate**
   - Downloads JSON with full breakdown
   - Filename: `<original>-cost-estimate.json`

### 6. Seed Data

**File:** `src/seeders/20251214000000-dsr-items.js`

#### Categories Seeded:

- **Earthwork**: Excavation, Filling (2 items)
- **Concrete**: PCC, RCC M20, RCC M25 (3 items)
- **Steel**: Reinforcement, Structural (2 items)
- **Masonry**: Brickwork 9", Brickwork 4.5" (2 items)
- **Finishing**: Plastering, Painting, Flooring (6 items)
- **Carpentry**: Doors, Windows (2 items)
- **Waterproofing**: Membrane (1 item)
- **Materials**: Cement, Sand, Aggregates (4 items)

**Total:** 22 DSR items with standard Indian construction rates

## Usage Guide

### 1. Run Migrations

```bash
NODE_ENV=development npx sequelize-cli db:migrate
```

### 2. Seed DSR Data

```bash
NODE_ENV=development npx sequelize-cli db:seed --seed 20251214000000-dsr-items.js
```

### 3. Upload and Convert PDF

1. Login to dashboard
2. Navigate to Upload page
3. Upload construction PDF
4. Click "Convert to JSON"
5. Wait for conversion to complete

### 4. Calculate Costs

1. After PDF conversion, click "Calculate Costs"
2. System extracts line items from PDF
3. Matches items with DSR database
4. Displays cost breakdown:
   - Material costs
   - Labor costs
   - Equipment costs
   - Total estimated cost
   - Matched items count
   - Unmatched items count

### 5. Download Estimate

- Click download button to get JSON with full breakdown
- Includes all matched items with details
- Lists unmatched items for manual review

## Technical Details

### Fuzzy Matching Algorithm

1. **Keyword Extraction**
   - Remove stopwords (the, a, an, in, of, for, etc.)
   - Convert to lowercase
   - Split into keywords

2. **Database Search**
   - PostgreSQL ILIKE queries on description
   - Search by individual keywords
   - Collect all potential matches

3. **Similarity Scoring**
   - Exact match: 1.0
   - Contains match: 0.9
   - Keyword overlap: ratio of matching keywords
   - Threshold: 0.3 (30% similarity minimum)

4. **Best Match Selection**
   - Sort matches by similarity score
   - Return highest scoring match
   - Return "No match" if below threshold

### Cost Calculation

```javascript
totalCost = Σ (quantity × rate × matched_items)

breakdown = {
  material: Σ (quantity × material_cost),
  labor: Σ (quantity × labor_cost),
  equipment: Σ (quantity × equipment_cost)
}
```

## Example API Response

### POST /api/dsr/estimate

```json
{
  "success": true,
  "message": "Cost estimation completed",
  "data": {
    "totalCost": 125000.5,
    "breakdown": {
      "material": 75000.0,
      "labor": 40000.5,
      "equipment": 10000.0
    },
    "matchedItems": 15,
    "unmatchedItems": 3,
    "matches": [
      {
        "extractedItem": {
          "description": "Cement concrete M20",
          "quantity": 10,
          "unit": "cum"
        },
        "matchedDSR": {
          "item_code": "CC-002",
          "description": "Reinforced cement concrete M20 grade",
          "rate": 8500.0,
          "material_cost": 6000.0,
          "labor_cost": 1800.0,
          "equipment_cost": 700.0
        },
        "similarity": 0.95,
        "cost": 85000.0,
        "breakdown": {
          "material": 60000.0,
          "labor": 18000.0,
          "equipment": 7000.0
        }
      }
    ],
    "unmatchedItems": [
      {
        "description": "Custom item XYZ",
        "quantity": 5,
        "unit": "nos"
      }
    ]
  }
}
```

## Testing

### Manual Testing Steps

1. **Upload Test PDF**
   - Use construction estimate or BOQ PDF
   - Should contain line items with quantities and units

2. **Convert to JSON**
   - Verify JSON extraction successful
   - Check for text and table data

3. **Calculate Costs**
   - Click "Calculate Costs" button
   - Verify cost breakdown displays
   - Check matched vs unmatched items

4. **Download Estimate**
   - Download JSON file
   - Verify structure and data accuracy

### API Testing

```bash
# Get DSR items
curl -X GET http://localhost:5001/api/dsr/items \
  -H "Authorization: Bearer <token>"

# Get categories
curl -X GET http://localhost:5001/api/dsr/categories \
  -H "Authorization: Bearer <token>"

# Calculate estimate
curl -X POST http://localhost:5001/api/dsr/estimate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"pdfData": {...}}'
```

## Future Enhancements

### Potential Improvements

1. **Manual DSR Selection**
   - Allow users to manually select DSR for unmatched items
   - Edit quantities and rates
   - Recalculate costs

2. **Custom DSR Items**
   - Allow users to add custom rates
   - Organization-specific rate schedules
   - Import/export DSR database

3. **Rate Updates**
   - Bulk rate updates
   - Historical rate tracking
   - Rate revision notifications

4. **Advanced Matching**
   - Machine learning-based matching
   - Context-aware matching
   - Unit conversion support

5. **Reporting**
   - PDF report generation
   - Excel export
   - Comparison with previous estimates
   - Cost trends analysis

6. **Integration**
   - Project management integration
   - Accounting system integration
   - Material procurement integration

## Troubleshooting

### Common Issues

1. **No Matches Found**
   - Check PDF format (text-based vs scanned)
   - Verify line item format
   - Review DSR database for similar items
   - Check similarity threshold (default: 0.3)

2. **Incorrect Costs**
   - Verify DSR rates are current
   - Check unit conversions
   - Review material/labor/equipment breakdown
   - Validate quantity extraction

3. **API Errors**
   - Check authentication token
   - Verify PDF conversion completed
   - Check server logs in `logs/combined.log`
   - Ensure DSR migration ran successfully

## Files Modified/Created

### New Files

1. `src/migrations/20251214000000-create-dsr-items.js`
2. `src/models/DSRItem.js`
3. `src/services/dsrMatchingService.js`
4. `src/routes/v1/dsrRoutes.js`
5. `src/seeders/20251214000000-dsr-items.js`

### Modified Files

1. `src/routes/v1/index.js` - Registered DSR routes
2. `public/dashboard-app/src/components/Upload.jsx` - Added cost estimation UI

## Credits

Implementation based on EstimateX project requirements for construction cost estimation with DSR database matching.
