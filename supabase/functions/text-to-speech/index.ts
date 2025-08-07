import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice_id = "9BWtsMINqrJLrRacOk9x", model = "eleven_multilingual_v2", speed = 1.0 } = await req.json();
    
    // Clamp speed to ElevenLabs acceptable range (0.7 - 1.2)
    const clampedSpeed = Math.max(0.7, Math.min(1.2, speed));

    console.log('Request received:', { 
      textLength: text?.length, 
      voice_id, 
      model, 
      speed 
    });

    if (!text) {
      throw new Error('Text is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    // ElevenLabs has a 10,000 character limit - chunk the text if needed
    const MAX_CHARS = 9500; // Leave some buffer
    let finalAudioBuffer: ArrayBuffer;

    if (text.length <= MAX_CHARS) {
      console.log('Processing single chunk - text length:', text.length);
      finalAudioBuffer = await generateSingleAudio(text, voice_id, model, clampedSpeed, ELEVENLABS_API_KEY);
    } else {
      console.log('Processing multiple chunks - total text length:', text.length);
      
      // Split text into chunks at sentence boundaries
      const chunks = splitTextIntoChunks(text, MAX_CHARS);
      console.log(`Split into ${chunks.length} chunks`);
      
      const audioChunks: ArrayBuffer[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
        try {
          const chunkAudio = await generateSingleAudio(chunks[i], voice_id, model, clampedSpeed, ELEVENLABS_API_KEY);
          audioChunks.push(chunkAudio);
        } catch (error) {
          console.error(`Error processing chunk ${i + 1}:`, error);
          throw new Error(`Failed to process chunk ${i + 1}: ${error.message}`);
        }
      }
      
      // Combine audio chunks
      finalAudioBuffer = combineAudioBuffers(audioChunks);
    }

    console.log('Final audio size:', finalAudioBuffer.byteLength, 'bytes');

    // Convert to base64 in chunks to avoid stack overflow
    const uint8Array = new Uint8Array(finalAudioBuffer);
    let binaryString = '';
    const chunkSize = 8192;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64Audio = btoa(binaryString);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        contentType: 'audio/mpeg',
        size: finalAudioBuffer.byteLength
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate speech',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

// Helper function to generate audio for a single text chunk
async function generateSingleAudio(
  text: string, 
  voice_id: string, 
  model: string, 
  speed: number, 
  apiKey: string
): Promise<ArrayBuffer> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        speed: speed,
        use_speaker_boost: true
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs API error:', response.status, errorText);
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  return await response.arrayBuffer();
}

// Helper function to split text into chunks at sentence boundaries
function splitTextIntoChunks(text: string, maxChars: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by sentences first
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxChars) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        // Single sentence is too long - split by words
        const words = sentence.split(' ');
        let wordChunk = '';
        
        for (const word of words) {
          if (wordChunk.length + word.length + 1 <= maxChars) {
            wordChunk += (wordChunk ? ' ' : '') + word;
          } else {
            if (wordChunk) {
              chunks.push(wordChunk.trim());
              wordChunk = word;
            } else {
              // Single word is too long - just add it as is
              chunks.push(word);
            }
          }
        }
        
        if (wordChunk) {
          currentChunk = wordChunk;
        }
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

// Helper function to combine multiple audio buffers
function combineAudioBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const buffer of buffers) {
    combined.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  
  return combined.buffer;
}