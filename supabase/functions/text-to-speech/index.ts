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

    console.log('Generating speech for text length:', text.length);
    console.log('Using voice:', voice_id);
    console.log('Using model:', model);
    console.log('Speed setting:', speed);

    // Call ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
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

    // Get the audio data as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    console.log('Generated audio size:', audioBuffer.byteLength, 'bytes');

    // Convert to base64
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        contentType: 'audio/mpeg',
        size: audioBuffer.byteLength
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