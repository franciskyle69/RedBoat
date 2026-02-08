import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { fetchActivityLogs, ActivityLogItem } from '../../api/activity';
import '../../styles/main.css';

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function formatWhat(log: ActivityLogItem) {
  return `${log.action} on ${log.resource}`;
}

function formatWho(log: ActivityLogItem) {
  const who = log.actorEmail || '—';
  const role = log.actorRole ? ` (${log.actorRole})` : '';
  return `${who}${role}`;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const limit = 20;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchActivityLogs({
        page,
        limit,
        q: search.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setLogs(res.data);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    load();
  };

  return (
    <AdminLayout pageTitle="Activity Logs">
      <div className="reports-controls" style={{ marginBottom: '1rem' }}>
        <div className="date-range-selector date-range-selector--responsive" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <input
            type="text"
            className="input"
            placeholder="Search email, action, or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ minWidth: 200, maxWidth: 280 }}
          />
          <input
            type="date"
            className="input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="From date"
          />
          <input
            type="date"
            className="input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="To date"
          />
          <button type="button" className="admin-button" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Who</th>
              <th>What</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} style={{ padding: 16 }}>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={4} style={{ padding: 16, color: 'var(--danger, #b91c1c)' }}>
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && logs.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 16 }}>
                  No activity found.
                </td>
              </tr>
            )}
            {!loading && !error && logs.map((log) => (
              <tr key={log._id}>
                <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                <td>{formatWho(log)}</td>
                <td>{formatWhat(log)}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{
                      background: log.status === 'failure' ? '#fee2e2' : '#dcfce7',
                      color: log.status === 'failure' ? '#b91c1c' : '#166534',
                      fontSize: '0.75rem',
                    }}
                  >
                    {log.status || 'success'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 0',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ color: 'var(--text-muted, #64748b)', fontSize: 14 }}>
          Page {page} of {pages || 1} · {total} total
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="admin-button secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="admin-button secondary"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
