import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { unzip } from "https://deno.land/x/zip@v1.2.5/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_url, file_type, file_name } = await req.json();
    if (!file_url) throw new Error("File URL is required");

    console.log(`Processing file: ${file_name} (${file_type})`);

    // Download file
    const fileResponse = await fetch(file_url, { cache: "no-store" });
    if (!fileResponse.ok) throw new Error(`Failed to download file: ${fileResponse.statusText}`);

    const fileBuffer = await fileResponse.arrayBuffer();
    let extractedText = "";

    // Determine file type
    const fileExt = file_type.includes("pdf")
      ? "pdf"
      : file_type.includes("wordprocessingml.document")
      ? "docx"
      : file_type.includes("presentationml.presentation")
      ? "pptx"
      : "txt";

    if (fileExt === "txt") {
      // Direct text extraction
      extractedText = new TextDecoder().decode(fileBuffer);
    } else if (fileExt === "pdf") {
      // Use Hugging Face for PDF
      const HUGGING_FACE_TOKEN = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN");
      if (!HUGGING_FACE_TOKEN) throw new Error("Hugging Face API token not configured");
      
      const hfResponse = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
          "Content-Type": "application/pdf",
        },
        body: fileBuffer,
      });

      if (hfResponse.ok) {
        const result = await hfResponse.json();
        extractedText = parseHuggingFaceResult(result);
      }
    } else if (fileExt === "docx") {
      // Extract DOCX by unzipping and parsing XML
      extractedText = await extractDocxText(fileBuffer);
    } else if (fileExt === "pptx") {
      // Extract PPTX by unzipping and parsing XML
      extractedText = await extractPptxText(fileBuffer);
    }

    // Clean and validate text
    extractedText = cleanExtractedText(extractedText);
    if (!extractedText || extractedText.length < 10) {
      extractedText = `Unable to extract readable text from ${file_name}. The file may be corrupted, password-protected, or contain only images.`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        extractedText,
        wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Document extraction error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Extraction failed",
        extractedText: `Error processing file: ${error.message || "Unknown error occurred"}`
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/** Extract text from DOCX files */
async function extractDocxText(fileBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(fileBuffer);
    const unzipped = await unzip(uint8Array);
    
    // Find document.xml
    const docXml = unzipped.find(file => file.name === "word/document.xml");
    if (!docXml) return "";
    
    const xmlContent = new TextDecoder().decode(docXml.content);
    
    // Extract text from <w:t> tags
    const textMatches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    if (!textMatches) return "";
    
    const extractedTexts = textMatches.map(match => {
      const textMatch = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
      return textMatch ? textMatch[1] : "";
    }).filter(text => text.length > 0);
    
    return extractedTexts.join(" ");
  } catch (error) {
    console.error("DOCX extraction error:", error);
    return "";
  }
}

/** Extract text from PPTX files */
async function extractPptxText(fileBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(fileBuffer);
    const unzipped = await unzip(uint8Array);
    
    // Find all slide XML files
    const slideFiles = unzipped.filter(file => 
      file.name.startsWith("ppt/slides/slide") && file.name.endsWith(".xml")
    );
    
    let allText = "";
    
    for (const slideFile of slideFiles) {
      const xmlContent = new TextDecoder().decode(slideFile.content);
      
      // Extract text from <a:t> tags (drawing text)
      const textMatches = xmlContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
      if (textMatches) {
        const slideTexts = textMatches.map(match => {
          const textMatch = match.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
          return textMatch ? textMatch[1] : "";
        }).filter(text => text.length > 0);
        
        if (slideTexts.length > 0) {
          allText += slideTexts.join(" ") + "\n\n";
        }
      }
    }
    
    return allText.trim();
  } catch (error) {
    console.error("PPTX extraction error:", error);
    return "";
  }
}

/** 🔹 Parse Hugging Face response in all formats */
function parseHuggingFaceResult(result: any): string {
  if (!result) return "";

  // Case 1: Array (PDF or PPTX usually)
  if (Array.isArray(result)) {
    return result
      .map((page: any) => page.text || page.paragraph || page.content || "")
      .filter(Boolean)
      .join("\n\n");
  }

  // Case 2: Object (DOCX usually)
  if (typeof result === "object") {
    if (result.paragraphs) return result.paragraphs.join("\n\n");
    if (result.text) return result.text;
    if (result.generated_text) return result.generated_text;
    if (result.content) return result.content;

    // Case 3: Deep nested fallback
    return JSON.stringify(result);
  }

  return "";
}

/** 🔹 Cleanup text */
function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}
