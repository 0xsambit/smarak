import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Clock } from 'lucide-react';
import type { CriticalAlert, DashboardScope, IncidentsBySeverity } from '../../types/dashboard';

interface RiskAlertPanelProps {
  scope: DashboardScope;
  incidentsBySeverity: IncidentsBySeverity;
  alerts: CriticalAlert[];
  onRespond: (id: string) => Promise<void>;
}

const severityClasses = {
  HIGH: 'bg-red-50 text-red-700 border-red-100',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-100',
  LOW: 'bg-stone-100 text-stone-600 border-stone-200',
};

const RiskAlertPanel: React.FC<RiskAlertPanelProps> = ({ scope, incidentsBySeverity, alerts, onRespond }) => {
  const [selectedAlert, setSelectedAlert] = useState<CriticalAlert | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeModal = () => {
    setSelectedAlert(null);
    setError(null);
  };

  const handleRespond = async () => {
    if (!selectedAlert) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onRespond(selectedAlert.id);
      closeModal();
    } catch (responseError: any) {
      setError(responseError?.response?.data?.message || 'Unable to update incident status right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const scopeLabel = scope === 'national' ? 'National' : scope === 'state' ? 'State' : 'Site';

  return (
    <>
      <div id="critical-alerts" className="flex h-full flex-col rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 p-4">
          <h3 className="flex items-center gap-2 font-serif font-medium text-stone-900">
            <AlertCircle className="h-4 w-4 text-stone-500" />
            Critical Alerts
          </h3>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
            {incidentsBySeverity.HIGH} Critical
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="flex h-full min-h-56 items-center justify-center px-4 text-center text-sm text-stone-500">
              No high-severity unresolved incidents are open for this scope.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {alerts.map((alert) => (
                <div key={alert.id} className="border-l-4 border-transparent p-4 transition-colors hover:border-l-stone-400 hover:bg-stone-50">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <h4 className="text-sm font-semibold text-stone-800">{alert.site}</h4>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${severityClasses[alert.severity]}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-stone-700">{alert.type}</p>
                  <div className="mt-2 flex items-center justify-between gap-4 text-xs text-stone-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Open for {alert.daysOpen} day(s)</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAlert(alert);
                        setError(null);
                      }}
                      className="inline-flex items-center gap-1 font-medium text-stone-500 transition-colors hover:text-stone-900"
                    >
                      View Detail
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedAlert ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <button onClick={closeModal} className="absolute inset-0 bg-black/40" aria-label="Close alert details" />
          <div className="relative w-full max-w-lg rounded-xl border border-stone-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-stone-100 p-5">
              <div>
                <h3 className="text-lg font-medium text-stone-900">Critical Alert Details</h3>
                <p className="mt-1 text-xs text-stone-500">{scopeLabel} incident response view</p>
              </div>
              <button onClick={closeModal} className="text-sm text-stone-400 hover:text-stone-700">
                Close
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">Site</p>
                  <p className="text-sm font-semibold text-stone-900">{selectedAlert.site}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">Status</p>
                  <p className="text-sm font-semibold text-stone-900">{selectedAlert.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">Severity</p>
                  <p className="text-sm font-semibold text-red-700">{selectedAlert.severity}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-400">Open Duration</p>
                  <p className="text-sm font-semibold text-stone-900">{selectedAlert.daysOpen} day(s)</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-400">Issue</p>
                <p className="mt-1 text-sm font-medium text-stone-900">{selectedAlert.type}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-400">Description</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-700">{selectedAlert.description}</p>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-stone-100 px-5 py-4">
              <button
                onClick={closeModal}
                className="rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              >
                Close
              </button>
              <button
                onClick={handleRespond}
                disabled={!selectedAlert.canRespond || submitting}
                className="rounded-md bg-stone-900 px-3 py-2 text-sm text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!selectedAlert.canRespond
                  ? 'Response Active'
                  : submitting
                    ? 'Updating...'
                    : 'Mark In Progress'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default RiskAlertPanel;
