import { NextResponse } from 'next/server';
import { sanitizeErrorResponse } from '@/lib/sanitize';
import { apiRoute } from '@/lib/apiHandler';
import { ttsSchema } from '@/lib/validation';

const HF_TOKEN = process.env.HF_TOKEN;
const HF_KOKORO_TTS_URL = 'https://router.huggingface.co/hf-inference/models/hexgrad/Kokoro-82M';

export const POST = apiRoute(
  {
    requireCsrf: true,
    rateLimit: { max: 15, windowMs: 60000 },
    schema: ttsSchema,
    errorMessage: 'Failed to synthesize speech',
  },
  async (request, { body }) => {
    const { text, voice } = body;

    if (!HF_TOKEN) {
      return NextResponse.json({ error: 'Hugging Face TTS is not configured', fallback: true }, { status: 503 });
    }

    try {
      const response = await fetch(HF_KOKORO_TTS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          parameters: { voice },
          options: { wait_for_model: true },
        }),
      });

      if (!response.ok) {
        const rawError = await response.text();
        let errorMessage = `Hugging Face TTS request failed (${response.status})`;
        let bodyMessage = '';

        if (rawError) {
          try {
            const errorBody = JSON.parse(rawError);
            bodyMessage = errorBody?.error || errorBody?.message || '';
          } catch {
            bodyMessage = rawError;
          }
        }

        if (bodyMessage) {
          errorMessage = bodyMessage;
        }

        if (response.status === 503 && /loading/i.test(bodyMessage || '')) {
          return NextResponse.json(
            {
              error: 'TTS model is loading. Please retry in a few seconds.',
              isLoading: true,
              fallback: true,
            },
            { status: 503 }
          );
        }

        if (response.status === 401 || response.status === 403) {
          return NextResponse.json(
            {
              error: 'Invalid Hugging Face token. Please verify HF_TOKEN.',
              fallback: true,
            },
            { status: 401 }
          );
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('audio/')) {
        let details = 'Unexpected response from Hugging Face TTS.';
        try {
          const payload = await response.json();
          if (payload?.error) details = payload.error;
        } catch {
          // Not JSON — keep default details.
        }
        throw new Error(details);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType || 'audio/mpeg',
          'Cache-Control': 'no-store',
        },
      });
    } catch (error) {
      // Return TTS-specific error payload with fallback flag for frontend
      return NextResponse.json(
        sanitizeErrorResponse({ error: 'Failed to synthesize speech', details: error?.message, fallback: true }),
        { status: 503 }
      );
    }
  }
);
