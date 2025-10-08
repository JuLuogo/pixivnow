// 手动实现 CORS 处理
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  }
}

function corsResponse(response: Response) {
  const headers = new Headers(response.headers)
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    headers.set(key, value)
  })
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    console.log('Worker fetch called:', request.method, request.url)
    
    const url = new URL(request.url)
    const path = url.pathname
    
    // 处理 OPTIONS 请求（CORS 预检）
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders(),
      })
    }
    
    try {
      // 随机图片 API
      if (path === '/api/illust/random') {
        return await handleRandomAPI(request, env, url)
      }
      
      // 通用代理 (ajax|rpc)
      if (path.match(/^\/(ajax|rpc)\//)) {
        return await handleGenericProxy(request, env)
      }
      
      // 图片代理 (~|-)
      if (path.match(/^\/[~-]\//)) {
        return await handleImageProxy(request, env)
      }
      
      // 用户 API
      if (path === '/api/user') {
        return await handleUserAPI(request, env, url)
      }

      // 静态资源和前端页面处理
      // 使用 getAssetFromKV (Workers Sites)
      try {
        return await getAssetFromKV(
          {
            request,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
          }
        )
      } catch (e) {
        // 如果静态资源不存在，返回 index.html（SPA 路由处理）
        try {
          const indexRequest = new Request(new URL('/index.html', request.url), request)
          return await getAssetFromKV(
            {
              request: indexRequest,
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
            }
          )
        } catch (indexError) {
          // 如果 index.html 也不存在，返回内置的前端页面
          return await handleFrontendPage(request, env)
        }
      }
      
    } catch (error) {
      console.error('Worker error:', error)
      return corsResponse(new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
  },
}

// 随机图片 API 处理器
async function handleRandomAPI(request: Request, env: any, url: URL) {
  try {
    // 简化版本：返回模拟数据而不是调用 Pixiv API
    const requestImage =
      (request.headers.get('accept')?.includes('image') || url.searchParams.get('format') === 'image') &&
      url.searchParams.get('format') !== 'json'

    // 模拟数据用于测试
    const mockIllusts = [
      {
        id: '123456789',
        title: 'Test Illustration',
        userId: '987654321',
        userName: 'Test Artist',
        tags: ['test', 'mock'],
        updateDate: '2024-01-01T12:00:00+00:00',
        urls: {
          mini: 'https://i.pximg.net/c/48x48/img-master/img/2024/01/01/12/00/00/123456789_p0_square1200.jpg',
          thumb: 'https://i.pximg.net/c/250x250_80_a2/img-master/img/2024/01/01/12/00/00/123456789_p0_square1200.jpg',
          small: 'https://i.pximg.net/c/540x540_70/img-master/img/2024/01/01/12/00/00/123456789_p0_master1200.jpg',
          regular: 'https://i.pximg.net/img-master/img/2024/01/01/12/00/00/123456789_p0_master1200.jpg',
          original: 'https://i.pximg.net/img-original/img/2024/01/01/12/00/00/123456789_p0.jpg',
        }
      }
    ]

    if (requestImage && mockIllusts[0]?.urls?.regular) {
      return corsResponse(new Response(null, { 
        status: 302, 
        headers: { Location: mockIllusts[0].urls.regular } 
      }))
    }

    return corsResponse(new Response(JSON.stringify(mockIllusts), {
      headers: { 'Content-Type': 'application/json' },
    }))

    /* 原始 Pixiv API 调用代码 - 暂时注释掉
    const pixivUrl = new URL('https://www.pixiv.net/ajax/illust/discovery')
    pixivUrl.searchParams.set('mode', url.searchParams.get('mode') ?? 'safe')
    pixivUrl.searchParams.set('max', requestImage ? '1' : url.searchParams.get('max') ?? '18')

    const headers = new Headers()
    headers.set('referer', 'https://www.pixiv.net/')
    // 使用默认的 User-Agent，或者环境变量中的自定义 User-Agent
  // 使用默认的 User-Agent，或者环境变量中的自定义 User-Agent
  headers.set('user-agent', env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0')

    console.log('Fetching from Pixiv API:', pixivUrl.toString())
    const response = await fetch(pixivUrl.toString(), { headers })
    
    if (!response.ok) {
      console.error('Pixiv API error:', response.status, response.statusText)
      return corsResponse(new Response(JSON.stringify({ error: `Pixiv API returned ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
    
    const data = await response.json()
    console.log('Pixiv API response:', data)

    // 检查 API 响应是否有错误
    if (data.error) {
      console.error('Pixiv API returned error:', data.error)
      return corsResponse(new Response(JSON.stringify({ error: data.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }))
    }

    const illusts = (data.illusts ?? []).filter((value: any) =>
      value && typeof value === 'object' && value.id
    )

    if (illusts.length === 0) {
      return corsResponse(new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      }))
    }

    // 使用默认的 Pixiv 图片 URL，或者环境变量中的自定义代理 URL
    const PXIMG_BASEURL_I = (env.VITE_PXIMG_BASEURL_I || 'https://i.pximg.net/').replace(/\/$/, '') + '/'

    // 处理图片 URL
    illusts.forEach((value: any) => {
      try {
        if (value.updateDate) {
          const date = new Date(value.updateDate)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hour = String(date.getHours()).padStart(2, '0')
          const minute = String(date.getMinutes()).padStart(2, '0')
          const second = String(date.getSeconds()).padStart(2, '0')
          
          const middle = `img/${year}/${month}/${day}/${hour}/${minute}/${second}/${value.id}`
          
          value.urls = {
            mini: `${PXIMG_BASEURL_I}c/48x48/img-master/${middle}_p0_square1200.jpg`,
            thumb: `${PXIMG_BASEURL_I}c/250x250_80_a2/img-master/${middle}_p0_square1200.jpg`,
            small: `${PXIMG_BASEURL_I}c/540x540_70/img-master/${middle}_p0_master1200.jpg`,
            regular: `${PXIMG_BASEURL_I}img-master/${middle}_p0_master1200.jpg`,
            original: `${PXIMG_BASEURL_I}img-original/${middle}_p0.jpg`,
          }
        } else {
          const middle = `img/2024/01/01/00/00/00/${value.id}`
          value.urls = {
            mini: `${PXIMG_BASEURL_I}c/48x48/img-master/${middle}_p0_square1200.jpg`,
            thumb: `${PXIMG_BASEURL_I}c/250x250_80_a2/img-master/${middle}_p0_square1200.jpg`,
            small: `${PXIMG_BASEURL_I}c/540x540_70/img-master/${middle}_p0_master1200.jpg`,
            regular: `${PXIMG_BASEURL_I}img-master/${middle}_p0_master1200.jpg`,
            original: `${PXIMG_BASEURL_I}img-original/${middle}_p0.jpg`,
          }
        }
      } catch (error) {
        console.error('Error processing illust:', value.id, error)
        const middle = `img/2024/01/01/00/00/00/${value.id}`
        value.urls = {
          mini: `${PXIMG_BASEURL_I}c/48x48/img-master/${middle}_p0_square1200.jpg`,
          thumb: `${PXIMG_BASEURL_I}c/250x250_80_a2/img-master/${middle}_p0_square1200.jpg`,
          small: `${PXIMG_BASEURL_I}c/540x540_70/img-master/${middle}_p0_master1200.jpg`,
          regular: `${PXIMG_BASEURL_I}img-master/${middle}_p0_master1200.jpg`,
          original: `${PXIMG_BASEURL_I}img-original/${middle}_p0.jpg`,
        }
      }
    })

    if (requestImage && illusts[0]?.urls?.regular) {
      return corsResponse(new Response(null, { 
        status: 302, 
        headers: { Location: illusts[0].urls.regular } 
      }))
    }

    return corsResponse(new Response(JSON.stringify(illusts), {
      headers: { 'Content-Type': 'application/json' },
    }))
    */
  } catch (error) {
    console.error('Error in random API:', error)
    return corsResponse(new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }))
  }
}

