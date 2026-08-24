import pdfParse from 'pdf-parse';

export async function extractTextFromFile(fileBuffer: Buffer, mimeType: string, originalName: string): Promise<string> {
  let extractedText = '';

  if (mimeType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf')) {
    try {
      const data = await pdfParse(fileBuffer);
      extractedText = data.text;
    } catch (err: any) {
      console.warn('PDF parsing error, falling back to raw buffer string:', err.message);
      extractedText = fileBuffer.toString('utf-8');
    }
  } else {
    // TXT or DOCX raw string representation
    extractedText = fileBuffer.toString('utf-8');
  }

  // Clean and normalize extracted text
  return cleanText(extractedText);
}

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
