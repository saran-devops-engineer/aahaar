import { syncKnowledgeBase } from '@/engines/knowledge'

/** Bootstrap IndexedDB knowledge tables to the current catalog version. */
export async function seedIfEmpty(): Promise<void> {
  await syncKnowledgeBase()
}
