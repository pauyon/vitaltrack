import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Realtime CRUD for a per-user reading collection at
 * `users/{uid}/{collectionName}`. `mapDoc` converts raw Firestore data into the
 * typed reading shape (e.g. Timestamp -> Date). Returned rows are newest-first.
 */
export function useReadings<T extends { id: string; takenAt: Date }>(
  collectionName: string,
  mapDoc: (id: string, data: DocumentData) => T,
) {
  const { user } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const col = collection(db, 'users', user.uid, collectionName);
    const q = query(col, orderBy('takenAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => mapDoc(d.id, d.data())));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
    // mapDoc is stable (module-level); intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, collectionName]);

  function colRef() {
    if (!user) throw new Error('Not authenticated');
    return collection(db, 'users', user.uid, collectionName);
  }

  async function add(data: Record<string, unknown> & { takenAt: Date }) {
    await addDoc(colRef(), {
      ...data,
      takenAt: Timestamp.fromDate(data.takenAt),
      createdAt: serverTimestamp(),
    });
  }

  async function update(
    id: string,
    data: Record<string, unknown> & { takenAt: Date },
  ) {
    if (!user) throw new Error('Not authenticated');
    await updateDoc(doc(db, 'users', user.uid, collectionName, id), {
      ...data,
      takenAt: Timestamp.fromDate(data.takenAt),
    });
  }

  async function remove(id: string) {
    if (!user) throw new Error('Not authenticated');
    await deleteDoc(doc(db, 'users', user.uid, collectionName, id));
  }

  /** Bulk-insert many readings (used by import). Batched in chunks of 450. */
  async function addMany(rows: Array<Record<string, unknown> & { takenAt: Date }>) {
    if (!user) throw new Error('Not authenticated');
    const col = collection(db, 'users', user.uid, collectionName);
    const CHUNK = 450;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const batch = writeBatch(db);
      for (const row of rows.slice(i, i + CHUNK)) {
        batch.set(doc(col), {
          ...row,
          takenAt: Timestamp.fromDate(row.takenAt),
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  }

  return { items, loading, error, add, update, remove, addMany };
}

/** Convert a Firestore Timestamp|Date|undefined to a JS Date safely. */
export function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}
