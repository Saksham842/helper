import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

let logDirectory: string | null = null;

function getLogDir(): string {
  if (logDirectory) return logDirectory;
  try {
    logDirectory = app.getPath('userData');
  } catch {
    // Fallback if called before app name or path is set
    const base = process.env.APPDATA || process.env.HOME || '.';
    logDirectory = path.join(base, 'SystemAudioHelper');
  }

  try {
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }
  } catch (err) {
    console.error('[Logger] Failed to create log directory:', err);
  }

  return logDirectory;
}

function writeEntry(fileName: string, line: string) {
  try {
    const dir = getLogDir();
    const filePath = path.join(dir, fileName);
    fs.appendFileSync(filePath, line + '\n', { encoding: 'utf8' });
  } catch (err) {
    console.error(`[Logger] Failed writing to ${fileName}:`, err);
  }
}

export function logInfo(message: string, ...args: any[]): void {
  const ts = new Date().toISOString();
  const formatted = args.length > 0 ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}` : message;
  const line = `[${ts}] [INFO] [PID:${process.pid}] ${formatted}`;
  console.log(line);
  writeEntry('diagnostic.log', line);
}

export function logWarn(message: string, ...args: any[]): void {
  const ts = new Date().toISOString();
  const formatted = args.length > 0 ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}` : message;
  const line = `[${ts}] [WARN] [PID:${process.pid}] ${formatted}`;
  console.warn(line);
  writeEntry('diagnostic.log', line);
}

export function logError(message: string, err?: any): void {
  const ts = new Date().toISOString();
  let stackStr = '';
  if (err instanceof Error) {
    stackStr = `\n${err.stack || err.message}`;
  } else if (err !== undefined) {
    stackStr = `\n${typeof err === 'object' ? JSON.stringify(err, null, 2) : String(err)}`;
  }
  const line = `[${ts}] [ERROR] [PID:${process.pid}] ${message}${stackStr}`;
  console.error(line);
  writeEntry('diagnostic.log', line);
  writeEntry('error.log', line);
}

export function initProcessErrorCatchers(): void {
  process.on('uncaughtException', (err: Error) => {
    logError('UNCAUGHT EXCEPTION in Electron Main Process', err);
  });

  process.on('unhandledRejection', (reason: any) => {
    logError('UNHANDLED PROMISE REJECTION in Electron Main Process', reason);
  });

  logInfo('Process error catchers initialized.');
}
