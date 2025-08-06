import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Hugging Face models for text extraction
const MODEL_CONFIG: Record<string, string> = {
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
    if (!file_url) throw new Error("File URL is required");

    const HUGGING_FACE_TOKEN = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN");
    if (!HUGGING_FACE_TOKEN) {
      throw new Error("Hugging Face API token not configured");
    }

    console.log(`🔄 Processing file: ${file_name} (${file_type})`);

    // 1️⃣ Fetch file from Supabase Storage (public or signed URL)
    const fileResponse = await fetch(file_url, { cache: "no-store" });
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`);
    }

    // 2️⃣ Determine file type
    const fileExt = getFileExtension(file_type);
    console.log(`📄 Detected file type: ${fileExt}`);

    let extractedText = "";

    if (fileExt === "txt") {
      // Handle TXT files directly
      extractedText = new TextDecoder().decode(await fileResponse.arrayBuffer());
      console.log(`✅ TXT file processed, ${extractedText.length} characters`);
    } else {
      // Handle binary files (PDF, DOCX, PPTX) with Hugging Face
      const fileBuffer = await fileResponse.arrayBuffer();
      const uint8Array = new Uint8Array(fileBuffer);
      
      const modelURL = `https://api-inference.huggingface.co/models/${MODEL_CONFIG[fileExt]}`;
      console.log(`🤖 Sending to Hugging Face: ${modelURL}`);

      const hfResponse = await fetch(modelURL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGING_FACE_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        body: uint8Array,
      });

      if (!hfResponse.ok) {
        const errorText = await hfResponse.text();
        console.error(`❌ Hugging Face API error: ${hfResponse.status} - ${errorText}`);
        throw new Error(`Hugging Face API error: ${hfResponse.status}`);
      }

      const result = await hfResponse.json();
      console.log(`📊 HF response sample:`, JSON.stringify(result).slice(0, 200) + "...");

      extractedText = parseHuggingFaceResult(result);
    }

    // 3️⃣ Clean and validate extracted text
    extractedText = cleanExtractedText(extractedText);
    
    if (!extractedText || extractedText.trim().length < 10) {
      console.log("⚠️ No readable text found, returning fallback message");
      return new Response(
        JSON.stringify({
          success: false,
          extractedText: "⚠ Unable to extract text. The file may be scanned, encrypted, or image-based.",
          wordCount: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
    console.log(`✅ Extraction successful: ${wordCount} words, ${extractedText.length} characters`);

    return new Response(
      JSON.stringify({
        success: true,
        extractedText,
        wordCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Document extraction error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        extractedText: "⚠ Unable to extract text. The file may be scanned, encrypted, or image-based.",
        error: error.message || "Extraction failed",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/** 
 * Determine file extension from MIME type 
 */
function getFileExtension(mimeType: string): string {
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("wordprocessingml.document")) return "docx";
  if (mimeType.includes("presentationml.presentation")) return "pptx";
  if (mimeType.includes("text/plain")) return "txt";
  
  // Fallback based on common MIME types
  if (mimeType.includes("application/pdf")) return "pdf";
  if (mimeType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) return "docx";
  if (mimeType.includes("application/vnd.openxmlformats-officedocument.presentationml.presentation")) return "pptx";
  
  return "txt"; // Default fallback
}

/** 
 * Parse Hugging Face response into readable text 
 */
function parseHuggingFaceResult(result: any): string {
  if (!result) return "";

  // Handle array responses (common for document extraction)
  if (Array.isArray(result)) {
    const textParts = result
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object") {
          return item.text || item.content || item.paragraph || item.generated_text || "";
        }
        return "";
      })
      .filter(text => text && text.trim().length > 0);
    
    return textParts.join("\n\n");
  }

  // Handle object responses
  if (typeof result === "object") {
    if (result.text) return result.text;
    if (result.content) return result.content;
    if (result.generated_text) return result.generated_text;
    if (result.extracted_text) return result.extracted_text;
    
    // Handle nested data arrays
    if (Array.isArray(result.data)) {
      return result.data
        .filter(item => item && typeof item === "string")
        .join("\n\n");
    }
    
    // Last resort: try to extract any text-like properties
    const textValues = Object.values(result)
      .filter(val => typeof val === "string" && val.trim().length > 0);
    
    if (textValues.length > 0) {
      return textValues.join("\n\n");
    }
  }

  return "";
}

/** 
 * Clean extracted text and remove binary artifacts 
 */
function cleanExtractedText(text: string): string {
  if (!text || typeof text !== "string") return "";
  
  return text
    // Remove binary/control characters but keep basic punctuation and letters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    // Remove multiple consecutive spaces
    .replace(/[ \t]+/g, " ")
    // Clean up line breaks (max 2 consecutive)
    .replace(/\n{3,}/g, "\n\n")
    // Remove trailing/leading whitespace from each line
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n")
    // Final trim
    .trim();
}

// TODO: Add OCR fallback for scanned documents using services like:
// - Google Cloud Vision API
// - AWS Textract  
// - Azure Computer Vision
// This would handle image-based PDFs and scanned documents
