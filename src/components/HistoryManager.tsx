import React, { useState, useEffect } from "react";
import { HistoryItem } from "../types";
import { Calendar, User, FileText, Download, RotateCcw, Trash2 } from "lucide-react";
import { generatePDF } from "../utils/pdfGenerator";

interface HistoryManagerProps {
  onLoadHistoryItem: (item: HistoryItem) => void;
  // Trigger history reload when parent signals new item was added
  historyTrigger: number;
}

export const HistoryManager: React.FC<HistoryManagerProps> = ({
  onLoadHistoryItem,
  historyTrigger,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = () => {
    const stored = localStorage.getItem("uma_saree_history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse history", err);
      }
    }
  };

  useEffect(() => {
    loadHistory();
  }, [historyTrigger]);

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const stored = localStorage.getItem("uma_saree_history");
    if (stored) {
      try {
        const items: HistoryItem[] = JSON.parse(stored);
        const filtered = items.filter((item) => item.id !== id);
        localStorage.setItem("uma_saree_history", JSON.stringify(filtered));
        setHistory(filtered);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReDownload = async (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    await generatePDF(item.header, item.rows, "download");
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-[#1e1e2e]/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold text-white tracking-wide">Export History</h2>
        <span className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">Regenerate</span>
      </div>

      <div className="space-y-3">
        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl text-sm">
            No exported production sheets yet
          </div>
        ) : (
          <div className="max-height-[350px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-3 transition-all relative group"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {item.designName || "Unnamed Design"}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatTimestamp(item.timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => handleReDownload(item, e)}
                      title="Download PDF"
                      className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-all"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => onLoadHistoryItem(item)}
                      title="Load into Editor"
                      className="text-slate-400 hover:text-violet-400 p-1.5 rounded hover:bg-slate-800 transition-all"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                      title="Delete Entry"
                      className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-950/30 p-2 rounded-lg">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Calendar size={12} className="text-violet-400 shrink-0" />
                    <span className="truncate">Date: {item.date || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User size={12} className="text-violet-400 shrink-0" />
                    <span className="truncate">Party: {item.partyName || "N/A"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
