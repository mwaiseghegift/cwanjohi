/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, Download, FileText, FileSpreadsheet, CheckCircle, Eye, X } from 'lucide-react'
import * as XLSX from 'xlsx'

interface AgencyData {
    _id: { $oid: string }
    sgAgencyName: string
    sgInstanceId: number
    oncecxAgencyName: string
    onecxUuid: string
    departmentName: string
}

interface FileData {
    name: string
    data: AgencyData[]
    headers: string[]
}

interface ChangeDetail {
    field: string
    oldValue: any
    newValue: any
}

interface ChangedRecord {
    type: 'added' | 'modified' | 'removed'
    record: AgencyData
    changes?: ChangeDetail[]
    matchedBy?: string
}

export default function ExcelAnalysisPage() {
    const [excelFile, setExcelFile] = useState<FileData | null>(null)
    const [txtFile, setTxtFile] = useState<FileData | null>(null)
    const [changedData, setChangedData] = useState<ChangedRecord[]>([])
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisComplete, setAnalysisComplete] = useState(false)
    const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; data: any[]; title: string }>({
        isOpen: false,
        data: [],
        title: ''
    })

    const handleExcelUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet)

                // Convert Excel data to match our AgencyData structure
                const agencyData: AgencyData[] = jsonData.map((row: any) => ({
                    _id: { $oid: row._id || row.id || '' },
                    sgAgencyName: row.sgAgencyName || row['SG Agency Name'] || '',
                    sgInstanceId: parseInt(row.sgInstanceId || row['SG Instance ID'] || '0'),
                    oncecxAgencyName: row.oncecxAgencyName || row['OneCX Agency Name'] || '',
                    onecxUuid: row.onecxUuid || row['OneCX UUID'] || '',
                    departmentName: row.departmentName || row['Department Name'] || ''
                }))

                setExcelFile({
                    name: file.name,
                    data: agencyData,
                    headers: ['_id', 'sgAgencyName', 'sgInstanceId', 'oncecxAgencyName', 'onecxUuid', 'departmentName']
                })
            } catch (error) {
                console.error('Error reading Excel file:', error)
                alert('Error reading Excel file. Please make sure it\'s a valid Excel file with the correct columns.')
            }
        }
        reader.readAsArrayBuffer(file)
    }, [])

    const handleTxtUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string

                // Extract JSON part (remove timestamp and login info)
                const jsonStartIndex = text.indexOf('[')
                const jsonText = text.substring(jsonStartIndex)

                const jsonData: AgencyData[] = JSON.parse(jsonText)

                setTxtFile({
                    name: file.name,
                    data: jsonData,
                    headers: ['_id', 'sgAgencyName', 'sgInstanceId', 'oncecxAgencyName', 'onecxUuid', 'departmentName']
                })
            } catch (error) {
                console.error('Error reading text file:', error)
                alert('Error reading text file. Please make sure it contains valid JSON data.')
            }
        }
        reader.readAsText(file)
    }, [])

    const analyzeChanges = useCallback(() => {
        if (!excelFile || !txtFile) return

        setIsAnalyzing(true)

        const changes: ChangedRecord[] = []

        // Create maps for easier lookup
        const excelMap = new Map<string, AgencyData>()
        const txtMap = new Map<string, AgencyData>()

        // Use sgInstanceId as primary key for matching
        excelFile.data.forEach(record => {
            excelMap.set(record.sgInstanceId.toString(), record)
        })

        txtFile.data.forEach(record => {
            txtMap.set(record.sgInstanceId.toString(), record)
        })

        // Find new records (in txt but not in excel)
        txtFile.data.forEach(txtRecord => {
            const key = txtRecord.sgInstanceId.toString()
            if (!excelMap.has(key)) {
                changes.push({
                    type: 'added',
                    record: txtRecord,
                    matchedBy: 'sgInstanceId'
                })
            }
        })

        // Find removed records (in excel but not in txt)
        excelFile.data.forEach(excelRecord => {
            const key = excelRecord.sgInstanceId.toString()
            if (!txtMap.has(key)) {
                changes.push({
                    type: 'removed',
                    record: excelRecord,
                    matchedBy: 'sgInstanceId'
                })
            }
        })

        // Find modified records
        excelFile.data.forEach(excelRecord => {
            const key = excelRecord.sgInstanceId.toString()
            const txtRecord = txtMap.get(key)

            if (txtRecord) {
                const recordChanges: ChangeDetail[] = []

                // Compare each field
                if (excelRecord.sgAgencyName !== txtRecord.sgAgencyName) {
                    recordChanges.push({
                        field: 'sgAgencyName',
                        oldValue: excelRecord.sgAgencyName,
                        newValue: txtRecord.sgAgencyName
                    })
                }

                if (excelRecord.oncecxAgencyName !== txtRecord.oncecxAgencyName) {
                    recordChanges.push({
                        field: 'oncecxAgencyName',
                        oldValue: excelRecord.oncecxAgencyName,
                        newValue: txtRecord.oncecxAgencyName
                    })
                }

                if (excelRecord.onecxUuid !== txtRecord.onecxUuid) {
                    recordChanges.push({
                        field: 'onecxUuid',
                        oldValue: excelRecord.onecxUuid,
                        newValue: txtRecord.onecxUuid
                    })
                }

                if (excelRecord.departmentName !== txtRecord.departmentName) {
                    recordChanges.push({
                        field: 'departmentName',
                        oldValue: excelRecord.departmentName,
                        newValue: txtRecord.departmentName
                    })
                }

                if (recordChanges.length > 0) {
                    changes.push({
                        type: 'modified',
                        record: txtRecord,
                        changes: recordChanges,
                        matchedBy: 'sgInstanceId'
                    })
                }
            }
        })

        setChangedData(changes)
        setIsAnalyzing(false)
        setAnalysisComplete(true)
    }, [excelFile, txtFile])

    const downloadChanges = useCallback(() => {
        if (changedData.length === 0) return

        // Create separate sheets for different types of changes
        const addedRecords = changedData.filter(c => c.type === 'added')
        const modifiedRecords = changedData.filter(c => c.type === 'modified')
        const removedRecords = changedData.filter(c => c.type === 'removed')

        const workbook = XLSX.utils.book_new()

        // Added records sheet
        if (addedRecords.length > 0) {
            const addedData = [
                ['_id', 'sgAgencyName', 'sgInstanceId', 'oncecxAgencyName', 'onecxUuid', 'departmentName'],
                ...addedRecords.map(change => [
                    change.record._id.$oid,
                    change.record.sgAgencyName,
                    change.record.sgInstanceId,
                    change.record.oncecxAgencyName,
                    change.record.onecxUuid,
                    change.record.departmentName
                ])
            ]
            const addedSheet = XLSX.utils.aoa_to_sheet(addedData)
            XLSX.utils.book_append_sheet(workbook, addedSheet, 'Added Records')
        }

        // Modified records sheet
        if (modifiedRecords.length > 0) {
            const modifiedData = [
                ['sgInstanceId', 'sgAgencyName', 'Field Changed', 'Old Value', 'New Value'],
                ...modifiedRecords.flatMap(change =>
                    change.changes?.map(fieldChange => [
                        change.record.sgInstanceId,
                        change.record.sgAgencyName,
                        fieldChange.field,
                        fieldChange.oldValue,
                        fieldChange.newValue
                    ]) || []
                )
            ]
            const modifiedSheet = XLSX.utils.aoa_to_sheet(modifiedData)
            XLSX.utils.book_append_sheet(workbook, modifiedSheet, 'Modified Records')
        }

        // Removed records sheet
        if (removedRecords.length > 0) {
            const removedData = [
                ['_id', 'sgAgencyName', 'sgInstanceId', 'oncecxAgencyName', 'onecxUuid', 'departmentName'],
                ...removedRecords.map(change => [
                    change.record._id.$oid,
                    change.record.sgAgencyName,
                    change.record.sgInstanceId,
                    change.record.oncecxAgencyName,
                    change.record.onecxUuid,
                    change.record.departmentName
                ])
            ]
            const removedSheet = XLSX.utils.aoa_to_sheet(removedData)
            XLSX.utils.book_append_sheet(workbook, removedSheet, 'Removed Records')
        }

        XLSX.writeFile(workbook, `agency_changes_analysis_${new Date().toISOString().split('T')[0]}.xlsx`)
    }, [changedData])

    const showPreview = (data: any[], title: string) => {
        setPreviewModal({ isOpen: true, data, title })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-500 dark:to-slate-600 py-20 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
                        Agency Data Analysis Tool
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Compare your static Excel file with daily JSON data exports to identify changes in agency records
                    </p>
                </motion.div>

                {/* File Upload Section */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Excel File Upload */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-slate-700"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <FileSpreadsheet className="w-6 h-6 text-green-600 mr-2" />
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                    Reference Excel File
                                </h2>
                            </div>
                            {excelFile && (
                                <button
                                    onClick={() => showPreview(excelFile.data, 'Excel File Preview')}
                                    className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Preview
                                </button>
                            )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Upload your reference Excel file containing agency data
                        </p>

                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {excelFile ? excelFile.name : 'Click to upload Excel file'}
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={handleExcelUpload}
                            />
                        </label>

                        {excelFile && (
                            <div className="mt-4">
                                <div className="flex items-center text-green-600 mb-2">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    <span className="text-sm">File loaded successfully</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {excelFile.data.length} records loaded
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* Text File Upload */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-slate-700"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <FileText className="w-6 h-6 text-blue-600 mr-2" />
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                    Daily JSON Export
                                </h2>
                            </div>
                            {txtFile && (
                                <button
                                    onClick={() => showPreview(txtFile.data, 'JSON File Preview')}
                                    className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Preview
                                </button>
                            )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Upload the daily JSON export file to compare against the Excel file
                        </p>

                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {txtFile ? txtFile.name : 'Click to upload JSON file'}
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".txt,.json"
                                onChange={handleTxtUpload}
                            />
                        </label>

                        {txtFile && (
                            <div className="mt-4">
                                <div className="flex items-center text-green-600 mb-2">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    <span className="text-sm">File loaded successfully</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {txtFile.data.length} records loaded
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Analysis Button */}
                {excelFile && txtFile && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-center mb-12"
                    >
                        <button
                            onClick={analyzeChanges}
                            disabled={isAnalyzing}
                            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? 'Analyzing Changes...' : 'Analyze Changes'}
                        </button>
                    </motion.div>
                )}

                {/* Results Section */}
                {analysisComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-slate-700"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                                Analysis Results
                            </h2>
                            {changedData.length > 0 && (
                                <button
                                    onClick={downloadChanges}
                                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Changes
                                </button>
                            )}
                        </div>

                        {changedData.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                                <p className="text-lg text-gray-600 dark:text-gray-400">
                                    No changes detected! Your files are identical.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                                        <div className="text-green-800 dark:text-green-300 font-semibold">
                                            Added Records
                                        </div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {changedData.filter(c => c.type === 'added').length}
                                        </div>
                                    </div>

                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                        <div className="text-yellow-800 dark:text-yellow-300 font-semibold">
                                            Modified Records
                                        </div>
                                        <div className="text-2xl font-bold text-yellow-600">
                                            {changedData.filter(c => c.type === 'modified').length}
                                        </div>
                                    </div>

                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
                                        <div className="text-red-800 dark:text-red-300 font-semibold">
                                            Removed Records
                                        </div>
                                        <div className="text-2xl font-bold text-red-600">
                                            {changedData.filter(c => c.type === 'removed').length}
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Changes */}
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-slate-700">
                                                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Type</th>
                                                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Instance ID</th>
                                                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Agency Name</th>
                                                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Changes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {changedData.map((change, index) => (
                                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${change.type === 'added' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                                change.type === 'modified' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                            }`}>
                                                            {change.type.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                                        {change.record.sgInstanceId}
                                                    </td>
                                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                                        <span className="font-medium">{change.record.sgAgencyName}</span>
                                                    </td>
                                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                                        {change.type === 'modified' && change.changes ? (
                                                            <ul className="text-sm space-y-1">
                                                                {change.changes.map((fieldChange, i) => (
                                                                    <li key={i} className="text-orange-600 dark:text-orange-400">
                                                                        <strong>{fieldChange.field}:</strong> &quot;{fieldChange.oldValue}&quot; → &quot;{fieldChange.newValue}&quot;
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-sm text-gray-500">
                                                                {change.type === 'added' ? 'New record' : 'Record removed'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Preview Modal */}
            {previewModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                {previewModal.title}
                            </h3>
                            <button
                                onClick={() => setPreviewModal({ isOpen: false, data: [], title: '' })}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-auto">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-slate-700">
                                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Instance ID</th>
                                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">SG Agency Name</th>
                                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">OneCX Agency Name</th>
                                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Department</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewModal.data.slice(0, 50).map((record, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                                    {record.sgInstanceId}
                                                </td>
                                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                                    {record.sgAgencyName}
                                                </td>
                                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                                    {record.oncecxAgencyName}
                                                </td>
                                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                                    {record.departmentName}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {previewModal.data.length > 50 && (
                                <p className="text-sm text-gray-500 mt-4">
                                    Showing first 50 of {previewModal.data.length} records
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}