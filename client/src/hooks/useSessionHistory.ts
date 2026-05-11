/*
 * Sciverse · useSessionHistory (v17.1)
 * 方案 B：会话+版本历史模型
 *
 * 核心约定：
 * - 一个 Session 对应一条侧边栏历史项，含若干 Version
 * - 每个 Version 都是独立检索（无上下文记忆），可单独复现
 * - 排序按 lastActivityAt 倒序
 * - localStorage key: "sciverse:sessions:v1"
 *
 * v17.1 修复：
 * - 浏览器 `storage` 事件只跨标签页生效，同窗口内 Sidebar 与 Experience 不会自动同步
 * - 改为自定义事件 + EventTarget 广播：每次写入都 dispatch，所有 hook 实例订阅刷新
 */
import { useCallback, useEffect, useState } from "react";

export type Version = {
  id: string;
  query: string;
  ts: number;
};

export type Session = {
  id: string;
  title: string;
  versions: Version[];
  createdAt: number;
  lastActivityAt: number;
};

const STORAGE_KEY = "sciverse:sessions:v1";
const EVENT_NAME = "sciverse:sessions:changed";

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function readAll(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as Session[];
  } catch {
    return [];
  }
}

function writeAll(list: Session[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // v17.1：同窗口广播，让本窗口内的其他 hook 实例同步刷新
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // ignore quota
  }
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<Session[]>(() => readAll());

  // 跨标签 + 同窗口同步
  useEffect(() => {
    const reload = () => setSessions(readAll());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) reload();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENT_NAME, reload as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVENT_NAME, reload as EventListener);
    };
  }, []);

  const persist = useCallback((next: Session[]) => {
    setSessions(next);
    writeAll(next);
  }, []);

  const createSession = useCallback(
    (query: string): { sessionId: string; versionId: string } => {
      const now = Date.now();
      const v: Version = { id: uid("v"), query: query.trim(), ts: now };
      const s: Session = {
        id: uid("s"),
        title: query.trim().slice(0, 60),
        versions: [v],
        createdAt: now,
        lastActivityAt: now,
      };
      persist([s, ...readAll()]);
      return { sessionId: s.id, versionId: v.id };
    },
    [persist],
  );

  const appendVersion = useCallback(
    (sessionId: string, query: string): { sessionId: string; versionId: string } => {
      const all = readAll();
      const idx = all.findIndex((s) => s.id === sessionId);
      if (idx < 0) return createSession(query);
      const now = Date.now();
      const v: Version = { id: uid("v"), query: query.trim(), ts: now };
      const updated: Session = {
        ...all[idx],
        versions: [...all[idx].versions, v],
        lastActivityAt: now,
      };
      const next = [updated, ...all.filter((_, i) => i !== idx)];
      persist(next);
      return { sessionId: updated.id, versionId: v.id };
    },
    [persist, createSession],
  );

  const touch = useCallback(
    (sessionId: string) => {
      const all = readAll();
      const idx = all.findIndex((s) => s.id === sessionId);
      if (idx < 0) return;
      const now = Date.now();
      const updated: Session = { ...all[idx], lastActivityAt: now };
      const next = [updated, ...all.filter((_, i) => i !== idx)];
      persist(next);
    },
    [persist],
  );

  const rename = useCallback(
    (sessionId: string, title: string) => {
      const all = readAll();
      const next = all.map((s) =>
        s.id === sessionId ? { ...s, title: title.slice(0, 60) } : s,
      );
      persist(next);
    },
    [persist],
  );

  const remove = useCallback(
    (sessionId: string) => {
      persist(readAll().filter((s) => s.id !== sessionId));
    },
    [persist],
  );

  return {
    sessions,
    createSession,
    appendVersion,
    touch,
    rename,
    remove,
  };
}

export function findSession(sessions: Session[], id: string | null) {
  if (!id) return undefined;
  return sessions.find((s) => s.id === id);
}

export function findVersion(session: Session | undefined, vid: string | null) {
  if (!session || !vid) return undefined;
  return session.versions.find((v) => v.id === vid);
}
