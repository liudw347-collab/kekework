/**
 * Cloudflare Pages Function - 全部数据接口
 *
 * GET /api/data       - 获取所有数据（返回 JSON 对象 {key: value, ...}）
 * POST /api/data      - 批量保存（覆盖所有数据，body: {key: value, ...}）
 *
 * 通过 X-Access-Token 头进行简单鉴权（私人网站用）
 * 数据存储在 Cloudflare D1 数据库的 app_data 表
 */

interface Env {
  DB: D1Database;
  ACCESS_TOKEN?: string;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Access-Token",
};

function unauthorized() {
  return new Response(JSON.stringify({ error: "未授权，请检查访问令牌" }), {
    status: 401,
    headers: JSON_HEADERS,
  });
}

function checkAuth(request: Request, env: Env): boolean {
  // 如果未配置 ACCESS_TOKEN，则允许所有请求（开发模式）
  if (!env.ACCESS_TOKEN) return true;
  const token = request.headers.get("X-Access-Token");
  return token === env.ACCESS_TOKEN;
}

/** 处理 CORS 预检 */
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
};

/** GET /api/data - 返回所有数据 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return unauthorized();
  }

  try {
    const result = await context.env.DB.prepare(
      "SELECT key, value FROM app_data",
    ).all();

    const data: Record<string, unknown> = {};
    for (const row of result.results) {
      const key = row.key as string;
      const value = row.value as string;
      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value;
      }
    }

    return new Response(JSON.stringify(data), {
      headers: JSON_HEADERS,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "数据库读取失败",
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
};

/** POST /api/data - 批量保存（替换所有） */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return unauthorized();
  }

  try {
    const body = (await context.request.json()) as Record<string, unknown>;
    const updatedAt = new Date().toISOString();

    // 使用事务批量更新
    const stmts = Object.entries(body).map(([key, value]) =>
      context.env.DB.prepare(
        "INSERT OR REPLACE INTO app_data (key, value, updated_at) VALUES (?, ?, ?)",
      ).bind(key, JSON.stringify(value), updatedAt),
    );

    if (stmts.length > 0) {
      await context.env.DB.batch(stmts);
    }

    return new Response(JSON.stringify({ success: true, count: stmts.length }), {
      headers: JSON_HEADERS,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "数据库写入失败",
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
};
