import express from "express";
import dns from "dns";
import { promisify } from "util";

const lookupPromise = promisify(dns.lookup);

const app = express();

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
  statusCode: number | null;
  statusText: string | null;
  responseTimeMs: number;
  ipAddress: string | null;
  errorCategory: string | null;
  errorMessage: string | null;
  checkedAt: string;
}

const recentChecks: CheckLog[] = [];

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
    
    return {
      url,
      hostname,
      online: response.status >= 100 && response.status < 500, // 1xx, 2xx, 3xx, 4xx are technically server-responsive
      statusCode: response.status,
      statusText: response.statusText,
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

export default app;
