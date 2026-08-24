import React, { useState, useEffect } from 'react';
import { EmailLog } from '../../types/index.js';
import { adminApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import {
  Mail,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Loader2,
  X,
  Eye,
} from 'lucide-react';

export const EmailAuditQueue: React.FC = () => {
  const { success, error } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedPreviewEmail, setSelectedPreviewEmail] = useState<EmailLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getEmailLogs(statusFilter);
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      setRetryingId(id);
      const res = await adminApi.retryEmail(id);
      if (res.data.success) {
        success(res.data.message || 'Email retried successfully!');
        fetchLogs();
      } else {
        error(res.data.message || 'Retry failed.');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to retry email.');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-teal-500" />
            Email Notification & Retry Queue Audit ({logs.length} logged)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time delivery log with automatic Ethereal email HTML render previews and exponential backoff.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {['ALL', 'SENT', 'PENDING', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 glass-card rounded-2xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Mail className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No email records found
          </h4>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isRetrying = retryingId === log.id;
            const isSent = log.status === 'SENT';
            const isFailed = log.status === 'FAILED';

            return (
              <div
                key={log.id}
                className="glass-card-hover rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase ${
                        isSent
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                          : isFailed
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {isSent ? <CheckCircle2 className="w-3 h-3" /> : isFailed ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {log.status}
                    </span>

                    <span className="font-semibold text-slate-400">
                      {log.templateType}
                    </span>
                    <span className="text-slate-400">• Attempts: {log.attempts}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {log.subject}
                  </h4>

                  <div className="text-slate-500 dark:text-slate-400">
                    To: <strong>{log.recipient}</strong> {log.recipientName && `(${log.recipientName})`}
                  </div>

                  {log.lastError && (
                    <div className="text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                      Error: {log.lastError}
                    </div>
                  )}
                </div>

                {/* Actions: View Live Rendered HTML Modal or Retry */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                  <button
                    onClick={() => setSelectedPreviewEmail(log)}
                    className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Email HTML Preview</span>
                  </button>



                  {!isSent && (
                    <button
                      onClick={() => handleRetry(log.id)}
                      disabled={isRetrying}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 transition-all"
                    >
                      {isRetrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      <span>Retry Dispatch</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rendered Email Preview Modal */}
      {selectedPreviewEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-teal-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Email Dispatch Preview
                </h3>
              </div>
              <button
                onClick={() => setSelectedPreviewEmail(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div><strong>Subject:</strong> {selectedPreviewEmail.subject}</div>
              <div><strong>To:</strong> {selectedPreviewEmail.recipient} {selectedPreviewEmail.recipientName && `(${selectedPreviewEmail.recipientName})`}</div>
              <div><strong>Template:</strong> {selectedPreviewEmail.templateType}</div>
              <div><strong>Status:</strong> {selectedPreviewEmail.status} (Attempts: {selectedPreviewEmail.attempts})</div>
            </div>

            {/* Email HTML Container */}
            <div className="p-4 rounded-2xl bg-white text-slate-900 border border-slate-200 min-h-[160px] text-xs">
              {selectedPreviewEmail.contentHtml ? (
                <div dangerouslySetInnerHTML={{ __html: selectedPreviewEmail.contentHtml }} />
              ) : (
                <div className="space-y-3">
                  <div className="font-bold text-teal-700 text-sm">SwasthyaPulse Healthcare Notification</div>
                  <p>Dear {selectedPreviewEmail.recipientName || 'Patient'},</p>
                  <p>Your appointment and consultation updates have been registered successfully in SwasthyaPulse.</p>
                  <div className="p-2 bg-teal-50 rounded-lg text-teal-800 border border-teal-200 font-mono text-[11px]">
                    Status: {selectedPreviewEmail.status} • Delivery Protocol: Ethereal SMTP / Database Queue Worker
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPreviewEmail(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
