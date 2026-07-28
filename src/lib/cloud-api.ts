/**
 * 可可的工作台 - 云端 API 封装
 *
 * 通过 fetch 调用 Cloudflare Pages Functions：
 * - GET  /api/data           获取所有数据
 * - PUT  /api/data/{key}     保存某项数据
 * - POST /api/data           批量保存
 * - DELETE /api/data/{key}   删除某项数据
 *
 * 通过 X-Access-Token 头鉴权。
 */
import { tokenStorage } from "./storage";
import type { AppAllData } from "./types";

const API_BASE = "/api/data";

/** 获取鉴权头 */
function getAuthHeaders(): Record<string, string> {
  const token = tokenStorage.get();
  return token ? { "X-Access-Token": token } : {};
}

/** 是否已配置访问令牌 */
export function hasAccessToken(): boolean {
  return !!tokenStorage.get();
}

/** 设置访问令牌 */
export function setAccessToken(token: string): void {
  tokenStorage.set(token.trim());
}

/** 清除访问令牌 */
export function clearAccessToken(): void {
  tokenStorage.set("");
}

/**
 * 从云端加载全部数据
 * @returns 云端数据（Partial，缺失字段由调用方填充默认值）
 */
export async function fetchAllFromCloud(): Promise<Partial<AppAllData>> {
  const res = await fetch(API_BASE, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (res.status === 404) {
    // API 端点不存在（可能未部署 functions），返回空对象
    return {};
  }
  if (!res.ok) {
    throw new Error(`云端加载失败：HTTP ${res.status}`);
  }

  return (await res.json()) as Partial<AppAllData>;
}

/**
 * 保存某项数据到云端（增量更新）
 */
export async function saveToCloud<K extends keyof AppAllData>(
  key: K,
  value: AppAllData[K],
): Promise<void> {
  const res = await fetch(`${API_BASE}/${key}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(value),
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error(`云端保存失败：HTTP ${res.status}`);
  }
}

/**
 * 批量保存所有数据到云端（覆盖式）
 * 用于「导入数据」功能
 */
export async function saveAllToCloud(data: Partial<AppAllData>): Promise<void> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error(`云端批量保存失败：HTTP ${res.status}`);
  }
}

/**
 * 删除某项数据
 */
export async function deleteFromCloud<K extends keyof AppAllData>(
  key: K,
): Promise<void> {
  const res = await fetch(`${API_BASE}/${key}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok && res.status !== 404) {
    throw new Error(`云端删除失败：HTTP ${res.status}`);
  }
}

/** 清空云端所有数据 */
export async function clearAllFromCloud(): Promise<void> {
  // D1 没有直接清空表的特殊 API，通过 POST 空对象来覆盖
  // 但这样不会删除已存在的 key，所以改用 DELETE 逐个
  // 简单做法：加载所有数据后逐个删除
  const allData = await fetchAllFromCloud();
  const keys = Object.keys(allData) as (keyof AppAllData)[];
  await Promise.all(keys.map((k) => deleteFromCloud(k)));
}
