import { authHeaders } from './client';

export interface SseMessage {
  event: string;
  data: string;
}

/**
 * Turns a text stream into Server-Sent Events. Keeps the unfinished tail between chunks, since
 * an event can arrive split across reads. Comment lines (": keep-alive") are skipped.
 */
export class SseParser {
  private buffer = '';

  push(chunk: string): SseMessage[] {
    this.buffer += chunk.replace(/\r\n/g, '\n');
    const messages: SseMessage[] = [];
    let end = this.buffer.indexOf('\n\n');
    while (end >= 0) {
      const block = this.buffer.slice(0, end);
      this.buffer = this.buffer.slice(end + 2);
      const message = parseBlock(block);
      if (message) {
        messages.push(message);
      }
      end = this.buffer.indexOf('\n\n');
    }
    return messages;
  }
}

function parseBlock(block: string): SseMessage | null {
  let event = 'message';
  const data: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith(':') || line === '') {
      continue;
    }
    const colon = line.indexOf(':');
    const field = colon < 0 ? line : line.slice(0, colon);
    const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '');
    if (field === 'event') {
      event = value;
    } else if (field === 'data') {
      data.push(value);
    }
  }
  return data.length === 0 && event === 'message' ? null : { event, data: data.join('\n') };
}

/**
 * Listens to a server-sent event stream with the user's headers (EventSource can't send
 * headers). Reconnects with a growing delay when the connection drops; stop() ends it.
 */
export function openStream(
  path: string,
  onMessage: (message: SseMessage) => void,
  onState: (connected: boolean) => void,
): () => void {
  let stopped = false;
  let controller: AbortController | null = null;
  let delay = 1000;

  const connect = async () => {
    while (!stopped) {
      controller = new AbortController();
      try {
        const response = await fetch(path, {
          headers: { Accept: 'text/event-stream', ...authHeaders() },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error(`stream answered ${response.status}`);
        }
        onState(true);
        delay = 1000;
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        const parser = new SseParser();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          parser.push(value).forEach(onMessage);
        }
      } catch {
        // dropped or refused: try again below
      }
      onState(false);
      if (!stopped) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 30_000);
      }
    }
  };
  void connect();
  return () => {
    stopped = true;
    controller?.abort();
  };
}
