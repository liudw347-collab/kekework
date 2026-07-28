/**
 * Cloudflare Pages Function - 健康检查接口
 *
 * GET /api/health - 返回服务状态，用于验证部署是否正常
 * 不需要鉴权，方便排查问题
 */

interface Env {
  DB?: D1Database;
  ACCESS_TOKEN?: string;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const result = {
    status: "ok",
    timestamp: new Date().toISOString(),
    checks: {
      dbBound: !!context.env.DB,
      tokenConfigured: !!context.env.ACCESS_TOKEN,
    },
  };

  // 如果数据库已绑定，测试连通性
  if (context.env.DB) {
    try {
      const count = await context.env.DB.prepare(
        "SELECT COUNT(*) as cnt FROM app_data",
      ).first<{ cnt: number }>();
      result.checks.dbConnected = true;
      result.checks.recordCount = count?.cnt ?? 0;
    } catch (err) {
      result.checks.dbConnected = false;
      result.checks.dbError = err instanceof Error ? err.message : String(err);
    }
  }

  return new Response(JSON.stringify(result, null, 2), {
    headers: JSON_HEADERS,
  });
};
