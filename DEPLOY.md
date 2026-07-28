# 部署到 Cloudflare Pages 指南（含 D1 数据库）

本网站使用 **Cloudflare Pages + D1 数据库**，实现跨设备数据同步。

## 一、项目信息

- **网站名称**：可可的工作台
- **技术栈**：Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **后端**：Cloudflare Pages Functions（`functions/api/`）
- **数据库**：Cloudflare D1（SQLite，免费 5GB）
- **数据同步**：跨设备实时同步（通过访问令牌鉴权）

## 二、架构说明

```
┌─────────────────────────────────────┐
│         用户浏览器（手机/电脑）         │
│   Next.js 静态页面 + 访问令牌         │
└──────────────┬──────────────────────┘
               │ fetch /api/data/{key}
               │ Header: X-Access-Token
               ▼
┌─────────────────────────────────────┐
│    Cloudflare Pages Functions       │
│    functions/api/data/index.ts      │
│    functions/api/data/[key]/...     │
│    - 鉴权（比对 ACCESS_TOKEN）        │
│    - CRUD 操作 D1 数据库              │
└──────────────┬──────────────────────┘
               │ D1 绑定 (DB)
               ▼
┌─────────────────────────────────────┐
│       Cloudflare D1 数据库           │
│    表 app_data (key, value, updated_at) │
└─────────────────────────────────────┘
```

## 三、本地构建验证

```bash
# 安装依赖
npm install

# 构建静态文件（输出到 out/ 目录）
npx next build
```

## 四、部署步骤（关键！）

### 步骤 1：推送代码到 GitHub

代码已推送到：https://github.com/liudw347-collab/kekework.git

### 步骤 2：在 Cloudflare 创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单 → **Workers & Pages** → **D1**
3. 点击 **Create database**
4. 数据库名称：`keke-workbench-db`
5. 点击创建，记下 **Database ID**（后面要用）

### 步骤 3：执行数据库 Schema

1. 在刚创建的 D1 数据库页面，点击 **Console** 标签
2. 粘贴 `schema.sql` 的内容并执行：

```sql
CREATE TABLE IF NOT EXISTS app_data (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_data_updated_at ON app_data(updated_at);
```

或者用命令行：
```bash
npx wrangler d1 execute keke-workbench-db --file=./schema.sql
```

### 步骤 4：创建 Cloudflare Pages 项目

1. 进入 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. 选择 `liudw347-collab/kekework` 仓库
3. 配置构建设置：

   | 配置项 | 值 |
   |--------|-----|
   | Framework preset | Next.js (Static HTML Export) |
   | Build command | `npx next build` |
   | Build output directory | `out` |
   | Root directory | `/` |
   | Node version | 18 或更高 |

### 步骤 5：绑定 D1 数据库（关键！）

1. 在 Pages 项目设置中 → **Functions** → **D1 database bindings**
2. 添加绑定：
   - **Variable name**: `DB`（必须叫这个名）
   - **D1 database**: 选择 `keke-workbench-db`
3. 保存

### 步骤 6：设置环境变量

在 Pages 项目设置中 → **Environment variables** 添加：

| 变量名 | 示例值 | 说明 |
|--------|--------|-----|
| `ACCESS_TOKEN` | `keke-secret-2024` | 自定义访问令牌（建议用强密码） |

⚠️ **重要**：这个令牌就是后续登录网站时要输入的"访问令牌"。请记住它！

### 步骤 7：部署

点击 **Save and Deploy**，等待 2-3 分钟。

### 步骤 8：首次登录

1. 访问 `https://<project-name>.pages.dev`
2. 页面会显示"未设置访问令牌"提示条
3. 点击"设置令牌"按钮
4. 输入步骤 6 设置的 `ACCESS_TOKEN`
5. 点击"保存并验证"
6. 验证成功后，所有数据将自动同步到云端

## 五、跨设备使用

在新手机/电脑上访问同一个网址，输入相同的访问令牌，即可看到所有数据。

## 六、自定义域名（可选）

1. Pages 项目设置 → **Custom domains**
2. 添加你的域名（如 `keke.example.com`）
3. 配置 DNS CNAME 指向 `*.pages.dev`

## 七、数据安全

- 所有数据存储在 Cloudflare D1，全球 CDN 加速
- 通过 `ACCESS_TOKEN` 鉴权，未授权请求会被拒绝（401）
- 数据传输全程 HTTPS 加密
- 建议定期使用「导出数据」功能做本地备份

## 八、API 端点说明

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/data` | 获取所有数据 |
| POST | `/api/data` | 批量保存（body: {key: value, ...}） |
| GET | `/api/data/{key}` | 获取某项数据 |
| PUT | `/api/data/{key}` | 保存某项数据 |
| DELETE | `/api/data/{key}` | 删除某项数据 |

所有请求需要 `X-Access-Token` 头（值等于环境变量 `ACCESS_TOKEN`）。

## 九、扩展新功能

代码结构清晰，方便后续添加模块：

```
src/
├── app/
│   ├── layout.tsx          # 根布局（注入 AppDataProvider）
│   ├── page.tsx            # 主入口
│   └── globals.css         # 莫兰迪配色
├── components/
│   ├── layout/             # 顶部栏、底部导航
│   ├── modules/            # 9 个功能模块组件
│   ├── AppLoadingGate.tsx  # 加载/错误状态
│   └── TokenDialog.tsx     # 访问令牌设置
├── context/
│   └── AppDataContext.tsx  # 全局数据 Context
├── lib/
│   ├── cloud-api.ts        # 云端 API 封装
│   ├── storage.ts          # 默认值 + 类型常量
│   ├── types.ts            # 类型定义
│   └── utils.ts            # 工具函数
functions/
└── api/
    └── data/
        ├── index.ts        # GET/POST 全部数据
        └── [key]/
            └── index.ts    # GET/PUT/DELETE 单个 key
public/
├── manifest.webmanifest    # PWA 清单
└── icon.svg                # 应用图标
schema.sql                   # D1 数据库 Schema
wrangler.toml                # Cloudflare 配置
```

**添加新模块步骤：**
1. 在 `lib/types.ts` 的 `AppAllData` 中添加新字段
2. 在 `lib/storage.ts` 的 `getDefaultData()` 中添加默认值
3. 在 `components/modules/` 创建新模块组件，使用 `useAppData()` hook
4. 在 `app/page.tsx` 的 `ModuleView` 类型中添加新视图
5. 在 `HomeDashboard.tsx` 的卡片数组中添加入口

## 十、免费额度

Cloudflare Pages + D1 免费额度：
- **Pages**：不限请求数，500 次构建/月，20 GB 流量/月
- **D1**：5 GB 存储，500 万次读/天，10 万次写/天
- **Pages Functions**：10 万次请求/天

完全足够个人工具网站使用。
