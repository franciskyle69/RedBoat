import React, { useEffect, useMemo, useState, createElement } from "react";
import "../../styles/main.css";
import { useNotifications } from "../../contexts/NotificationContext";
import AdminLayout from "../../components/AdminLayout";
import AdminTableContainer from "../../components/admin/AdminTableContainer";
import { confirmDialog } from "../../utils/adminSwal";
import { FiRefreshCw, FiEdit2, FiCheck, FiX, FiAlertCircle, FiClock, FiCheckCircle, FiFilter, FiUser } from "react-icons/fi";
import type { IconType } from "react-icons";
import { API_BASE_URL } from "../../config/api";

// Wrapper to fix react-icons v5 TypeScript compatibility with older TypeScript
const Icon = ({ icon, className }: { icon: IconType; className?: string }): JSX.Element => {
  return createElement(icon as React.ComponentType<{ className?: string }>, { className });
};

type HKStatus = 'clean' | 'dirty' | 'in-progress';

interface HKRoom {
  _id: string;
  roomNumber: string;
  roomType: string;
  housekeepingStatus?: HKStatus;
  lastCleanedAt?: string;
  assignedHousekeeper?: string;
}

interface HKSummaryCounts {
  clean: number;
  dirty: number;
  'in-progress': number;
}

function Housekeeping() {
  const { notify } = useNotifications();
  const [rooms, setRooms] = useState<HKRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<HKStatus | 'all'>('all');
  const [localAssigned, setLocalAssigned] = useState<Record<string, string>>({});
  const [isEditingAssigned, setIsEditingAssigned] = useState<Record<string, boolean>>({});
  const [summaryCounts, setSummaryCounts] = useState<HKSummaryCounts | null>(null);

  useEffect(() => {
    fetchHK();
  }, []);

  const fetchHK = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/housekeeping`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        const mapped = (data.data || []).map((r: any) => ({
          _id: r._id,
          roomNumber: r.roomNumber,
          roomType: r.roomType,
          housekeepingStatus: r.housekeepingStatus || 'clean',
          lastCleanedAt: r.lastCleanedAt,
          assignedHousekeeper: r.assignedHousekeeper,
        }));
        setRooms(mapped);
        if (data.summary && data.summary.counts) {
          setSummaryCounts({
            clean: data.summary.counts.clean || 0,
            dirty: data.summary.counts.dirty || 0,
            'in-progress': data.summary.counts['in-progress'] || 0,
          });
        } else {
          setSummaryCounts(null);
        }
        // Initialize local input values so typing doesn't trigger saves
        const initialAssigned: Record<string, string> = {};
        const initialEditing: Record<string, boolean> = {};
        mapped.forEach((r: HKRoom) => {
          initialAssigned[r._id] = r.assignedHousekeeper || '';
          initialEditing[r._id] = false;
        });
        setLocalAssigned(initialAssigned);
        setIsEditingAssigned(initialEditing);
      } else {
        setMessage(data.message || "Failed to load housekeeping data");
      }
    } catch (e) {
      console.error(e);
      setMessage("Error loading housekeeping data");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (roomId: string, housekeepingStatus: HKStatus, roomNumber?: string) => {
    const statusLabel =
      housekeepingStatus === 'dirty'
        ? 'Dirty'
        : housekeepingStatus === 'in-progress'
          ? 'In Progress'
          : 'Clean';

    const labelWithRoom = roomNumber
      ? `Room ${roomNumber} as ${statusLabel}`
      : `this room as ${statusLabel}`;

    const isConfirmed = await confirmDialog({
      title: 'Change housekeeping status?',
      text: `Are you sure you want to mark ${labelWithRoom}?`,
      confirmText: 'Yes, update',
      icon: 'question',
    });

    if (!isConfirmed) return;

    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/housekeeping/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ housekeepingStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Housekeeping status updated');
        notify('Housekeeping status updated', 'success');
        await fetchHK();
      } else {
        const msg = data.message || 'Failed to update status';
        setMessage(msg);
        notify(msg, 'error');
      }
    } catch (e) {
      console.error(e);
      setMessage('Error updating status');
      notify('Error updating status', 'error');
    }
  };

  const assignHousekeeper = async (roomId: string, assignedHousekeeper: string) => {
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/housekeeping/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assignedHousekeeper }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Housekeeper assigned');
        notify('Housekeeper assigned', 'success');
        // Update local state only; avoid immediate full refetch while typing
        setRooms(prev => prev.map(r => r._id === roomId ? { ...r, assignedHousekeeper } : r));
      } else {
        const msg = data.message || 'Failed to assign housekeeper';
        setMessage(msg);
        notify(msg, 'error');
      }
    } catch (e) {
      console.error(e);
      setMessage('Error assigning housekeeper');
      notify('Error assigning housekeeper', 'error');
    }
  };

  const filteredRooms = useMemo(() => {
    if (filter === 'all') return rooms;
    return rooms.filter(r => (r.housekeepingStatus || 'clean') === filter);
  }, [rooms, filter]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredRooms.length / pageSize)),
    [filteredRooms.length]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, rooms.length]);

  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRooms.slice(start, start + pageSize);
  }, [filteredRooms, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;

  const getStatusIcon = (status: HKStatus): JSX.Element | null => {
    switch (status) {
      case 'dirty':
        return <Icon icon={FiAlertCircle} className="status-icon" />;
      case 'in-progress':
        return <Icon icon={FiClock} className="status-icon" />;
      case 'clean':
        return <Icon icon={FiCheckCircle} className="status-icon" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: HKStatus) => {
    switch (status) {
      case 'dirty':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'clean':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusFilters: { value: HKStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Rooms' },
    { value: 'dirty', label: 'Dirty' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'clean', label: 'Clean' },
  ];

  return (
    <AdminLayout pageTitle="Housekeeping">
      <div className="bookings-content">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Housekeeping Dashboard</h2>
          <button
            onClick={fetchHK}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon icon={FiRefreshCw} className={`${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.toLowerCase().includes('error') || message.toLowerCase().includes('fail')
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Status Summary Cards */}
        {summaryCounts && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {Object.entries(summaryCounts).map(([status, count]) => (
              <div
                key={status}
                className={`p-6 rounded-xl shadow-sm border ${
                  status === 'dirty' ? 'border-red-100 bg-red-50' :
                    status === 'in-progress' ? 'border-yellow-100 bg-yellow-50' :
                      'border-green-100 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                      {status === 'in-progress' ? 'In Progress' : status}
                    </p>
                    <p className="mt-2 text-3xl font-bold">{count}</p>
                  </div>
                  <div className={`p-3 rounded-full ${
                    status === 'dirty' ? 'bg-red-100 text-red-600' :
                      status === 'in-progress' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                  }`}>
                    {getStatusIcon(status as HKStatus)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === value
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500">No rooms match the selected filter.</p>
            <button
              onClick={() => setFilter('all')}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <AdminTableContainer>
            <table className="bookings-table">
              <thead>
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Cleaned
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Housekeeper
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRooms.map((room) => {
                    const status = room.housekeepingStatus || 'clean';
                    return (
                      <tr key={room._id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900">Room {room.roomNumber}</div>
                          <div className="text-sm text-gray-500">{room.roomType}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status as HKStatus)}`}>
                            {getStatusIcon(status as HKStatus)}
                            <span className="ml-1">{status.replace('-', ' ')}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {room.lastCleanedAt
                            ? new Date(room.lastCleanedAt).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditingAssigned[room._id] ? (
                            <div className="housekeeping-assign-editor">
                              <input
                                type="text"
                                value={localAssigned[room._id] ?? ''}
                                onChange={(e) =>
                                  setLocalAssigned((prev) => ({ ...prev, [room._id]: e.target.value }))
                                }
                                placeholder="Enter name"
                                className="housekeeping-assigned-input"
                              />
                              <button
                                onClick={async () => {
                                  await assignHousekeeper(room._id, localAssigned[room._id] ?? '');
                                  setIsEditingAssigned((prev) => ({ ...prev, [room._id]: false }));
                                }}
                                className="housekeeping-assign-icon save"
                                title="Save"
                              >
                                <Icon icon={FiCheck} />
                              </button>
                              <button
                                onClick={() => {
                                  setLocalAssigned((prev) => ({
                                    ...prev,
                                    [room._id]: room.assignedHousekeeper || '',
                                  }));
                                  setIsEditingAssigned((prev) => ({ ...prev, [room._id]: false }));
                                }}
                                className="housekeeping-assign-icon cancel"
                                title="Cancel"
                              >
                                <Icon icon={FiX} />
                              </button>
                            </div>
                          ) : (
                            <div className="housekeeping-assign-display">
                              <span>{room.assignedHousekeeper?.trim() || 'Unassigned'}</span>
                              <button
                                onClick={() =>
                                  setIsEditingAssigned((prev) => ({ ...prev, [room._id]: true }))
                                }
                                className="housekeeping-assign-icon edit"
                                title="Edit assignment"
                              >
                                <Icon icon={FiEdit2} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => updateStatus(room._id, 'dirty', room.roomNumber)}
                              className={`housekeeping-status-button dirty ${
                                status === 'dirty' ? 'active' : ''
                              }`}
                            >
                              Dirty
                            </button>
                            <button
                              onClick={() => updateStatus(room._id, 'in-progress', room.roomNumber)}
                              className={`housekeeping-status-button in-progress ${
                                status === 'in-progress' ? 'active' : ''
                              }`}
                            >
                              In Progress
                            </button>
                            <button
                              onClick={() => updateStatus(room._id, 'clean', room.roomNumber)}
                              className={`housekeeping-status-button clean ${
                                status === 'clean' ? 'active' : ''
                              }`}
                            >
                              Clean
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
              <div>
                Showing {startIndex + 1}
                –
                {Math.min(startIndex + pageSize, filteredRooms.length)} of {filteredRooms.length} rooms
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || filteredRooms.length === 0}
                >
                  Next
                </button>
              </div>
            </div>
          </AdminTableContainer>
        )}
      </div>
    </AdminLayout>
  );
}

export default Housekeeping;
