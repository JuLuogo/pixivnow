var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-ikDXAQ/checked-fetch.js
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

// node_modules/.pnpm/itty-router@5.0.22/node_modules/itty-router/index.mjs
var t = /* @__PURE__ */ __name(({ base: e = "", routes: t2 = [], ...r2 } = {}) => ({ __proto__: new Proxy({}, { get: /* @__PURE__ */ __name((r3, o2, a, s) => (r4, ...c) => t2.push([o2.toUpperCase?.(), RegExp(`^${(s = (e + r4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), c, s]) && a, "get") }), routes: t2, ...r2, async fetch(e2, ...o2) {
  let a, s, c = new URL(e2.url), n = e2.query = { __proto__: null };
  for (let [e3, t3] of c.searchParams) n[e3] = n[e3] ? [].concat(n[e3], t3) : t3;
  e: try {
    for (let t3 of r2.before || []) if (null != (a = await t3(e2.proxy ?? e2, ...o2))) break e;
    t: for (let [r3, n2, l, i] of t2) if ((r3 == e2.method || "ALL" == r3) && (s = c.pathname.match(n2))) {
      e2.params = s.groups || {}, e2.route = i;
      for (let t3 of l) if (null != (a = await t3(e2.proxy ?? e2, ...o2))) break t;
    }
  } catch (t3) {
    if (!r2.catch) throw t3;
    a = await r2.catch(t3, e2.proxy ?? e2, ...o2);
  }
  try {
    for (let t3 of r2.finally || []) a = await t3(a, e2.proxy ?? e2, ...o2) ?? a;
  } catch (t3) {
    if (!r2.catch) throw t3;
    a = await r2.catch(t3, e2.proxy ?? e2, ...o2);
  }
  return a;
} }), "t");
var r = /* @__PURE__ */ __name((e = "text/plain; charset=utf-8", t2) => (r2, o2 = {}) => {
  if (void 0 === r2 || r2 instanceof Response) return r2;
  const a = new Response(t2?.(r2) ?? r2, o2.url ? void 0 : o2);
  return a.headers.set("content-type", e), a;
}, "r");
var o = r("application/json; charset=utf-8", JSON.stringify);
var p = r("text/plain; charset=utf-8", String);
var f = r("text/html");
var u = r("image/jpeg");
var h = r("image/png");
var g = r("image/webp");
var y = /* @__PURE__ */ __name((e = {}) => {
  const { origin: t2 = "*", credentials: r2 = false, allowMethods: o2 = "*", allowHeaders: a, exposeHeaders: s, maxAge: c } = e, n = /* @__PURE__ */ __name((e2) => {
    const o3 = e2?.headers.get("origin");
    return true === t2 ? o3 : t2 instanceof RegExp ? t2.test(o3) ? o3 : void 0 : Array.isArray(t2) ? t2.includes(o3) ? o3 : void 0 : t2 instanceof Function ? t2(o3) : "*" == t2 && r2 ? o3 : t2;
  }, "n"), l = /* @__PURE__ */ __name((e2, t3) => {
    for (const [r3, o3] of Object.entries(t3)) o3 && e2.headers.append(r3, o3);
    return e2;
  }, "l");
  return { corsify: /* @__PURE__ */ __name((e2, t3) => e2?.headers?.get("access-control-allow-origin") || 101 == e2.status ? e2 : l(e2.clone(), { "access-control-allow-origin": n(t3), "access-control-allow-credentials": r2 }), "corsify"), preflight: /* @__PURE__ */ __name((e2) => {
    if ("OPTIONS" == e2.method) {
      const t3 = new Response(null, { status: 204 });
      return l(t3, { "access-control-allow-origin": n(e2), "access-control-allow-methods": o2?.join?.(",") ?? o2, "access-control-expose-headers": s?.join?.(",") ?? s, "access-control-allow-headers": a?.join?.(",") ?? a ?? e2.headers.get("access-control-request-headers"), "access-control-max-age": c, "access-control-allow-credentials": r2 });
    }
  }, "preflight") };
}, "y");

// functions/[[path]].ts
var { preflight, corsify } = y();
var router = t();
router.all("/*", preflight);
router.all("/(ajax|rpc)/:path+", async (req, env) => {
  const url = new URL(req.url);
  url.hostname = "www.pixiv.net";
  const headers = new Headers(req.headers);
  headers.set("origin", "https://www.pixiv.net");
  headers.set("referer", "https://www.pixiv.net/");
  const newReq = new Request(url.toString(), {
    method: req.method,
    headers,
    body: req.body
  });
  return fetch(newReq);
});
router.all("/(~|-)/:path+", async (req, env) => {
  const url = new URL(req.url);
  const prefix = url.pathname.split("/")[1];
  switch (prefix) {
    case "-":
      url.hostname = "i.pximg.net";
      break;
    case "~":
      url.hostname = "s.pximg.net";
      break;
    default:
      return new Response("Invalid request", { status: 400 });
  }
  url.pathname = url.pathname.substring(prefix.length + 1);
  const headers = new Headers();
  const proxyHeaders = [
    "accept",
    "accept-encoding",
    "accept-language",
    "range",
    "if-range",
    "if-none-match",
    "if-modified-since",
    "cache-control"
  ];
  for (const h2 of proxyHeaders) {
    if (req.headers.has(h2)) {
      headers.set(h2, req.headers.get(h2));
    }
  }
  headers.set("referer", "https://www.pixiv.net/");
  headers.set("user-agent", env.USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0");
  const newReq = new Request(url.toString(), {
    headers
  });
  return fetch(newReq);
});
router.all("/api/illust/random", async (req, env) => {
  try {
    const url = new URL(req.url);
    const requestImage = (req.headers.get("accept")?.includes("image") || url.searchParams.get("format") === "image") && url.searchParams.get("format") !== "json";
    const pixivUrl = new URL("https://www.pixiv.net/ajax/illust/discovery");
    pixivUrl.searchParams.set("mode", url.searchParams.get("mode") ?? "safe");
    pixivUrl.searchParams.set("max", requestImage ? "1" : url.searchParams.get("max") ?? "18");
    const headers = new Headers();
    headers.set("referer", "https://www.pixiv.net/");
    headers.set("user-agent", env.USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0");
    const response = await fetch(pixivUrl.toString(), { headers });
    if (!response.ok) {
      throw new Error(`Pixiv API returned ${response.status}`);
    }
    const data = await response.json();
    const illusts = (data.illusts ?? []).filter(
      (value) => Object.keys(value).includes("id")
    );
    if (illusts.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" }
      });
    }
    const PXIMG_BASEURL_I = (env.VITE_PXIMG_BASEURL_I || "https://i.pximg.net/").replace(/\/$/, "") + "/";
    illusts.forEach((value) => {
      try {
        const updateDate = new Date(value.updateDate);
        const tokyoTime = new Date(updateDate.getTime() + 9 * 60 * 60 * 1e3);
        const year = tokyoTime.getUTCFullYear();
        const month = String(tokyoTime.getUTCMonth() + 1).padStart(2, "0");
        const day = String(tokyoTime.getUTCDate()).padStart(2, "0");
        const hour = String(tokyoTime.getUTCHours()).padStart(2, "0");
        const minute = String(tokyoTime.getUTCMinutes()).padStart(2, "0");
        const second = String(tokyoTime.getUTCSeconds()).padStart(2, "0");
        const middle = `img/${year}/${month}/${day}/${hour}/${minute}/${second}/${value.id}`;
        value.urls = {
          mini: `${PXIMG_BASEURL_I}c/48x48/img-master/${middle}_p0_square1200.jpg`,
          thumb: `${PXIMG_BASEURL_I}c/250x250_80_a2/img-master/${middle}_p0_square1200.jpg`,
          small: `${PXIMG_BASEURL_I}c/540x540_70/img-master/${middle}_p0_master1200.jpg`,
          regular: `${PXIMG_BASEURL_I}img-master/${middle}_p0_master1200.jpg`,
          original: `${PXIMG_BASEURL_I}img-original/${middle}_p0.jpg`
        };
      } catch (error) {
        console.error("Error formatting date for illust:", value.id, error);
        value.urls = {
          mini: `${PXIMG_BASEURL_I}c/48x48/img-master/img/2024/01/01/00/00/00/${value.id}_p0_square1200.jpg`,
          thumb: `${PXIMG_BASEURL_I}c/250x250_80_a2/img-master/img/2024/01/01/00/00/00/${value.id}_p0_square1200.jpg`,
          small: `${PXIMG_BASEURL_I}c/540x540_70/img-master/img/2024/01/01/00/00/00/${value.id}_p0_master1200.jpg`,
          regular: `${PXIMG_BASEURL_I}img-master/img/2024/01/01/00/00/00/${value.id}_p0_master1200.jpg`,
          original: `${PXIMG_BASEURL_I}img-original/img/2024/01/01/00/00/00/${value.id}_p0.jpg`
        };
      }
    });
    if (requestImage) {
      return new Response(null, {
        status: 302,
        headers: { Location: illusts[0].urls.regular }
      });
    }
    return new Response(JSON.stringify(illusts), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in random API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
router.all("/api/user", async (req, env) => {
  const token = req.headers.get("cookie")?.match(/PHPSESSID=([^;]+)/)?.[1] || new URL(req.url).searchParams.get("token");
  if (!token) {
    return new Response(JSON.stringify({ message: "\u672A\u914D\u7F6E\u7528\u6237\u5BC6\u94A5" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }
  const url = new URL(req.url);
  url.hostname = "www.pixiv.net";
  url.pathname = "/";
  const headers = new Headers(req.headers);
  headers.set("cookie", `PHPSESSID=${token}`);
  const newReq = new Request(url.toString(), {
    headers
  });
  const res = await fetch(newReq);
  const text = await res.text();
  let meta = null;
  class MetaHandler {
    constructor(type) {
      this.type = type;
    }
    static {
      __name(this, "MetaHandler");
    }
    text(chunk) {
      try {
        if (this.type === "legacy") {
          const data = JSON.parse(chunk.text);
          meta = {
            userData: data.userData,
            token: data.token || ""
          };
        } else {
          const nextData = JSON.parse(chunk.text);
          const perloadState = JSON.parse(
            nextData?.props?.pageProps?.serverSerializedPreloadedState
          );
          meta = {
            userData: perloadState?.userData?.self,
            token: perloadState?.api?.token || ""
          };
        }
      } catch (e) {
        console.error("Error parsing meta", e);
      }
    }
  }
  const rewriter = new HTMLRewriter().on('meta[name="global-data"]', new MetaHandler("legacy")).on("script#__NEXT_DATA__", new MetaHandler("next"));
  await rewriter.transform(new Response(text)).text();
  if (!meta || !meta.userData) {
    return new Response(JSON.stringify({ message: "\u65E0\u6CD5\u83B7\u53D6\u767B\u5F55\u72B6\u6001" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const responseHeaders = new Headers({
    "cache-control": "no-cache",
    "set-cookie": `CSRFTOKEN=${meta.token}; path=/; secure; sameSite=Lax`,
    "Content-Type": "application/json"
  });
  return new Response(JSON.stringify(meta), { headers: responseHeaders });
});
var path_default = {
  fetch: /* @__PURE__ */ __name((req, env, ctx) => router.handle(req, env, ctx).then(corsify).catch((err) => {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }), "fetch")
};

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

// .wrangler/tmp/bundle-ikDXAQ/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-ikDXAQ/middleware-loader.entry.ts
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
