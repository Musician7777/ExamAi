import { NextResponse } from 'next/server';

const HF_TOKEN = process.env.HF_TOKEN;
const HF_KOKORO_TTS_URL = 'https://api-inference.huggingface.co/models/hexgrad/Kokoro-82M';

export async function POST(request) {
    try {
        const { text } = await request.json();
        if (!text || !text.trim()) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        if (!HF_TOKEN) {
            return NextResponse.json({ error: 'Hugging Face TTS is not configured', fallback: true }, { status: 503 });
        }

        const response = await fetch(HF_KOKORO_TTS_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: text.slice(0, 4000),
                options: { wait_for_model: true },
            }),
        });

        if (!response.ok) {
            let errorMessage = `Hugging Face TTS request failed (${response.status})`;
            try {
                const errorBody = await response.json();
                const bodyMessage = errorBody?.error || errorBody?.message;
                if (bodyMessage) errorMessage = bodyMessage;

                if (response.status === 503 && /loading/i.test(bodyMessage || '')) {
                    return NextResponse.json({
                        error: 'TTS model is loading. Please retry in a few seconds.',
                        isLoading: true,
                        fallback: true,
                    }, { status: 503 });
                }
            } catch {
                const raw = await response.text();
                if (raw) errorMessage = `${errorMessage}: ${raw}`;
            }

            if (response.status === 401 || response.status === 403) {
                return NextResponse.json({
                    error: 'Invalid Hugging Face token. Please verify HF_TOKEN.',
                    fallback: true,
                }, { status: 401 });
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
                // Keep default details if the payload is not JSON.
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
        console.error('TTS API error:', error);
        return NextResponse.json({
            error: 'Failed to synthesize speech',
            details: error?.message,
            fallback: true,
        }, { status: 503 });
    }
}
