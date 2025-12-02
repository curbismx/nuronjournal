import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

async function transcribeWithRetry(formData: FormData, apiKey: string, maxRetries = 3): Promise<Response> {
  let lastError: string = '';
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (response.ok) {
      return response;
    }

    const errorText = await response.text();
    console.error(`OpenAI API error (attempt ${attempt + 1}):`, response.status, errorText);

    // Check if it's a rate limit error
    if (response.status === 429) {
      // Parse retry-after or use exponential backoff
      const retryAfter = response.headers.get('retry-after');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(1000 * Math.pow(2, attempt + 1), 30000);
      console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      lastError = errorText;
      continue;
    }

    // For non-rate-limit errors, don't retry
    return new Response(
      JSON.stringify({ error: `OpenAI API error: ${errorText}` }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // All retries exhausted
  return new Response(
    JSON.stringify({ error: `Rate limit exceeded after ${maxRetries} retries. Please wait a moment and try again.` }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    
    if (!audio) {
      console.error('No audio data provided');
      return new Response(
        JSON.stringify({ error: 'No audio data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing audio data, length:', audio.length);

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    console.log('Binary audio size:', binaryAudio.length, 'bytes');
    
    // Prepare form data
    const formData = new FormData();
    const blob = new Blob([binaryAudio.buffer as ArrayBuffer], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log('Sending to OpenAI Whisper API...');

    // Send to OpenAI with retry logic
    const response = await transcribeWithRetry(formData, openAIApiKey);

    if (!response.ok) {
      // Response already formatted by transcribeWithRetry
      const errorBody = await response.text();
      return new Response(errorBody, { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const result = await response.json();
    console.log('Transcription result:', result.text?.substring(0, 100));

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
