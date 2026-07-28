# 部署到 Cloudflare Pages 完整指南

> 本指南面向**完全没有用过 Cloudflare 的新手**，按顺序操作即可完成部署。
>
> 部署完成后，你会得到一个 `https://xxx.pages.dev` 网址，用任何手机/电脑访问，输入相同的访问令牌，就能看到同样的数据。

---

## 📋 部署前准备

- ✅ 一个 GitHub 账号（代码已推送到 https://github.com/liudw347-collab/kekework）
- ✅ 一个 Cloudflare 账号（免费注册：https://dash.cloudflare.com/sign-up）
- ✅ 准备一个**访问令牌**（自己想一串密码，比如 `keke-secret-2024`，记住它，后面要用 2 次）

> 💡 访问令牌的作用：保护你的私人数据，只有知道令牌的人才能读写。建议用字母+数字组合，至少 12 位。

---

## 🚀 部署步骤（共 6 步，约 15 分钟）

### 第 1 步：登录 Cloudflare

1. 打开 https://dash.cloudflare.com/
2. 用邮箱注册或登录
3. 登录后会看到仪表盘首页

### 第 2 步：创建 D1 数据库（存数据用）

**D1 就是 Cloudflare 提供的免费 SQLite 数据库，用来存你的所有数据。**

1. 在左侧菜单找到 **Storage & Databases** → 点击 **D1 SQL Database**
   > 找不到？在左侧菜单最上方的搜索框输入 `D1` 直接定位
2. 点击 **Create database** 按钮
3. **Database name** 填：`keke-workbench-db`
4. 点击 **Create** 创建

创建完成后，你会进入数据库详情页。**先不要关这个页面**，继续下一步。

### 第 3 步：在数据库里建表（复制粘贴 SQL）

**就像新建 Excel 表格要建表头一样，数据库也要先建表。**

1. 在刚才的数据库详情页，点击顶部的 **Console** 标签
2. 把下面这段 SQL **完整复制**粘贴到输入框里：

```sql
CREATE TABLE IF NOT EXISTS app_data (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_data_updated_at ON app_data(updated_at);
```

3. 点击 **Execute** 按钮执行
4. 看到 `Success` 提示就成功了 ✅

### 第 4 步：创建 Pages 项目（部署网站）

**这一步把 GitHub 代码部署成可访问的网站。**

1. 回到 Cloudflare 主菜单，点击 **Workers & Pages**
2. 点击 **Create** 按钮（或 **Create application**）
3. 选择 **Pages** 标签 → 点击 **Connect to Git**
4. 第一次会让你授权 GitHub：
   - 点击 **Connect to Git**
   - 选择你的 GitHub 账号
   - 找到 `kekework` 仓库，点击它
5. 配置构建参数：

   | 配置项 | 填什么 |
   |--------|--------|
   | Project name | `keke-workbench`（自动生成网址前缀） |
   | Production branch | `main` |
   | Framework preset | **Next.js** |
   | Build command | `npx next build` |
   | Build output directory | `out` |

6. **先不要点 Save and Deploy！** 展开下方的 **Environment variables (advanced)**，先配置环境变量（见第 5 步）

> ⚠️ 如果不小心点了部署也没关系，部署会成功但功能不全，按第 5、6 步配置后重新部署即可。

### 第 5 步：配置访问令牌（在同一页面继续）

**还在第 4 步的配置页面，往下滚动找到 Environment variables：**

1. 在 **Variable name** 填：`ACCESS_TOKEN`
2. 在 **Value** 填：你之前想好的访问令牌（比如 `keke-secret-2024`）
3. 点击 **Add** 添加这一行
4. 确保 Type 选的是 **Plaintext**

> 💡 这个令牌就是网站登录时要输入的密码，必须和这里填的**完全一致**。

### 第 6 步：点 Deploy 开始部署

1. 点击页面底部的 **Save and Deploy** 按钮
2. 等待 2-3 分钟，看到 **Success** 和绿色 ✅ 就部署成功了
3. 页面顶部会显示你的网址：`https://keke-workbench.pages.dev`（或类似）

**但是先别急！** 现在还差最后一步——绑定数据库，否则数据没地方存。

---

## 🔧 第 7 步：绑定 D1 数据库（关键！漏了这步数据不工作）

**好消息：本项目的 `wrangler.toml` 已经预配置好 D1 绑定，重新部署即可自动生效，无需在 Dashboard 手动操作！**

### 方式 A：自动绑定（推荐，已配置好）

项目的 `wrangler.toml` 中已经写了 D1 绑定配置：

