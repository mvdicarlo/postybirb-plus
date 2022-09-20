import { getCurrentWindow } from '@electron/remote';
const PORT = Number((getCurrentWindow() as any).PORT) + 1;
const URL = (getCurrentWindow() as any).AUTH_SERVER_URL;

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
