import React, { useState, useEffect } from "react";
import { HeaderData, RowData, Template } from "../types";
import { Save, FolderOpen, Trash2, CheckCircle2 } from "lucide-react";

interface TemplateManagerProps {
  currentHeader: HeaderData;
  currentRows: RowData[];
  onLoadTemplate: (header: HeaderData, rows: RowData[]) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  currentHeader,
  currentRows,
  onLoadTemplate,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load templates from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("uma_saree_templates");
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse templates", err);
      }
    }
  }, []);

  const saveTemplates = (updated: Template[]) => {
    localStorage.setItem("uma_saree_templates", JSON.stringify(updated));
    setTemplates(updated);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: newTemplateName.trim(),
      header: { ...currentHeader },
      // Create new clean rows copying the cell values
      rows: currentRows.map((r) => ({ ...r })),
      createdAt: new Date().toISOString(),
    };

    // Remove duplicates with the same name if any
    const filtered = templates.filter(
      (t) => t.name.toLowerCase() !== newTemplateName.trim().toLowerCase()
    );
    const updated = [newTemplate, ...filtered];
    
    saveTemplates(updated);
    setNewTemplateName("");
    setSuccessMsg("Template saved successfully!");
    
    setTimeout(() => {
      setSuccessMsg("");
    }, 3000);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.filter((t) => t.id !== id);
    saveTemplates(updated);
  };

  return (
    <div className="bg-[#1e1e2e]/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold text-white tracking-wide">Templates</h2>
        <span className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">Save & Load</span>
      </div>

      {/* Save Template Form */}
      <form onSubmit={handleSaveTemplate} className="space-y-3">
        <label htmlFor="newTemplateName" className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Save Current Design As Template</label>
        <div className="flex gap-2">
          <input
            id="newTemplateName"
            type="text"
            className="flex-1 bg-slate-900/60 border border-slate-750 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-slate-500"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="e.g. Parrot Beam, 110 Lichi"
          />
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-500 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-violet-500/10 active:scale-95 duration-100"
            title="Save Template"
          >
            <Save size={18} />
          </button>
        </div>
        {successMsg && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 size={14} />
            <span>{successMsg}</span>
          </div>
        )}
      </form>

      {/* Template List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saved Templates ({templates.length})</h3>
        {templates.length === 0 ? (
          <div className="text-center py-6 text-slate-500 border border-dashed border-slate-800 rounded-xl text-sm">
            No saved templates yet
          </div>
        ) : (
          <div className="max-height-[250px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => onLoadTemplate(tpl.header, tpl.rows)}
                className="flex items-center justify-between bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700/60 rounded-xl p-3 cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FolderOpen size={16} className="text-violet-400 shrink-0" />
                  <div className="truncate text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                    {tpl.name}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800/80 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete Template"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
