import React from "react";
import { HeaderData } from "../types";

interface HeaderFormProps {
  data: HeaderData;
  onChange: (field: keyof HeaderData, value: string) => void;
}

export const HeaderForm: React.FC<HeaderFormProps> = ({ data, onChange }) => {
  return (
    <div className="bg-[#1e1e2e]/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold text-white tracking-wide">Header Information</h2>
        <span className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">Factory Details</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Company Name */}
        <div className="space-y-2">
          <label htmlFor="companyName" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Company Name</label>
          <input
            id="companyName"
            type="text"
            className="w-full bg-slate-900/60 border border-slate-750 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-slate-500"
            value={data.companyName}
            onChange={(e) => onChange("companyName", e.target.value)}
            placeholder="UMA CREATION / UMA FAB"
          />
        </div>

        {/* Design Name (Big Prominent Value) */}
        <div className="space-y-2">
          <label htmlFor="designName" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Design Name / Heading</label>
          <input
            id="designName"
            type="text"
            className="w-full bg-slate-900/60 border border-slate-750 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-medium placeholder:text-slate-500"
            value={data.designName}
            onChange={(e) => onChange("designName", e.target.value)}
            placeholder="110 Lichi / Parrot Beam"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {/* Date */}
        <div className="space-y-2">
          <label htmlFor="date" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Date</label>
          <input
            id="date"
            type="text"
            className="w-full bg-slate-900/60 border border-slate-750 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-slate-500"
            value={data.date}
            onChange={(e) => onChange("date", e.target.value)}
            placeholder="e.g. 20/06/2026"
          />
        </div>

        {/* M No. */}
        <div className="space-y-2">
          <label htmlFor="mNo" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">M No.</label>
          <input
            id="mNo"
            type="text"
            className="w-full bg-slate-900/60 border border-slate-750 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-slate-500"
            value={data.mNo}
            onChange={(e) => onChange("mNo", e.target.value)}
            placeholder="e.g. 102"
          />
        </div>

        {/* Design */}
        <div className="space-y-2">
          <label htmlFor="design" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Design (DESIG)</label>
          <input
            id="design"
            type="text"
            className="w-full bg-slate-900/60 border border-slate-750 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-slate-500"
            value={data.design}
            onChange={(e) => onChange("design", e.target.value)}
            placeholder="e.g. Lichi"
          />
        </div>

        {/* Pick */}
        <div className="space-y-2">
          <label htmlFor="pick" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Pick</label>
          <input
            id="pick"
            type="text"
            className="w-full bg-slate-900/60 border border-slate-750 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-slate-500"
            value={data.pick}
            onChange={(e) => onChange("pick", e.target.value)}
            placeholder="e.g. 80"
          />
        </div>

        {/* Party */}
        <div className="space-y-2">
          <label htmlFor="party" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Party</label>
          <input
            id="party"
            type="text"
            className="w-full bg-slate-900/60 border border-slate-750 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-slate-500"
            value={data.party}
            onChange={(e) => onChange("party", e.target.value)}
            placeholder="e.g. UMA FAB"
          />
        </div>

        {/* Order No */}
        <div className="space-y-2">
          <label htmlFor="orderNo" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Order No.</label>
          <input
            id="orderNo"
            type="text"
            className="w-full bg-slate-900/60 border border-slate-750 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-slate-500"
            value={data.orderNo}
            onChange={(e) => onChange("orderNo", e.target.value)}
            placeholder="e.g. 5429"
          />
        </div>
      </div>
    </div>
  );
};
