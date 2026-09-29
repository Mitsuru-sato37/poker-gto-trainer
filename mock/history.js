export const HISTORY_STORAGE_KEY = 'poker-gto-trainer.mock-history.v1';
const HISTORY_VERSION = 1;
const MAX_HISTORY_ENTRIES = 500;

function validEntry(entry) {
  return entry && typeof entry === 'object'
    && typeof entry.problemId === 'string'
    && typeof entry.evaluation === 'string'
    && typeof entry.selectedAction === 'string'
    && typeof entry.answeredAt === 'string';
}

export function serializeHistory(history) {
  return JSON.stringify({ version: HISTORY_VERSION, entries: history.slice(-MAX_HISTORY_ENTRIES) });
}

export function restoreHistory(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== HISTORY_VERSION || !Array.isArray(parsed.entries)) return [];
    return parsed.entries.filter(validEntry).slice(-MAX_HISTORY_ENTRIES);
  } catch {
    return [];
  }
}

export function recordHistory(history, entry) {
  if (!validEntry(entry)) throw new Error('history entry is malformed');
  return [...history, entry].slice(-MAX_HISTORY_ENTRIES);
}

export function getMistakeEntries(history) {
  return history.filter((entry) => entry.evaluation === 'MISTAKE');
}
