'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, Download, FileText, FileSpreadsheet, CheckCircle, AlertTriangle, X, FileJson } from 'lucide-react'
import * as XLSX from 'xlsx'

// Type definitions
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

interface GraphQLData {
  data: {
    taxonomyTerms: {
      terms: GraphQLTerm[]
    }
  }
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

interface FileUploadStatus {
  onecx: boolean
  excel: boolean
  graphql: boolean
}

export default function DataComparisonPage() {
  const [files, setFiles] = useState<{
    onecx: OneCXRecord[]
    excel: ExcelRecord[]
    graphql: GraphQLTerm[]
  }>({
    onecx: [],
    excel: [],
    graphql: []
  })

  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>({
    onecx: false,
    excel: false,
    graphql: false
  })

  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonComplete, setComparisonComplete] = useState(false)

  // Normalize names for comparison
  const normalizeName = (str: string): string => {
    if (!str) return ''
    return str
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .replace(/[""]/g, '"') // Replace curly quotes
      .replace(/['']/g, "'") // Replace curly apostrophes
  }

  // Parse OneCX JSON file
  const parseOneCXJson = useCallback((file: File): Promise<OneCXRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const data = JSON.parse(text) as OneCXRecord[]
          
          if (!Array.isArray(data)) {
            throw new Error('OneCX JSON must be an array')
          }
          
          const normalizedData = data.map(record => ({
            sgAgencyName: record.sgAgencyName || '',
            sgInstanceId: record.sgInstanceId?.toString() || '',
            oncecxAgencyName: record.oncecxAgencyName || '',
            onecxUuid: record.onecxUuid || '',
            departmentName: record.departmentName || ''
          }))
          
          resolve(normalizedData)
        } catch (error) {
          reject(new Error(`Failed to parse OneCX JSON: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  // Parse Excel file
  const parseExcel = useCallback((file: File): Promise<ExcelRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
          
          if (jsonData.length < 2) {
            throw new Error('Excel file must have at least a header row and one data row')
          }
          
          const headers = jsonData[0].map((h: any) => h?.toString().toLowerCase() || '')
          const rows = jsonData.slice(1)
          
          // Map columns (flexible mapping)
          const getColumnIndex = (possibleNames: string[]) => {
            for (const name of possibleNames) {
              const index = headers.findIndex(h => h.includes(name.toLowerCase()))
              if (index !== -1) return index
            }
            return -1
          }
          
          const sgInstanceNameIdx = getColumnIndex(['sg instance name', 'instance name', 'sg instance'])
          const onecxNameIdx = getColumnIndex(['onecx name', 'oncecx name'])
          const instanceIdIdx = getColumnIndex(['instance id', 'id'])
          const uuidIdx = getColumnIndex(['uuid'])
          const sapInstanceIdIdx = getColumnIndex(['sap instance id', 'sap id'])
          
          const records: ExcelRecord[] = rows
            .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
            .map(row => ({
              sgInstanceName: row[sgInstanceNameIdx]?.toString() || '',
              onecxName: row[onecxNameIdx]?.toString() || '',
              instanceId: row[instanceIdIdx]?.toString() || '',
              uuid: row[uuidIdx]?.toString() || '',
              sapInstanceId: row[sapInstanceIdIdx]?.toString() || ''
            }))
          
          resolve(records)
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }, [])

  // Parse GraphQL JSON file
  const parseGraphQLTerms = useCallback((file: File): Promise<GraphQLTerm[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const data = JSON.parse(text) as GraphQLData
          
          if (!data.data?.taxonomyTerms?.terms || !Array.isArray(data.data.taxonomyTerms.terms)) {
            throw new Error('GraphQL JSON must have data.taxonomyTerms.terms array structure')
          }
          
          const terms = data.data.taxonomyTerms.terms.map(term => ({
            uuid: term.uuid || '',
            label: term.label || ''
          }))
          
          resolve(terms)
        } catch (error) {
          reject(new Error(`Failed to parse GraphQL JSON: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  // Compare data sources
  const compare = useCallback((onecx: OneCXRecord[], excel: ExcelRecord[], graphql: GraphQLTerm[]): Discrepancy[] => {
    const discrepancies: Discrepancy[] = []
    let discrepancyId = 0

    // Create lookup maps for efficient comparison (ignoring instanceId)
    const onecxByUuid = new Map<string, OneCXRecord>()
    const onecxByNormalizedName = new Map<string, OneCXRecord[]>()
    const excelByUuid = new Map<string, ExcelRecord>()
    const excelByNormalizedName = new Map<string, ExcelRecord[]>()
    const graphqlByUuid = new Map<string, GraphQLTerm>()
    const graphqlByLabel = new Map<string, GraphQLTerm[]>()

    // Build OneCX lookup maps
    onecx.forEach(record => {
      if (record.onecxUuid) {
        onecxByUuid.set(record.onecxUuid, record)
      }
      if (record.oncecxAgencyName) {
        const normalizedName = normalizeName(record.oncecxAgencyName)
        if (!onecxByNormalizedName.has(normalizedName)) {
          onecxByNormalizedName.set(normalizedName, [])
        }
        onecxByNormalizedName.get(normalizedName)!.push(record)
      }
    })

    // Build Excel lookup maps
    excel.forEach(record => {
      if (record.uuid) {
        excelByUuid.set(record.uuid, record)
      }
      if (record.onecxName) {
        const normalizedName = normalizeName(record.onecxName)
        if (!excelByNormalizedName.has(normalizedName)) {
          excelByNormalizedName.set(normalizedName, [])
        }
        excelByNormalizedName.get(normalizedName)!.push(record)
      }
    })

    // Build GraphQL lookup maps
    graphql.forEach(term => {
      if (term.uuid) {
        graphqlByUuid.set(term.uuid, term)
      }
      if (term.label) {
        const normalizedLabel = normalizeName(term.label)
        if (!graphqlByLabel.has(normalizedLabel)) {
          graphqlByLabel.set(normalizedLabel, [])
        }
        graphqlByLabel.get(normalizedLabel)!.push(term)
      }
    })

    // VALIDATION 1: OneCX vs Excel (by UUID and name matching, ignoring instanceId)
    // Ensures: OneCX Agency Name + OneCX UUID = Excel OneCX Name + Excel UUID
    onecx.forEach(onecxRecord => {
      // First try to match by UUID
      let excelRecord = excelByUuid.get(onecxRecord.onecxUuid)
      let matchedBy = 'UUID'
      
      // If no UUID match, try to match by normalized name
      if (!excelRecord && onecxRecord.oncecxAgencyName) {
        const normalizedName = normalizeName(onecxRecord.oncecxAgencyName)
        const excelMatches = excelByNormalizedName.get(normalizedName)
        if (excelMatches && excelMatches.length > 0) {
          excelRecord = excelMatches[0] // Take first match
          matchedBy = 'name'
        }
      }
      
      if (!excelRecord) {
        discrepancies.push({
          id: (++discrepancyId).toString(),
          type: 'missing_in_excel',
          description: `OneCX record missing in Excel mapping table`,
          onecxData: onecxRecord,
          details: `OneCX Agency: "${onecxRecord.oncecxAgencyName}", UUID: ${onecxRecord.onecxUuid}`
        })
      } else {
        // Check UUID consistency between OneCX and Excel
        if (onecxRecord.onecxUuid !== excelRecord.uuid) {
          discrepancies.push({
            id: (++discrepancyId).toString(),
            type: 'uuid_mismatch',
            description: `UUID mismatch between OneCX and Excel (matched by ${matchedBy})`,
            onecxData: onecxRecord,
            excelData: excelRecord,
            details: `OneCX UUID: ${onecxRecord.onecxUuid} | Excel UUID: ${excelRecord.uuid}`
          })
        }

        // Check name consistency between OneCX and Excel
        const onecxNormalized = normalizeName(onecxRecord.oncecxAgencyName)
        const excelNormalized = normalizeName(excelRecord.onecxName)
        if (onecxNormalized !== excelNormalized) {
          discrepancies.push({
            id: (++discrepancyId).toString(),
            type: 'name_mismatch',
            description: `Agency name mismatch between OneCX and Excel (matched by ${matchedBy})`,
            onecxData: onecxRecord,
            excelData: excelRecord,
            details: `OneCX: "${onecxRecord.oncecxAgencyName}" | Excel: "${excelRecord.onecxName}"`
          })
        }
      }
    })

    // Check for Excel records not in OneCX (by UUID and name matching)
    excel.forEach(excelRecord => {
      // First try to match by UUID
      let onecxRecord = onecxByUuid.get(excelRecord.uuid)
      
      // If no UUID match, try to match by normalized name
      if (!onecxRecord && excelRecord.onecxName) {
        const normalizedName = normalizeName(excelRecord.onecxName)
        const onecxMatches = onecxByNormalizedName.get(normalizedName)
        if (onecxMatches && onecxMatches.length > 0) {
          onecxRecord = onecxMatches[0] // Take first match
        }
      }
      
      if (!onecxRecord) {
        discrepancies.push({
          id: (++discrepancyId).toString(),
          type: 'missing_in_onecx',
          description: `Excel record missing in OneCX data`,
          excelData: excelRecord,
          details: `Excel Name: "${excelRecord.onecxName}", UUID: ${excelRecord.uuid}`
        })
      }
    })

    // VALIDATION 2: Excel vs GraphQL (by UUID)
    // Ensures: Excel OneCX Name + Excel UUID = GraphQL Label + GraphQL UUID
    excel.forEach(excelRecord => {
      const graphqlTerm = graphqlByUuid.get(excelRecord.uuid)
      
      if (!graphqlTerm) {
        discrepancies.push({
          id: (++discrepancyId).toString(),
          type: 'missing_in_graphql',
          description: `Excel UUID not found in GraphQL terms`,
          excelData: excelRecord,
          details: `UUID: ${excelRecord.uuid} | Excel Name: "${excelRecord.onecxName}"`
        })
      } else {
        // Check label consistency between Excel and GraphQL
        const excelNormalized = normalizeName(excelRecord.onecxName)
        const graphqlNormalized = normalizeName(graphqlTerm.label)
        if (excelNormalized !== graphqlNormalized) {
          discrepancies.push({
            id: (++discrepancyId).toString(),
            type: 'label_mismatch',
            description: `Label mismatch between Excel and GraphQL for same UUID`,
            excelData: excelRecord,
            graphqlData: graphqlTerm,
            details: `UUID: ${excelRecord.uuid} | Excel: "${excelRecord.onecxName}" | GraphQL: "${graphqlTerm.label}"`
          })
        }
      }
    })

    // VALIDATION 3: Three-way consistency check (OneCX → Excel → GraphQL, ignoring instanceId)
    // Ensures: OneCX Agency Name + OneCX UUID = Excel OneCX Name + Excel UUID = GraphQL Label + GraphQL UUID
    onecx.forEach(onecxRecord => {
      // Find matching Excel record by UUID or name
      let excelRecord = excelByUuid.get(onecxRecord.onecxUuid)
      if (!excelRecord && onecxRecord.oncecxAgencyName) {
        const normalizedName = normalizeName(onecxRecord.oncecxAgencyName)
        const excelMatches = excelByNormalizedName.get(normalizedName)
        if (excelMatches && excelMatches.length > 0) {
          excelRecord = excelMatches[0]
        }
      }
      
      if (excelRecord && onecxRecord.onecxUuid === excelRecord.uuid) {
        // If OneCX and Excel have matching UUIDs, check if GraphQL also matches
        const graphqlTerm = graphqlByUuid.get(onecxRecord.onecxUuid)
        if (graphqlTerm) {
          // All three sources have the same UUID, check if names/labels are consistent
          const onecxNormalized = normalizeName(onecxRecord.oncecxAgencyName)
          const excelNormalized = normalizeName(excelRecord.onecxName)
          const graphqlNormalized = normalizeName(graphqlTerm.label)
          
          if (onecxNormalized === excelNormalized && excelNormalized !== graphqlNormalized) {
            discrepancies.push({
              id: (++discrepancyId).toString(),
              type: 'label_mismatch',
              description: `Three-way validation: OneCX and Excel names match but GraphQL label differs`,
              onecxData: onecxRecord,
              excelData: excelRecord,
              graphqlData: graphqlTerm,
              details: `UUID: ${onecxRecord.onecxUuid} | OneCX/Excel: "${onecxRecord.oncecxAgencyName}" | GraphQL: "${graphqlTerm.label}"`
            })
          } else if (onecxNormalized !== excelNormalized && excelNormalized === graphqlNormalized) {
            discrepancies.push({
              id: (++discrepancyId).toString(),
              type: 'name_mismatch',
              description: `Three-way validation: Excel and GraphQL names match but OneCX differs`,
              onecxData: onecxRecord,
              excelData: excelRecord,
              graphqlData: graphqlTerm,
              details: `UUID: ${onecxRecord.onecxUuid} | OneCX: "${onecxRecord.oncecxAgencyName}" | Excel/GraphQL: "${excelRecord.onecxName}"`
            })
          }
        }
      }
    })

    // Check for duplicate labels in GraphQL
    graphqlByLabel.forEach((terms) => {
      if (terms.length > 1) {
        const uuids = terms.map(t => t.uuid).join(', ')
        discrepancies.push({
          id: (++discrepancyId).toString(),
          type: 'duplicate_label',
          description: `Duplicate label found in GraphQL with different UUIDs`,
          details: `Label: "${terms[0].label}", UUIDs: ${uuids}`
        })
      }
    })

    // Check for orphaned GraphQL terms
    const usedUuids = new Set(excel.map(r => r.uuid))
    graphql.forEach(term => {
      if (!usedUuids.has(term.uuid)) {
        discrepancies.push({
          id: (++discrepancyId).toString(),
          type: 'orphaned_graphql',
          description: `GraphQL term not referenced in Excel mapping table`,
          graphqlData: term,
          details: `UUID: ${term.uuid}, Label: "${term.label}"`
        })
      }
    })

    return discrepancies
  }, [])

  // File upload handlers
  const handleFileUpload = async (fileType: 'onecx' | 'excel' | 'graphql', file: File) => {
    try {
      let data: OneCXRecord[] | ExcelRecord[] | GraphQLTerm[] = []
      
      switch (fileType) {
        case 'onecx':
          data = await parseOneCXJson(file)
          break
        case 'excel':
          data = await parseExcel(file)
          break
        case 'graphql':
          data = await parseGraphQLTerms(file)
          break
      }

      setFiles(prev => ({ ...prev, [fileType]: data }))
      setUploadStatus(prev => ({ ...prev, [fileType]: true }))
    } catch (error) {
      alert(`Error uploading ${fileType} file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Run comparison
  const runComparison = async () => {
    if (!uploadStatus.onecx || !uploadStatus.excel || !uploadStatus.graphql) {
      alert('Please upload all three files before comparing')
      return
    }

    setIsComparing(true)
    setComparisonComplete(false)

    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const results = compare(files.onecx, files.excel, files.graphql)
      setDiscrepancies(results)
      setComparisonComplete(true)
    } catch (error) {
      alert(`Error during comparison: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsComparing(false)
    }
  }

  // Download CSV
  const downloadCSV = () => {
    if (discrepancies.length === 0) {
      alert('No discrepancies to download')
      return
    }

    const csvHeaders = [
      'Type',
      'Description',
      'Details',
      'OneCX Agency Name',
      'OneCX Instance ID',
      'OneCX UUID',
      'Excel Instance Name',
      'Excel OneCX Name',
      'Excel UUID',
      'GraphQL Label',
      'GraphQL UUID'
    ]

    const csvRows = discrepancies.map(disc => [
      disc.type,
      disc.description,
      disc.details || '',
      disc.onecxData?.oncecxAgencyName || '',
      disc.onecxData?.sgInstanceId || '',
      disc.onecxData?.onecxUuid || '',
      disc.excelData?.sgInstanceName || '',
      disc.excelData?.onecxName || '',
      disc.excelData?.uuid || '',
      disc.graphqlData?.label || '',
      disc.graphqlData?.uuid || ''
    ])

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `data_discrepancies_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getDiscrepancyIcon = (type: string) => {
    switch (type) {
      case 'missing_in_excel':
      case 'missing_in_onecx':
      case 'missing_in_graphql':
        return <X className="w-4 h-4 text-red-500" />
      case 'uuid_mismatch':
      case 'name_mismatch':
      case 'label_mismatch':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'duplicate_label':
      case 'orphaned_graphql':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getDiscrepancyColor = (type: string) => {
    switch (type) {
      case 'missing_in_excel':
      case 'missing_in_onecx':
      case 'missing_in_graphql':
        return 'border-red-200 bg-red-50'
      case 'uuid_mismatch':
      case 'name_mismatch':
      case 'label_mismatch':
        return 'border-yellow-200 bg-yellow-50'
      case 'duplicate_label':
      case 'orphaned_graphql':
        return 'border-orange-200 bg-orange-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-400 dark:to-slate-200 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Data Source Comparison
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Upload your OneCX JSON, Excel mapping table, and GraphQL terms to identify discrepancies and mismatches across your data sources.
          </p>
        </motion.div>

        {/* File Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* OneCX JSON Upload */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">OneCX JSON</h3>
              {uploadStatus.onecx && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload OneCX_UUID-prod.txt (JSON array format)
            </p>
            <label className="block">
              <input
                type="file"
                accept=".txt,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload('onecx', file)
                }}
                className="hidden"
              />
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                <Upload className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {uploadStatus.onecx ? `Loaded ${files.onecx.length} records` : 'Click to upload'}
                </span>
              </div>
            </label>
          </div>

          {/* Excel Upload */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center mb-4">
              <FileSpreadsheet className="w-6 h-6 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Excel Mapping</h3>
              {uploadStatus.excel && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload MuleSoft Mapping Table.xlsx
            </p>
            <label className="block">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload('excel', file)
                }}
                className="hidden"
              />
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-green-400 transition-colors">
                <Upload className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {uploadStatus.excel ? `Loaded ${files.excel.length} records` : 'Click to upload'}
                </span>
              </div>
            </label>
          </div>

          {/* GraphQL Upload */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center mb-4">
              <FileJson className="w-6 h-6 text-purple-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">GraphQL Terms</h3>
              {uploadStatus.graphql && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload graphql.json with taxonomy terms
            </p>
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload('graphql', file)
                }}
                className="hidden"
              />
              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-purple-400 transition-colors">
                <Upload className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {uploadStatus.graphql ? `Loaded ${files.graphql.length} terms` : 'Click to upload'}
                </span>
              </div>
            </label>
          </div>
        </motion.div>

        {/* Compare Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-8"
        >
          <button
            onClick={runComparison}
            disabled={!uploadStatus.onecx || !uploadStatus.excel || !uploadStatus.graphql || isComparing}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            {isComparing ? 'Comparing...' : 'Compare Data Sources'}
          </button>
        </motion.div>

        {/* Results Section */}
        {comparisonComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Comparison Results
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {discrepancies.length} discrepancies found
                  </span>
                  {discrepancies.length > 0 && (
                    <button
                      onClick={downloadCSV}
                      className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download CSV
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {discrepancies.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    No Discrepancies Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    All data sources are consistent with each other.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {discrepancies.map((discrepancy) => (
                    <div
                      key={discrepancy.id}
                      className={`p-6 rounded-lg border-2 shadow-sm ${getDiscrepancyColor(discrepancy.type)}`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {getDiscrepancyIcon(discrepancy.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-500 mb-2">
                            {discrepancy.description}
                          </h4>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-400 mb-3">
                            Type: {discrepancy.type.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          {discrepancy.details && (
                            <p className="text-sm text-gray-800 dark:text-gray-200 mb-4 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                              {discrepancy.details}
                            </p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {discrepancy.onecxData && (
                              <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded border">
                                <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">OneCX Data</h5>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                  Agency: {discrepancy.onecxData.oncecxAgencyName}<br />
                                  Instance ID: {discrepancy.onecxData.sgInstanceId}<br />
                                  UUID: {discrepancy.onecxData.onecxUuid}
                                </p>
                              </div>
                            )}
                            {discrepancy.excelData && (
                              <div className="bg-green-50 dark:bg-green-900 p-3 rounded border">
                                <h5 className="font-semibold text-green-800 dark:text-green-200 mb-1">Excel Data</h5>
                                <p className="text-xs text-green-700 dark:text-green-300">
                                  Instance Name: {discrepancy.excelData.sgInstanceName}<br />
                                  OneCX Name: {discrepancy.excelData.onecxName}<br />
                                  UUID: {discrepancy.excelData.uuid}
                                </p>
                              </div>
                            )}
                            {discrepancy.graphqlData && (
                              <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded border">
                                <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-1">GraphQL Data</h5>
                                <p className="text-xs text-purple-700 dark:text-purple-300">
                                  Label: {discrepancy.graphqlData.label}<br />
                                  UUID: {discrepancy.graphqlData.uuid}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
