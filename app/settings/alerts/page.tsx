'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';

interface Preferences {
  weeklyDigest: boolean;
  dailyDigest: boolean;
  dailyDigestTime: string;
  realtimeNewRoles: boolean;
  realtimeFundraises: boolean;
  realtimeSurges: boolean;
  realtimeStalls: boolean;
  newsletter: boolean;
}

const DEFAULT_PREFS: Preferences = {
  weeklyDigest: true,
  dailyDigest: false,
  dailyDigestTime: '09:00',
  realtimeNewRoles: true,
  realtimeFundraises: true,
  realtimeSurges: true,
  realtimeStalls: true,
  newsletter: true,
};

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return { value: `${String(i).padStart(2, '0')}:00`, label: `${h}:00 ${ampm}` };
});

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
        disabled
          ? 'bg-zinc-800 cursor-not-allowed opacity-50'
          : checked
            ? 'bg-purple-600'
            : 'bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

export default function AlertSettings() {
  const { isPro } = useSubscription();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Fetch preferences
  useEffect(() => {
    fetch('/api/preferences')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setPrefs((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Save on change
  const save = useCallback(
    (updated: Preferences) => {
      setPrefs(updated);
      setSaved(false);
      fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
        .then(() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        })
        .catch(() => {});
    },
    []
  );

  const update = useCallback(
    (key: keyof Preferences, value: boolean | string) => {
      const updated = { ...prefs, [key]: value };
      save(updated);
    },
    [prefs, save]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-medium text-zinc-100">Alerts</h2>
        {saved && (
          <span className="text-xs text-emerald-400 animate-fade-in">
            Saved
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Weekly digest */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-100 font-medium">Weekly digest</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Summary of your followed companies&apos; activity. Delivered Saturday mornings.
            </p>
          </div>
          <Toggle checked={prefs.weeklyDigest} onChange={(v) => update('weeklyDigest', v)} />
        </div>

        {/* Daily digest (Pro) */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-zinc-100 font-medium">Daily digest</p>
              {!isPro && (
                <span className="text-[10px] font-semibold text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">
                  PRO
                </span>
              )}
            </div>
            {isPro ? (
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={prefs.dailyDigestTime}
                  onChange={(e) => update('dailyDigestTime', e.target.value)}
                  disabled={!prefs.dailyDigest}
                  className="bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 px-2 py-1 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                >
                  {HOURS.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <Link
                href="/pricing"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors mt-0.5 inline-block"
              >
                Upgrade to Pro to enable →
              </Link>
            )}
          </div>
          <Toggle
            checked={prefs.dailyDigest}
            onChange={(v) => update('dailyDigest', v)}
            disabled={!isPro}
          />
        </div>

        {/* Real-time alerts (Pro) */}
        <div className="border-t border-zinc-800 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm text-zinc-100 font-medium">Real-time alerts</p>
            {!isPro && (
              <span className="text-[10px] font-semibold text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">
                PRO
              </span>
            )}
          </div>

          {isPro ? (
            <div className="space-y-3 ml-1">
              {([
                ['realtimeNewRoles', 'New roles at followed companies'],
                ['realtimeFundraises', 'Fundraise events at followed companies'],
                ['realtimeSurges', 'Surge alerts (3x+ posting rate)'],
                ['realtimeStalls', 'Stall alerts (60+ days quiet)'],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <p className="text-sm text-zinc-300">{label}</p>
                  <Toggle
                    checked={prefs[key]}
                    onChange={(v) => update(key, v)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Link
              href="/pricing"
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Upgrade to Pro to enable →
            </Link>
          )}
        </div>

        {/* Newsletter */}
        <div className="border-t border-zinc-800 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-100 font-medium">Newsletter</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                The Cadre Hiring Signal — ecosystem-wide hiring insights.
              </p>
            </div>
            <Toggle checked={prefs.newsletter} onChange={(v) => update('newsletter', v)} />
          </div>
        </div>
      </div>
    </div>
  );
}
