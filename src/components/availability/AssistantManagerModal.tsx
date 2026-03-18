'use client';

import { useState, useEffect } from 'react';
import { 
  Assistant, 
  getMyAssistants, 
  addAssistant, 
  removeAssistant, 
  updateAssistantPermissions 
} from '@/lib/api/assistants';

interface AssistantManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssistantManagerModal({ isOpen, onClose }: AssistantManagerModalProps) {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAssistants();
    }
  }, [isOpen]);

  const loadAssistants = async () => {
    try {
      setLoading(true);
      const data = await getMyAssistants();
      setAssistants(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      setIsAdding(true);
      setError('');
      await addAssistant({ assistantEmail: newEmail.trim() });
      setNewEmail('');
      await loadAssistants();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this assistant?')) return;
    try {
      await removeAssistant(id);
      await loadAssistants();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const togglePermission = async (assistant: Assistant, field: 'manageSlots' | 'manageBookings') => {
    try {
      await updateAssistantPermissions(assistant.id, {
        [field]: !assistant.permissions[field]
      });
      await loadAssistants();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manage Assistants</h2>
            <p className="text-sm text-slate-500">Authorize others to manage your schedule and bookings</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Add Form */}
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter assistant's email address..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAdding || !newEmail}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
            >
              {isAdding ? 'Adding...' : 'Add Assistant'}
            </button>
          </form>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* List */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Your Assistants</h3>
            
            {loading ? (
              <div className="py-10 text-center text-slate-400">Loading assistants...</div>
            ) : assistants.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400">
                No assistants added yet.
              </div>
            ) : (
              <div className="grid gap-3">
                {assistants.map((assistant) => (
                  <div key={assistant.id} className="p-4 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                        {assistant.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{assistant.name}</div>
                        <div className="text-xs text-slate-500">{assistant.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={assistant.permissions.manageSlots}
                            onChange={() => togglePermission(assistant, 'manageSlots')}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-600 group-hover:text-slate-900">Slots</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={assistant.permissions.manageBookings}
                            onChange={() => togglePermission(assistant, 'manageBookings')}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-600 group-hover:text-slate-900">Bookings</span>
                        </label>
                      </div>

                      <button
                        onClick={() => handleRemove(assistant.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove Assistant"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
