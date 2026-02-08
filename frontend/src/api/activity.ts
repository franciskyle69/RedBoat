import { API_BASE_URL } from '../config/api';

export interface ActivityLogItem {
  _id: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ip?: string;
  userAgent?: string;
  status?: 'success' | 'failure';
  createdAt: string;
}

export interface ActivityLogResponse {
  data: ActivityLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ActivityLogQuery {
  page?: number;
  limit?: number;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
}

function buildQuery(params: ActivityLogQuery): string {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.q?.trim()) search.set('q', params.q.trim());
  if (params.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params.dateTo) search.set('dateTo', params.dateTo);
  const s = search.toString();
  return s ? `?${s}` : '';
}

export async function fetchActivityLogs(params: ActivityLogQuery = {}): Promise<ActivityLogResponse> {
  const url = `${API_BASE_URL}/activity/logs${buildQuery(params)}`;
  const res = await fetch(url, { credentials: 'include' });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    const message = (json as any).message || 'Failed to fetch activity logs';
    throw new Error(message);
  }
  return json as ActivityLogResponse;
}
