import React, { useRef } from "react";
import { RowData } from "../types";
import { Plus, Trash2, Copy, CornerDownRight, ArrowDownToLine, ChevronDown } from "lucide-react";

interface ProductionGridProps {
  rows: RowData[];
  onChangeRows: (rows: RowData[]) => void;
}

const COL_KEYS: (keyof Omit<RowData, "id">)[] = [
  "saree",
  "f1",
  "f2",
  "f3",
  "f4",
  "f5",
  "f6",
  "f7",
];

const COL_LABELS = [
  { key: "saree" as const, label: "SAREE" },
  { key: "f1" as const, label: "F1" },
  { key: "f2" as const, label: "F2" },
  { key: "f3" as const, label: "F3" },
  { key: "f4" as const, label: "F4" },
  { key: "f5" as const, label: "F5" },
  { key: "f6" as const, label: "F6" },
  { key: "f7" as const, label: "F7" },
];

export const ProductionGrid: React.FC<ProductionGridProps> = ({ rows, onChangeRows }) => {
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const updateCell = (rowIndex: number, colKey: keyof Omit<RowData, "id">, value: string) => {
    const updated = [...rows];
    updated[rowIndex] = {
      ...updated[rowIndex],
      [colKey]: value,
    };
    onChangeRows(updated);
  };

  const handleAddRow = () => {
    const newId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // If there is an existing row, copy the saree name as a starting point, or keep empty
    const newRow: RowData = {
      id: newId,
      saree: "",
      f1: "",
      f2: "",
      f3: "",
      f4: "",
      f5: "",
      f6: "",
      f7: "",
    };
    onChangeRows([...rows, newRow]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (rows.length <= 1) {
      // Keep at least one row
      onChangeRows([
        {
          id: `row-${Date.now()}`,
          saree: "",
          f1: "",
          f2: "",
          f3: "",
          f4: "",
          f5: "",
          f6: "",
          f7: "",
        },
      ]);
      return;
    }
    const updated = rows.filter((_, idx) => idx !== rowIndex);
    onChangeRows(updated);
  };

  const handleDuplicateRow = (rowIndex: number) => {
    const sourceRow = rows[rowIndex];
    const newId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duplicatedRow: RowData = {
      ...sourceRow,
      id: newId,
    };
    const updated = [...rows];
    updated.splice(rowIndex + 1, 0, duplicatedRow);
    onChangeRows(updated);
  };

  const handleInsertRow = (rowIndex: number) => {
    const newId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const emptyRow: RowData = {
      id: newId,
      saree: "",
      f1: "",
      f2: "",
      f3: "",
      f4: "",
      f5: "",
      f6: "",
      f7: "",
    };
    const updated = [...rows];
    updated.splice(rowIndex + 1, 0, emptyRow);
    onChangeRows(updated);
  };

  const handleCopyPreviousRow = (rowIndex: number) => {
    if (rowIndex === 0) return;
    const prevRow = rows[rowIndex - 1];
    const updated = [...rows];
    updated[rowIndex] = {
      ...updated[rowIndex],
      saree: prevRow.saree,
      f1: prevRow.f1,
      f2: prevRow.f2,
      f3: prevRow.f3,
      f4: prevRow.f4,
      f5: prevRow.f5,
      f6: prevRow.f6,
      f7: prevRow.f7,
    };
    onChangeRows(updated);
  };

  const fillColumnToAll = (colKey: keyof Omit<RowData, "id">) => {
    // Find the first row that has a non-empty value in this column
    const sourceRow = rows.find((r) => r[colKey].trim() !== "");
    if (!sourceRow) return;
    const fillValue = sourceRow[colKey];
    
    const updated = rows.map((r) => ({
      ...r,
      [colKey]: fillValue,
    }));
    onChangeRows(updated);
  };

  const focusCell = (r: number, c: number) => {
    if (r < 0 || r >= rows.length || c < 0 || c >= COL_KEYS.length) return;
    const nextColKey = COL_KEYS[c];
    const el = document.getElementById(`cell-${r}-${nextColKey}`);
    if (el) {
      (el as HTMLTextAreaElement).focus();
    }
  };

  const handleFocus = (
    rowIndex: number,
    colKey: keyof Omit<RowData, "id">,
    e: React.FocusEvent<HTMLTextAreaElement>
  ) => {
    const inputEl = e.currentTarget;
    
    // Smart auto-fill from previous row
    if (!inputEl.value.trim() && rowIndex > 0) {
      const prevValue = rows[rowIndex - 1][colKey];
      if (prevValue) {
        updateCell(rowIndex, colKey, prevValue);
      }
    }
    
    // Highlight all text for fast overwriting (Excel style)
    setTimeout(() => {
      inputEl.select();
    }, 50);
  };

  const handleKeyDown = (
    rowIndex: number,
    colIdx: number,
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    const totalCols = COL_KEYS.length;

    if (e.key === "ArrowUp") {
      const value = e.currentTarget.value;
      const newlineIdx = value.indexOf("\n");
      const cursor = e.currentTarget.selectionStart;
      // If no newline, or cursor is on the first line, move focus up
      if (newlineIdx === -1 || cursor === null || cursor <= newlineIdx) {
        e.preventDefault();
        focusCell(rowIndex - 1, colIdx);
      }
    } else if (e.key === "ArrowDown") {
      const value = e.currentTarget.value;
      const newlineIdx = value.indexOf("\n");
      const cursor = e.currentTarget.selectionStart;
      // If no newline, or cursor is on the second line, move focus down
      if (newlineIdx === -1 || cursor === null || cursor > newlineIdx) {
        e.preventDefault();
        focusCell(rowIndex + 1, colIdx);
      }
    } else if (e.key === "ArrowLeft") {
      const cursorPosition = e.currentTarget.selectionStart;
      if (cursorPosition === 0 || cursorPosition === null) {
        e.preventDefault();
        if (colIdx > 0) {
          focusCell(rowIndex, colIdx - 1);
        } else if (rowIndex > 0) {
          focusCell(rowIndex - 1, totalCols - 1);
        }
      }
    } else if (e.key === "ArrowRight") {
      const cursorPosition = e.currentTarget.selectionStart;
      const textLength = e.currentTarget.value.length;
      if (cursorPosition === textLength || cursorPosition === null) {
        e.preventDefault();
        if (colIdx < totalCols - 1) {
          focusCell(rowIndex, colIdx + 1);
        } else if (rowIndex < rows.length - 1) {
          focusCell(rowIndex + 1, 0);
        }
      }
    } else if (e.key === "Enter") {
      const value = e.currentTarget.value;
      const lines = value.split("\n");
      // If we already have 2 lines, Enter will navigate to the row below
      if (lines.length >= 2) {
        e.preventDefault();
        if (rowIndex < rows.length - 1) {
          focusCell(rowIndex + 1, colIdx);
        } else {
          handleAddRow();
          setTimeout(() => {
            focusCell(rowIndex + 1, colIdx);
          }, 100);
        }
      }
      // Otherwise, we allow standard Enter behavior to insert a newline naturally inside the textarea
    } else if (e.key === "Tab") {
      if (!e.shiftKey && rowIndex === rows.length - 1 && colIdx === totalCols - 1) {
        e.preventDefault();
        handleAddRow();
        setTimeout(() => {
          focusCell(rowIndex + 1, 0);
        }, 100);
      }
    }
  };

  return (
    <div className="bg-[#1e1e2e]/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Production Entry Grid</h2>
          <p className="text-xs text-slate-400 mt-1">
            Navigate with <kbd className="bg-slate-800 px-1 rounded text-slate-300">Tab</kbd>,{" "}
            <kbd className="bg-slate-800 px-1 rounded text-slate-300">Enter</kbd>, or{" "}
            <kbd className="bg-slate-800 px-1 rounded text-slate-300">Arrow Keys</kbd>.
          </p>
        </div>
        <button
          onClick={handleAddRow}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 self-start sm:self-center"
        >
          <Plus size={16} />
          Add Row
        </button>
      </div>

      <div ref={gridContainerRef} className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <th className="py-4 px-3 text-center w-12 border-r border-slate-800">SR</th>
              {COL_LABELS.map((col, idx) => (
                <th key={col.key} className="py-4 px-3 border-r border-slate-800 min-w-[120px]">
                  <div className="flex items-center justify-between gap-2">
                    <span>{col.label}</span>
                    {col.key !== "saree" && (
                      <button
                        onClick={() => fillColumnToAll(col.key)}
                        title={`Apply first filled cell in ${col.label} to all rows`}
                        className="text-slate-400 hover:text-violet-400 p-1 rounded hover:bg-slate-800 transition-all"
                      >
                        <ArrowDownToLine size={13} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="py-4 px-3 text-center w-36">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-950/20">
            {rows.map((row, rIdx) => (
              <tr
                key={row.id}
                className="hover:bg-white/[0.02] focus-within:bg-white/[0.04] transition-colors"
              >
                {/* Serial Number */}
                <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-800/80">
                  {rIdx + 1}
                </td>

                {/* Saree Column */}
                <td className="p-1.5 border-r border-slate-800/80">
                  <textarea
                    id={`cell-${rIdx}-saree`}
                    className="w-full bg-transparent border-0 text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/70 focus:bg-slate-900/40 transition-all h-[42px] resize-none overflow-hidden whitespace-pre-wrap leading-tight align-middle text-center"
                    rows={2}
                    value={row.saree}
                    onChange={(e) => updateCell(rIdx, "saree", e.target.value)}
                    onFocus={(e) => handleFocus(rIdx, "saree", e)}
                    onKeyDown={(e) => handleKeyDown(rIdx, 0, e)}
                    placeholder="Saree Name..."
                  />
                </td>

                {/* F1 to F7 Columns */}
                {COL_KEYS.slice(1).map((colKey, colIdx) => (
                  <td key={colKey} className="p-1.5 border-r border-slate-800/80">
                    <textarea
                      id={`cell-${rIdx}-${colKey}`}
                      className="w-full bg-transparent border-0 text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/70 focus:bg-slate-900/40 transition-all h-[42px] resize-none overflow-hidden whitespace-pre-wrap leading-tight align-middle text-center"
                      rows={2}
                      value={row[colKey]}
                      onChange={(e) => updateCell(rIdx, colKey, e.target.value)}
                      onFocus={(e) => handleFocus(rIdx, colKey, e)}
                      onKeyDown={(e) => handleKeyDown(rIdx, colIdx + 1, e)}
                      placeholder="-"
                    />
                  </td>
                ))}

                {/* Actions Cell */}
                <td className="p-1.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {rIdx > 0 && (
                      <button
                        onClick={() => handleCopyPreviousRow(rIdx)}
                        title="Copy Row Above"
                        className="text-slate-400 hover:text-sky-400 p-1.5 rounded hover:bg-slate-800/60 transition-all"
                      >
                        <CornerDownRight size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicateRow(rIdx)}
                      title="Duplicate Row"
                      className="text-slate-400 hover:text-emerald-400 p-1.5 rounded hover:bg-slate-800/60 transition-all"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => handleInsertRow(rIdx)}
                      title="Insert Empty Row Below"
                      className="text-slate-400 hover:text-amber-400 p-1.5 rounded hover:bg-slate-800/60 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteRow(rIdx)}
                      title="Delete Row"
                      className="text-slate-400 hover:text-rose-500 p-1.5 rounded hover:bg-slate-800/60 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
