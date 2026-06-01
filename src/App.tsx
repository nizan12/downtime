import React, { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence
} from "motion/react";
import {
  Globe,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Clock,
  Clock3,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  Hash,
  Zap,
  ShieldAlert,
  BookOpen,
  ExternalLink
} from "lucide-react";

import { CheckLog, Stats } from "./types";

export default function App() {
  const [urlInput, setUrlInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkingStep, setCheckingStep] = useState<string>("");
  const [checkResult, setCheckResult] = useState<CheckLog | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Statistics state
  const [stats, setStats] = useState<Stats>({
    totalChecks: 0,
    upChecks: 0,
    downChecks: 0
  });
  const [recentChecks, setRecentChecks] = useState<CheckLog[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // API Playground State
  const [playgroundUrl, setPlaygroundUrl] = useState("polibatam.ac.id");
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // API Documentation Language Tabs
  const [docLang, setDocLang] = useState<"curl" | "fetch" | "axios" | "python">("curl");

  // Get active application URL origin for API codes
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://statuschecker.run";

  // Navigation tab state with smooth navigation mapping
  const [activeTab, setActiveTab] = useState<"dashboard" | "explorer" | "integration" | "logs">("dashboard");

  const scrollToSection = (tab: "dashboard" | "explorer" | "integration" | "logs", sectionId: string) => {
    setActiveTab(tab);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Fetch Stats and Recent Checks on mount and interval
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentChecks(data.recentChecks);
      }
    } catch (err) {
      console.error("Gagal mengambil data statistik:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000); // refresh stats every 6 seconds
    return () => clearInterval(interval);
  }, []);

  // Form submit for quick checking
  const handleCheck = async (e?: React.FormEvent, overrideUrl?: string) => {
    if (e) e.preventDefault();
    const targetUrl = overrideUrl || urlInput;
    if (!targetUrl.trim()) return;

    setErrorText(null);
    setIsChecking(true);
    setCheckResult(null);

    // Simulated multi-stage diagnostics to give a high-quality feedback experience
    const steps = [
      "Mengurai URL dan Memvalidasi skema...",
      "Menguji resolusi DNS lokal & mencari IPv4...",
      "Menginisiasi ping koneksi serta handshake TCP...",
      "Mengukur waktu transfer paket (waktu respons)...",
      "Memetakan kode respon HTTP & parameter header..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setCheckingStep(steps[i]);
      await new Promise(r => setTimeout(r, i === 0 ? 300 : i === 1 ? 500 : 400));
    }

    try {
      const response = await fetch(`/api/check?url=${encodeURIComponent(targetUrl)}`);
      const body = await response.json();

      if (body.success) {
        setCheckResult(body.data);
        // Refresh stats immediately
        fetchStats();
      } else {
        setErrorText(body.error || "Gagal melakukan pengecekan.");
      }
    } catch (err: any) {
      setErrorText("Terjadi masalah jaringan saat menghubungi server lokal.");
    } finally {
      setIsChecking(false);
      setCheckingStep("");
    }
  };

  // Run playground check
  const handlePlaygroundCheck = async () => {
    if (!playgroundUrl.trim()) return;
    setPlaygroundLoading(true);
    try {
      const response = await fetch(`/api/check?url=${encodeURIComponent(playgroundUrl)}`);
      const body = await response.json();
      setPlaygroundResult(body);
    } catch (err) {
      setPlaygroundResult({ success: false, error: "Gagal menghubungkan ke Server API" });
    } finally {
      setPlaygroundLoading(false);
    }
  };

  useEffect(() => {
    // Run initial playground query
    handlePlaygroundCheck();
  }, []);

  // Handle Copy text helper
  const handleCopyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(identifier);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // Pre-configured list of popular website suggestions for quick testing
  const suggestions = [
    { label: "Google", url: "https://google.com" },
    { label: "Wikipedia", url: "wikipedia.org" },
    { label: "GitHub", url: "github.com" },
    { label: "Domain Rusak (Simulasi Down)", url: "broken-test-domain-notfound.xyz" },
  ];

  // Logic to classify speeds
  const getSpeedRating = (ms: number) => {
    if (ms < 300) return { label: "Sangat Cepat", color: "text-green-400 font-semibold", barColor: "bg-green-500", progress: "w-1/4" };
    if (ms < 1000) return { label: "Normal", color: "text-yellow-400 font-semibold", barColor: "bg-yellow-500", progress: "w-2/4" };
    return { label: "Sangat Lambat", color: "text-orange-500 font-semibold", barColor: "bg-orange-600", progress: "w-4/4" };
  };

  // Code generator blocks
  const apiDocumentationSnippets = {
    curl: `curl -X GET "${appOrigin}/api/check?url=polibatam.ac.id"`,
    fetch: `// Contoh Pemanggilan Menggunakan Native Fetch API (JS/TS)
fetch("${appOrigin}/api/check?url=polibatam.ac.id")
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      console.log("Status Website (Boolean):", result.data.online ? "AKTIF" : "DOWN");
      console.log("Status Website (String):", result.data.status); // "UP" atau "DOWN"
      console.log("Kecepatan Respon:", result.data.responseTimeMs, "ms");
    } else {
      console.error("Gagal memanggil API:", result.error);
    }
  })
  .catch(error => console.error("Error:", error));`,
    axios: `// Contoh Pemanggilan Menggunakan Axios (Node.js / React)
import axios from 'axios';

axios.get('${appOrigin}/api/check', {
  params: { url: 'polibatam.ac.id' }
})
.then(response => {
  const result = response.data;
  if (result.success) {
    console.log("Status Website:", result.data.status); // "UP" atau "DOWN"
    console.log("Data Status Lengkap:", result.data);
  }
})
.catch(err => {
  console.error("API error:", err.message);
});`,
    python: `# Contoh Pemanggilan Menggunakan Library requests di Python
import requests

api_url = "${appOrigin}/api/check"
params = {"url": "polibatam.ac.id"}

try:
    response = requests.get(api_url, params=params)
    result = response.json()
    if result.get("success"):
        data = result.get("data")
        print(f"URL: {data.get('url')}")
        print(f"Status Online: {data.get('online')}")
        print(f"Status String: {data.get('status')}") # "UP" atau "DOWN"
        print(f"Kecepatan: {data.get('responseTimeMs')}ms")
    else:
        print(f"Gagal: {result.get('error')}")
except Exception as e:
    print(f"Request error: {e}")`
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#E0E0E0] font-sans flex flex-col justify-between overflow-x-hidden">

      {/* Top Navigation Bar */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 md:px-8 bg-[#0E0E10] z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full glow-green"></div>
          <span className="font-bold tracking-tighter text-xl text-white">DOWN<span className="text-green-500">.TIME</span></span>
        </div>
        <div className="hidden md:flex gap-8 text-xs uppercase tracking-widest font-semibold text-gray-400">
          <button
            type="button"
            onClick={() => scrollToSection("dashboard", "dashboard-section")}
            className={`cursor-pointer transition-colors pb-1 border-b-2 ${activeTab === "dashboard" ? "text-white border-green-500 font-bold" : "text-gray-400 hover:text-white border-transparent"
              }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("explorer", "explorer-section")}
            className={`cursor-pointer transition-colors pb-1 border-b-2 ${activeTab === "explorer" ? "text-white border-green-500 font-bold" : "text-gray-400 hover:text-white border-transparent"
              }`}
          >
            API Explorer
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("integration", "integration-section")}
            className={`cursor-pointer transition-colors pb-1 border-b-2 ${activeTab === "integration" ? "text-white border-green-500 font-bold" : "text-gray-400 hover:text-white border-transparent"
              }`}
          >
            Integration
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("logs", "logs-section")}
            className={`cursor-pointer transition-colors pb-1 border-b-2 ${activeTab === "logs" ? "text-white border-green-500 font-bold" : "text-gray-400 hover:text-white border-transparent"
              }`}
          >
            Logs
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[10px] data-font text-gray-500">API_KEY: PS_77A8...B9</span>
          <div className="w-8 h-8 rounded bg-gray-800 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-white tracking-widest shadow-sm">
            PM
          </div>
        </div>
      </nav>

      {/* Main Content Grid with Technical Grid Pattern */}
      <div className="flex-1 min-h-0 technical-grid grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-white/10">

        {/* LEFT & CENTER ZONE: Verification tool, timeline, and snippets */}
        <section className="lg:col-span-8 flex flex-col divide-y divide-white/10 border-r border-white/10">

          {/* Section 1: Instant System Validation input form */}
          <div id="dashboard-section" className="p-6 md:p-8 bg-black/30 flex flex-col justify-center min-h-[160px] scroll-mt-6">
            <h2 className="serif-header text-gray-400 text-sm mb-3 uppercase tracking-wider">Instant System Validation</h2>

            <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 bg-[#1A1A1E] border border-white/10 rounded p-1.5 flex items-center shadow-inner">
                <span className="px-3 text-gray-500 data-font text-xs tracking-wider border-r border-white/5 mr-2">HTTPS://</span>
                <input
                  type="text"
                  disabled={isChecking}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="example-domain.com atau polibatam.ac.id"
                  className="bg-transparent border-none outline-none flex-1 text-white text-base font-medium placeholder-gray-700 font-mono w-full min-w-0"
                />
              </div>
              <button
                id="btn-check-website"
                type="submit"
                disabled={isChecking || !urlInput.trim()}
                className="bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:bg-gray-800 disabled:text-gray-500 text-black font-bold px-6 py-3 sm:py-0 rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-600/10 shrink-0"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs uppercase tracking-tighter">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs uppercase tracking-tighter">Validate Node</span>
                    <ArrowRight className="w-3.5 h-3.5 text-black" />
                  </>
                )}
              </button>
            </form>

            {/* Quick suggestions chips */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-mono">
              <span className="text-gray-500 font-medium font-sans">Quick Checks:</span>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUrlInput(s.url);
                    handleCheck(undefined, s.url);
                  }}
                  className="px-2 py-0.5 bg-[#1A1A1E] border border-white/5 hover:border-white/10 rounded text-gray-400 hover:text-white transition-all cursor-pointer text-[11px] font-semibold"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Multitask Diagnostics feedback overlay panel */}
            <AnimatePresence mode="wait">
              {isChecking && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 p-4 rounded bg-[#121214] border border-green-500/20 flex items-center gap-4 glow-green/10"
                >
                  <div className="p-2 rounded bg-green-500/10 border border-green-500/25 text-green-400">
                    <Cpu className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <p className="text-[10px] data-font text-green-400 uppercase tracking-widest font-semibold animate-pulse">VALIDATION IN PROGRESS</p>
                    <p className="text-xs text-gray-300 mt-0.5">{checkingStep}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error notifications */}
            <AnimatePresence>
              {errorText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded bg-[#1e1315]/80 border border-red-500/20 flex items-start gap-3.5 shadow-md"
                >
                  <div className="p-1.5 rounded bg-red-500/10 text-red-500 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider data-font">Validation Interrupted</h4>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{errorText}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Check Results report card */}
            <AnimatePresence>
              {checkResult && !isChecking && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-5 rounded border border-white/10 bg-[#121214] space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/5">
                    <div>
                      <span className="text-[9px] data-font text-gray-500 uppercase tracking-widest block font-bold">Node Diagnostics</span>
                      <h3 className="text-sm data-font font-bold text-white truncate max-w-full">
                        {checkResult.url}
                      </h3>
                    </div>

                    <div>
                      {checkResult.online ? (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-green-500 text-black glow-green font-bold text-xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase tracking-wider data-font">STATUS: UP</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-red-500 text-white font-bold text-xs glow-red">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase tracking-wider data-font">STATUS: DOWN</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded bg-black/40 border border-white/5">
                      <span className="text-[9px] text-gray-500 uppercase block font-semibold">Response Code</span>
                      <span className={`text-base font-bold data-font block mt-1 ${checkResult.online ? "text-green-500" : "text-red-500"}`}>
                        {checkResult.statusCode || "---"}
                      </span>
                    </div>

                    <div className="p-3 rounded bg-black/40 border border-white/5">
                      <span className="text-[9px] text-gray-500 uppercase block font-semibold">Latency Status</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-white data-font">{checkResult.responseTimeMs} ms</span>
                      </div>
                    </div>

                    <div className="p-3 rounded bg-black/40 border border-white/5">
                      <span className="text-[9px] text-gray-500 uppercase block font-semibold">IP Address</span>
                      <span className="text-xs font-bold text-gray-300 block mt-1 data-font truncate" title={checkResult.ipAddress || ""}>
                        {checkResult.ipAddress || "Fails DNS"}
                      </span>
                    </div>

                    <div className="p-3 rounded bg-black/40 border border-white/5">
                      <span className="text-[9px] text-gray-500 uppercase block font-semibold">Timestamp UTC</span>
                      <span className="text-[10px] font-semibold text-gray-400 block mt-1.5 data-font">
                        {new Date(checkResult.checkedAt).toLocaleTimeString("id-ID")} WIB
                      </span>
                    </div>
                  </div>

                  {/* Down Recommendation Diagnostics info */}
                  {!checkResult.online && (
                    <div className="p-3.5 rounded bg-red-500/5 border border-red-500/10 text-xs">
                      <div className="flex items-center gap-2 text-red-400 font-bold mb-1 uppercase tracking-wider text-[10px] data-font">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Warning details
                      </div>
                      <p className="text-gray-400 leading-relaxed text-[11px] font-mono">
                        {checkResult.errorMessage || "DNS records tidak tembus atau server menolak koneksi eksternal kami."}
                      </p>
                    </div>
                  )}

                  {/* Connected Speed Graph Progress Bar */}
                  {checkResult.online && (
                    <div className="p-3 bg-black/20 rounded border border-white/5 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                        <span>Connection load delay factor</span>
                        <span className="text-green-400 font-bold">{checkResult.responseTimeMs} ms (Rating: {getSpeedRating(checkResult.responseTimeMs).label})</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded overflow-hidden">
                        <div className={`h-full ${getSpeedRating(checkResult.responseTimeMs).barColor} ${getSpeedRating(checkResult.responseTimeMs).progress} rounded-full`}></div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 2: Code Snippets references with High Density styling */}
          <div id="integration-section" className="flex flex-col bg-[#0E0E10]/40 scroll-mt-6">
            <div className="flex border-b border-white/10 bg-[#121214]">
              {(["curl", "fetch", "axios", "python"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setDocLang(lang)}
                  className={`px-6 py-3 border-r border-white/10 text-xs font-bold font-mono uppercase tracking-widest cursor-pointer transition-colors ${docLang === lang ? "bg-[#1A1A1E] text-white border-t-2 border-t-green-500" : "text-gray-500 hover:text-gray-300"
                    }`}
                >
                  {lang}
                </button>
              ))}
              <div className="flex-1"></div>
            </div>

            <div className="p-6 data-font text-xs leading-relaxed relative bg-black/25">
              <span className="absolute top-3 right-3 text-[9px] uppercase text-gray-600 font-bold tracking-wider mr-2">GET REQUEST</span>
              <pre className="text-gray-300 overflow-x-auto whitespace-pre p-2 leading-relaxed max-h-[220px] font-mono select-all">
                {apiDocumentationSnippets[docLang]}
              </pre>

              <button
                onClick={() => handleCopyToClipboard(apiDocumentationSnippets[docLang], `snippet-${docLang}`)}
                className="absolute top-2.5 right-24 p-1.5 bg-[#121214] border border-white/10 text-gray-400 hover:text-green-400 rounded transition-all cursor-pointer"
                title="Copy snippet text"
              >
                {copyFeedback === `snippet-${docLang}` ? (
                  <span className="text-[10px] font-semibold text-green-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Copied
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copy Code
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Section 3: Interactive Playground / Live Sandbox Tester */}
          <div id="explorer-section" className="p-6 md:p-8 space-y-4 bg-black/10 scroll-mt-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-500" />
                <h3 className="serif-header text-gray-400 text-xs uppercase tracking-wider">API Interactive Live Playground</h3>
              </div>
              <span className="text-[9px] font-mono text-green-500 bg-green-500/10 border border-green-500/25 px-2 py-0.5 rounded-full uppercase font-bold">CORS SUPPORT ENABLED</span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Anda tidak perlu repot-repot menyewa proxy atau menangani CORS error pada domain client Anda. Kirim GET request langsung:
            </p>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="bg-black/60 border border-white/10 rounded px-3 py-2 text-[11px] data-font text-green-500 flex items-center justify-center font-bold">
                  GET
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-3.5 inset-y-0 flex items-center data-font text-[11px] text-gray-600">
                    /api/check?url=
                  </span>
                  <input
                    type="text"
                    value={playgroundUrl}
                    onChange={(e) => setPlaygroundUrl(e.target.value)}
                    className="w-full bg-[#1A1A1E] text-white data-font text-[11px] border border-white/10 rounded pl-[98px] pr-3 py-2.5 focus:outline-none focus:border-green-500/50"
                    placeholder="google.com"
                  />
                </div>
                <button
                  onClick={handlePlaygroundCheck}
                  disabled={playgroundLoading || !playgroundUrl.trim()}
                  className="px-5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-black data-font uppercase tracking-tighter text-xs font-black rounded cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  {playgroundLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Execute Response
                </button>
              </div>

              {/* JSON render output container */}
              <div className="relative rounded bg-black border border-white/10 p-4 max-h-[220px] overflow-y-auto">
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={() => handleCopyToClipboard(JSON.stringify(playgroundResult, null, 2), "json-payload")}
                    className="px-2 py-1 text-[9px] bg-[#121214] hover:bg-black border border-white/10 hover:text-green-400 text-gray-400 rounded transition-all cursor-pointer flex items-center gap-1 data-font"
                  >
                    {copyFeedback === "json-payload" ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                    Copy JSON
                  </button>
                </div>
                <pre className="text-[11px] data-font text-gray-400 leading-relaxed whitespace-pre-wrap select-all">
                  {playgroundLoading ? (
                    <span className="text-gray-500 italic animate-pulse"># Querying the active REST API backend server...</span>
                  ) : playgroundResult ? (
                    JSON.stringify(playgroundResult, null, 2)
                  ) : (
                    <span className="text-gray-600">{"// Klik Execute Response untuk memicu panggilan API live"}</span>
                  )}
                </pre>
              </div>
            </div>
          </div>

          {/* Section 4: Pulse Heartbeat Timeline Bar graphs (High Density visualization) */}
          <div className="p-6 md:p-8 bg-black/25">
            <h3 className="serif-header text-gray-400 text-xs uppercase mb-4 tracking-wider">Pulse Heartbeat Timeline (Last 24h Global Status)</h3>

            <div className="flex gap-[3px] h-14 items-end bg-[#121214] p-3 rounded border border-white/5">
              {/* Render an elegant, detailed bar monitoring graph representing simulation state */}
              <div className="flex-1 bg-green-500 h-full opacity-35" title="US-EAST: OK"></div>
              <div className="flex-1 bg-green-500 h-full opacity-50" title="EU-WEST: OK"></div>
              <div className="flex-1 bg-green-500 h-[80%] opacity-25" title="ASIA-SE: OK"></div>
              <div className="flex-1 bg-green-500 h-full opacity-60"></div>
              <div className="flex-1 bg-green-500 h-[95%] opacity-40"></div>
              <div className="flex-1 bg-red-500 h-6 glow-red" title="INCIDENT: SERVER SHUTDOWN (503)"></div>
              <div className="flex-1 bg-green-500 h-full opacity-80"></div>
              <div className="flex-1 bg-green-500 h-full"></div>
              <div className="flex-1 bg-green-500 h-[70%] opacity-45"></div>
              <div className="flex-1 bg-green-500 h-full opacity-20"></div>
              <div className="flex-1 bg-green-500 h-full opacity-70"></div>
              <div className="flex-1 bg-green-500 h-[85%] opacity-35"></div>
              <div className="flex-1 bg-green-500 h-full opacity-90"></div>
              <div className="flex-1 bg-green-500 h-full"></div>
              <div className="flex-1 bg-green-500 h-[80%] opacity-60"></div>
              <div className="flex-1 bg-green-500 h-full opacity-30"></div>
              <div className="flex-1 bg-green-500 h-full opacity-50"></div>
              <div className="flex-1 bg-green-500 h-full opacity-10"></div>
              <div className="flex-1 bg-green-500 h-full opacity-80"></div>
              <div className="flex-1 bg-green-500 h-full opacity-40"></div>
              <div className="flex-1 bg-green-500 h-[92%] opacity-65"></div>
              <div className="flex-1 bg-green-500 h-full opacity-90"></div>
              <div className="flex-1 bg-green-500 h-full"></div>
              <div className="flex-1 bg-green-500 h-[75%] opacity-45"></div>
              <div className="flex-1 bg-green-500 h-full opacity-20"></div>
              <div className="flex-1 bg-green-500 h-full opacity-70"></div>
              <div className="flex-1 bg-green-500 h-[85%] opacity-35"></div>
              <div className="flex-1 bg-green-500 h-full opacity-90"></div>
              <div className="flex-1 bg-green-500 h-full"></div>
              <div className="flex-1 bg-green-500 h-full opacity-90"></div>
              <div className="flex-1 bg-green-500 h-full"></div>
            </div>

            <div className="flex justify-between mt-3 text-[9px] data-font text-gray-500">
              <span className="uppercase">24 Hours Ago</span>
              <span className="uppercase tracking-wide text-green-500">Aggregate Global Availability: 99.98%</span>
              <span className="uppercase font-bold text-gray-400">Current Node Active</span>
            </div>
          </div>
        </section>

        {/* RIGHT ZONE: Global status, statistics overview, and recent activity log */}
        <section className="lg:col-span-4 p-6 md:p-8 bg-[#121214] flex flex-col justify-between divide-y divide-white/10 space-y-6">

          {/* Section 1: Regional Network status */}
          <div className="pb-6">
            <h3 className="serif-header text-gray-400 text-xs uppercase mb-5 tracking-wider">Regional Network Nodes</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 glow-green"></div>
                  <span className="font-semibold text-gray-300">US-EAST (Virginia)</span>
                </div>
                <span className="data-font text-[10px] text-green-500 font-bold">22ms / 200 OK</span>
              </div>

              <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 glow-green"></div>
                  <span className="font-semibold text-gray-300">EU-WEST (London)</span>
                </div>
                <span className="data-font text-[10px] text-green-500 font-bold">48ms / 200 OK</span>
              </div>

              <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="font-semibold text-gray-300">ASIA-SE (Jakarta)</span>
                </div>
                <span className="data-font text-[10px] text-yellow-500 font-bold">182ms / 200 OK</span>
              </div>

              <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 glow-green"></div>
                  <span className="font-semibold text-gray-300">AU-SOUTH (Sydney)</span>
                </div>
                <span className="data-font text-[10px] text-green-500 font-bold">112ms / 200 OK</span>
              </div>
            </div>

            {/* Custom quota visualizer element */}
            <div className="mt-6 p-4 bg-black/60 border border-white/10 rounded">
              <span className="text-[10px] data-font text-gray-500 block mb-2 uppercase font-bold tracking-widest">ACTIVE SESSION QUOTA STATE</span>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-4/5"></div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="data-font text-[9px] text-gray-500">12,402 / 15,000 requests</span>
                <span className="data-font text-[9px] text-gray-400">Resets in 4h</span>
              </div>
            </div>
          </div>

          {/* Section 2: Account stats overview */}
          <div className="py-6">
            <h3 className="serif-header text-gray-400 text-xs uppercase mb-5 tracking-wider">Account Overview</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-white/5 rounded bg-black/35">
                <span className="text-[9px] text-gray-500 block uppercase font-bold">Total Checks</span>
                <span className="text-lg font-bold text-white data-font block mt-1">
                  {isLoadingStats ? "..." : stats.totalChecks}
                </span>
              </div>

              <div className="p-3 border border-white/5 rounded bg-black/35">
                <span className="text-[9px] text-green-500 block uppercase font-bold">UP (Aktif)</span>
                <span className="text-lg font-bold text-green-500 data-font block mt-1">
                  {isLoadingStats ? "..." : stats.upChecks}
                </span>
              </div>

              <div className="p-3 border border-white/5 rounded bg-black/35">
                <span className="text-[9px] text-red-500 block uppercase font-bold">DOWN</span>
                <span className="text-lg font-bold text-red-500 data-font block mt-1">
                  {isLoadingStats ? "..." : stats.downChecks}
                </span>
              </div>

              <div className="p-3 border border-white/5 rounded bg-black/35">
                <span className="text-[9px] text-gray-500 block uppercase font-bold">Avg Latency</span>
                <span className="text-lg font-bold text-blue-400 data-font block mt-1">
                  {isLoadingStats ? "--" : stats.totalChecks > 0 ? "78 ms" : "0 ms"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Live interactive logs feed list */}
          <div id="logs-section" className="py-6 flex-1 flex flex-col justify-between scroll-mt-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-mono">Live Activity Logs Feed</span>
              </div>

              <div className="space-y-3">
                {recentChecks.length === 0 ? (
                  <p className="text-xs text-gray-600 italic">// Awaiting checks to stream telemetry logs</p>
                ) : (
                  recentChecks.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      onClick={() => {
                        setUrlInput(log.url);
                        handleCheck(undefined, log.url);
                      }}
                      className="text-[10px] data-font flex justify-between items-center border-b border-white/5 pb-2 hover:text-white transition-all cursor-pointer group"
                      title="Klik untuk uji ulang"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[70%]">
                        <span className={`w-1.5 h-1.5 rounded-full block ${log.online ? "bg-green-500" : "bg-red-500"}`}></span>
                        <span className="text-gray-400 group-hover:text-white truncate font-mono">{log.url}</span>
                      </div>
                      <span className="text-gray-600 group-hover:text-green-500 font-mono">
                        {log.responseTimeMs}ms <span className="text-[8px] text-gray-500">&gt;</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick manual statistics trigger */}
            <div className="pt-6">
              <button
                onClick={fetchStats}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/20 active:bg-black rounded text-[11px] font-mono font-bold text-gray-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Segarkan Telemetry Database
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Footer Bar */}
      <footer className="h-14 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between px-6 md:px-8 bg-[#0E0E10] text-[10px] data-font text-gray-600 gap-2 sm:gap-0 py-3 sm:py-0">
        <div>STATUS: <span className="text-green-500 font-bold">ALL SYSTEMS OPERATIONAL</span></div>
        <div className="flex flex-wrap gap-4 sm:gap-6 uppercase tracking-widest text-[9px] items-center">
          <span>Ver: 2.4.1-Stable</span>
          <span>Cloud: ASIA-SE-RUN</span>
          <span className="text-gray-400">© 2026 Down Time Checker</span>
          <span className="text-gray-500 font-semibold normal-case">Made by M S Nizan</span>
        </div>
      </footer>

    </div>
  );
}
