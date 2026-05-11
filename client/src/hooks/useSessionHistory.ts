/*
 * Sciverse · useSessionHistory (v17)
 * 方案 B：会话+版本历史模型
 *
 * 核心约定：
 * - 一个 Session 对应一条侧边栏历史项，含若干 Version
 * - 每个 Version 都是独立检索（无上下文记忆），可单独复现
 * - 排序按 lastActivityAt 倒序（老会话被修改也会自然回到顶部）
 * - localStorage key: "sciverse:sessions:v1"
 *
 * 行为：
 * - createSession(query): 新对话页提交 → 新建会话 + 首版本
 * - appendVersion(sessionId, query): 结果页"追加到本会话" → 在已有会话末尾加 vN
 * - touch(sessionId): 仅切换浏览版本时更新 lastActivityAt，不影响 versions
 * - rename(sessionId, title): 改会话标题（默认取首版本 query）
 * - remove(sessionId): 删除整条会话
 */
import { useCallback, useEffect, useState } from "react";

export type Version = {
  id: string;          // v_xxx
  query: string;       // 该版本的关键词
  ts: number;          // 创建时间戳
};

export type Session = {
  id: string;          // s_xxx
  title: string;       // 默认 = 首版本 query
  versions: Version[]; // 至少 1 个
  createdAt: number;
  lastActivityAt: number;
};

const STORAGE_KEY = "sciverse:sessions:v1";

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
  } catch {
    // ignore quota
  }
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<Session[]>(() => readAll());

  // 跨标签同步
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSessions(readAll());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
      if (idx < 0) {
        // 安全降级：会话不存在则当作新建
        return createSession(query);
      }
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

// helper：在 hook 之外读取（如 Sidebar 需要订阅，亦走 hook；此 helper 用于一次性查询）
export function findSession(sessions: Session[], id: string | null) {
  if (!id) return undefined;
  return sessions.find((s) => s.id === id);
}

export function findVersion(session: Session | undefined, vid: string | null) {
  if (!session || !vid) return undefined;
  return session.versions.find((v) => v.id === vid);
}