```toml
[[d1_databases]]
binding = "DB"
database_name = "keke-workbench-db"
database_id = "ee03190b-6d83-4f3c-aa99-131be34e96c3"  # 你的数据库 ID
```

**你只需要做一件事：重新部署**

1. 进入 Pages 项目 → **Deployments** 标签
2. 找到最新的部署记录 → 点击右侧 **...** 菜单
3. 选择 **Retry deployment**
4. 等 2-3 分钟，看到绿色 ✅

### 方式 B：手动绑定（如果方式 A 不行）

如果重新部署后 D1 仍未绑定，可以在 Dashboard 手动绑定：

1. 进入 Pages 项目 → **Settings** → **Bindings**
2. 点击 **Add binding** → **D1 database**
3. **Variable name** 填 `DB`（**大写**，必须叫这个名字）
4. **D1 database** 选择 `keke-workbench-db`
5. 点击 **Save**
6. **再次重新部署**（Deployments → Retry deployment）

> 💡 如果 Settings → Bindings 里的 **Add 按钮点不动**（灰色），这是 Cloudflare 已知界面问题。直接用方式 A 的 `wrangler.toml` 配置即可，不依赖界面。

### 第 8 步：验证部署是否成功

部署完成后，**用浏览器打开下面这个网址**（把 `keke-workbench` 换成你的项目名）：

```
https://keke-workbench.pages.dev/api/health
```

应该看到类似这样的 JSON：

```json
{
  "status": "ok",
  "timestamp": "2026-07-28T...",
  "checks": {
    "dbBound": true,        ← 必须是 true
    "tokenConfigured": true, ← 必须是 true
    "dbConnected": true,    ← 必须是 true
    "recordCount": 0        ← 数据库记录数（首次为 0）
  }
}
```

**如果三个 true 都有，说明部署完全成功！** 可以进入下一步首次登录。

**如果有 false**，对照下表排查：

| 字段 | 是 false 怎么办 |
|------|----------------|
| `dbBound` | D1 没绑定。检查 `wrangler.toml` 里 `database_id` 是否正确，重新部署 |
| `tokenConfigured` | 环境变量没设。Settings → Environment variables 添加 `ACCESS_TOKEN` 后重新部署 |
| `dbConnected` | 数据库表没建。回到 D1 数据库 Console 执行 `schema.sql` |
| `dbError` 字段有内容 | 看错误信息，常见是表不存在（执行 schema.sql 即可） |

---

## ✅ 部署完成！首次使用

1. 用手机或电脑浏览器打开 `https://keke-workbench.pages.dev`
2. 页面顶部会有一条黄色提示：**"未设置访问令牌或令牌无效"**
3. 点击 **"设置令牌"** 按钮
4. 输入你之前设置的访问令牌（如 `keke-secret-2024`）
5. 点击 **"保存并验证"**
6. 看到 🌸 加载动画后正常显示首页，就成功了 🎉

### 跨设备使用

在另一台手机/电脑打开同一个网址，输入相同的访问令牌，所有数据自动同步过来。

---

## 🆘 常见问题排查

### Q1：访问网站显示空白或 404

**原因**：构建可能失败了。

**解决**：
1. 进入 Pages 项目 → **Deployments** 标签
2. 点击最新部署记录查看 **Build logs**
3. 检查是否有红色错误，常见原因：
   - Node 版本太低：在 Settings → Environment variables 添加 `NODE_VERSION = 20`
   - 构建命令错误：确认是 `npx next build`，输出目录是 `out`

### Q2：登录后还是显示"未设置访问令牌或令牌无效"

**原因**：访问令牌不匹配，或者环境变量没设置。

**解决**：
1. 进入 Pages 项目 → **Settings** → **Environment variables**
2. 确认有 `ACCESS_TOKEN` 变量，值就是你输入的令牌
3. 如果没有，添加后**必须重新部署**（Deployments → Retry deployment）
4. 网站上重新点击"设置令牌"输入一遍

### Q3：数据保存后刷新就没了

**原因**：D1 数据库没绑定，或绑定后没重新部署。

**解决**：
1. 进入 Pages 项目 → **Settings** → **Bindings**
2. 确认有 `DB` 绑定（变量名必须是大写 `DB`），指向 `keke-workbench-db`
3. 如果没有或名字不对，修改后**必须重新部署**
4. 还不行？检查 D1 数据库的 Console，执行 `SELECT * FROM app_data;` 看是否有数据

### Q4：每次刷新都显示加载中

**原因**：可能是 Cloudflare Functions 没正常部署。

**解决**：
1. 进入 Pages 项目 → **Functions** 标签
2. 应该能看到 `/api/data` 路由
3. 如果看不到，检查 `functions/api/data/index.ts` 文件是否在 GitHub 仓库里
4. 重新触发部署

