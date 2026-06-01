export interface CheckLog {
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

export interface Stats {
  totalChecks: number;
  upChecks: number;
  downChecks: number;
}

export interface StatsResponse {
  success: boolean;
  stats: Stats;
  recentChecks: CheckLog[];
}

export interface CheckResponse {
  success: boolean;
  data: CheckLog;
  error?: string;
}
