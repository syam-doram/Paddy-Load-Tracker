import React, { useState } from 'react';

export default function MarketEntryPage({ handleCreateMarket, newMarketForm, setNewMarketForm }: any) {
  return (
    <div className="max-w-lg mx-auto bg-white border border-zinc-200 rounded-2xl p-8 mt-8 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Add Market Entry</h2>
      <form onSubmit={handleCreateMarket} className="space-y-4">
        <div>
          <label className="text-xs text-zinc-500">Name</label>
          <input required value={newMarketForm.name} onChange={(e) => setNewMarketForm({ ...newMarketForm, name: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Price (₹)</label>
          <input required type="number" step="0.01" value={newMarketForm.price} onChange={(e) => setNewMarketForm({ ...newMarketForm, price: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-zinc-500">Unit</label>
            <input value={newMarketForm.unit} onChange={(e) => setNewMarketForm({ ...newMarketForm, unit: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Change %</label>
            <input type="number" step="0.01" value={newMarketForm.change_percent} onChange={(e) => setNewMarketForm({ ...newMarketForm, change_percent: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500">Region</label>
          <input value={newMarketForm.region} onChange={(e) => setNewMarketForm({ ...newMarketForm, region: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Trend (comma separated)</label>
          <input value={newMarketForm.trend} onChange={(e) => setNewMarketForm({ ...newMarketForm, trend: e.target.value })} placeholder="1800,1850,1900,2000" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm">Add</button>
          <button type="button" onClick={() => setNewMarketForm({ name: '', price: '', unit: '/qtl', change_percent: '', region: '', trend: '' })} className="px-3 py-2 rounded-md text-sm border">Clear</button>
        </div>
      </form>
    </div>
  );
}
