'use client';

import { useState, useRef } from 'react';

export default function BackfillPage() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const stopRef = useRef(false);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const runBackfill = async (endpoint: string, label: string) => {
    addLog(`--- Starting ${label} ---`);
    let totalUpdated = 0;
    let calls = 0;

    while (!stopRef.current) {
      calls++;
      try {
        const res = await fetch(endpoint);
        const text = await res.text();
        const data = JSON.parse(text);

        totalUpdated += data.updated || 0;
        addLog(`Call ${calls}: ${data.updated || 0} updated (${totalUpdated} total) — ${data.runtime}`);

        if (!data.hasMore) {
          addLog(`✓ ${label} complete! ${totalUpdated} records updated.`);
          break;
        }

        // Small delay between calls
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        addLog(`Error on call ${calls}: ${err}`);
        break;
      }
    }
  };

  const start = async (endpoint: string, label: string) => {
    stopRef.current = false;
    setRunning(true);
    setLog([]);
    await runBackfill(endpoint, label);
    setRunning(false);
  };

  const stop = () => {
    stopRef.current = true;
    addLog('Stopping...');
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8 font-mono">
      <h1 className="text-xl font-bold mb-6">Cadre Admin — Backfill</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => start('/api/backfill-jobs', 'Location / Country / Salary')}
          disabled={running}
          className="px-4 py-2 bg-[#5e6ad2] rounded text-sm disabled:opacity-50"
        >
          Backfill Location / Country / Salary
        </button>
        {running && (
          <button onClick={stop} className="px-4 py-2 bg-red-600 rounded text-sm">
            Stop
          </button>
        )}
      </div>

      <div className="bg-[#252526] rounded p-4 max-h-[70vh] overflow-y-auto text-xs">
        {log.length === 0 && <p className="text-[#666]">Click a button to start backfilling...</p>}
        {log.map((line, i) => (
          <p key={i} className={line.startsWith('✓') ? 'text-green-400' : line.startsWith('Error') ? 'text-red-400' : 'text-[#999]'}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
