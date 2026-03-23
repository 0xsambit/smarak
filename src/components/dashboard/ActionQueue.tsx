import React, { useMemo, useState } from 'react';
import { CheckCircle, Eye, XCircle } from 'lucide-react';
import type { PendingApproval } from '../../types/dashboard';

interface ActionQueueProps {
  approvals: PendingApproval[];
  currentUserRole?: string;
  onReview: (id: string, status: 'APPROVED' | 'REJECTED', reviewNotes: string) => Promise<void>;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const ActionQueue: React.FC<ActionQueueProps> = ({ approvals, currentUserRole, onReview }) => {
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReview = useMemo(
    () => currentUserRole === 'NATIONAL_ADMIN' || currentUserRole === 'STATE_ADMIN',
    [currentUserRole],
  );

  const openApproval = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setReviewNotes(approval.reviewNotes || '');
    setError(null);
  };

  const closeApproval = () => {
    setSelectedApproval(null);
    setReviewNotes('');
    setError(null);
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedApproval) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onReview(selectedApproval.id, status, reviewNotes.trim());
      closeApproval();
    } catch (reviewError: any) {
      setError(reviewError?.response?.data?.message || 'Unable to review approval right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 p-4">
          <h3 className="font-serif font-medium text-stone-900">Pending Approvals & Actions</h3>
          <span className="text-xs font-medium text-stone-500">{approvals.length} Pending</span>
        </div>

        {approvals.length === 0 ? (
          <div className="flex min-h-56 items-center justify-center px-6 text-center text-sm text-stone-500">
            No pending approvals for this scope.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Request</th>
                  <th className="px-6 py-3 font-medium">Site</th>
                  <th className="px-6 py-3 font-medium">Submitted By</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {approvals.map((approval) => (
                  <tr key={approval.id} className="group transition-colors hover:bg-stone-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900">{approval.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-wide text-stone-500">{approval.type}</div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">{approval.site}</td>
                    <td className="px-6 py-4 text-stone-500">{approval.submittedBy}</td>
                    <td className="px-6 py-4 text-stone-500">{formatDate(approval.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                          approval.priority === 'High'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {approval.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-60 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => openApproval(approval)}
                          className="rounded p-1.5 text-stone-500 hover:bg-stone-200 hover:text-stone-900"
                          aria-label={`View ${approval.title}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canReview ? (
                          <button
                            onClick={() => openApproval(approval)}
                            className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                            aria-label={`Review ${approval.title}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedApproval ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <button
            onClick={closeApproval}
            className="absolute inset-0 bg-black/40"
            aria-label="Close approval details"
          />
          <div className="relative w-full max-w-2xl rounded-xl border border-stone-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-stone-100 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">{selectedApproval.type}</p>
                <h3 className="mt-2 text-lg font-semibold text-stone-900">{selectedApproval.title}</h3>
              </div>
              <button onClick={closeApproval} className="text-sm text-stone-400 hover:text-stone-700">
                Close
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">Site</p>
                  <p className="text-sm font-medium text-stone-900">{selectedApproval.site}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">Submitted By</p>
                  <p className="text-sm font-medium text-stone-900">{selectedApproval.submittedBy}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">Priority</p>
                  <p className="text-sm font-medium text-stone-900">{selectedApproval.priority}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">Created</p>
                  <p className="text-sm font-medium text-stone-900">{formatDate(selectedApproval.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-stone-400">Description</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-700">
                  {selectedApproval.description || 'No additional description was provided.'}
                </p>
              </div>

              {canReview ? (
                <div>
                  <label className="text-xs uppercase tracking-wider text-stone-400" htmlFor="review-notes">
                    Review Notes
                  </label>
                  <textarea
                    id="review-notes"
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:border-stone-400 focus:outline-none"
                    placeholder="Add optional review notes before approving or rejecting."
                  />
                </div>
              ) : null}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 px-5 py-4">
              <button
                onClick={closeApproval}
                className="rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              >
                Close
              </button>
              {canReview ? (
                <>
                  <button
                    onClick={() => handleReview('REJECTED')}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleReview('APPROVED')}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-3 py-2 text-sm text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {submitting ? 'Saving...' : 'Approve'}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ActionQueue;
