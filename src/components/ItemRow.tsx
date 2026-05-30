import React, { useState } from "react";
import { KitItem, ItemStatus } from "../types";
import { 
  CheckCircle2, 
  ShoppingCart, 
  Box, 
  AlertTriangle, 
  Clock, 
  CalendarDays, 
  Trash2, 
  FileText, 
  Check, 
  Bell, 
  BellOff 
} from "lucide-react";

interface ItemRowProps {
  item: KitItem;
  onUpdate: (updatedItem: KitItem) => void;
  onDelete: () => void;
  key?: React.Key;
}

export default function ItemRow({ item, onUpdate, onDelete }: ItemRowProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState(item.note || "");
  const [showReminderSetting, setShowReminderSetting] = useState(false);

  // Status configuration details
  const statusConfigs: Record<ItemStatus, {
    label: string;
    bgClass: string;
    textClass: string;
    icon: React.ReactNode;
  }> = {
    packed: {
      label: "Packed & Ready",
      bgClass: "bg-emerald-50 hover:bg-emerald-100",
      textClass: "text-emerald-700 border-emerald-200",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    },
    "to-buy": {
      label: "Need to Buy",
      bgClass: "bg-amber-50 hover:bg-amber-100",
      textClass: "text-amber-700 border-amber-200",
      icon: <ShoppingCart className="h-4 w-4 text-amber-600" />,
    },
    "to-pack": {
      label: "Have, Need to Pack",
      bgClass: "bg-sky-50 hover:bg-sky-100",
      textClass: "text-sky-700 border-sky-200",
      icon: <Box className="h-4 w-4 text-sky-600" />,
    },
    removed: {
      label: "Removed / Borrowed",
      bgClass: "bg-purple-50 hover:bg-purple-100",
      textClass: "text-purple-700 border-purple-200",
      icon: <Clock className="h-4 w-4 text-purple-600" />,
    },
    expired: {
      label: "Expired Supply",
      bgClass: "bg-rose-50 hover:bg-rose-100",
      textClass: "text-rose-700 border-rose-200",
      icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
    }
  };

  // Check if item is currently expired based on date
  const isDateExpired = () => {
    if (!item.expirationDate) return false;
    const expDate = new Date(item.expirationDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    return expDate < today;
  };

  const isExpiringSoon = () => {
    if (!item.expirationDate) return false;
    const expDate = new Date(item.expirationDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (expDate < today) return false;
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  // Automatically update status if expiration date causes it to cycle to expired,
  // or handle manual status triggers
  const handleStatusChange = (newStatus: ItemStatus) => {
    let update: Partial<KitItem> = { status: newStatus };
    
    if (newStatus === "removed") {
      // Set default removal dates
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      update.removedAt = today.toISOString().split("T")[0];
      update.reminderDueDate = nextWeek.toISOString().split("T")[0];
      setShowReminderSetting(true);
    } else {
      update.removedAt = null;
      update.reminderDueDate = null;
    }

    onUpdate({
      ...item,
      ...update,
    });
  };

  const handleSaveNotes = () => {
    onUpdate({
      ...item,
      note: noteText,
    });
    setShowNotes(false);
  };

  const currentStatus = isDateExpired() ? "expired" : item.status;
  const config = statusConfigs[currentStatus] || statusConfigs.packed;

  return (
    <div id={`item-row-${item.id}`} className="flex flex-col border-b border-gray-100 py-3 last:border-b-0 hover:bg-gray-50/50 px-3 rounded-lg transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 md:flex-nowrap">
        {/* Left Side: Name and note indicator */}
        <div className="flex min-w-[200px] flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold tracking-tight text-gray-800 ${item.status === 'removed' ? 'line-through text-gray-400' : ''}`}>
              {item.name}
            </span>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
              {item.quantity || "1x"}
            </span>

            {/* Alert on Expiration Badge */}
            {item.expirationDate && (
              <button
                id={`btn-toggle-alert-${item.id}`}
                onClick={() => onUpdate({ ...item, alertOnExpiration: !item.alertOnExpiration })}
                title={item.alertOnExpiration ? "Email alerts enabled for expiration" : "Email alerts disabled for expiration"}
                className={`p-1 rounded-md transition ${
                  item.alertOnExpiration 
                    ? "text-red-500 hover:text-red-600 bg-red-50" 
                    : "text-gray-300 hover:text-gray-400 hover:bg-gray-100"
                }`}
              >
                {item.alertOnExpiration ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
              </button>
            )}
          </div>
          {item.note && !showNotes && (
            <span className="mt-0.5 text-xs text-gray-500 line-clamp-1 italic">
              ↳ "{item.note}"
            </span>
          )}
        </div>

        {/* Middle and Right: Status, Expiration, Note Trigger, and Delete */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          
          {/* Item Expiration Inline Date */}
          <div className="flex items-center gap-1 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-2xs">
            <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
            <input
              id={`input-exp-${item.id}`}
              type="date"
              value={item.expirationDate || ""}
              onChange={(e) => onUpdate({ ...item, expirationDate: e.target.value || null })}
              className="bg-transparent focus:outline-hidden text-gray-700 cursor-pointer text-xs"
              placeholder="Expiry Date"
            />
            {isDateExpired() && (
              <span className="ml-1 font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                Expired
              </span>
            )}
            {isExpiringSoon() && (
              <span className="ml-1 font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                Soon
              </span>
            )}
          </div>

          {/* Status Dropdown Picker */}
          <div className="relative">
            <select
              id={`select-status-${item.id}`}
              value={item.status}
              onChange={(e) => handleStatusChange(e.target.value as ItemStatus)}
              className={`appearance-none font-medium text-xs rounded-full px-3 py-1.5 pl-8 pr-6 border cursor-pointer focus:outline-hidden focus:ring-1 transition shadow-2xs ${config.bgClass} ${config.textClass}`}
            >
              <option value="packed" className="bg-white text-gray-800">Packed & Ready</option>
              <option value="to-buy" className="bg-white text-gray-800">Need to Buy</option>
              <option value="to-pack" className="bg-white text-gray-800">Need to Pack</option>
              <option value="removed" className="bg-white text-gray-800">Removed / Borrowed</option>
            </select>
            <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
              {config.icon}
            </div>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-current h-0 w-0" />
          </div>

          {/* Edit Note Button */}
          <button
            id={`btn-note-${item.id}`}
            onClick={() => {
              setShowNotes(!showNotes);
              if (!showNotes) setNoteText(item.note || "");
            }}
            className={`p-1.5 rounded-lg border transition ${
              showNotes || item.note
                ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                : "bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
            title="Add/Edit Note"
          >
            <FileText className="h-4 w-4" />
          </button>

          {/* Delete Button */}
          <button
            id={`btn-delete-item-${item.id}`}
            onClick={onDelete}
            className="p-1.5 rounded-lg border border-transparent text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition"
            title="Delete Item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expandable note text area input */}
      {showNotes && (
        <div className="mt-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Item Note / Checkout Memo
          </label>
          <div className="flex gap-2">
            <input
              id={`input-note-${item.id}`}
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Took pants out to wash. Stash in trunk floor."
              className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
            <button
              id={`btn-save-note-${item.id}`}
              onClick={handleSaveNotes}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <Check className="h-3 w-3" /> Save
            </button>
          </div>
        </div>
      )}

      {/* Expandable temporary checkout date setting */}
      {item.status === 'removed' && (showReminderSetting || item.reminderDueDate) && (
        <div className="mt-2 p-3 bg-purple-50 rounded-xl border border-purple-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-semibold text-purple-800">
              Removed Item reminder
            </span>
            <span className="text-xs text-purple-600">
              (Will remind in 1 week by default)
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600 font-medium select-none">Reminds on:</span>
            <input
              id={`input-reminder-date-${item.id}`}
              type="date"
              value={item.reminderDueDate || ""}
              onChange={(e) => onUpdate({ ...item, reminderDueDate: e.target.value })}
              className="bg-white border border-purple-200 rounded-lg px-2 py-1 text-xs text-purple-700 focus:outline-hidden"
            />
            <button
              onClick={() => setShowReminderSetting(false)}
              className="bg-purple-600 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded hover:bg-purple-700 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
