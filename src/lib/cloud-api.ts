/**
 * 可可的工作台 - 云端 API 封装
 *
 * 通过 fetch 调用 Cloudflare Pages Functions：
 * - GET    /api/data           获取所有数据
 * - PUT    /api/data/{key}     保存某项数据（增量更新，插入或替换）
 * - POST   /api/data           批量保存（仅 upsert body 中提供的字段，不删除其他字段）
 * - DELETE /api/data/{key}     删除某项数据
 *
 * 通过 X-Access-Token 头鉴权。
 * 所有请求都有 10 秒超时，避免网络卡死。
 */
import { tokenStorage } from "./storage";
import type { AppAllData } from "./types";

const API_BASE = "/api/data";
const REQUEST_TIMEOUT_MS = 10_000;

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
 * 带超时的 fetch 封装
 * 超时后抛出 Error("TIMEOUT")，调用方可据此显示友好提示
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("TIMEOUT");
    }
    // 网络错误（DNS 解析失败、连接拒绝等）
    throw new Error(`NETWORK_ERROR: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    clearTimeout(timer);
  }
}

/** 统一处理响应状态码 */
function handleResponse(res: Response, action: string): void {
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error(`${action}失败：HTTP ${res.status}`);
  }
}

/**
 * 从云端加载全部数据
 * @returns 云端数据（Partial，缺失字段由调用方填充默认值）
 */
export async function fetchAllFromCloud(): Promise<Partial<AppAllData>> {
  let res: Response;
  try {
    res = await fetchWithTimeout(API_BASE, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "TIMEOUT") {
      throw new Error("云端加载超时，请检查网络");
    }
    throw new Error(`网络错误：${msg}`);
  }

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (res.status === 404) {
    // API 端点不存在（可能未部署 functions），返回空对象
    // 这种情况通常是部署配置错误，前端会降级显示默认数据
    return {};
  }
  if (!res.ok) {
    throw new Error(`云端加载失败：HTTP ${res.status}`);
  }

  return (await res.json()) as Partial<AppAllData>;
}

/**
 * 保存某项数据到云端（增量更新，插入或替换）
 */
export async function saveToCloud<K extends keyof AppAllData>(
  key: K,
  value: AppAllData[K],
): Promise<void> {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_BASE}/${key}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(value),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "TIMEOUT") {
      throw new Error("保存超时，请检查网络");
    }
    throw new Error(`网络错误：${msg}`);
  }
  handleResponse(res, "云端保存");
}

/**
 * 批量保存数据到云端（upsert 语义）
 * 注意：此接口仅会插入或更新 body 中提供的字段，不会删除其他字段。
 * 用于「导入数据」功能，导入后所有提供的字段会覆盖云端对应字段。
 */
export async function saveAllToCloud(data: Partial<AppAllData>): Promise<void> {
  let res: Response;
  try {
    res = await fetchWithTimeout(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "TIMEOUT") {
      throw new Error("批量保存超时，请检查网络");
    }
    throw new Error(`网络错误：${msg}`);
  }
  handleResponse(res, "云端批量保存");
}

/**
 * 删除某项数据
 */
export async function deleteFromCloud<K extends keyof AppAllData>(
  key: K,
): Promise<void> {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_BASE}/${key}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "TIMEOUT") {
      throw new Error("删除超时，请检查网络");
    }
    throw new Error(`网络错误：${msg}`);
  }
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok && res.status !== 404) {
    throw new Error(`云端删除失败：HTTP ${res.status}`);
  }
}

/**
 * 清空云端所有数据
 * 实现方式：新增一个 DELETE /api/data 接口（清空整张表）
 * 如果该接口不可用，则降级为逐个 DELETE
 */
export async function clearAllFromCloud(): Promise<void> {
  // 优先尝试批量清空接口
  try {
    const res = await fetchWithTimeout(API_BASE, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    if (res.ok) {
      return;
    }
    if (res.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (res.status === 405) {
      // DELETE /api/data 接口未实现，降级为逐个删除
      await clearAllFromCloudFallback();
      return;
    }
    throw new Error(`云端清空失败：HTTP ${res.status}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED") {
      throw e;
    }
    if (msg === "TIMEOUT") {
      throw new Error("清空超时，请检查网络");
    }
    // 网络错误时降级
    await clearAllFromCloudFallback();
  }
}

/** 降级方案：逐个删除所有 key */
async function clearAllFromCloudFallback(): Promise<void> {
  const allData = await fetchAllFromCloud();
  const keys = Object.keys(allData) as (keyof AppAllData)[];
  // 串行删除，避免触发 D1 速率限制
  for (const k of keys) {
    await deleteFromCloud(k);
  }
}
