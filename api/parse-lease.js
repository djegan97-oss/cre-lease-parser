// /api/parse-lease.js
import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the uploaded file
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
    });

    const [fields, files] = await form.parse(req);
    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if it's a PDF
    if (!uploadedFile.mimetype?.includes('pdf')) {
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }

    // Step 1: Convert PDF to text using PDF.co
    const pdfText = await convertPdfToText(uploadedFile);
    
    // Step 2: Parse lease data using OpenAI
    const leaseData = await parseLeaseWithAI(pdfText);

    // Step 3: Return structured data
    res.status(200).json({
      success: true,
      filename: uploadedFile.originalFilename,
      extractedText: pdfText.substring(0, 500) + '...', // First 500 chars for debugging
      leaseData: leaseData
    });

  } catch (error) {
    console.error('Error processing lease:', error);
    res.status(500).json({ 
      error: 'Failed to process lease',
      details: error.message 
    });
  }
}

async function convertPdfToText(file) {
  const pdfCoApiKey = process.env.PDFCO_API_KEY;
  
  if (!pdfCoApiKey) {
    throw new Error('PDF.co API key not configured');
  }

  // Read file as base64
  const fileBuffer = fs.readFileSync(file.filepath);
  const base64Data = fileBuffer.toString('base64');

  // Convert PDF to text using PDF.co
  const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': pdfCoApiKey,
    },
    body: JSON.stringify({
      file: `data:application/pdf;base64,${base64Data}`,
      inline: true,
    }),
  });

  const result = await response.json();
  
  if (!result.body) {
    throw new Error(`PDF conversion failed: ${result.error || 'Unknown error'}`);
  }

  return result.body;
}

async function parseLeaseWithAI(text) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
Extract the following information from this commercial lease document. Return ONLY a valid JSON object with these exact fields that match the Bubble database schema:

{
  "annual_increase": 0,
  "current_rent": 0,
  "expense_reimb": "",
  "free_rent_months": 0,
  "lease_end": "",
  "lease_start": "",
  "leased_area": 0,
  "measurement": "",
  "renewal_option": "",
  "renewal_option_terms": "",
  "starting_rent": 0,
  "suite": "",
  "tenant_name": "",
  "term_months": 0
}

Instructions:
- annual_increase: Annual rent increase amount as number (no $ signs)
- current_rent: Current monthly rent as number (no $ signs or commas)
- expense_reimb: Type of expense reimbursement (e.g., "NNN", "Gross", "Modified Gross", etc.)
- free_rent_months: Number of free rent months as number
- lease_end: Lease end date in YYYY-MM-DD format
- lease_start: Lease start date in YYYY-MM-DD format
- leased_area: Square footage as number (no units)
- measurement: Unit of measurement, usually "SF" or "RSF"
- renewal_option: "yes" or "no" if renewal options exist
- renewal_option_terms: Text description of renewal terms if any
- starting_rent: Initial monthly rent amount as number (no $ signs)
- suite: Suite number or unit identifier
- tenant_name: Full legal name of the tenant
- term_months: Lease term in months as number

For fields you cannot find in the document, use empty string "" for text fields, 0 for numbers. For dates, use YYYY-MM-DD format.

Lease document text:
${text}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured data from commercial real estate lease documents. Always return valid JSON that matches the exact field names provided.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0,
      max_tokens: 1000,
    }),
  });

  const result = await response.json();
  
  if (!result.choices?.[0]?.message?.content) {
    throw new Error('Failed to parse lease with AI');
  }

  try {
    // Parse the JSON response
    const leaseData = JSON.parse(result.choices[0].message.content);
    return leaseData;
  } catch (parseError) {
    throw new Error('AI returned invalid JSON: ' + result.choices[0].message.content);
  }
}
