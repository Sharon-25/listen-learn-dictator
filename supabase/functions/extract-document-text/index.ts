import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const HUGGING_FACE_TOKEN = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN");
    if (!HUGGING_FACE_TOKEN) throw new Error("Hugging Face API token not configured");

    console.log(`Processing file: ${file_name} (${file_type})`);

    // Download file from Supabase
    const fileResponse = await fetch(file_url, { cache: "no-store" });
    if (!fileResponse.ok) throw new Error(`Failed to download file: ${fileResponse.statusText}`);

    const fileBuffer = await fileResponse.arrayBuffer();
    let extractedText = "";

    // Pick correct model based on file type
    let modelURL = "";
    if (file_type.includes("pdf")) {
      modelURL = "https://api-inference.huggingface.co/models/nielsr/pdf-text-extraction";
    } else if (file_type.includes("wordprocessingml.document")) {
      modelURL = "https://api-inference.huggingface.co/models/chmp/parse-docx";
    } else if (file_type.includes("presentationml.presentation")) {
      modelURL = "https://api-inference.huggingface.co/models/allenai/ppt-text-extraction";
    } else if (file_type.includes("text/plain")) {
      extractedText = await fileResponse.text();
    }

    if (modelURL) {
      console.log("Sending file to Hugging Face model:", modelURL);
      const hfResponse = await fetch(modelURL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGING_FACE_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        body: fileBuffer,
      });

      if (!hfResponse.ok) {
        const errText = await hfResponse.text();
        throw new Error(`Hugging Face API error: ${hfResponse.status} - ${errText}`);
      }

      const result = await hfResponse.json();
      extractedText = result.text || result.generated_text || "";

      console.log("Raw extraction result:", extractedText.substring(0, 200));
    }

    // Clean & format extracted text
    extractedText = cleanExtractedText(extractedText);

    if (!extractedText) {
      throw new Error("No text could be extracted from this document.");
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

// Utility function to clean text
function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}