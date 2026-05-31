import React, { useState, useEffect } from "react";
import { Kit, KitItem, AppSettings, EmailLog, KitCategory } from "./types";
import MetricCard from "./components/MetricCard";
import KitCard from "./components/KitCard";
import SettingsModal from "./components/SettingsModal";
import {
  Plus,
  Settings,
  Mail,
  RefreshCw,
  Loader2,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FolderHeart,
  X,
  FileCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  Check,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [kits, setKits] = useState<Kit[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [summaryExpanded, setSummaryExpanded] = useState<boolean>(() => {
    return localStorage.getItem("prepTracker_summaryExpanded") !== "false";
  });
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(() => {
    return localStorage.getItem("prepTracker_filtersExpanded") !== "false";
  });

  // Filtering states
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState<boolean>(false);
  const [itemSearchQuery, setItemSearchQuery] = useState<string>("");

  // New kit creations state
  const [showAddKitModal, setShowAddKitModal] = useState(false);
  const [newKitName, setNewKitName] = useState("");
  const [newKitCat, setNewKitCat] = useState<KitCategory>("vehicle");
  const [newKitDesc, setNewKitDesc] = useState("");

  // Add item to multiple kits state
  const [showAddMultiKitModal, setShowAddMultiKitModal] = useState(false);
  const [multiKitItemName, setMultiKitItemName] = useState("");
  const [multiKitItemQty, setMultiKitItemQty] = useState("1");
  const [multiKitItemExpiry, setMultiKitItemExpiry] = useState("");
  const [multiKitItemAlert, setMultiKitItemAlert] = useState(true);
  const [selectedKitIds, setSelectedKitIds] = useState<Set<string>>(new Set());

  // Sub components modal toggling
  const [showSettings, setShowSettings] = useState(false);

  // Alert/Email action run notification banner
  const [triggeringAlert, setTriggeringAlert] = useState(false);
  const [alertResponse, setAlertResponse] = useState<{
    success: boolean;
    message: string;
    expired: number;
    expiringSoon: number;
    reminders: number;
  } | null>(null);

  // Initial full-stack load
  const loadAppData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data");
      const data = await res.json();
      setKits(data.kits || []);
      setSettings(data.settings || null);
      setEmailLogs(data.emailLogs || []);
    } catch (e) {
      console.error("Critical error while reading DB endpoints:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  // Universal Save Backer Helper
  const syncWithServer = async (updatedKits: Kit[], updatedSettings?: AppSettings, updatedLogs?: EmailLog[]) => {
    try {
      const nextSettings = updatedSettings || settings;
      const nextLogs = updatedLogs || emailLogs;

      if (!nextSettings) return;

      const payload = {
        kits: updatedKits,
        settings: nextSettings,
        emailLogs: nextLogs
      };

      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Failed to commit updates to database", e);
    }
  };

  // 1. Audit / update singular Kit
  const handleUpdateKit = async (updatedKit: Kit) => {
    const nextKits = kits.map(k => k.id === updatedKit.id ? updatedKit : k);
    setKits(nextKits);
    await syncWithServer(nextKits);
  };

  // 2. Add New Kit
  const handleCreateKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKitName.trim()) return;

    try {
      const response = await fetch("/api/kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKitName.trim(),
          category: newKitCat,
          description: newKitDesc.trim()
        })
      });
      const resJson = await response.json();

      if (resJson.success && resJson.kit) {
        const nextKits = [...kits, resJson.kit];
        setKits(nextKits);

        // Reset state
        setNewKitName("");
        setNewKitDesc("");
        setNewKitCat("vehicle");
        setShowAddKitModal(false);
      }
    } catch (er) {
      console.error("Failed to append kit", er);
    }
  };

  // 3. Delete Kit
  const handleDeleteKit = async (kitId: string) => {
    if (!window.confirm("Are you sure you want to delete this Entire Kit and all its supplies? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/kits/${kitId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        const nextKits = kits.filter(k => k.id !== kitId);
        setKits(nextKits);
        await syncWithServer(nextKits);
      }
    } catch (e) {
      console.error("Failed to delete kit", e);
    }
  };

  // 3.5. Add Item to Multiple Kits
  const handleAddItemToMultipleKits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!multiKitItemName.trim() || selectedKitIds.size === 0) return;

    const nextKits = kits.map(kit => {
      if (!selectedKitIds.has(kit.id)) return kit;

      const newItem: KitItem = {
        id: "item_" + Math.random().toString(36).substr(2, 9),
        name: multiKitItemName.trim(),
        quantity: multiKitItemQty.trim() || "1",
        status: "to-pack",
        expirationDate: multiKitItemExpiry || null,
        alertOnExpiration: multiKitItemAlert,
        lastChecked: new Date().toISOString().split("T")[0]
      };

      return {
        ...kit,
        items: [newItem, ...kit.items],
        updatedAt: new Date().toISOString()
      };
    });

    setKits(nextKits);
    await syncWithServer(nextKits);

    // Reset form
    setMultiKitItemName("");
    setMultiKitItemQty("1");
    setMultiKitItemExpiry("");
    setMultiKitItemAlert(true);
    setSelectedKitIds(new Set());
    setShowAddMultiKitModal(false);
  };

  // 4. Save SMTP Settings Drawer
  const handleSaveSettings = async (updatedSettings: AppSettings) => {
    setSettings(updatedSettings);
    // sync settings to db inside memory + file
    await syncWithServer(kits, updatedSettings);
  };

  // 5. Purge Log history
  const handleClearLogs = async () => {
    setEmailLogs([]);
    await syncWithServer(kits, undefined, []);
  };

  // 6. Trigger Email alerts & notifications
  const handleTriggerAlertsNow = async () => {
    try {
      setTriggeringAlert(true);
      setAlertResponse(null);
      const res = await fetch("/api/send-alerts", { method: "POST" });
      const data = await res.json();

      setAlertResponse(data);
      // Reload logged history record lists
      await loadAppData();
    } catch (e) {
      console.error("Fail alerting trigger call", e);
    } finally {
      setTriggeringAlert(false);
    }
  };



  // Helper date utilities
  const isExpired = (item: KitItem) => {
    if (!item.expirationDate) return false;
    const expDate = new Date(item.expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expDate < today;
  };

  const isExpiringSoon = (item: KitItem) => {
    if (!item.expirationDate) return false;
    const expDate = new Date(item.expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expDate < today) return false;
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  // Stats Parsers
  const totalKits = kits.length;
  let totalExpired = 0;
  let totalExpiringSoon = 0;
  let totalBorrowReminders = 0;
  let totalNeedsAction = 0;

  kits.forEach(k => {
    k.items.forEach(item => {
      if (isExpired(item) || item.status === 'expired') totalExpired++;
      else if (isExpiringSoon(item)) totalExpiringSoon++;

      if (item.status === 'removed') totalBorrowReminders++;

      // Count items that need action (expired, to-buy, or to-pack)
      if (isExpired(item) || item.status === 'expired' || item.status === 'to-buy' || item.status === 'to-pack') {
        totalNeedsAction++;
      }
    });
  });

  // Filters logic: determine visible kits (non-destructive)
  const filteredKits = kits.filter(kit => {
    let matchedCount = kit.items.length;

    // Search query filter matching
    if (itemSearchQuery.trim() !== "") {
      const query = itemSearchQuery.toLowerCase();
      const matched = kit.items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.note && item.note.toLowerCase().includes(query))
      );
      matchedCount = matched.length;
    }

    // "Needs Attention" filters matching
    if (needsAttentionOnly) {
      const query = itemSearchQuery.toLowerCase();
      const matched = kit.items.filter(item => {
        const matchesSearch = itemSearchQuery.trim() === "" ||
          item.name.toLowerCase().includes(query) ||
          (item.note && item.note.toLowerCase().includes(query));

        const matchesAttention = isExpired(item) ||
          isExpiringSoon(item) ||
          item.status === 'removed' ||
          item.status === 'to-buy' ||
          item.status === 'to-pack';

        return matchesSearch && matchesAttention;
      });
      matchedCount = matched.length;
    }

    const isFilteringActive = needsAttentionOnly || itemSearchQuery.trim() !== "";
    if (isFilteringActive && matchedCount === 0) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 text-gray-800 pb-16 antialiased">

      {/* 1. APP TOP BANNER HERO */}
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-gray-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-0 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 rounded-xl p-1.5 text-white shadow-xs">
              <FolderHeart className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2]" />
            </div>
            <div className="flex flex-col items-start text-left">
              <h1 className="text-sm sm:text-base font-black text-gray-950 tracking-tight leading-none sm:leading-tight">
                ReadySet
              </h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-indigo-600 tracking-wide uppercase mt-0.5 sm:mt-0">
                {settings?.hubSubtitle || "Miraval"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="header-btn-settings"
              onClick={() => setShowSettings(true)}
              className="p-1.5 sm:p-2 border border-gray-250 bg-white hover:bg-slate-50 rounded-lg text-gray-700 transition cursor-pointer"
              title="SMTP Settings & History Outbox"
            >
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. LIVE LOADING SCREEN VIEW */}
      {loading ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
          <h3 className="mt-4 font-extrabold text-gray-700">Loading Household Prep Database</h3>
          <p className="mt-1 text-xs text-gray-400">Directly synchronized with Portainer volume mounts.</p>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">

          {/* 3. ALERT TRIGGER REPORT BLOCK */}
          {alertResponse && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-slate-900 text-white border border-gray-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl shrink-0 text-indigo-400">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Alert Trigger Execution Finished</h4>
                  <p className="text-xs text-gray-300 mt-1">
                    {alertResponse.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                    Found {alertResponse.expired} expired item(s), {alertResponse.expiringSoon} item(s) expiring within 30 days, and {alertResponse.reminders} missing return reminder(s).
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSettings(true);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-lg transition"
                >
                  View Simulated Outbox HTML
                </button>
                <button
                  onClick={() => setAlertResponse(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* 4. DASHBOARD OVERVIEW SECTION HEADER & TOGGLE */}
          <div className="flex items-center justify-between px-1 select-none">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <FolderHeart className="h-4 w-4" /> Household Prep Summary
            </span>
            <button
              id="btn-toggle-summary"
              onClick={() => {
                const nextVal = !summaryExpanded;
                setSummaryExpanded(nextVal);
                localStorage.setItem("prepTracker_summaryExpanded", String(nextVal));
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition py-1 px-2 hover:bg-indigo-50 rounded-lg"
              title={summaryExpanded ? "Collapse Summary" : "Expand Summary"}
            >
              {summaryExpanded ? (
                <>Hide Summary <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Show Summary <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          </div>

          {/* 4. STATS METRICS GRID */}
          <AnimatePresence initial={false}>
            {summaryExpanded && (
              <motion.section
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-1">
                  <MetricCard
                    id="stat-kits"
                    title="Kits"
                    value={totalKits}
                    icon={<FolderHeart className="h-5 w-5 text-indigo-600" />}
                    colorClass="bg-indigo-50 border border-indigo-100"
                    subText="Active survival supplies"
                  />
                  <MetricCard
                    id="stat-expired"
                    title="Action Required"
                    value={totalNeedsAction}
                    icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
                    colorClass="bg-rose-50 border border-rose-100"
                    subText="Expired, to-buy, or to-pack"
                    onClick={() => {
                      setNeedsAttentionOnly(true);
                    }}
                  />
                  <MetricCard
                    id="stat-soon"
                    title="Expiring Soon"
                    value={totalExpiringSoon}
                    icon={<Calendar className="h-5 w-5 text-amber-600" />}
                    colorClass="bg-amber-50 border border-amber-100"
                    subText="Expiring within 30 days"
                    onClick={() => {
                      setNeedsAttentionOnly(true);
                    }}
                  />
                  <MetricCard
                    id="stat-reminders"
                    title="Removed Reminders"
                    value={totalBorrowReminders}
                    icon={<Clock className="h-5 w-5 text-purple-600" />}
                    colorClass="bg-purple-50 border border-purple-100"
                    subText="Borrowed gear out of kit"
                    onClick={() => {
                      setNeedsAttentionOnly(true);
                    }}
                  />
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* 5. FILTER NAVIGATION SECTION HEADER & TOGGLE */}
          <div className="flex items-center justify-between px-1 select-none mt-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <SlidersHorizontal className="h-4 w-4" /> Filters & Actions
            </span>
            <button
              id="btn-toggle-filters"
              onClick={() => {
                const nextVal = !filtersExpanded;
                setFiltersExpanded(nextVal);
                localStorage.setItem("prepTracker_filtersExpanded", String(nextVal));
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition py-1 px-2 hover:bg-indigo-50 rounded-lg"
              title={filtersExpanded ? "Collapse Filters" : "Expand Filters"}
            >
              {filtersExpanded ? (
                <>Hide Filters <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Show Filters <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {filtersExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-5 bg-white border border-gray-150 rounded-2xl shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 shrink-0">
                      <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Search Filters
                      </span>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <input
                        id="input-item-search"
                        type="text"
                        placeholder="Search items by name/note..."
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 pl-8 pr-8 font-semibold text-xs text-gray-700 placeholder-gray-400 focus:outline-hidden focus:border-indigo-400 focus:bg-white transition"
                      />
                      <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      {itemSearchQuery && (
                        <button
                          id="btn-clear-search-query"
                          onClick={() => setItemSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5 transition"
                          title="Clear search"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Needs attention toggle */}
                    <button
                      id="btn-filter-needs-attention"
                      onClick={() => setNeedsAttentionOnly(!needsAttentionOnly)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${needsAttentionOnly
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-slate-50 border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                    >
                      {needsAttentionOnly ? <CheckCircle2 className="h-4 w-4 text-rose-600" /> : null}
                      Needs Attention
                    </button>

                    {/* Clear filters trigger */}
                    {(needsAttentionOnly || itemSearchQuery.trim() !== "") && (
                      <button
                        id="btn-clear-filters"
                        onClick={() => {
                          setNeedsAttentionOnly(false);
                          setItemSearchQuery("");
                        }}
                        className="text-xs font-bold text-indigo-600 hover:underline px-2 cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}

                    <span className="text-gray-300 md:block hidden">|</span>

                    <button
                      id="btn-launch-add-kit"
                      onClick={() => setShowAddKitModal(true)}
                      className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs px-4  py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
                    >
                      <Plus className="h-4 w-4" /> Add Kit Container
                    </button>

                    <button
                      id="btn-launch-add-multi-supply"
                      onClick={() => setShowAddMultiKitModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Add Supply to Multiple Kits
                    </button>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 6. KIT CONTAINER RENDERS */}
          <section className="space-y-4">
            {filteredKits.length === 0 ? (
              <div className="py-24 border-2 border-dashed border-gray-250 bg-white rounded-3xl text-center">
                <FolderHeart className="h-10 w-10 text-gray-350 mx-auto" />
                <h3 className="mt-3 font-extrabold text-gray-800">No Prep Kits Found</h3>
                <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
                  {itemSearchQuery.trim() !== ""
                    ? `No supplies matched your search for "${itemSearchQuery}". Try a different term or clear filters.`
                    : needsAttentionOnly
                      ? "Excellent! No supplies currently require checkups, purchasing, or expiration replacements."
                      : "Create an emergency kit (e.g. Car Kit, Bug Out Bag) to begin mapping survival gear."}
                </p>
                {!needsAttentionOnly && (
                  <button
                    onClick={() => setShowAddKitModal(true)}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl"
                  >
                    Add Your First Kit
                  </button>
                )}
              </div>
            ) : (
              filteredKits.map((kit, index) => (
                <KitCard
                  key={kit.id}
                  kit={kit}
                  defaultExpanded={needsAttentionOnly ? true : (filteredKits.length === 1 || index === 0)}
                  onUpdateKit={handleUpdateKit}
                  onDeleteKit={() => handleDeleteKit(kit.id)}
                  searchQuery={itemSearchQuery}
                  needsAttentionOnly={needsAttentionOnly}
                />
              ))
            )}
          </section>

        </main>
      )}

      {/* 7. SETTINGS & LOG OUTBOX MODAL */}
      {showSettings && settings && (
        <SettingsModal
          id="settings-drawer-dialog"
          settings={settings}
          emailLogs={emailLogs}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          onClearLogs={handleClearLogs}
        />
      )}



      {/* 9. DIALOG: CREATE NEW KIT DRAWER */}
      {showAddKitModal && (
        <div id="create-kit-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-base tracking-tight text-gray-900">
                Configure New Kit Container
              </h3>
              <button
                onClick={() => setShowAddKitModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKit} className="space-y-4 pt-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Kit Title
                </label>
                <input
                  id="add-kit-name"
                  type="text"
                  required
                  placeholder="e.g. Car Trunk Bin, 3-Month Shelter Pantry"
                  value={newKitName}
                  onChange={(e) => setNewKitName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Category
                </label>
                <select
                  id="add-kit-cat"
                  value={newKitCat}
                  onChange={(e) => setNewKitCat(e.target.value as KitCategory)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden"
                >
                  <option value="vehicle">Car Emergency Kit</option>
                  <option value="evacuation">3-Day Evacuation / Refugee Bag</option>
                  <option value="fire">Fire Safety / Prevention Kit</option>
                  <option value="shelter-in-place">3-Month Sheltering Pantry</option>
                  <option value="medical">Medical / First Aid Kit</option>
                  <option value="custom">Custom Kit Category</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Kit Description
                </label>
                <textarea
                  id="add-kit-desc"
                  rows={2}
                  value={newKitDesc}
                  placeholder="Memo on where it is located, what scenarios it is designed to address..."
                  onChange={(e) => setNewKitDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddKitModal(false)}
                  className="px-3 py-1.5 border border-gray-255 text-gray-500 hover:bg-gray-50 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-add-kit"
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg shadow-sm"
                >
                  Create Prep Kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. DIALOG: ADD SUPPLY TO MULTIPLE KITS */}
      {showAddMultiKitModal && (
        <div id="add-multi-supply-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-base tracking-tight text-gray-900">
                Add Supply to Multiple Kits
              </h3>
              <button
                onClick={() => setShowAddMultiKitModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddItemToMultipleKits} className="space-y-4 pt-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Supply Name
                </label>
                <input
                  id="multi-item-name"
                  type="text"
                  required
                  placeholder="e.g. First Aid Kit, Bottled Water, Emergency Rations"
                  value={multiKitItemName}
                  onChange={(e) => setMultiKitItemName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Quantity
                  </label>
                  <input
                    id="multi-item-qty"
                    type="text"
                    placeholder="e.g. 3x, 2 pairs"
                    value={multiKitItemQty}
                    onChange={(e) => setMultiKitItemQty(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    id="multi-item-expiry"
                    type="date"
                    value={multiKitItemExpiry}
                    onChange={(e) => setMultiKitItemExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="multi-item-alert"
                  type="checkbox"
                  checked={multiKitItemAlert}
                  onChange={(e) => setMultiKitItemAlert(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
                <span className="text-xs text-gray-500">Enable email alerts if expired</span>
              </label>

              <div className="border-t border-gray-100 pt-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Add to Kits
                </label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl max-h-48 overflow-y-auto">
                  {kits.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No kits available</p>
                  ) : (
                    kits.map(kit => (
                      <label key={kit.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition">
                        <input
                          type="checkbox"
                          checked={selectedKitIds.has(kit.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedKitIds);
                            if (e.target.checked) {
                              newSet.add(kit.id);
                            } else {
                              newSet.delete(kit.id);
                            }
                            setSelectedKitIds(newSet);
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-gray-700">{kit.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddMultiKitModal(false)}
                  className="px-3 py-1.5 border border-gray-255 text-gray-500 hover:bg-gray-50 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-multi-supply"
                  type="submit"
                  disabled={selectedKitIds.size === 0}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-xs font-extrabold rounded-lg shadow-sm transition"
                >
                  Add Supply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
