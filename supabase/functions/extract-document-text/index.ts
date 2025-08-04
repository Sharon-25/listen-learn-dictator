import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map file types to Hugging Face model + correct MIME
const MODEL_CONFIG: Record<string, { model: string; mime: string }> = {
  pdf: {
    model: "https://api-inference.huggingface.co/models/nielsr/pdf-text-extraction",
    mime: "application/pdf",
  },
  docx: {
    model: "https://api-inference.huggingface.co/models/chmp/parse-docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  pptx: {
    model: "https://api-inference.huggingface.co/models/allenai/ppt-text-extraction",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_url, file_type, file_name } = await req.json();
    if (!file_url) throw new Error("File URL is required");

    const HUGGING_FACE_TOKEN = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN");
    if (!HUGGING_FACE_TOKEN) throw new Error("Hugging Face API token not configured");

    console.log(`Processing file: ${file_name} (${file_type})`);

    // 1️⃣ Download file
    const fileResponse = await fetch(file_url, { cache: "no-store" });
    if (!fileResponse.ok) throw new Error(`Failed to download file: ${fileResponse.statusText}`);

    const fileBuffer = await fileResponse.arrayBuffer();
    let extractedText = "";

    // 2️⃣ Determine model & MIME type
    const fileExt = file_type.includes("pdf")
      ? "pdf"
      : file_type.includes("wordprocessingml.document")
      ? "docx"
      : file_type.includes("presentationml.presentation")
      ? "pptx"
      : "txt";

    const modelConfig = MODEL_CONFIG[fileExt];

    if (fileExt === "txt") {
      // Directly read plain text
      extractedText = await fileResponse.text();
    } else if (modelConfig) {
      // 3️⃣ Call Hugging Face
      console.log("Sending to Hugging Face:", modelConfig.model);
      const hfResponse = await fetch(modelConfig.model, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
          "Content-Type": modelConfig.mime,
        },
        body: fileBuffer,
      });

      if (!hfResponse.ok) {
        const errText = await hfResponse.text();
        throw new Error(`Hugging Face API error: ${hfResponse.status} - ${errText}`);
      }

      const result = await hfResponse.json();
      console.log("Full HF result sample:", JSON.stringify(result).substring(0, 400));

      extractedText = parseHuggingFaceResult(result);
    }

    // 4️⃣ Clean text or fallback
    extractedText = cleanExtractedText(extractedText);
    if (!extractedText) {
      extractedText = getFallbackText(file_name);
    }

    return new Response(
      JSON.stringify({
        success: true,
        extractedText,
        wordCount: extractedText.split(/\s+/).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Document extraction error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Extraction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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

/** 🔹 Fallback message */
function getFallbackText(fileName: string): string {
  return `${fileName}

⚠ Unable to extract text from this document.

Possible reasons:
- The file is scanned or image-based
- Encrypted or password-protected
- Unsupported format

Try converting it to a searchable PDF or uploading a different file.`;
}