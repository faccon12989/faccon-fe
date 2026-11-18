import type { LocalDocument } from "./types";

const FILE_LIMIT = 10 * 1024 * 1024;
const ALLOWED = /\.(pdf|png|jpe?g|webp|xlsx?|csv|docx?|hwp|hwpx|txt)$/i;
const openFiles = (): Promise<IDBDatabase> => new Promise((resolve: (db: IDBDatabase) => void, reject: (reason: Error) => void): void => {
  const request = indexedDB.open("faccon-local-files", 1);
  request.onupgradeneeded = (): void => { request.result.createObjectStore("files"); };
  request.onsuccess = (): void => resolve(request.result);
  request.onerror = (): void => reject(new Error("이 브라우저에서 원문 파일을 저장할 수 없습니다."));
});
export const validateLocalFile = (file: File): void => {
  if (!ALLOWED.test(file.name)) throw new Error("PDF, 이미지, 엑셀, 워드, 한글, CSV, TXT 파일을 등록해 주세요.");
  if (!file.size || file.size > FILE_LIMIT) throw new Error("파일은 0바이트보다 크고 10MB 이하여야 합니다.");
};
export const storeLocalFile = async (id: string, file: File): Promise<void> => {
  validateLocalFile(file);
  const db = await openFiles();
  await new Promise<void>((resolve: () => void, reject: (reason: Error) => void): void => {
    const transaction = db.transaction("files", "readwrite");
    transaction.objectStore("files").put(file, id);
    transaction.oncomplete = (): void => { db.close(); resolve(); };
    transaction.onerror = (): void => { db.close(); reject(new Error("파일 저장에 실패했습니다. 브라우저 저장공간을 확인해 주세요.")); };
  });
};
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  window.setTimeout((): void => URL.revokeObjectURL(url), 1000);
};
export const readLocalFile = async (doc: LocalDocument): Promise<Blob> => {
  const db = await openFiles();
  return new Promise<Blob>((resolve: (file: Blob) => void, reject: (reason: Error) => void): void => {
    const request = db.transaction("files", "readonly").objectStore("files").get(doc.id);
    request.onsuccess = (): void => { db.close(); request.result instanceof Blob ? resolve(request.result) : reject(new Error("이 기기에 원문 파일이 없습니다. 다시 등록해 주세요.")); };
    request.onerror = (): void => { db.close(); reject(new Error("원문을 불러오지 못했습니다.")); };
  });
};
export const downloadLocalFile = async (doc: LocalDocument): Promise<void> => downloadBlob(await readLocalFile(doc), doc.name);
