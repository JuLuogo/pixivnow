# PixivNow Worker 部署指南

## 快速部署（零配置）

PixivNow Worker 支持零配置部署，无需设置任何环境变量即可正常运行：

```bash
# 1. 安装依赖
pnpm install

# 2. 登录 Cloudflare
pnpm wrangler login

# 3. 部署到 Cloudflare Workers
pnpm deploy
```

## 本地开发

```bash
# 启动本地开发服务器
pnpm serve

# 服务器将在 http://127.0.0.1:8787 启动
```

## API 端点

- `GET /` - 健康检查
- `GET /api/illust/random` - 随机插画 API
- `GET /api/user?id={user_id}` - 用户信息 API
- `GET /-/{image_path}` - i.pximg.net 图片代理
- `GET /~/{image_path}` - s.pximg.net 图片代理
- `GET /{pixiv_path}` - 通用 Pixiv 代理

## 反代配置

### 通过 wrangler.toml 配置

编辑 `wrangler.toml` 文件中的 `[vars]` 部分：

```toml
[vars]
# 图片反代配置
VITE_PXIMG_BASEURL_I = "https://i.pixiv.re/"  # i.pximg.net 反代
VITE_PXIMG_BASEURL_S = "https://s.pixiv.re/"  # s.pximg.net 反代

# 其他可选配置
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
UA_BLACKLIST = "[]"
```

### 通过 Cloudflare Dashboard 配置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages
3. 选择你的 Worker
4. 进入 Settings > Variables
5. 添加环境变量：
   - `VITE_PXIMG_BASEURL_I`: i.pximg.net 的反代 URL
   - `VITE_PXIMG_BASEURL_S`: s.pximg.net 的反代 URL
   - `USER_AGENT`: 自定义 User-Agent（可选）

### 常用反代服务

```toml
# pixiv.re (推荐)
VITE_PXIMG_BASEURL_I = "https://i.pixiv.re/"
VITE_PXIMG_BASEURL_S = "https://s.pixiv.re/"

# pixiv.cat
VITE_PXIMG_BASEURL_I = "https://i.pixiv.cat/"
VITE_PXIMG_BASEURL_S = "https://s.pixiv.cat/"

# 自定义反代
VITE_PXIMG_BASEURL_I = "https://your-proxy-domain.com/"
VITE_PXIMG_BASEURL_S = "https://your-s-proxy-domain.com/"
```

## 默认配置

如果不设置环境变量，Worker 将使用以下默认值：

- **图片代理**: 直接访问 Pixiv 原始 URL (`i.pximg.net`, `s.pximg.net`)
- **User-Agent**: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0`
- **UA 黑名单**: 空数组 `[]`
- **CORS**: 完全开放，支持所有域名

## 测试反代配置

部署后，可以通过以下方式测试反代是否生效：

```bash
# 测试 i.pximg.net 反代
curl -I "https://your-worker.your-subdomain.workers.dev/-/img-master/img/2024/01/01/00/00/00/123456_p0_master1200.jpg"

# 测试 s.pximg.net 反代  
curl -I "https://your-worker.your-subdomain.workers.dev/~/c/250x250_80_a2_g5/img-master/img/2024/01/01/00/00/00/123456_p0_square1200.jpg"
```

如果配置了反代，响应头中应该包含反代服务的标识（如 `x-proxied-by`）。

## 故障排除

### 1. 图片无法加载
- 检查反代 URL 是否正确
- 确认反代服务是否可用
- 验证环境变量是否正确设置

### 2. CORS 错误
- Worker 默认启用 CORS，支持所有域名
- 如果仍有问题，检查请求头是否正确

### 3. 部署失败
- 确认已登录 Cloudflare: `pnpm wrangler login`
- 检查 `wrangler.toml` 配置是否正确
- 验证 Worker 名称是否唯一

## 许可证

MIT License