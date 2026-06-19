"use client";

import React, { useState, useEffect, useRef } from "react";
import { HeaderData, RowData, HistoryItem } from "../types";
import { HeaderForm } from "../components/HeaderForm";
import { ProductionGrid } from "../components/ProductionGrid";
import { TemplateManager } from "../components/TemplateManager";
import { HistoryManager } from "../components/HistoryManager";
import { generatePDF } from "../utils/pdfGenerator";
import { Printer, Download, Eye, RotateCcw, Save, Sparkles, Check, FileText } from "lucide-react";

// Default initial state
const getDefaultRows = (): RowData[] =>
  Array.from({ length: 5 }, (_, i) => ({
    id: `row-init-${i}-${Math.random().toString(36).substr(2, 5)}`,
    saree: "",
    f1: "",
    f2: "",
    f3: "",
    f4: "",
    f5: "",
    f6: "",
    f7: "",
  }));

const defaultHeader: HeaderData = {
  companyName: "UMA CREATION / UMA FAB",
  designName: "110 Lichi",
  date: new Date().toLocaleDateString("en-GB"), // e.g., 20/06/2026
  mNo: "",
  design: "",
  pick: "",
  party: "",
  orderNo: "",
};

export default function Dashboard() {
  const [header, setHeader] = useState<HeaderData>(defaultHeader);
  const [rows, setRows] = useState<RowData[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // 1. Initial State Loading (localStorage draft or defaults)
  useEffect(() => {
    setRows(getDefaultRows());
    const storedDraft = localStorage.getItem("uma_saree_draft");
    if (storedDraft) {
      try {
        const parsed = JSON.parse(storedDraft);
        if (parsed.header) setHeader(parsed.header);
        if (parsed.rows && parsed.rows.length > 0) setRows(parsed.rows);
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Failed to load draft", err);
      }
    }
  }, []);

  // 2. Debounced live PDF preview generation
  useEffect(() => {
    if (rows.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        const url = await generatePDF(header, rows, "view");
        if (url) {
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      } catch (err) {
        console.error("Preview generation error", err);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [header, rows]);

  // 3. Auto-save every 30 seconds
  useEffect(() => {
    if (rows.length === 0) return;
    const interval = setInterval(() => {
      setIsAutoSaving(true);
      const draft = { header, rows };
      localStorage.setItem("uma_saree_draft", JSON.stringify(draft));
      
      setTimeout(() => {
        setIsAutoSaving(false);
        setLastSaved(new Date().toLocaleTimeString());
      }, 500);
    }, 30000);

    return () => clearInterval(interval);
  }, [header, rows]);

  // Manual save trigger
  const handleSaveDraft = () => {
    setIsAutoSaving(true);
    const draft = { header, rows };
    localStorage.setItem("uma_saree_draft", JSON.stringify(draft));
    setTimeout(() => {
      setIsAutoSaving(false);
      setLastSaved(new Date().toLocaleTimeString());
    }, 400);
  };

  const handleHeaderChange = (field: keyof HeaderData, value: string) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoadTemplate = (tplHeader: HeaderData, tplRows: RowData[]) => {
    setHeader(tplHeader);
    setRows(tplRows);
    handleSaveDraft();
  };

  const handleLoadHistoryItem = (item: HistoryItem) => {
    setHeader(item.header);
    setRows(item.rows);
    handleSaveDraft();
  };

  const saveToHistory = () => {
    const stored = localStorage.getItem("uma_saree_history");
    let historyList: HistoryItem[] = [];
    if (stored) {
      try {
        historyList = JSON.parse(stored);
      } catch {
        historyList = [];
      }
    }

    const newItem: HistoryItem = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: header.date || "N/A",
      designName: header.designName || "Unnamed Design",
      partyName: header.party || "N/A",
      header: { ...header },
      rows: rows.map((r) => ({ ...r })),
    };

    const updated = [newItem, ...historyList].slice(0, 50); // limit to 50 items
    localStorage.setItem("uma_saree_history", JSON.stringify(updated));
    setHistoryTrigger((t) => t + 1);
  };

  const handleDownloadPDF = async () => {
    await generatePDF(header, rows, "download");
    saveToHistory();
  };

  const handlePrintPDF = async () => {
    await generatePDF(header, rows, "print");
    saveToHistory();
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear current data and start fresh?")) {
      setHeader({
        ...defaultHeader,
        date: new Date().toLocaleDateString("en-GB"),
      });
      setRows(getDefaultRows());
      localStorage.removeItem("uma_saree_draft");
      setLastSaved(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0c10] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.18),rgba(255,255,255,0))] text-slate-100 pb-16">
      {/* Header Bar */}
      <header className="border-b border-white/5 bg-[#0f111a]/80 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-[1700px] mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                UMA CREATION <span className="text-xs font-normal text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">A4 PDF Generator</span>
              </h1>
              <p className="text-xs text-slate-400">Saree Production Sheet (Factory Print Format)</p>
            </div>
          </div>

          {/* Quick Actions & Status */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-save Status */}
            <div className="text-xs text-slate-400 mr-2 flex items-center gap-2 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-800">
              {isAutoSaving ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Saving draft...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span>Auto-saved at {lastSaved}</span>
                </>
              ) : (
                <span>Unsaved changes</span>
              )}
            </div>

            <button
              onClick={handleSaveDraft}
              className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 active:scale-95 duration-100"
              title="Save current state as draft manually"
            >
              <Save size={15} />
              Save Draft
            </button>

            <button
              onClick={handleReset}
              className="bg-slate-900 hover:bg-slate-850 text-rose-400 border border-slate-800/80 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 active:scale-95 duration-100"
            >
              <RotateCcw size={15} />
              Reset Sheet
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

            <button
              onClick={handlePrintPDF}
              className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2 active:scale-95 duration-100"
            >
              <Printer size={16} />
              Print PDF
            </button>

            <button
              onClick={handleDownloadPDF}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 active:scale-95 duration-100"
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Dashboard */}
      <div className="max-w-[1700px] mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Inputs and Sheet Editor) */}
          <div className="lg:col-span-2 space-y-8">
            <HeaderForm data={header} onChange={handleHeaderChange} />
            <ProductionGrid rows={rows} onChangeRows={setRows} />
          </div>

          {/* Right Column (Sidebar Tools & PDF Live Preview) */}
          <div className="space-y-8">
            {/* Live PDF Preview */}
            <div className="bg-[#1e1e2e]/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  <Eye className="text-violet-400 h-5 w-5" />
                  Print Preview
                </h2>
                <span className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">Vector PDF</span>
              </div>
              
              {previewUrl ? (
                <div className="relative border border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-950">
                  <iframe
                    key={previewUrl || "empty"}
                    src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-[450px]"
                    title="Live PDF print preview"
                  />
                  <div className="absolute bottom-4 right-4 bg-slate-900/90 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur shadow flex items-center gap-1.5">
                    <FileText size={12} className="text-violet-400" />
                    <span>Exact A4 Layout ({rows.length <= 5 ? "Double Copy" : "Full Sheet"})</span>
                  </div>
                </div>
              ) : (
                <div className="h-[450px] border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 bg-slate-950/20 text-sm gap-2">
                  <div className="h-8 w-8 rounded-full border-2 border-slate-800 border-t-violet-500 animate-spin" />
                  Generating print layout...
                </div>
              )}
            </div>

            {/* Template Manager */}
            <TemplateManager
              currentHeader={header}
              currentRows={rows}
              onLoadTemplate={handleLoadTemplate}
            />

            {/* Export History */}
            <HistoryManager
              onLoadHistoryItem={handleLoadHistoryItem}
              historyTrigger={historyTrigger}
            />
          </div>

        </div>
      </div>
    </main>
  );
}
