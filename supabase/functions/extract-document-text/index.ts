import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ✅ Hugging Face models optimized for readable text
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
    if (!HUGGING_FACE_TOKEN)
      throw new Error("Hugging Face API token not configured");

    console.log(`Processing file: ${file_name} (${file_type})`);

    // 1️⃣ Fetch file from public Supabase URL
    const fileResponse = await fetch(file_url, { cache: "no-store" });
    if (!fileResponse.ok)
      throw new Error(`Failed to download file: ${fileResponse.statusText}`);

    const fileBuffer = await fileResponse.arrayBuffer();

    // 2️⃣ Determine extension
    const fileExt = file_type.includes("pdf")
      ? "pdf"
      : file_type.includes("wordprocessingml.document")
      ? "docx"
      : file_type.includes("presentationml.presentation")
      ? "pptx"
      : "txt";

    let extractedText = "";

    if (fileExt === "txt") {
      // Directly read plain text
      extractedText = await fileResponse.text();
    } else {
      const modelURL = `https://api-inference.huggingface.co/models/${MODEL_CONFIG[fileExt]}`;
      console.log("Sending to Hugging Face:", modelURL);

      // 3️⃣ Send binary file to Hugging Face
      const hfResponse = await fetch(modelURL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
        },
        body: fileBuffer, // binary buffer
      });

      if (!hfResponse.ok) {
        const errText = await hfResponse.text();
        throw new Error(
          `Hugging Face API error: ${hfResponse.status} - ${errText}`,
        );
      }

      const result = await hfResponse.json();
      console.log("Sample HF result:", JSON.stringify(result).slice(0, 300));

      extractedText = parseHuggingFaceResult(result);
    }

    // 4️⃣ Clean extracted text or fallback
    extractedText = cleanExtractedText(extractedText);
    if (!extractedText) extractedText = getFallbackText(file_name);

    return new Response(
      JSON.stringify({
        success: true,
        extractedText,
        wordCount: extractedText.split(/\s+/).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error("Document extraction error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Extraction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

/** 🔹 Parse Hugging Face response into readable text */
function parseHuggingFaceResult(result: any): string {
  if (!result) return "";

  if (Array.isArray(result)) {
    // Array of objects with text/content fields
    return result
      .map((item) => item.text || item.content || item.paragraph || "")
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof result === "object") {
    if (result.text) return result.text;
    if (result.content) return result.content;
    if (result.generated_text) return result.generated_text;
    if (Array.isArray(result.data)) return result.data.join("\n\n");
    return JSON.stringify(result); // fallback to inspect structure
  }

  return "";
}

/** 🔹 Cleanup text */
function cleanExtractedText(text: string): string {
  return text
    .replace(/[^ -~\n]+/g, "") // remove non-printable chars
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
