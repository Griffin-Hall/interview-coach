import { Request, Response, Router } from 'express';

const router = Router();
const OPENAI_SPEECH_API_URL = 'https://api.openai.com/v1/audio/speech';
const DEFAULT_TTS_MODEL = 'gpt-4o-mini-tts';
const DEFAULT_VOICE = 'alloy';
const MAX_INPUT_CHARS = 2000;

const availableVoices = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'nova',
  'onyx',
  'sage',
  'shimmer',
  'verse'
] as const;

const supportedVoices = new Set<string>(availableVoices);

interface SpeechRequestBody {
  text?: unknown;
  voice?: unknown;
}

router.get('/voices', (_req: Request, res: Response) => {
  res.json({
    voices: availableVoices,
    defaultVoice: DEFAULT_VOICE
  });
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, voice } = req.body as SpeechRequestBody;

    if (typeof text !== 'string' || text.trim().length < 3) {
      res.status(400).json({
        error: 'Text is required and must be at least 3 characters.'
      });
      return;
    }

    if (text.trim().length > MAX_INPUT_CHARS) {
      res.status(400).json({
        error: `Text is too long. Maximum length is ${MAX_INPUT_CHARS} characters.`
      });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      res.status(503).json({
        error: 'Read aloud is unavailable because OPENAI_API_KEY is not configured on the backend.'
      });
      return;
    }

    const selectedVoice =
      typeof voice === 'string' && supportedVoices.has(voice.toLowerCase())
        ? voice.toLowerCase()
        : DEFAULT_VOICE;

    const model = process.env.OPENAI_TTS_MODEL?.trim() || DEFAULT_TTS_MODEL;

    const openAIResponse = await fetch(OPENAI_SPEECH_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        voice: selectedVoice,
        input: text.trim(),
        format: 'mp3'
      })
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI speech request failed (${openAIResponse.status}).`);
    }

    const audioArrayBuffer = await openAIResponse.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(audioBuffer);
  } catch (error) {
    console.error('Error generating speech audio:', error);
    res.status(500).json({
      error: 'Failed to generate read-aloud audio. Please try again.'
    });
  }
});

export default router;
