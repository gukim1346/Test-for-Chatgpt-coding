import { useEffect, useState } from 'react';
import { useRecordingsStore } from '../stores/recordingsStore';
import { api } from '../utils/api';
import { useToast } from '../providers/ToastProvider';

const RecordingsPage = () => {
  const items = useRecordingsStore((state) => state.items);
  const fetchRecordings = useRecordingsStore((state) => state.fetchRecordings);
  const deleteRecording = useRecordingsStore((state) => state.deleteRecording);
  const loading = useRecordingsStore((state) => state.loading);
  const { showToast } = useToast();
  const [selectedRecording, setSelectedRecording] = useState<{ id: string; url: string; mime: string } | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const handlePlay = async (id: string) => {
    try {
      const response = await api.get<{ id: string; url: string; mime: string }>(`/api/recordings/${id}`);
      setSelectedRecording(response.data);
    } catch (error) {
      showToast({ message: 'Failed to load recording', tone: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recording?')) return;
    try {
      await deleteRecording(id);
      showToast({ message: 'Recording deleted', tone: 'info' });
    } catch (error) {
      showToast({ message: 'Failed to delete recording', tone: 'error' });
    }
  };

  const applyFilter = () => {
    fetchRecordings({ q: query });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-800">Recordings</h1>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search recordings"
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={applyFilter}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500"
          >
            Search
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Thumbnail</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  {loading ? 'Loading…' : 'No recordings available.'}
                </td>
              </tr>
            ) : (
              items.map((recording) => (
                <tr key={recording.id} className="bg-white">
                  <td className="px-4 py-3">
                    {recording.thumbUrl ? (
                      <img src={recording.thumbUrl} alt="Thumbnail" className="h-16 w-28 rounded object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">No preview</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(recording.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{recording.durationSec}s</td>
                  <td className="px-4 py-3 text-slate-600">{recording.sizeMB.toFixed(2)} MB</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePlay(recording.id)}
                        className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring focus-visible:ring-emerald-500"
                      >
                        Play
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/recordings/${recording.id}`)}
                        className="rounded bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleDelete(recording.id)}
                        className="rounded bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 focus:outline-none focus-visible:ring focus-visible:ring-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedRecording && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 p-4" role="dialog" aria-modal>
          <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-700">Recording preview</h2>
              <button onClick={() => setSelectedRecording(null)} className="text-sm text-slate-500 hover:text-slate-700">
                Close
              </button>
            </div>
            <video controls className="mt-3 w-full rounded" src={selectedRecording.url} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingsPage;
