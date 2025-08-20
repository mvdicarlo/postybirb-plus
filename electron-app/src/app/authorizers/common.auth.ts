function getEnvPort(): number {
  try {
    // Renderer/preload path
    if (typeof window !== 'undefined' && (window as any).PORT) {
      return Number((window as any).PORT);
    }
  } catch (_) {}
  // Main process fallback
  const base = Number(process.env.PORT || '9247');
  return base;
}

function getEnvAuthUrl(): string {
  try {
    if (typeof window !== 'undefined' && (window as any).AUTH_SERVER_URL) {
      return String((window as any).AUTH_SERVER_URL);
    }
  } catch (_) {}
  return String((global as any).AUTH_SERVER_URL || '');
}

const PORT = getEnvPort() + 1;
const URL = getEnvAuthUrl();

export function getURL(path): string {
  return `${URL}/${path}?port=${PORT}`;
}

export function getPort(): number {
  return PORT;
}

export function createResponseBody(text: string): string {
  return `<div style="
  font-size: 24px;
  color: #1890ff;
  text-align: center;
  margin-top: 5em;
">${text}</div>`;
}
