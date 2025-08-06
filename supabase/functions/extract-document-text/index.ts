import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Hugging Face models for text extraction
const HUGGING_FACE_MODELS = {
  pdf: "impira/layoutlm-document-qa",
  docx: "unstructuredio/unstructured-docx", 
  pptx: "unstructuredio/unstructured-pptx",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_url, file_type, file_name } = await req.json();
    
    if (!file_url) {
      throw new Error("File URL is required");
    }

    const HUGGING_FACE_TOKEN = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN");
    if (!HUGGING_FACE_TOKEN) {
      throw new Error("HUGGING_FACE_ACCESS_TOKEN not configured in environment");
    }

    console.log(`🔄 Processing: ${file_name} | Type: ${file_type} | URL: ${file_url.substring(0, 50)}...`);

    // Determine file type from MIME type
    const fileType = getFileType(file_type);
    console.log(`📁 Detected file type: ${fileType}`);

    if (fileType === "txt") {
      // Handle TXT files directly
      const response = await fetch(file_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const textContent = await response.text();
      const cleanText = cleanExtractedText(textContent);
      
      console.log(`✅ TXT processed: ${cleanText.length} characters`);
      
      return new Response(JSON.stringify({
        success: true,
        extractedText: cleanText,
        wordCount: countWords(cleanText)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Handle binary files (PDF, DOCX, PPTX) with Hugging Face
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`);
    }

    // Get binary data
    const fileBuffer = await fileResponse.arrayBuffer();
    const fileData = new Uint8Array(fileBuffer);
    
    console.log(`📦 File size: ${fileData.length} bytes`);

    // Call Hugging Face API
    const model = HUGGING_FACE_MODELS[fileType as keyof typeof HUGGING_FACE_MODELS];
    const hfUrl = `https://api-inference.huggingface.co/models/${model}`;
    
    console.log(`🤖 Calling Hugging Face: ${hfUrl}`);

    const hfResponse = await fetch(hfUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HUGGING_FACE_TOKEN}`,
        "Content-Type": "application/octet-stream",
      },
      body: fileData,
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error(`❌ Hugging Face API Error: ${hfResponse.status} - ${errorText}`);
      
      return new Response(JSON.stringify({
        success: false,
        extractedText: "⚠ Could not extract readable text from this file.",
        error: `Hugging Face API error: ${hfResponse.status}`
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse Hugging Face response
    const hfResult = await hfResponse.json();
    const responsePreview = JSON.stringify(hfResult).substring(0, 200);
    console.log(`📊 HF Response Preview: ${responsePreview}...`);

    // Extract text from Hugging Face response
    const extractedText = parseHuggingFaceResponse(hfResult);
    
    if (!extractedText || extractedText.trim().length === 0) {
      console.log("⚠️ No text extracted from Hugging Face response");
      
      return new Response(JSON.stringify({
        success: false,
        extractedText: "⚠ Could not extract readable text from this file.",
        rawResponse: responsePreview
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Clean the extracted text
    const cleanText = cleanExtractedText(extractedText);
    const wordCount = countWords(cleanText);
    
    console.log(`✅ Extraction successful: ${wordCount} words, ${cleanText.length} characters`);
    console.log(`📝 Text preview: ${cleanText.substring(0, 100)}...`);

    return new Response(JSON.stringify({
      success: true,
      extractedText: cleanText,
      wordCount: wordCount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("❌ Error in extract-document-text:", error);
    
    return new Response(JSON.stringify({
      success: false,
      extractedText: "⚠ Could not extract readable text from this file.",
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

/**
 * Determine file type from MIME type
 */
function getFileType(mimeType: string): string {
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("wordprocessingml") || mimeType.includes("msword")) return "docx";
  if (mimeType.includes("presentationml") || mimeType.includes("ms-powerpoint")) return "pptx";
  if (mimeType.includes("text/plain")) return "txt";
  
  // Fallback to txt for unknown types
  return "txt";
}

/**
 * Parse Hugging Face API response to extract text
 */
function parseHuggingFaceResponse(response: any): string {
  if (!response) {
    console.log("🔍 Empty response from Hugging Face");
    return "";
  }

  let extractedTexts: string[] = [];

  // Handle array responses
  if (Array.isArray(response)) {
    console.log(`🔍 Processing array response with ${response.length} items`);
    
    response.forEach((item, index) => {
      if (typeof item === "string" && item.trim()) {
        extractedTexts.push(item.trim());
      } else if (typeof item === "object" && item) {
        // Check common text fields
        const textFields = ["text", "content", "paragraph", "generated_text", "extracted_text"];
        
        for (const field of textFields) {
          if (item[field] && typeof item[field] === "string" && item[field].trim()) {
            extractedTexts.push(item[field].trim());
            break;
          }
        }
      }
    });
  }
  
  // Handle object responses
  else if (typeof response === "object") {
    console.log("🔍 Processing object response");
    
    // Direct text fields
    const textFields = ["text", "content", "paragraph", "generated_text", "extracted_text"];
    
    for (const field of textFields) {
      if (response[field] && typeof response[field] === "string" && response[field].trim()) {
        extractedTexts.push(response[field].trim());
      }
    }
    
    // Check for nested arrays
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((item: any) => {
        if (typeof item === "string" && item.trim()) {
          extractedTexts.push(item.trim());
        }
      });
    }
    
    // Check for results array
    if (response.results && Array.isArray(response.results)) {
      response.results.forEach((item: any) => {
        if (typeof item === "string" && item.trim()) {
          extractedTexts.push(item.trim());
        } else if (item && typeof item === "object") {
          for (const field of textFields) {
            if (item[field] && typeof item[field] === "string" && item[field].trim()) {
              extractedTexts.push(item[field].trim());
            }
          }
        }
      });
    }
  }
  
  // Handle string responses
  else if (typeof response === "string" && response.trim()) {
    console.log("🔍 Processing string response");
    extractedTexts.push(response.trim());
  }

  const finalText = extractedTexts.join("\n\n");
  console.log(`🔍 Extracted ${extractedTexts.length} text segments, total length: ${finalText.length}`);
  
  return finalText;
}

/**
 * Clean extracted text by removing binary artifacts and formatting
 */
function cleanExtractedText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    // Remove binary/control characters but preserve basic punctuation
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    // Remove multiple consecutive spaces
    .replace(/[ \t]+/g, " ")
    // Normalize line breaks (max 2 consecutive)
    .replace(/\n{3,}/g, "\n\n")
    // Clean up each line
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n")
    .trim();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  if (!text || typeof text !== "string") {
    return 0;
  }
  
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}
