# Data Source Comparison Tool

This component provides comprehensive validation and comparison of three critical data sources to ensure consistency across OneCX, Excel mapping tables, and GraphQL taxonomy terms. The tool identifies discrepancies, mismatches, and orphaned records to maintain data integrity.

## Overview

The comparison tool validates the core principle:
**OneCX Agency Name + OneCX UUID = Excel OneCX Name + Excel UUID = GraphQL Label + GraphQL UUID**

The tool performs three-way validation ignoring `instanceId` fields and instead relies on UUID and normalized name matching for more reliable data consistency.

## Supported File Formats

### 1. OneCX JSON File (`.txt` or `.json`)

**Required Structure:**
```json
[
  {
    "sgAgencyName": "Department of Health",
    "sgInstanceId": "12345",
    "oncecxAgencyName": "Health Department", 
    "onecxUuid": "uuid-health-001",
    "departmentName": "Public Health"
  }
]
```

**Required Fields:**
- `sgAgencyName` (string): Source government agency name
- `sgInstanceId` (string): Instance identifier (ignored in comparison)
- `oncecxAgencyName` (string): OneCX standardized agency name
- `onecxUuid` (string): Unique identifier for the agency
- `departmentName` (string): Department classification

**File Requirements:**
- Must be valid JSON array format
- Each record must contain all required fields
- File extensions: `.txt`, `.json`

### 2. Excel Mapping Table (`.xlsx` or `.xls`)

**Required Columns (flexible naming):**

| Column Purpose | Accepted Column Names |
|---|---|
| SG Instance Name | "SG Instance Name", "Instance Name", "SG Instance" |
| OneCX Name | "OneCX Name", "OneCX Name" |
| Instance ID | "Instance ID", "ID" |
| UUID | "UUID" |
| SAP Instance ID | "SAP Instance ID", "SAP ID" |

**Column Mapping Logic:**
- The tool automatically detects columns using case-insensitive substring matching
- First matching column name is used if multiple possibilities exist
- Missing columns result in empty string values for that field

**Data Processing:**
- Empty rows are automatically filtered out
- All cell values are converted to strings
- Header row is automatically detected and skipped

### 3. GraphQL Terms JSON (`.json`)

**Required Structure:**
```json
{
  "data": {
    "taxonomyTerms": {
      "terms": [
        {
          "uuid": "uuid-health-001",
          "label": "Health Department"
        }
      ]
    }
  }
}
```

**Required Fields:**
- `data.taxonomyTerms.terms` (array): Container for taxonomy terms
- `uuid` (string): Unique identifier matching Excel/OneCX UUIDs
- `label` (string): Human-readable term label

## Data Normalization Process

All name/label comparisons use the `normalizeName()` function:

```typescript
const normalizeName = (str: string): string => {
  return str
    .trim()                    // Remove leading/trailing whitespace
    .toLowerCase()             // Convert to lowercase
    .replace(/\s+/g, ' ')     // Collapse multiple spaces to single space
    .replace(/[""]/g, '"')    // Replace curly quotes with straight quotes
    .replace(/['']/g, "'")    // Replace curly apostrophes with straight apostrophes
}
```

## Comparison Logic & Validation Rules

### Validation 1: OneCX ↔ Excel Comparison

**Matching Strategy:**
1. Primary: Match by UUID (`onecxUuid` = `excel.uuid`)
2. Fallback: Match by normalized name (`oncecxAgencyName` = `excel.onecxName`)

**Checks Performed:**
- **UUID Consistency**: Verifies matching records have identical UUIDs
- **Name Consistency**: Verifies matching records have identical normalized names
- **Missing Records**: Identifies records present in one source but not the other

### Validation 2: Excel ↔ GraphQL Comparison

**Matching Strategy:**
- Match by UUID (`excel.uuid` = `graphql.uuid`)

**Checks Performed:**
- **UUID Existence**: Verifies all Excel UUIDs exist in GraphQL terms
- **Label Consistency**: Verifies matching UUIDs have identical normalized labels

### Validation 3: Three-Way Consistency Check

**Process:**
1. Find OneCX records with matching Excel records (by UUID or name)
2. For matched pairs with identical UUIDs, verify GraphQL consistency
3. Check if all three sources have consistent names/labels

## Discrepancy Types & Classifications

### Primary Discrepancy Types

| Type | Enum Value | Description | Color Coding |
|---|---|---|---|
| Missing in Excel | `missing_in_excel` | OneCX record not found in Excel | Red |
| Missing in OneCX | `missing_in_onecx` | Excel record not found in OneCX | Red |
| UUID Mismatch | `uuid_mismatch` | Different UUIDs for matched records | Yellow |
| Name Mismatch | `name_mismatch` | Different names for matched records | Yellow |
| Missing in GraphQL | `missing_in_graphql` | Excel UUID not in GraphQL | Red |
| Label Mismatch | `label_mismatch` | Different labels for same UUID | Yellow |
| Duplicate Label | `duplicate_label` | Same label with different UUIDs | Orange |
| Orphaned GraphQL | `orphaned_graphql` | GraphQL term not referenced in Excel | Orange |

### Discrepancy Details Format

Each discrepancy includes:
- **ID**: Unique identifier
- **Type**: Enum value from above table
- **Description**: Human-readable explanation
- **Details**: Specific data causing the discrepancy
- **Source Data**: Relevant records from each data source

Each discrepancy includes:

- **ID**: Unique identifier
- **Type**: Enum value from above table
- **Description**: Human-readable explanation
- **Details**: Specific data causing the discrepancy
- **Source Data**: Relevant records from each data source

## Error Handling & Data Quality

### File Upload Validation

**OneCX JSON Validation:**
- Must be valid JSON format
- Must be an array structure
- All records must contain required fields
- Error messages specify parsing issues

