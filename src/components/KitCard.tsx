import React, { useState } from "react";
import { Kit, KitItem, KitCategory, ItemStatus } from "../types";
import ItemRow from "./ItemRow";
import { 
  Car, 
  Backpack, 
  Flame, 
  Home, 
  HeartPulse, 
  Compass, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Clock, 
  Calendar,
  PenSquare,
  AlertTriangle,
  FolderOpen
} from "lucide-react";

interface KitCardProps {
  kit: Kit;
  defaultExpanded?: boolean;
  onUpdateKit: (updatedKit: Kit) => void;
  onDeleteKit: () => void;
  key?: React.Key;
  searchQuery?: string;
  needsAttentionOnly?: boolean;
}

export default function KitCard({
  kit,
  defaultExpanded = false,
  onUpdateKit,
  onDeleteKit,
  searchQuery = "",
  needsAttentionOnly = false
}: KitCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editName, setEditName] = useState(kit.name);
  const [editDescription, setEditDescription] = useState(kit.description);
  const [editCategory, setEditCategory] = useState<KitCategory>(kit.category);

  // New item input states
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemExpiry, setNewExpiry] = useState("");
  const [newItemAlert, setNewItemAlert] = useState(true);

  // Category Icon Resolver
  const CategoryIcon = ({ category }: { category: KitCategory }) => {
    switch (category) {
      case "vehicle":
        return <Car className="h-5 w-5 text-indigo-600" />;
      case "evacuation":
        return <Backpack className="h-5 w-5 text-amber-600" />;
      case "fire":
        return <Flame className="h-5 w-5 text-rose-600" />;
      case "shelter-in-place":
        return <Home className="h-5 w-5 text-emerald-600" />;
      case "medical":
        return <HeartPulse className="h-5 w-5 text-red-600" />;
      default:
        return <Compass className="h-5 w-5 text-sky-600" />;
    }
  };

  const getCategoryColorClass = (category: KitCategory) => {
    switch (category) {
      case "vehicle":
        return "bg-indigo-50 border-indigo-150";
      case "evacuation":
        return "bg-amber-50 border-amber-150";
      case "fire":
        return "bg-rose-50 border-rose-150";
      case "shelter-in-place":
        return "bg-emerald-50 border-emerald-150";
      case "medical":
        return "bg-red-50 border-red-150";
      default:
        return "bg-sky-50 border-sky-150";
    }
  };

  // Stats Counters
  const totalItems = kit.items.length;
  
  const isExpired = (item: KitItem) => {
    if (!item.expirationDate) return false;
    const expDate = new Date(item.expirationDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    return expDate < today;
  };

  const isExpiringSoon = (item: KitItem) => {
    if (!item.expirationDate) return false;
    const expDate = new Date(item.expirationDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (expDate < today) return false;
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const expiredCount = kit.items.filter(item => isExpired(item) || item.status === 'expired').length;
  const missingCount = kit.items.filter(item => item.status === 'to-buy' || item.status === 'to-pack').length;
  const borrowedCount = kit.items.filter(item => item.status === 'removed').length;

  // Filter items for responsive screen display only (preserves non-matching items on updating)
  const displayedItems = kit.items.filter(item => {
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(q) || 
                            (item.note && item.note.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    if (needsAttentionOnly) {
      const matchesAttention = isExpired(item) || 
                               item.status === 'expired' ||
                               isExpiringSoon(item) || 
                               item.status === 'removed' || 
                               item.status === 'to-buy';
      if (!matchesAttention) return false;
    }
    return true;
  });

  // Add individual item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const addedItem: KitItem = {
      id: "item_" + Math.random().toString(36).substr(2, 9),
      name: newItemName.trim(),
      quantity: newItemQty.trim() ||"1",
      status: "to-pack", // defaults to "need to pack" which is highly logical
      expirationDate: newItemExpiry || null,
      alertOnExpiration: newItemAlert,
      lastChecked: new Date().toISOString().split("T")[0]
    };

    onUpdateKit({
      ...kit,
      items: [addedItem, ...kit.items]
    });

    // Reset Form
    setNewItemName("");
    setNewItemQty("1");
    setNewExpiry("");
    setNewItemAlert(true);
    setShowAddItem(false);
  };

  // Update singular item inside this kit
  const handleUpdateItem = (updatedItem: KitItem) => {
    // If the expiration date changed and it exceeds today, update status appropriately
    let finalStatus = updatedItem.status;
    if (updatedItem.expirationDate) {
      const exp = new Date(updatedItem.expirationDate);
      const now = new Date();
      now.setHours(0,0,0,0);
      if (exp < now) {
        finalStatus = "expired";
      } else if (updatedItem.status === "expired") {
        finalStatus = "packed"; // clear warning state
      }
    }

    const nextItems = kit.items.map(item => 
      item.id === updatedItem.id ? { ...updatedItem, status: finalStatus } : item
    );

    onUpdateKit({
      ...kit,
      items: nextItems
    });
  };

  // Delete singular item inside this kit
  const handleDeleteItem = (itemId: string) => {
    const nextItems = kit.items.filter(item => item.id !== itemId);
    onUpdateKit({
      ...kit,
      items: nextItems
    });
  };

  // Audit Entire Kit (Setting lastAuditedAt & syncing unchecked items lastChecked field)
  const handleAuditKitNow = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const auditedItems = kit.items.map(item => ({
      ...item,
      lastChecked: todayStr
    }));

    onUpdateKit({
      ...kit,
      lastAuditedAt: todayStr,
      items: auditedItems
    });
  };

  // Save Meta Title & Category Updates
  const handleSaveMetaChanges = () => {
    onUpdateKit({
      ...kit,
      name: editName,
      description: editDescription,
      category: editCategory
    });
    setIsEditingMeta(false);
  };

  return (
    <div id={`kit-card-${kit.id}`} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      
      {/* Kit Header Block */}
      <div className="flex items-center justify-between p-5 md:p-6 select-none cursor-pointer hover:bg-slate-50/50" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border ${getCategoryColorClass(kit.category)}`}>
            <CategoryIcon category={kit.category} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold tracking-tight text-gray-800">
                {kit.name}
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {kit.category.replace("-", " ")}
              </span>
              
              {/* Emergency Attention indicators */}
              {expiredCount > 0 && (
                <span className="flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-md animate-pulse">
                  <AlertTriangle className="h-3 w-3" /> Expired Gear
                </span>
              )}
            </div>
            
            <p className="mt-1 text-xs text-gray-500 max-w-sm md:max-w-md font-medium line-clamp-1">
              {kit.description || "No description provided."}
            </p>

            {/* Micro Stats Row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold text-gray-400">
              <span className="flex items-center gap-1">
                <FolderOpen className="h-3 w-3 text-gray-400" /> {totalItems} total supplies
              </span>
              {missingCount > 0 && (
                <span className="text-amber-600">
                  • {missingCount} to acquire/pack
                </span>
              )}
              {borrowedCount > 0 && (
                <span className="text-purple-600">
                  • {borrowedCount} checked out
                </span>
              )}
              {kit.lastAuditedAt ? (
                <span className="text-emerald-600">
                  • Checked {kit.lastAuditedAt}
                </span>
              ) : (
                <span className="text-rose-500">
                  • Not yet audited
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Accordion trigger icons */}
        <button id={`btn-toggle-kit-${kit.id}`} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-900">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Accordion Body contents */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/20 p-5 md:p-6 transition-all">
          
          {/* Metadata editor section or action row */}
          {isEditingMeta ? (
            <div className="mb-5 p-4 border border-gray-200 rounded-2xl bg-white space-y-3.5">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Edit Kit Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Kit Title</label>
                  <input
                    id={`input-meta-name-${kit.id}`}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Category type</label>
                  <select
                    id={`select-meta-cat-${kit.id}`}
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as KitCategory)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden"
                  >
                    <option value="vehicle">Car Emergency Kit</option>
                    <option value="evacuation">3-Day Evacuation Bag</option>
                    <option value="fire">Fire Safety Kit</option>
                    <option value="shelter-in-place">Shelter-in-Place Pantry</option>
                    <option value="medical">Medical / First Aid Kit</option>
                    <option value="custom">Custom Kit Category</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Kit Description</label>
                  <input
                    id={`input-meta-desc-${kit.id}`}
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center shrink-0 pt-2 border-t border-gray-100">
                <button
                  id={`btn-delete-kit-${kit.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.confirm("Are you sure you want to delete this kit? This process cannot be undone.")) {
                      onDeleteKit();
                    }
                  }}
                  className="px-3.5 py-1.5 border border-rose-200 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Delete Kit"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Kit
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingMeta(false)}
                    className="px-3 py-1.5 border border-gray-250 text-gray-500 rounded-lg hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id={`btn-save-meta-${kit.id}`}
                    onClick={handleSaveMetaChanges}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold cursor-pointer"
                  >
                    Save Kit Info
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-5 flex flex-wrap gap-2 items-center justify-between">
              
              {/* Kit Auditing Call to Action block */}
              <div className="flex items-center gap-2">
                <button
                  id={`btn-audit-kit-${kit.id}`}
                  onClick={handleAuditKitNow}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 rounded-xl px-2.5 sm:px-3.5 py-2 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                  title="Mark this entire kit inspected physically today."
                >
                  <CheckSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Audit Complete</span>
                </button>
                <button
                  id={`btn-edit-kit-${kit.id}`}
                  onClick={() => setIsEditingMeta(true)}
                  className="border border-gray-250 text-gray-600 hover:bg-gray-50 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <PenSquare className="h-4 w-4" /> Edit Details
                </button>
              </div>

              {/* Add button */}
              <div className="flex items-center gap-2">
                <button
                  id={`btn-toggle-add-form-${kit.id}`}
                  onClick={() => setShowAddItem(!showAddItem)}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-3.5 py-2 text-xs font-extrabold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Item
                </button>
              </div>
            </div>
          )}

          {/* New Item Form */}
          {showAddItem && (
            <form onSubmit={handleAddItem} className="mb-5 p-4 border border-indigo-100 rounded-2xl bg-indigo-50/20 grid grid-cols-1 md:grid-cols-12 gap-3.5">
              <div className="md:col-span-5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Item Title / Supply Name</label>
                <input
                  id={`new-item-name-${kit.id}`}
                  type="text"
                  required
                  placeholder="e.g. Protein Bars, Wool socks"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-white border border-gray-250 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Quantity</label>
                <input
                  id={`new-item-qty-${kit.id}`}
                  type="text"
                  placeholder="e.g. 10 bars"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  className="w-full bg-white border border-gray-250 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Expiry Date (optional)</label>
                <input
                  id={`new-item-expiry-${kit.id}`}
                  type="date"
                  value={newItemExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full bg-white border border-gray-250 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  id={`new-item-submit-${kit.id}`}
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Add Supply
                </button>
              </div>

              <div className="md:col-span-12 flex items-center justify-between py-1 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-2">
                  <input
                    id={`new-item-alert-${kit.id}`}
                    type="checkbox"
                    checked={newItemAlert}
                    onChange={(e) => setNewItemAlert(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor={`new-item-alert-${kit.id}`} className="text-xs text-gray-500 cursor-pointer">
                    Enable email alarms if expired or check-ups overdue
                  </label>
                </div>
                <button
                  onClick={() => setShowAddItem(false)}
                  type="button"
                  className="text-xs text-gray-400 font-semibold hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Checklist content listing */}
          <div className="bg-white border border-gray-100 rounded-3xl p-2.5 shadow-2xs divide-y divide-gray-50">
            {totalItems === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Backpack className="h-10 w-10 text-gray-300" />
                <h4 className="mt-2 text-sm font-bold text-gray-800">Kit is Empty</h4>
                <p className="mt-1 text-xs text-gray-400 max-w-xs">
                  Get custom item suggestions automatically by clicking <strong>'Suggest items with AI'</strong> or load standard list recommendations.
                </p>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center pb-12">
                <Backpack className="h-8 w-8 text-gray-350 mx-auto" />
                <h4 className="mt-2 text-xs font-extrabold text-gray-800">No Matching Supplies</h4>
                <p className="mt-1 text-[11px] text-gray-400 max-w-xs mx-auto">
                  No items in this kit match the active search word or attention filter.
                </p>
              </div>
            ) : (
              displayedItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onUpdate={handleUpdateItem}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}
