"use client";

import type { LocalDraft } from "@/types";

const DB_NAME = "voiceflow";
const DB_VERSION = 1;
const STORE_NAME = "local-drafts";
export const LOCAL_DRAFTS_CHANGED = "voiceflow:local-drafts-changed";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local drafts"));
  });
}

function emitDraftsChanged() {
  window.dispatchEvent(new Event(LOCAL_DRAFTS_CHANGED));
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = run(store);
    let result: T | undefined;

    if (request) {
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => reject(request.error ?? new Error("Local draft operation failed"));
    }

    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Local draft transaction failed"));
    };
  });
}

export async function listLocalDrafts(): Promise<LocalDraft[]> {
  const drafts = (await withStore<LocalDraft[]>("readonly", (store) => store.getAll())) ?? [];
  return drafts.sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
}

export async function saveLocalDraft(draft: LocalDraft): Promise<void> {
  await withStore("readwrite", (store) => store.put(draft));
  emitDraftsChanged();
}

export async function updateLocalDraft(
  id: string,
  updates: Partial<Omit<LocalDraft, "id" | "audioBlob">>
): Promise<LocalDraft | null> {
  const existing = await getLocalDraft(id);
  if (!existing) return null;

  const next = { ...existing, ...updates };
  await saveLocalDraft(next);
  return next;
}

export async function getLocalDraft(id: string): Promise<LocalDraft | null> {
  return (await withStore<LocalDraft>("readonly", (store) => store.get(id))) ?? null;
}

export async function deleteLocalDraft(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
  emitDraftsChanged();
}

export function createLocalDraft(
  blob: Blob,
  title: string,
  duration: number
): LocalDraft {
  return {
    id: crypto.randomUUID(),
    title,
    transcript: "",
    tags: [],
    duration,
    recordedAt: new Date().toISOString(),
    status: "recorded",
    error: null,
    audioBlob: blob,
    audioType: blob.type || "audio/webm",
  };
}
