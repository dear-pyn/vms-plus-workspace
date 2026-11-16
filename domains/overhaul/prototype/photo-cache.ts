/** Prototype image bytes live in IndexedDB; shared mock snapshots only contain the asset ID. */
function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("vms-plus-prototype-photos", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function cachePhoto(file: File): Promise<string> {
  const db = await openCache();
  const id = crypto.randomUUID();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("photos", "readwrite");
      tx.objectStore("photos").put(file, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return id;
  } finally { db.close(); }
}
export async function readPhoto(id: string): Promise<Blob | undefined> {
  const db = await openCache();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("photos").objectStore("photos").get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