**Excel File Validation:**
- Supports `.xlsx` and `.xls` formats
- Must contain at least header row + one data row
- Flexible column detection with fallback handling
- Empty rows automatically filtered

**GraphQL JSON Validation:**
- Must be valid JSON format
- Must contain `data.taxonomyTerms.terms` structure
- Terms array must contain objects with `uuid` and `label`
- Nested structure validation with clear error messages

### Data Quality Checks

- **Empty Field Handling**: Empty or null values converted to empty strings
- **Type Conversion**: All data normalized to string format
- **Duplicate Detection**: Identifies multiple records with same identifiers
- **Orphan Detection**: Finds records not referenced across data sources

## User Interface Features

### Upload Interface

- **Three Upload Zones**: Dedicated areas for each file type
- **Visual Feedback**: Progress indicators and success states
- **File Type Validation**: Restricts uploads to supported formats
- **Error Display**: Clear error messages for upload failures

### Results Display

- **Color-Coded Discrepancies**: Visual distinction by severity
  - Red: Missing records (critical)
  - Yellow: Mismatches (warning)
  - Orange: Data quality issues (attention)

- **Detailed Information**: Each discrepancy shows:
  - Discrepancy type and description
  - Affected data from all relevant sources
  - Specific field values causing the issue

### Export Functionality

**CSV Export Format:**
```csv
Type,Description,Details,OneCX Agency Name,OneCX Instance ID,OneCX UUID,Excel Instance Name,Excel OneCX Name,Excel UUID,GraphQL Label,GraphQL UUID
```

**CSV Features:**
- All discrepancies included in single file
- Proper CSV escaping for special characters
- Timestamp in filename for version control
- Compatible with Excel and other analysis tools

## Sample Data

Sample data files provided in `/public/` folder:

- `sample-onecx-data.json` - Example OneCX records with various agency types
- `sample-graphql-data.json` - Example GraphQL terms with intentional discrepancies
- `sample-excel-data.csv` - Example Excel data (convert to .xlsx for testing)

**Sample Data Features:**
- Demonstrates all discrepancy types
- Includes edge cases for testing
- Shows proper data format structures

## Usage Instructions

### Step-by-Step Process

1. **Navigate to Tool**: Access via "Data Comparison" in main feature grid
2. **Upload Files**: 
   - Upload OneCX JSON file first
   - Upload Excel mapping table second
   - Upload GraphQL terms JSON third
3. **Verify Uploads**: Check green checkmarks and record counts
4. **Run Comparison**: Click "Compare Data Sources" button
5. **Review Results**: Examine discrepancies table for issues
6. **Export Results**: Download CSV for offline analysis

### Best Practices

- **File Preparation**: Ensure all files follow specified formats
- **Data Cleanup**: Remove test/invalid records before upload
- **Review Process**: Check sample data first to understand output format
- **Documentation**: Save comparison results with timestamps
- **Iterative Process**: Fix identified issues and re-run comparison

## Technical Implementation

### Core Technologies

- **Framework**: Next.js 15 with TypeScript
- **File Processing**: 
  - `xlsx` library for Excel file parsing
  - `FileReader` API for text/JSON file reading
- **UI Components**: 
  - Framer Motion for animations
  - Tailwind CSS for styling
  - Lucide React for icons

### Performance Characteristics

- **Memory Efficient**: Streams file data without loading entire files in memory
- **Fast Processing**: O(n) comparison algorithms using Map data structures
- **Scalable**: Handles thousands of records efficiently
- **Responsive**: Non-blocking UI updates during processing

### Data Structures

**Lookup Maps for Efficient Comparison:**
```typescript
const onecxByUuid = new Map<string, OneCXRecord>()
const excelByUuid = new Map<string, ExcelRecord>()
const graphqlByUuid = new Map<string, GraphQLTerm>()
const onecxByNormalizedName = new Map<string, OneCXRecord[]>()
const excelByNormalizedName = new Map<string, ExcelRecord[]>()
const graphqlByLabel = new Map<string, GraphQLTerm[]>()
```

### Error Recovery

- **Partial Data Handling**: Tool continues processing even with some invalid records
- **Clear Error Messages**: Specific feedback for each failure type
- **Graceful Degradation**: UI remains responsive during processing errors
- **Data Validation**: Comprehensive checks before comparison execution

## API Reference

### Core Functions

```typescript
// File parsing functions
parseOneCXJson(file: File): Promise<OneCXRecord[]>
parseExcel(file: File): Promise<ExcelRecord[]>
parseGraphQLTerms(file: File): Promise<GraphQLTerm[]>

// Data processing
normalizeName(str: string): string
compare(onecx: OneCXRecord[], excel: ExcelRecord[], graphql: GraphQLTerm[]): Discrepancy[]

// UI handlers
handleFileUpload(fileType: 'onecx' | 'excel' | 'graphql', file: File): Promise<void>
runComparison(): Promise<void>
downloadCSV(): void
```

### Type Definitions

```typescript
interface OneCXRecord {
  sgAgencyName: string
  sgInstanceId: string
  oncecxAgencyName: string
  onecxUuid: string
  departmentName: string
}

interface ExcelRecord {
  sgInstanceName: string
  onecxName: string
  instanceId: string
  uuid: string
  sapInstanceId: string
}

interface GraphQLTerm {
  uuid: string
  label: string
}

interface Discrepancy {
  id: string
  type: 'missing_in_excel' | 'missing_in_onecx' | 'uuid_mismatch' | 'name_mismatch' | 'missing_in_graphql' | 'label_mismatch' | 'duplicate_label' | 'orphaned_graphql'
  description: string
  onecxData?: OneCXRecord
  excelData?: ExcelRecord
  graphqlData?: GraphQLTerm
  details?: string
}
```
