// Minimal offline write queue (localStorage-backed) for non-critical mutations.
// Modules can voluntarily enqueue writes when navigator.onLine is false.
const KEY = "ms_offline_queue_v1";

export interface QueuedWrite {
  id: string;
  table: string;
  op: "insert" | "update" | "delete";
  payload: any;
  match?: Record<string, any>;
  created_at: string;
}

function read(): QueuedWrite[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(arr: QueuedWrite[]) {
  localStorage.setItem(KEY, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent("ms:pending-sync", { detail: { count: arr.length } }));
}

export function enqueueWrite(item: Omit<QueuedWrite, "id" | "created_at">) {
  const arr = read();
  arr.push({ ...item, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  write(arr);
}

export function pendingCount() { return read().length; }

export async function flushQueue(supabase: any) {
  const arr = read();
  if (arr.length === 0) return { flushed: 0, failed: 0 };
  const remaining: QueuedWrite[] = [];
  let flushed = 0, failed = 0;
  for (const item of arr) {
    try {
      let q = supabase.from(item.table);
      if (item.op === "insert") await q.insert(item.payload).throwOnError();
      else if (item.op === "update") await q.update(item.payload).match(item.match || {}).throwOnError();
      else if (item.op === "delete") await q.delete().match(item.match || {}).throwOnError();
      flushed++;
    } catch {
      remaining.push(item); failed++;
    }
  }
  write(remaining);
  return { flushed, failed };
}

export function watchAndFlush(supabase: any) {
  const tryFlush = () => { if (navigator.onLine) flushQueue(supabase); };
  window.addEventListener("online", tryFlush);
  // Initial broadcast
  window.dispatchEvent(new CustomEvent("ms:pending-sync", { detail: { count: read().length } }));
  tryFlush();
}
