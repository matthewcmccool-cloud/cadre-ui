'use client';

import { useState, useRef, useCallback } from 'react';

interface Endpoint {
  path: string;
  label: string;
  description: string;
  color: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    path: '/api/backfill-jobs',
    label: 'Location / Country / Salary',
    description: 'Extract from Raw JSON (Greenhouse/Lever/Ashby)',
    color: 'bg-[#5e6ad2]',
  },
  {
    path: '/api/backfill-functions',
    label: 'Job Functions',
    description: 'Classify by title regex → Function table',
    color: 'bg-[#5e6ad2]',
  },
  {
    path: '/api/backfill-dates',
    label: 'First Seen Dates',
    description: 'Set from Airtable createdTime',
    color: 'bg-[#5e6ad2]',
  },
  {
    path: '/api/enrich-investors',
    label: 'Investor Bio & Location',
    description: 'AI enrich via Perplexity Sonar',
    color: 'bg-[#9333ea]',
  },
  {
    path: '/api/enrich-companies',
    label: 'Company Stage & Size',
    description: 'AI enrich via Perplexity Sonar',
    color: 'bg-[#9333ea]',
  },
  {
    path: '/api/enrich-ats-urls',
    label: 'ATS API URLs',
    description: 'AI discover via Perplexity Sonar',
    color: 'bg-[#9333ea]',
  },
];

export default function BackfillPage() {
  const [running, setRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [stats, setStats] = useState<Record<string, { updated: number; calls: number }>>({});
  const stopRef = useRef(false);

  const addLog = useCallback(
    (msg: string) => setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]),
    []
  );

  const runEndpoint = async (endpoint: Endpoint): Promise<boolean> => {
    const { path, label } = endpoint;
    setCurrentTask(label);
    addLog(`--- Starting: ${label} ---`);
    let totalUpdated = 0;
    let calls = 0;

    while (!stopRef.current) {
      calls++;
      try {
        const res = await fetch(path);
        const text = await res.text();
        const data = JSON.parse(text);

        if (!res.ok) {
          addLog(`Error (${res.status}): ${data.error || text.substring(0, 200)}`);
          return false;
        }

        totalUpdated += data.updated || 0;
        const parts = [
          `updated=${data.updated || 0}`,
          data.processed !== undefined ? `processed=${data.processed}` : '',
          data.skipped !== undefined ? `skipped=${data.skipped}` : '',
          data.alreadyHadLocation ? `already=${data.alreadyHadLocation}` : '',
          data.errors ? `errors=${data.errors}` : '',
        ].filter(Boolean);

        addLog(`  Call ${calls}: ${parts.join(', ')} (${data.runtime})`);

        setStats((prev) => ({
          ...prev,
          [path]: { updated: totalUpdated, calls },
        }));

        if (!data.hasMore) {
          addLog(`  Done! ${totalUpdated} total records updated in ${calls} call(s).`);
          return true;
        }

        // Delay between calls
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        addLog(`  Error on call ${calls}: ${err}`);
        return false;
      }
    }
    addLog(`  Stopped by user.`);
    return false;
  };

  const runSingle = async (endpoint: Endpoint) => {
    stopRef.current = false;
    setRunning(true);
    setLog([]);
    setStats({});
    await runEndpoint(endpoint);
    setCurrentTask('');
    setRunning(false);
  };

  const runAll = async () => {
    stopRef.current = false;
    setRunning(true);
    setLog([]);
    setStats({});

    for (const endpoint of ENDPOINTS) {
      if (stopRef.current) break;
      await runEndpoint(endpoint);
      if (!stopRef.current) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    addLog('=== All tasks finished ===');
    setCurrentTask('');
    setRunning(false);
  };

  const diagnose = async () => {
    stopRef.current = false;
    setRunning(true);
    setLog([]);
    setStats({});
    setCurrentTask('Diagnostics');
    addLog('--- Running diagnostics ---');
    try {
      const res = await fetch('/api/backfill-jobs?mode=diagnose');
      const text = await res.text();
      const data = JSON.parse(text);
      addLog(`Jobs with Raw JSON: ${data.withRawJson}`);
      addLog(`  Already have Location: ${data.withRawJsonAndLocation}`);
      addLog(`  Need backfill: ${data.withRawJsonNoLocation}`);
      addLog(`  Scan complete: ${data.complete ? 'Yes' : 'No (timed out, more exist)'}`);
      addLog(`  Runtime: ${data.runtime}`);
    } catch (err) {
      addLog(`Error: ${err}`);
    }
    setCurrentTask('');
    setRunning(false);
  };

  const stop = () => {
    stopRef.current = true;
    addLog('Stopping after current call finishes...');
  };

  const totalUpdated = Object.values(stats).reduce((sum, s) => sum + s.updated, 0);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8 font-mono">
      <h1 className="text-xl font-bold mb-2">Cadre Admin — Backfill Runner</h1>
      {currentTask && (
        <p className="text-sm text-[#5e6ad2] mb-4 animate-pulse">Running: {currentTask}...</p>
      )}
      {!currentTask && totalUpdated > 0 && (
        <p className="text-sm text-green-400 mb-4">Total records updated: {totalUpdated}</p>
      )}

      {/* Control buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={diagnose}
          disabled={running}
          className="px-4 py-2 bg-[#444] hover:bg-[#555] rounded text-sm disabled:opacity-50 transition"
        >
          Diagnose
        </button>
        <button
          onClick={runAll}
          disabled={running}
          className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-bold disabled:opacity-50 transition"
        >
          Run All (6 endpoints)
        </button>
        {running && (
          <button
            onClick={stop}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm transition"
          >
            Stop
          </button>
        )}
      </div>

      {/* Individual endpoint buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {ENDPOINTS.map((ep) => (
          <button
            key={ep.path}
            onClick={() => runSingle(ep)}
            disabled={running}
            className={`${ep.color} hover:opacity-90 rounded p-3 text-left text-sm disabled:opacity-50 transition`}
          >
            <div className="font-bold">{ep.label}</div>
            <div className="text-xs opacity-75">{ep.description}</div>
            {stats[ep.path] && (
              <div className="text-xs mt-1 opacity-90">
                {stats[ep.path].updated} updated in {stats[ep.path].calls} call(s)
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Log output */}
      <div className="bg-[#252526] rounded p-4 max-h-[60vh] overflow-y-auto text-xs leading-5">
        {log.length === 0 && (
          <p className="text-[#999]">Click a button to start. Each endpoint auto-loops until done.</p>
        )}
        {log.map((line, i) => (
          <p
            key={i}
            className={
              line.includes('Done!') || line.includes('finished')
                ? 'text-green-400'
                : line.includes('Error')
                  ? 'text-red-400'
                  : line.includes('Starting')
                    ? 'text-[#5e6ad2]'
                    : line.includes('Stopped')
                      ? 'text-yellow-400'
                      : 'text-[#999]'
            }
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
