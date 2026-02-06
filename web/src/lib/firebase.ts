import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (server-side only)
export function initAdmin() {
  if (getApps().length === 0) {
    // In production, use service account credentials
    // For now, using default credentials (requires GOOGLE_APPLICATION_CREDENTIALS env var)
    initializeApp({
      projectId: 'agent-pay-hq',
    });
  }
  return getFirestore();
}
