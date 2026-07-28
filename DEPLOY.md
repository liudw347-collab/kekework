# 部署到 Cloudflare Pages 指南

本网站已配置为静态导出，可零成本部署到 Cloudflare Pages。

## 一、项目信息

- **网站名称**：可可的工作台
- **技术栈**：Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **数据存储**：浏览器 localStorage（无需后端）
- **导出模式**：`output: "export"`（静态 HTML）

## 二、本地构建验证

```bash
# 安装依赖
npm install

# 构建静态文件（输出到 out/ 目录）
npx next build

# 本地预览（可选）
npx serve out
```

构建成功后会生成 `out/` 目录，包含所有静态 HTML/CSS/JS 文件。

## 三、Cloudflare Pages 部署步骤

### 方法 A：通过 Git 仓库自动部署（推荐）

1. **推送代码到 GitHub**

   ```bash
   git init
   git add .
   git commit -m "feat: 可可的工作台 v1"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/keke-workbench.git
   git push -u origin main
   ```

2. **在 Cloudflare 创建 Pages 项目**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
   - 选择刚推送的 GitHub 仓库

3. **配置构建设置**

   | 配置项 | 值 |
   |--------|-----|
   | Framework preset | Next.js (Static HTML Export) |
   | Build command | `npx next build` |
   | Build output directory | `out` |
   | Root directory | `/` |
   | Node version | 18 或更高 |

4. **点击 Save and Deploy**

   首次部署约 2-3 分钟，部署完成后会得到一个 `*.pages.dev` 域名。

### 方法 B：通过 Wrangler CLI 直接上传

```bash
# 安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 构建项目
npx next build

# 部署到 Pages
wrangler pages deploy out --project-name=keke-workbench
```

## 四、自定义域名（可选）

1. 在 Cloudflare Pages 项目设置中点击 **Custom domains**
2. 添加你的域名（如 `keke.example.com`）
3. 按提示配置 DNS 记录（CNAME 指向 `*.pages.dev`）

## 五、更新网站

每次推送到 main 分支，Cloudflare 会自动触发重新部署。
也可以在 Dashboard 手动点击 **Retry deployment**。

## 六、备份与迁移

- **导出数据**：网站内「我的」→「导出全部数据」会下载 JSON 文件
- **导入数据**：在新设备上「我的」→「导入数据」上传 JSON 即可恢复
- 注意：localStorage 数据绑定到具体浏览器，跨设备需要手动迁移

## 七、扩展新功能

代码结构清晰，方便后续添加模块：

```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主入口（视图路由）
│   └── globals.css         # 莫兰迪配色
├── components/
│   ├── layout/             # 顶部栏、底部导航、模块容器
│   └── modules/            # 9 个功能模块组件
│       ├── HomeDashboard.tsx
│       ├── ExamCountdownModule.tsx
│       ├── QuizModule.tsx
│       ├── PeriodTrackerModule.tsx
│       ├── ToolboxModule.tsx
│       ├── TodoListModule.tsx
│       ├── WaterReminderModule.tsx
│       ├── DailyQuoteModule.tsx
│       ├── QuickCalendarModule.tsx
│       ├── QuickNavModule.tsx
│       └── ProfileModule.tsx
└── lib/
    ├── storage.ts          # localStorage 封装
    ├── types.ts            # 类型定义
    └── utils.ts            # 工具函数
```

**添加新模块步骤：**
1. 在 `lib/types.ts` 添加数据类型
2. 在 `lib/storage.ts` 添加读写函数
3. 在 `components/modules/` 创建新模块组件
4. 在 `app/page.tsx` 的 `ModuleView` 类型中添加新视图
5. 在 `HomeDashboard.tsx` 的卡片数组中添加入口

## 八、免费额度

Cloudflare Pages 免费额度：
- **不限请求数**
- **500 次构建/月**
- **20 GB 流量/月**（个人使用足够）
- 全球 CDN 加速

完全足够个人工具网站使用。
