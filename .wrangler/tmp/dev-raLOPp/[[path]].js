var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-xddOtL/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// functions/[[path]].ts
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
function corsResponse(response) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(corsResponse, "corsResponse");
var path_default = {
  fetch: /* @__PURE__ */ __name(async (request, env, ctx) => {
    console.log("Worker fetch called:", request.method, request.url);
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders()
      });
    }
    try {
      if (path === "/api/illust/random") {
        return await handleRandomAPI(request, env, url);
      }
      if (path.match(/^\/(ajax|rpc)\//)) {
        return await handleGenericProxy(request, env);
      }
      if (path.match(/^\/[~-]\//)) {
        return await handleImageProxy(request, env);
      }
      if (path === "/api/user") {
        return await handleUserAPI(request, env, url);
      }
      if (path.startsWith("/assets/") || path === "/favicon.ico" || path === "/robots.txt" || path.startsWith("/images/")) {
        return await handleStaticAssets(request, env, path);
      }
      return await handleFrontendPage(request, env);
    } catch (error) {
      console.error("Worker error:", error);
      return corsResponse(new Response(JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }));
    }
  }, "fetch")
};
async function handleRandomAPI(request, env, url) {
  try {
    const requestImage = (request.headers.get("accept")?.includes("image") || url.searchParams.get("format") === "image") && url.searchParams.get("format") !== "json";
    const mockIllusts = [
      {
        id: "123456789",
        title: "Test Illustration",
        userId: "987654321",
        userName: "Test Artist",
        tags: ["test", "mock"],
        updateDate: "2024-01-01T12:00:00+00:00",
        urls: {
          mini: "https://i.pximg.net/c/48x48/img-master/img/2024/01/01/12/00/00/123456789_p0_square1200.jpg",
          thumb: "https://i.pximg.net/c/250x250_80_a2/img-master/img/2024/01/01/12/00/00/123456789_p0_square1200.jpg",
          small: "https://i.pximg.net/c/540x540_70/img-master/img/2024/01/01/12/00/00/123456789_p0_master1200.jpg",
          regular: "https://i.pximg.net/img-master/img/2024/01/01/12/00/00/123456789_p0_master1200.jpg",
          original: "https://i.pximg.net/img-original/img/2024/01/01/12/00/00/123456789_p0.jpg"
        }
      }
    ];
    if (requestImage && mockIllusts[0]?.urls?.regular) {
      return corsResponse(new Response(null, {
        status: 302,
        headers: { Location: mockIllusts[0].urls.regular }
      }));
    }
    return corsResponse(new Response(JSON.stringify(mockIllusts), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    console.error("Error in random API:", error);
    return corsResponse(new Response(JSON.stringify({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
}
__name(handleRandomAPI, "handleRandomAPI");
async function handleGenericProxy(request, env) {
  const url = new URL(request.url);
  url.hostname = "www.pixiv.net";
  const headers = new Headers(request.headers);
  headers.set("origin", "https://www.pixiv.net");
  headers.set("referer", "https://www.pixiv.net/");
  headers.set("user-agent", env.USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0");
  const newReq = new Request(url.toString(), {
    method: request.method,
    headers,
    body: request.body
  });
  const response = await fetch(newReq);
  return corsResponse(response);
}
__name(handleGenericProxy, "handleGenericProxy");
async function handleImageProxy(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.slice(2);
  if (url.pathname.startsWith("/~")) {
    if (env.VITE_PXIMG_BASEURL_S) {
      url.href = env.VITE_PXIMG_BASEURL_S + path;
    } else {
      url.hostname = "s.pximg.net";
      url.pathname = "/" + path;
    }
  } else {
    if (env.VITE_PXIMG_BASEURL_I) {
      url.href = env.VITE_PXIMG_BASEURL_I + path;
    } else {
      url.hostname = "i.pximg.net";
      url.pathname = "/" + path;
    }
  }
  const headers = new Headers();
  for (const h of ["accept", "accept-encoding", "accept-language", "cache-control", "user-agent"]) {
    if (request.headers.get(h)) {
      headers.set(h, request.headers.get(h));
    }
  }
  headers.set("referer", "https://www.pixiv.net/");
  headers.set("user-agent", env.USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0");
  const newReq = new Request(url.toString(), {
    headers
  });
  const response = await fetch(newReq);
  return corsResponse(response);
}
__name(handleImageProxy, "handleImageProxy");
async function handleUserAPI(request, env, url) {
  try {
    const userId = url.searchParams.get("id");
    if (!userId) {
      return corsResponse(new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }));
    }
    const pixivUrl = new URL(`https://www.pixiv.net/ajax/user/${userId}`);
    const headers = new Headers();
    headers.set("referer", "https://www.pixiv.net/");
    headers.set("user-agent", env.USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0");
    const response = await fetch(pixivUrl.toString(), { headers });
    if (!response.ok) {
      return corsResponse(new Response(JSON.stringify({ error: `Pixiv API returned ${response.status}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      }));
    }
    const data = await response.json();
    return corsResponse(new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    console.error("Error in user API:", error);
    return corsResponse(new Response(JSON.stringify({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
}
__name(handleUserAPI, "handleUserAPI");
async function handleStaticAssets(request, env, path) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    let contentType = "text/plain";
    if (pathname.endsWith(".js")) {
      contentType = "application/javascript";
    } else if (pathname.endsWith(".css")) {
      contentType = "text/css";
    } else if (pathname.endsWith(".ico")) {
      contentType = "image/x-icon";
    } else if (pathname.endsWith(".svg")) {
      contentType = "image/svg+xml";
    } else if (pathname.endsWith(".png")) {
      contentType = "image/png";
    } else if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    }
    try {
      return new Response("Static asset not found", {
        status: 404,
        headers: { "Content-Type": "text/plain" }
      });
    } catch (e) {
      return new Response("Static asset not found", {
        status: 404,
        headers: { "Content-Type": "text/plain" }
      });
    }
  } catch (e) {
    return new Response("Static asset not found", {
      status: 404,
      headers: { "Content-Type": "text/plain" }
    });
  }
}
__name(handleStaticAssets, "handleStaticAssets");
async function handleFrontendPage(request, env) {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PixivNow</title>

    <!-- Umami Analytics -->
    <script defer src="https://cloud.umami.is/script.js" data-website-id="842d980c-5e11-4834-a2a8-5daaa285ce66"><\/script>
    
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
      <div class="subtitle">\u63A2\u7D22\u7CBE\u5F69\u7684 Pixiv \u4F5C\u54C1\u4E16\u754C</div>
      
      <input type="text" class="search-box" placeholder="\u8F93\u5165\u5173\u952E\u8BCD\u6216\u753B\u5E08\u540D\u79F0\u641C\u7D22\u4F5C\u54C1..." />
      
      <div class="features">
        <div class="feature">
          <h3>\u{1F3A8} \u968F\u673A\u4F5C\u54C1</h3>
          <p>\u53D1\u73B0\u610F\u60F3\u4E0D\u5230\u7684\u7CBE\u5F69\u4F5C\u54C1</p>
        </div>
        <div class="feature">
          <h3>\u{1F50D} \u667A\u80FD\u641C\u7D22</h3>
          <p>\u5FEB\u901F\u627E\u5230\u4F60\u559C\u6B22\u7684\u5185\u5BB9</p>
        </div>
        <div class="feature">
          <h3>\u{1F4F1} \u54CD\u5E94\u5F0F\u8BBE\u8BA1</h3>
          <p>\u5B8C\u7F8E\u9002\u914D\u5404\u79CD\u8BBE\u5907</p>
        </div>
        <div class="feature">
          <h3>\u26A1 \u9AD8\u901F\u8BBF\u95EE</h3>
          <p>\u57FA\u4E8E Cloudflare \u5168\u7403\u52A0\u901F</p>
        </div>
      </div>
      
      <div class="status">
        \u2705 \u670D\u52A1\u6B63\u5E38\u8FD0\u884C\u4E2D
      </div>
      
      <div class="api-info">
        <p>API \u63A5\u53E3\u53EF\u7528\uFF1A</p>
        <p><a href="/api/illust/random">/api/illust/random</a> - \u968F\u673A\u4F5C\u54C1</p>
        <p><a href="/api/user">/api/user</a> - \u7528\u6237\u4FE1\u606F</p>
        <p>\u56FE\u7247\u4EE3\u7406\uFF1A<code>/i/</code> \u548C <code>/s/</code></p>
      </div>
    </div>
    
    <script>
      // \u7B80\u5355\u7684\u641C\u7D22\u529F\u80FD\u6F14\u793A
      document.querySelector('.search-box').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          const query = this.value.trim();
          if (query) {
            alert('\u641C\u7D22\u529F\u80FD\u6B63\u5728\u5F00\u53D1\u4E2D\uFF0C\u656C\u8BF7\u671F\u5F85\uFF01\\n\u641C\u7D22\u5173\u952E\u8BCD\uFF1A' + query);
          }
        }
      });
      
      // \u6DFB\u52A0\u4E00\u4E9B\u4EA4\u4E92\u6548\u679C
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
    <\/script>
  </body>
</html>`;
  return corsResponse(new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  }));
}
__name(handleFrontendPage, "handleFrontendPage");

// node_modules/.pnpm/wrangler@4.42.1/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/.pnpm/wrangler@4.42.1/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-xddOtL/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = path_default;

// node_modules/.pnpm/wrangler@4.42.1/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-xddOtL/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=%5B%5Bpath%5D%5D.js.map
