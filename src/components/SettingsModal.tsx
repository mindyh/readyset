import React, { useState } from "react";
import { AppSettings, EmailLog } from "../types";
import {
  X,
  Settings,
  Mail,
  Server,
  Clock,
  HelpCircle,
  History,
  Check,
  Eye,
  FileCode,
  UserPlus,
  ExternalLink
} from "lucide-react";

interface SettingsModalProps {
  id: string;
  settings: AppSettings;
  emailLogs: EmailLog[];
  onClose: () => void;
  onSave: (updatedSettings: AppSettings) => void;
  onClearLogs: () => void;
}

export default function SettingsModal({
  id,
  settings,
  emailLogs,
  onClose,
  onSave,
  onClearLogs
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "smtp" | "logs">("general");
  const [recipientEmails, setRecipientEmails] = useState(settings.recipientEmails);
  const [reminderDays, setReminderDays] = useState(settings.reminderDays);
  const [hubSubtitle, setHubSubtitle] = useState(settings.hubSubtitle ?? "subtitle");

  // SMTP Settings State
  const [smtpEnabled, setSmtpEnabled] = useState(settings.smtp?.enabled ?? false);
  const [smtpHost, setSmtpHost] = useState(settings.smtp?.host ?? "smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(settings.smtp?.port ?? 465);
  const [smtpSecure, setSmtpSecure] = useState(settings.smtp?.secure ?? true);
  const [smtpUser, setSmtpUser] = useState(settings.smtp?.user ?? "");
  const [smtpPass, setSmtpPass] = useState(settings.smtp?.pass ?? "");
  const [smtpFrom, setSmtpFrom] = useState(settings.smtp?.from ?? "");

  // Log View state
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // Test SMTP State
  const [testRecipient, setTestRecipient] = useState(settings.recipientEmails?.split(",")[0]?.trim() || "");
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTestEmail = async () => {
    if (!smtpHost || !smtpUser || !smtpPass) {
      setTestResult({ success: false, message: "Please enter your SMTP Host, Username, and Password to run a test." });
      return;
    }
    setIsTestingSmtp(true);
    setTestResult(null);

    try {
      const payload = {
        smtp: {
          enabled: true,
          host: smtpHost,
          port: Number(smtpPort),
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          from: smtpFrom || undefined,
        },
        recipient: testRecipient
      };

      const response = await fetch("/api/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTestResult({ success: true, message: data.message || "Test email sent successfully!" });
      } else {
        setTestResult({ success: false, message: data.error || "Failed to send test email. Double-check your parameters." });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || "A network error occurred while testing SMTP configuration." });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSave = () => {
    onSave({
      recipientEmails,
      reminderDays: Number(reminderDays),
      hubSubtitle,
      smtp: {
        enabled: smtpEnabled,
        host: smtpHost,
        port: Number(smtpPort),
        secure: smtpSecure,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
      }
    });
    onClose();
  };

  return (
    <div id={id} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 text-white flex items-center justify-between shrink-0 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-400" />
            <h2 className="font-extrabold tracking-tight text-md">
              Tracker Settings & Dashboard Configuration
            </h2>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-gray-100 flex border-b border-gray-200 shrink-0">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${activeTab === "general"
              ? "border-indigo-600 bg-white text-indigo-700"
              : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> General Alerts
            </span>
          </button>
          <button
            onClick={() => setActiveTab("smtp")}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${activeTab === "smtp"
              ? "border-indigo-600 bg-white text-indigo-700"
              : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Server className="h-3.5 w-3.5" /> SMTP Server
            </span>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${activeTab === "logs"
              ? "border-indigo-600 bg-white text-indigo-700"
              : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <History className="h-3.5 w-3.5" /> Email Logs ({emailLogs.length})
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* TAB 1: General Notifications settings */}
          {activeTab === "general" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Household Email Addresses (Comma Separated)
                </label>
                <div className="relative">
                  <input
                    id="input-recipient-emails"
                    type="text"
                    value={recipientEmails}
                    onChange={(e) => setRecipientEmails(e.target.value)}
                    placeholder="fake@example.com"
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <UserPlus className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Separate spouses, family members, or emergency handlers to receive parallel digests when supplies check out or expire.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Default Borrow/Checkout Reminder Duration (Days)
                </label>
                <div className="relative">
                  <input
                    id="input-reminder-interval"
                    type="number"
                    min="1"
                    max="365"
                    value={reminderDays}
                    onChange={(e) => setReminderDays(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  When you remove emergency gear (e.g. pants, battery bank) on the go, the system alerts you after this duration to restore them to the kit.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Tracker Subtitle / Location Label
                </label>
                <div className="relative">
                  <input
                    id="input-hub-subtitle"
                    type="text"
                    value={hubSubtitle}
                    onChange={(e) => setHubSubtitle(e.target.value)}
                    placeholder="e.g. Family Safety Hub"
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Settings className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Change the sub-heading label displayed below the "ReadySet" title in the header.
                </p>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex gap-3 text-xs leading-relaxed text-blue-800">
                <HelpCircle className="h-5 w-5 text-indigo-500 shrink-0" />
                <div>
                  <span className="font-bold">Home Server Note:</span> Since you are self-hosting under Portainer, you can map the host storage volume to `/app/data/db.json` to keep these settings safe permanently. Checks run and are logged right inside the container.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMTP server credentials */}
          {activeTab === "smtp" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Enable Live SMTP Emails</h3>
                  <p className="text-xs text-gray-400">If disabled, email logs will be simulated in the outbox below.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    id="chk-smtp-enabled"
                    type="checkbox"
                    checked={smtpEnabled}
                    onChange={(e) => setSmtpEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {smtpEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-100 p-4 rounded-2xl bg-white shadow-2xs">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">SMTP Host</label>
                    <input
                      id="smtp-host"
                      type="text"
                      placeholder="mail.example.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">SMTP Port</label>
                    <input
                      id="smtp-port"
                      type="number"
                      placeholder="587"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-800 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-4 md:col-span-2">
                    <input
                      id="smtp-secure"
                      type="checkbox"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="smtp-secure" className="text-xs font-bold text-gray-600">Use Secure TLS/SSL Connection</label>
                  </div>

                  <div className="md:col-span-2 border-t border-gray-100 my-1"></div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Username / Auth User</label>
                    <input
                      id="smtp-user"
                      type="text"
                      placeholder="user@example.com"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password / Secret</label>
                    <input
                      id="smtp-pass"
                      type="password"
                      placeholder="••••••••••••••"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-800 focus:outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Sender 'From' Name (optional)</label>
                    <input
                      id="smtp-from"
                      type="text"
                      placeholder="ReadySet <user@example.com>"
                      value={smtpFrom}
                      onChange={(e) => setSmtpFrom(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-800 focus:outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-2 border-t border-gray-100 my-2"></div>

                  {/* Test Email Section */}
                  <div className="md:col-span-2 bg-indigo-50/20 p-4 rounded-xl border border-indigo-150/70">
                    <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                      🧪 Send Test Alert Email Digest
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 mb-3">
                      Send an alert summary message to confirm your daily digest settings, host, credentials, and email template visual layout behave correctly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        id="smtp-test-recipient"
                        type="email"
                        placeholder="test-recipient@example.com"
                        value={testRecipient}
                        onChange={(e) => setTestRecipient(e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-hidden"
                      />
                      <button
                        id="btn-send-test-email"
                        type="button"
                        onClick={handleSendTestEmail}
                        disabled={isTestingSmtp}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition text-nowrap flex items-center justify-center gap-1.5 ${isTestingSmtp
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                          }`}
                      >
                        {isTestingSmtp ? "Sending Alert..." : "Send Test Alert"}
                      </button>
                    </div>
                    {testResult && (
                      <div className={`mt-3 p-2.5 rounded-lg border text-[11px] font-medium leading-relaxed ${testResult.success
                        ? "bg-emerald-50 text-emerald-850 border-emerald-150"
                        : "bg-rose-50 text-rose-850 border-rose-150"
                        }`}>
                        {testResult.message}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Email Audit Logs & Previews */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Household Email Outbox Logs
                </span>
                {emailLogs.length > 0 && (
                  <button
                    id="btn-clear-logs"
                    onClick={onClearLogs}
                    className="text-[10px] uppercase font-bold tracking-wider text-rose-500 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded transition"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {emailLogs.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Mail className="h-8 w-8 text-gray-300" />
                  <h4 className="mt-2 text-sm font-bold text-gray-600">Outbox is Clean</h4>
                  <p className="mt-1 text-xs text-gray-400 max-w-sm">
                    No emails have been triggered yet. Alerts are scanned and sent automatically once a day when items expire or go missing.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Selected Log Visual Card Preview */}
                  {selectedLog ? (
                    <div className="border border-indigo-200 rounded-2xl bg-indigo-50/50 p-4 relative">
                      <button
                        onClick={() => setSelectedLog(null)}
                        className="absolute right-3 top-3 text-[10px] uppercase tracking-wider font-extrabold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1 rounded-md"
                      >
                        Close Preview
                      </button>
                      <h4 className="font-bold text-indigo-900 text-sm">{selectedLog.subject}</h4>
                      <p className="text-[10px] text-gray-500 mt-1">
                        To: {selectedLog.to} • Triggered: {new Date(selectedLog.timestamp).toLocaleString()}
                      </p>

                      {/* Formatted HTML code preview in an iframe with fixed height */}
                      <div className="mt-3.5 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                        <iframe
                          title="Email HTML Preview"
                          srcDoc={selectedLog.body}
                          className="w-full h-80 border-0"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Logs list loop */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-2xl bg-white shadow-2xs">
                    {emailLogs.map((log) => (
                      <div
                        id={`log-row-${log.id}`}
                        key={log.id}
                        className="p-3 hover:bg-gray-50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 truncate">{log.subject}</p>
                          <p className="text-[10px] text-gray-450 mt-0.5">
                            Sent to: {log.to} • {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Badge based on state */}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${log.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                            : log.status === 'failed'
                              ? 'bg-rose-50 text-rose-700 border border-rose-150'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                            {log.status === 'sent' ? 'Sent (SMTP)' : log.status === 'failed' ? 'Failed' : 'Simulated'}
                          </span>

                          <button
                            id={`btn-view-log-${log.id}`}
                            onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent rounded transition"
                            title="Inspect Email Output"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
          <button
            id="btn-cancel-settings"
            onClick={onClose}
            className="px-4 py-2 border border-gray-250 text-gray-600 hover:bg-gray-100 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-save-settings"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