// 通用代理处理器
async function handleGenericProxy(request: Request, env: any) {
  const url = new URL(request.url)
  url.hostname = 'www.pixiv.net'

  const headers = new Headers(request.headers)
  headers.set('origin', 'https://www.pixiv.net')
  headers.set('referer', 'https://www.pixiv.net/')
  // 使用默认的 User-Agent，或者环境变量中的自定义 User-Agent
  headers.set('user-agent', env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0')

  const newReq = new Request(url.toString(), {
    method: request.method,
    headers,
    body: request.body,
  })

  const response = await fetch(newReq)
  return corsResponse(response)
}

// 图片代理处理器
async function handleImageProxy(request: Request, env: any) {
  const url = new URL(request.url)
  const path = url.pathname.slice(2)

  // 使用环境变量配置的反代 URL，或者默认的 Pixiv 原始 URL
  if (url.pathname.startsWith('/~')) {
    // 处理 s.pximg.net 的图片
    if (env.VITE_PXIMG_BASEURL_S) {
      url.href = env.VITE_PXIMG_BASEURL_S + path
    } else {
      url.hostname = 's.pximg.net'
      url.pathname = '/' + path
    }
  } else {
    // 处理 i.pximg.net 的图片
    if (env.VITE_PXIMG_BASEURL_I) {
      url.href = env.VITE_PXIMG_BASEURL_I + path
    } else {
      url.hostname = 'i.pximg.net'
      url.pathname = '/' + path
    }
  }

  const headers = new Headers()
  for (const h of ['accept', 'accept-encoding', 'accept-language', 'cache-control', 'user-agent']) {
    if (request.headers.get(h)) {
      headers.set(h, request.headers.get(h)!)
    }
  }

  headers.set('referer', 'https://www.pixiv.net/')
  // 使用默认的 User-Agent，或者环境变量中的自定义 User-Agent
  headers.set('user-agent', env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0')

  const newReq = new Request(url.toString(), {
    headers,
  })

  const response = await fetch(newReq)
  return corsResponse(response)
}

// 用户 API 处理器
async function handleUserAPI(request: Request, env: any, url: URL) {
  try {
    const userId = url.searchParams.get('id')
    
    if (!userId) {
      return corsResponse(new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }))
    }

    const pixivUrl = new URL(`https://www.pixiv.net/ajax/user/${userId}`)

    const headers = new Headers()
    headers.set('referer', 'https://www.pixiv.net/')
    // 使用默认的 User-Agent，或者环境变量中的自定义 User-Agent
    headers.set('user-agent', env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0')

    const response = await fetch(pixivUrl.toString(), { headers })
    
    if (!response.ok) {
      return corsResponse(new Response(JSON.stringify({ error: `Pixiv API returned ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
    
    const data = await response.json()
    
    return corsResponse(new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    }))
  } catch (error) {
    console.error('Error in user API:', error)
    return corsResponse(new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }))
  }
}

// 静态资源处理器（已废弃，现在使用 getAssetFromKV）
// async function handleStaticAssets(request: Request, env: any, path: string) {
//   // 这个函数已经被 getAssetFromKV 替代
//   return new Response('Static asset not found', { 
//     status: 404,
//     headers: { 'Content-Type': 'text/plain' }
//   })
// }

// 前端页面处理器
async function handleFrontendPage(request: Request, env: any) {
  // 返回前端 HTML 页面
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PixivNow</title>

    <!-- Umami Analytics -->
    <script defer src="https://cloud.umami.is/script.js" data-website-id="842d980c-5e11-4834-a2a8-5daaa285ce66"></script>
    
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
          sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .container {
        text-align: center;
        color: white;
        max-width: 600px;
        padding: 2rem;
      }
      
      .logo {
        font-size: 3rem;
        font-weight: bold;
        margin-bottom: 1rem;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      }
      
      .subtitle {
        font-size: 1.2rem;
        margin-bottom: 2rem;
        opacity: 0.9;
      }
      
      .search-box {
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50px;
        padding: 1rem 2rem;
        font-size: 1rem;
        color: white;
        width: 100%;
        max-width: 400px;
        margin: 0 auto 2rem;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      }
      
      .search-box::placeholder {
        color: rgba(255, 255, 255, 0.7);
      }
      
      .search-box:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.6);
        background: rgba(255, 255, 255, 0.2);
      }
      
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 2rem;
      }
      
      .feature {
        background: rgba(255, 255, 255, 0.1);
        padding: 1.5rem;
        border-radius: 15px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .feature h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
      }
      
      .feature p {
        margin: 0;
        opacity: 0.8;
        font-size: 0.9rem;
      }
      
      .status {
        margin-top: 2rem;
        padding: 1rem;
        background: rgba(0, 255, 0, 0.1);
        border: 1px solid rgba(0, 255, 0, 0.3);
        border-radius: 10px;
        color: #90EE90;
      }
      
      .api-info {
        margin-top: 2rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        font-size: 0.9rem;
        opacity: 0.8;
      }
      
      .api-info a {
        color: #FFD700;
        text-decoration: none;
      }
      
      .api-info a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">PixivNow</div>
      <div class="subtitle">探索精彩的 Pixiv 作品世界</div>
      
      <input type="text" class="search-box" placeholder="输入关键词或画师名称搜索作品..." />
      
      <div class="features">
        <div class="feature">
          <h3>🎨 随机作品</h3>
          <p>发现意想不到的精彩作品</p>
        </div>
        <div class="feature">
          <h3>🔍 智能搜索</h3>
          <p>快速找到你喜欢的内容</p>
        </div>
        <div class="feature">
          <h3>📱 响应式设计</h3>
          <p>完美适配各种设备</p>
        </div>
        <div class="feature">
          <h3>⚡ 高速访问</h3>
          <p>基于 Cloudflare 全球加速</p>
        </div>
      </div>
      
      <div class="status">
        ✅ 服务正常运行中
      </div>
      
      <div class="api-info">
        <p>API 接口可用：</p>
        <p><a href="/api/illust/random">/api/illust/random</a> - 随机作品</p>
        <p><a href="/api/user">/api/user</a> - 用户信息</p>
        <p>图片代理：<code>/i/</code> 和 <code>/s/</code></p>
      </div>
    </div>
    
    <script>
      // 简单的搜索功能演示
      document.querySelector('.search-box').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          const query = this.value.trim();
          if (query) {
            alert('搜索功能正在开发中，敬请期待！\\n搜索关键词：' + query);
          }
        }
      });
      
      // 添加一些交互效果
      document.querySelectorAll('.feature').forEach(feature => {
        feature.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-5px)';
          this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
        });
        
        feature.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0)';
          this.style.boxShadow = 'none';
        });
      });
    </script>
  </body>
</html>`

  return corsResponse(new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  }))
}