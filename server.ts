import express from "express";
import path from "path";
import dns from "dns";
import { promisify } from "util";

const lookupPromise = promisify(dns.lookup);

const app = express();
const PORT = 3000;

// Enable JSON parser for POST requests
app.use(express.json());

// In-memory logs & statistics
let totalChecks = 0;
let upChecks = 0;
let downChecks = 0;

interface CheckLog {
  id: string;
  url: string;
  hostname: string;
  online: boolean;
  status: "UP" | "DOWN";
  statusCode: number | null;
  statusText: string | null;
  responseTimeMs: number;
  ipAddress: string | null;
  errorCategory: string | null;
  errorMessage: string | null;
  checkedAt: string;
}

const recentChecks: CheckLog[] = [];

const HTTP_STATUS_NAMES: { [key: number]: string } = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  413: "Payload Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  507: "Insufficient Storage",
  508: "Loop Detected",
  // Cloudflare & Custom Gateway Errors
  520: "Web Server Returned an Unknown Error",
  521: "Web Server Is Down",
  522: "Connection Timed Out",
  523: "Origin Is Unreachable",
  524: "A Timeout Occurred",
  525: "SSL Handshake Failed",
  526: "Invalid SSL Certificate",
  527: "Railgun Listener Error"
};

// Helper to sanitize and normalize input URL
function normalizeUrl(inputUrl: string): { url: string; hostname: string; protocol: string } {
  let cleaned = inputUrl.trim();
  
  // If no protocol is set, default to https://
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = "https://" + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    return {
      url: parsed.href,
      hostname: parsed.hostname,
      protocol: parsed.protocol,
    };
  } catch (err) {
    throw new Error("URL tidak valid. Pastikan format URL benar (contoh: google.com atau http://domainku.com).");
  }
}

// Perform URL status check
async function checkWebsiteStatus(targetUrlStr: string): Promise<Omit<CheckLog, "id" | "checkedAt">> {
  const { url, hostname, protocol } = normalizeUrl(targetUrlStr);
  const startTime = Date.now();
  
  let ipAddress: string | null = null;
  try {
    const lookupResult = await lookupPromise(hostname);
    ipAddress = lookupResult.address;
  } catch (dnsErr) {
    // DNS resolution failed
    return {
      url,
      hostname,
      online: false,
      status: "DOWN",
      statusCode: null,
      statusText: null,
      responseTimeMs: Date.now() - startTime,
      ipAddress: null,
      errorCategory: "DNS_ERROR",
      errorMessage: "Gagal meresolusi hostname (DNS Error). Domain mungkin belum terdaftar, kedaluwarsa, atau salah ketik.",
    };
  }

  // Set timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebsiteStatusChecker/1.0",
        "Accept": "*/*",
      },
    });
    
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    
    // Some sites block common non-browser clients (403/503), but a response still means the server is UP.
    // However, typical up/down checking considers any successful IP response as UP unless the status code is entirely down.
    // Normally, HTTP status codes 2xx, 3xx, and even 4xx mean the server is hosting the site and responding.
    // Let's decide online is true if we received any HTTP response (even 500, but we will mark it as server-error).
    const isOnline = response.status >= 100 && response.status < 500;
    let statusText = response.statusText;
    if (!statusText || statusText.trim() === "" || statusText.toLowerCase() === "<none>") {
      statusText = HTTP_STATUS_NAMES[response.status] || `Status ${response.status}`;
    }

    return {
      url,
      hostname,
      online: isOnline,
      status: isOnline ? "UP" : "DOWN",
      statusCode: response.status,
      statusText,
      responseTimeMs,
      ipAddress,
      errorCategory: response.status >= 500 ? "SERVER_ERROR" : null,
      errorMessage: response.status >= 500 ? `Server merespon dengan status error ${response.status}.` : null,
    };
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    
    // Extract underlying errors
    const errorMsg = fetchErr.message || String(fetchErr);
    const errorCode = fetchErr.cause?.code || "";

    let errorCategory = "CONNECTION_FAILED";
    let messageIndonesian = "Terjadi kegagalan koneksi ke server.";

    if (fetchErr.name === "AbortError" || errorCode === "UND_ERR_HEADERS_TIMEOUT" || errorCode === "ETIMEDOUT") {
      errorCategory = "TIMEOUT";
      messageIndonesian = "Koneksi habis (Timeout). Server memakan waktu terlalu lama untuk meresorpon.";
    } else if (errorCode === "ECONNREFUSED") {
      errorCategory = "CONNECTION_REFUSED";
      messageIndonesian = "Koneksi ditolak (Connection Refused). Server aktif namun tidak menerima request pada port tersebut.";
    } else if (errorCode === "EPROTO" || errorMsg.includes("ssl") || errorMsg.includes("tls")) {
      errorCategory = "SSL_ERROR";
      messageIndonesian = "Kesalahan Protokol SSL/TLS. Sertifikat keamanan website mungkin tidak valid atau kedaluwarsa.";
    } else if (errorCode === "ENOTFOUND") {
      errorCategory = "DNS_ERROR";
      messageIndonesian = "Hostname tidak ditemukan (DNS Error).";
    }

    return {
      url,
      hostname,
      online: false,
      status: "DOWN",
      statusCode: null,
      statusText: null,
      responseTimeMs,
      ipAddress,
      errorCategory,
      errorMessage: `${messageIndonesian} (Kode: ${errorCode || fetchErr.name || "UNKNOWN"})`,
    };
  }
}

// CORS Middleware for APIs
app.use("/api", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// GET /api/check?url=...
app.get("/api/check", async (req, res) => {
  const urlParam = req.query.url;
  if (!urlParam || typeof urlParam !== "string") {
    return res.status(400).json({
      success: false,
      error: "Parameter 'url' wajib disertakan. Contoh: /api/check?url=google.com",
    });
  }

  try {
    const checkResult = await checkWebsiteStatus(urlParam);
    const finalLog: CheckLog = {
      id: Math.random().toString(36).substring(2, 11),
      ...checkResult,
      checkedAt: new Date().toISOString(),
    };

    // Update global Stats env safe
    totalChecks++;
    if (finalLog.online) {
      upChecks++;
    } else {
      downChecks++;
    }

    // Add to recent list (limit 15)
    recentChecks.unshift(finalLog);
    if (recentChecks.length > 15) {
      recentChecks.pop();
    }

    return res.json({
      success: true,
      data: finalLog,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || "Gagal memproses pengecekan URL.",
    });
  }
});

// POST /api/check { url: "..." }
app.post("/api/check", async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({
      success: false,
      error: "Body 'url' wajib disertakan sebagai string JSON. Contoh: { \"url\": \"google.com\" }",
    });
  }

  try {
    const checkResult = await checkWebsiteStatus(url);
    const finalLog: CheckLog = {
      id: Math.random().toString(36).substring(2, 11),
      ...checkResult,
      checkedAt: new Date().toISOString(),
    };

    totalChecks++;
    if (finalLog.online) {
      upChecks++;
    } else {
      downChecks++;
    }

    recentChecks.unshift(finalLog);
    if (recentChecks.length > 15) {
      recentChecks.pop();
    }

    return res.json({
      success: true,
      data: finalLog,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || "Gagal memproses pengecekan URL.",
    });
  }
});

// GET /api/stats
app.get("/api/stats", (req, res) => {
  res.json({
    success: true,
    stats: {
      totalChecks,
      upChecks,
      downChecks,
    },
    recentChecks,
  });
});

// Vite & Static file handler
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  bootstrap().catch((err) => {
    console.error("Failed to start server:", err);
  });
}

export default app;