### Q5：手机访问时布局错乱

**原因**：浏览器缓存了旧版本。

**解决**：
- 手机 Safari/Chrome 清除缓存后重新访问
- 或在网址后加参数强制刷新：`https://xxx.pages.dev/?v=2`

### Q6：想换访问令牌怎么办？

1. Cloudflare Pages → Settings → Environment variables
2. 编辑 `ACCESS_TOKEN`，改成新值
3. **重新部署**（Deployments → Retry）
4. 网站上重新点击"设置令牌"输入新值

---

## 📁 数据备份与迁移

### 导出数据（建议每周备份一次）

1. 网站内点击底部 **"我的"** 标签
2. 点击 **"导出全部数据（JSON）"**
3. 文件会下载到本地，妥善保存

### 导入数据（换设备或恢复时）

1. 在新设备打开网站并登录
2. 进入 **"我的"** → **"导入数据"**
3. 粘贴之前导出的 JSON 内容
4. 点击导入，数据会同步到云端

### 完全清空数据

1. 进入 **"我的"** → **"清空所有数据"**
2. 会清空云端和当前浏览器的所有数据
3. ⚠️ 此操作不可恢复，建议先导出备份

---

## 🌐 自定义域名（可选）

如果不想用 `*.pages.dev` 网址，可以绑定自己的域名：

1. Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 输入你的域名（如 `keke.example.com`）
3. 按提示在你的域名 DNS 添加 CNAME 记录，指向 `keke-workbench.pages.dev`
4. 等待 DNS 生效（几分钟到几小时）

---

## 💰 免费额度（够用）

| 资源 | 免费额度 | 说明 |
|------|---------|------|
| Pages 流量 | 不限 | 网站访问不收费 |
| Pages 构建次数 | 500 次/月 | 每次改代码重新部署算 1 次 |
| Pages Functions | 10 万次/天 | 数据同步请求 |
| D1 存储 | 5 GB | 个人数据远用不完 |
| D1 读取 | 500 万次/天 | 远超个人使用 |
| D1 写入 | 10 万次/天 | 远超个人使用 |

**结论**：个人使用完全免费，不会产生任何费用。

---

## 📞 还是不行？

如果按以上步骤操作后仍有问题，请把以下信息收集起来寻求帮助：

1. Pages 项目的 **Build logs** 截图（Deployments → 点击最新部署 → Build logs）
2. 浏览器控制台错误信息（F12 → Console 标签）
3. 网站访问地址
4. 具体哪一步出问题、报什么错

---

## 📝 项目技术信息（开发者参考）

<details>
<summary>点击展开技术细节</summary>

### 技术栈
- Next.js 16 (静态导出) + TypeScript + Tailwind CSS 4 + shadcn/ui
- Cloudflare Pages Functions 提供后端 API
- Cloudflare D1 (SQLite) 存储数据
- 通过 X-Access-Token 头鉴权

### 文件结构
```
functions/api/data/
├── index.ts              # GET/POST/DELETE 全部数据
└── [key]/index.ts        # GET/PUT/DELETE 单项数据
src/
├── context/AppDataContext.tsx     # 全局数据 Provider
├── lib/cloud-api.ts               # 云端 API 封装
├── lib/storage.ts                 # 默认值 + 类型常量
├── lib/types.ts                   # 类型定义
├── components/
│   ├── AppLoadingGate.tsx         # 加载状态门控
│   ├── TokenDialog.tsx            # 令牌设置对话框
│   ├── layout/                    # 顶部栏、底部导航
│   └── modules/                   # 9 个功能模块
schema.sql                          # D1 数据库 Schema
wrangler.toml                       # Cloudflare 配置
```

### API 端点
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/data` | 获取所有数据 |
| POST | `/api/data` | 批量保存（upsert） |
| DELETE | `/api/data` | 清空所有数据 |
| GET | `/api/data/{key}` | 获取某项数据 |
| PUT | `/api/data/{key}` | 保存某项数据 |
| DELETE | `/api/data/{key}` | 删除某项数据 |

所有请求需带 `X-Access-Token` 头，10 秒超时。

### 本地开发
```bash
npm install
npm run dev    # 开发模式（注意：本地不支持 functions，API 会 404）
npx next build # 构建静态文件到 out/
```

### 添加新功能模块
1. `lib/types.ts` 的 `AppAllData` 添加字段
2. `lib/storage.ts` 的 `getDefaultData()` 添加默认值
3. `components/modules/` 创建新组件，用 `useAppData()` hook
4. `app/page.tsx` 注册新视图
5. `HomeDashboard.tsx` 添加首页卡片入口

</details>
