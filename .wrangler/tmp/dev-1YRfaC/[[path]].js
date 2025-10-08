var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-MMP94b/checked-fetch.js
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
      if (path === "/") {
        return corsResponse(new Response("Pixiv Now Worker is running!", {
          headers: { "Content-Type": "text/plain" }
        }));
      }
      if (path === "/test") {
        return corsResponse(new Response(JSON.stringify({
          message: "Test successful",
          timestamp: Date.now(),
          method: request.method,
          path
        }), {
          headers: { "Content-Type": "application/json" }
        }));
      }
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
      return corsResponse(new Response("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" }
      }));
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
    url.hostname = "i.pximg.net";
  } else {
    url.hostname = "s.pximg.net";
  }
  url.pathname = "/" + path;
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

// .wrangler/tmp/bundle-MMP94b/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-MMP94b/middleware-loader.entry.ts
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
