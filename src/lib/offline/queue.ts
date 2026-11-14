import Dexie, { type Table } from 'dexie';

/**
 * Antrean offline GuGaramKu (IndexedDB via Dexie).
 *
 * Saat transaksi gagal dikirim ke API (offline / server error),
 * payload transaksi disimpan di sini agar kasir tidak kehilangan
 * data. Tombol "Kirim ulang" di halaman kasir akan mencoba mengirim
 * kembali antrean ini.
 */

export interface PendingTransaction {
  id?: number;
  /** Payload lengkap yang sama dengan body POST /api/transactions */
  payload: Record<string, unknown>;
  /** Jumlah item ringkas untuk ditampilkan di UI */
  itemCount: number;
  total: number;
  createdAt: string;
}

class GugaramkuOfflineDB extends Dexie {
  pendingTransactions!: Table<PendingTransaction, number>;

  constructor() {
    super('gugaramku-offline');
    this.version(1).stores({
      pendingTransactions: '++id, createdAt',
    });
  }
}

export const offlineDB = new GugaramkuOfflineDB();

/** Simpan transaksi gagal ke antrean offline */
export async function enqueueTransaction(payload: {
  payload: Record<string, unknown>;
  itemCount: number;
  total: number;
}): Promise<void> {
  await offlineDB.pendingTransactions.add({
    payload: payload.payload,
    itemCount: payload.itemCount,
    total: payload.total,
    createdAt: new Date().toISOString(),
  });
}

/** Ambil semua transaksi yang masih antre */
export async function getPendingTransactions(): Promise<PendingTransaction[]> {
  return offlineDB.pendingTransactions.orderBy('createdAt').toArray();
}

/** Hapus satu item antrean (setelah berhasil dikirim) */
export async function removePendingTransaction(id: number): Promise<void> {
  await offlineDB.pendingTransactions.delete(id);
}

/** Kosongkan seluruh antrean */
export async function clearPendingTransactions(): Promise<void> {
  await offlineDB.pendingTransactions.clear();
}
