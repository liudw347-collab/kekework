/**
 * Cloudflare Pages Function - 单个数据项接口
 *
 * GET    /api/data/{key}  - 获取某项数据
 * PUT    /api/data/{key}  - 保存某项数据（增量更新）
 * DELETE /api/data/{key}  - 删除某项数据
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
  return new Response(JSON.stringify({ error: "未授权" }), {
    status: 401,
    headers: JSON_HEADERS,
  });
}

function checkAuth(request: Request, env: Env): boolean {
  if (!env.ACCESS_TOKEN) return true;
  return request.headers.get("X-Access-Token") === env.ACCESS_TOKEN;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
};

/** GET /api/data/{key} */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return unauthorized();
  }

  const key = context.params.key as string;
  try {
    const result = await context.env.DB.prepare(
      "SELECT value FROM app_data WHERE key = ?",
    )
      .bind(key)
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: "未找到" }), {
        status: 404,
        headers: JSON_HEADERS,
      });
    }

    // 直接返回原始值（保持 JSON 格式）
    return new Response(result.value as string, {
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

/** PUT /api/data/{key} - 保存（插入或替换） */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return unauthorized();
  }

  const key = context.params.key as string;
  try {
    const value = await context.request.text();
    const updatedAt = new Date().toISOString();

    await context.env.DB.prepare(
      "INSERT OR REPLACE INTO app_data (key, value, updated_at) VALUES (?, ?, ?)",
    )
      .bind(key, value, updatedAt)
      .run();

    return new Response(JSON.stringify({ success: true, key, updatedAt }), {
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

/** DELETE /api/data/{key} */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return unauthorized();
  }

  const key = context.params.key as string;
  try {
    await context.env.DB.prepare("DELETE FROM app_data WHERE key = ?")
      .bind(key)
      .run();

    return new Response(JSON.stringify({ success: true, key }), {
      headers: JSON_HEADERS,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "数据库删除失败",
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
};
