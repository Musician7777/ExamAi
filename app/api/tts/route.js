import { NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

export async function POST(request) {
    try {
        const { text } = await request.json();
        if (!text || !text.trim()) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        if (!ELEVENLABS_API_KEY) {
            return NextResponse.json({ error: 'ElevenLabs is not configured', fallback: true }, { status: 503 });
        }

        const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });
        const audioStream = await client.textToSpeech.convert(ELEVENLABS_VOICE_ID, {
            text: text.slice(0, 4000),
            modelId: 'eleven_flash_v2_5',
            outputFormat: 'mp3_44100_128',
        });

        const audioBuffer = await streamToBuffer(audioStream);
        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
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
