import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    console.log(`🔄 Processing: ${file_name} | Type: ${file_type}`);

    // Determine file type from MIME type
    const fileType = getFileType(file_type);
    console.log(`📁 Detected file type: ${fileType}`);

    // Download file
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`);
    }

    let extractedText = "";

    if (fileType === "txt") {
      // Handle TXT files directly
      extractedText = await fileResponse.text();
      console.log(`✅ TXT processed: ${extractedText.length} characters`);
    } else if (fileType === "pdf") {
      // Extract text from PDF using JavaScript
      const arrayBuffer = await fileResponse.arrayBuffer();
      extractedText = await extractTextFromPDF(arrayBuffer);
      console.log(`✅ PDF processed: ${extractedText.length} characters`);
    } else if (fileType === "docx") {
      // Extract text from DOCX using JavaScript
      const arrayBuffer = await fileResponse.arrayBuffer();
      extractedText = await extractTextFromDOCX(arrayBuffer);
      console.log(`✅ DOCX processed: ${extractedText.length} characters`);
    } else if (fileType === "pptx") {
      // Extract text from PPTX using JavaScript
      const arrayBuffer = await fileResponse.arrayBuffer();
      extractedText = await extractTextFromPPTX(arrayBuffer);
      console.log(`✅ PPTX processed: ${extractedText.length} characters`);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      console.log("⚠️ No text extracted from file");
      
      return new Response(JSON.stringify({
        success: false,
        extractedText: "⚠ Could not extract readable text from this file."
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
 * Extract text from PDF using simple binary parsing
 */
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Simple PDF text extraction by finding text streams
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfText = new TextDecoder().decode(uint8Array);
    
    // Extract text between BT and ET operators (basic PDF text extraction)
    const textMatches = pdfText.match(/BT\s*(.+?)\s*ET/gs) || [];
    const extractedTexts: string[] = [];
    
    for (const match of textMatches) {
      // Extract text from Tj operators
      const tjMatches = match.match(/\(([^)]+)\)\s*Tj/g) || [];
      for (const tjMatch of tjMatches) {
        const text = tjMatch.match(/\(([^)]+)\)/)?.[1];
        if (text) {
          extractedTexts.push(text);
        }
      }
    }
    
    return extractedTexts.join(" ");
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "";
  }
}

/**
 * Extract text from DOCX using ZIP parsing
 */
async function extractTextFromDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Import JSZip dynamically
    const JSZip = (await import("https://esm.sh/jszip@3.10.1")).default;
    
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXml = await zip.file("word/document.xml")?.async("text");
    
    if (!documentXml) {
      throw new Error("Could not find document.xml in DOCX file");
    }
    
    // Extract text from XML tags
    const textContent = documentXml
      .replace(/<[^>]*>/g, " ") // Remove XML tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
    
    return textContent;
  } catch (error) {
    console.error("DOCX extraction error:", error);
    return "";
  }
}

/**
 * Extract text from PPTX using ZIP parsing
 */
async function extractTextFromPPTX(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Import JSZip dynamically
    const JSZip = (await import("https://esm.sh/jszip@3.10.1")).default;
    
    const zip = await JSZip.loadAsync(arrayBuffer);
    const extractedTexts: string[] = [];
    
    // Find all slide XML files
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.startsWith("ppt/slides/slide") && name.endsWith(".xml")
    );
    
    for (const slideFile of slideFiles) {
      const slideXml = await zip.file(slideFile)?.async("text");
      if (slideXml) {
        // Extract text from XML tags
        const slideText = slideXml
          .replace(/<[^>]*>/g, " ") // Remove XML tags
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim();
        
        if (slideText) {
          extractedTexts.push(slideText);
        }
      }
    }
    
    return extractedTexts.join("\n\n");
  } catch (error) {
    console.error("PPTX extraction error:", error);
    return "";
  }
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
