import * as xlsx from 'xlsx';
import mammoth from 'mammoth';

/**
 * Normalizes common document and spreadsheet formats into raw text
 * so that an LLM can analyze them.
 */
export async function extractTextFromAttachment(
    fileName: string,
    mimeType: string,
    buffer: Buffer
): Promise<string | null> {
    try {
        const lowerName = fileName.toLowerCase();

        // 1. PDF
        if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
            // @ts-ignore - dynamic require to bypass Turbopack static ESM analysis errors
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(buffer);
            return data.text;
        }

        // 2. Word Documents (DOCX)
        if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            lowerName.endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }

        // 3. Spreadsheets (XLSX, XLS, CSV)
        if (
            mimeType.includes('spreadsheet') ||
            mimeType === 'text/csv' ||
            lowerName.endsWith('.xlsx') ||
            lowerName.endsWith('.xls') ||
            lowerName.endsWith('.csv')
        ) {
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            let extractedText = '';

            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                const csvData = xlsx.utils.sheet_to_csv(sheet);
                extractedText += `\n--- Sheet: ${sheetName} ---\n${csvData}\n`;
            }

            return extractedText;
        }

        // 4. Plain Text
        if (mimeType.startsWith('text/') || lowerName.endsWith('.txt')) {
            return buffer.toString('utf-8');
        }

        // Unsupported format
        return null;

    } catch (error) {
        console.error(`Failed to extract text from attachment ${fileName}:`, error);
        return null;
    }
}
