import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import type { AiProviderId } from '@inboxctrl/ai';

const ENCRYPTION_PREFIX = 'v1';

export function encryptAiApiKey(apiKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}

export function decryptAiApiKey(value: string): string {
  const [version, iv, tag, ciphertext] = value.split(':');

  if (version !== ENCRYPTION_PREFIX || !iv || !tag || !ciphertext) {
    return Buffer.from(value, 'base64').toString('utf8');
  }

  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));

  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
}

export function getEnvApiKey(providerId: AiProviderId): string | undefined {
  switch (providerId) {
    case 'openai':
      return process.env.OPENAI_API_KEY || undefined;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || undefined;
    case 'gemini':
      return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || undefined;
    case 'groq':
      return process.env.GROQ_API_KEY || undefined;
    default:
      return undefined;
  }
}

function getEncryptionKey(): Buffer {
  const secret = process.env.INBOXCTRL_SECRET ?? process.env.BETTER_AUTH_SECRET;

  if (!secret || secret === 'generate-a-strong-secret') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Set INBOXCTRL_SECRET or BETTER_AUTH_SECRET before storing AI API keys.');
    }
    return createHash('sha256').update('inboxctrl-local-development').digest();
  }

  return createHash('sha256').update(secret).digest();
}
