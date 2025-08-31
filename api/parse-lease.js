// External Lease Parser Service for Vercel/Netlify
// This service handles PDF conversion and OpenAI processing

export default async function handler(req, res) {
  // CORS headers for Bubble
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfUrl, leaseUploadId } = req.body;

    if (!pdfUrl) {
      return res.status(400).json({ error: 'PDF URL is required' });
    }

    console.log('Processing lease document:', pdfUrl);

    // Step 1: Convert PDF to images using PDF.co
    const imageUrls = await convertPdfToImages(pdfUrl);
    console.log('PDF converted to', imageUrls.length, 'images');

    // Step 2: Extract lease data using OpenAI Vision
    const leaseData = await extractLeaseData(imageUrls);
    console.log('Lease data extracted:', leaseData);

    // Return structured response to Bubble
    return res.status(200).json({
      success: true,
      leaseUploadId,
      data: leaseData,
      imageCount: imageUrls.length
    });

  } catch (error) {
    console.error('Error processing lease:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      leaseUploadId: req.body.leaseUploadId
    });
  }
}

async function convertPdfToImages(pdfUrl) {
  const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.PDFCO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: pdfUrl,
      pages: '',
      name: 'lease_page'
    })
  });

  const result = await response.json();
  
  if (result.error) {
    throw new Error(`PDF conversion failed: ${result.message}`);
  }

  return result.urls;
}

async function extractLeaseData(imageUrls) {
  // Use first page for lease data extraction
  const firstImageUrl = imageUrls[0];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [{
          type: 'text',
          text: 'Extract lease data from this document and return ONLY a JSON object with these exact fields: tenant_name (string), leased_area (number), suite (string), lease_start (YYYY-MM-DD), lease_end (YYYY-MM-DD), term_months (number), starting_rent (number), current_rent (number), annual_increase (number as percentage), free_rent_months (number), expense_reimb (string), renewal_option (boolean), renewal_terms (string). Return only the JSON, no other text.'
        }, {
          type: 'image_url',
          image_url: { url: firstImageUrl }
        }]
      }],
      max_tokens: 500
    })
  });

  const result = await response.json();
  
  if (!result.choices || !result.choices[0]) {
    throw new Error('Invalid OpenAI response');
  }

  const content = result.choices[0].message.content;
  
  try {
    // Parse the JSON response from OpenAI
    const leaseData = JSON.parse(content);
    return leaseData;
  } catch (e) {
    throw new Error(`Failed to parse OpenAI response as JSON: ${content}`);
  }
}
