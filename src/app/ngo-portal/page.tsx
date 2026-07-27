'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { NgoApiKey, User } from '@/types';
import { Key, Download, Copy, Check, Terminal, Sparkles, Lock, LogIn, UserPlus } from 'lucide-react';

export default function NgoPortal() {
  const router = useRouter();
  const [keys, setKeys] = useState<NgoApiKey[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orgName, setOrgName] = useState('');
  const [tier, setTier] = useState<'COMMUNITY' | 'ENTERPRISE'>('COMMUNITY');
  const [loading, setLoading] = useState(true);
  const [keyGenerating, setKeyGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<NgoApiKey | null>(null);

  // API Sandbox State
  const [sandboxApiKey, setSandboxApiKey] = useState('');
  const [sandboxCategory, setSandboxCategory] = useState('');
  const [sandboxStatus, setSandboxStatus] = useState('');
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchKeysAndSession = async () => {
    try {
      setLoading(true);
      const authRes = await fetch('/api/auth');
      const authData = await authRes.json();

      if (authData.success && authData.user) {
        setCurrentUser(authData.user);
        
        if (authData.user.role === 'ngo' || authData.user.role === 'municipality_admin') {
          const res = await fetch('/api/v1/ngo/keys');
          const data = await res.json();
          if (data.success) {
            setKeys(data.data);
            if (data.data.length > 0 && !sandboxApiKey) {
              setSandboxApiKey(data.data[0].apiKey);
            }
          }
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Failed to load NGO portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeysAndSession();
  }, []);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyGenerating(true);
    try {
      const res = await fetch('/api/v1/ngo/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName: orgName || currentUser?.organizationName || currentUser?.name, tier })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data.data);
        setSandboxApiKey(data.data.apiKey);
        setOrgName('');
        fetchKeysAndSession();
      }
    } catch (err) {
      console.error('Key generation failed', err);
    } finally {
      setKeyGenerating(false);
    }
  };

  const handleRunSandbox = async () => {
    setSandboxLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (sandboxApiKey) headers['x-api-key'] = sandboxApiKey;

      const params = new URLSearchParams();
      if (sandboxCategory) params.append('category', sandboxCategory);
      if (sandboxStatus) params.append('status', sandboxStatus);

      const res = await fetch(`/api/v1/issues?${params.toString()}`, { headers });
      const data = await res.json();
      setSandboxResult(data);
    } catch (err: any) {
      setSandboxResult({ error: err.message || 'API Query Failed' });
    } finally {
      setSandboxLoading(false);
    }
  };

  const exportCsv = async () => {
    try {
      const res = await fetch('/api/v1/issues');
      const data = await res.json();
      if (!data.success || !data.data) return;

      const issues = data.data;
      const headers = ['id', 'title', 'category', 'status', 'netUpvotes', 'address', 'locationLat', 'locationLng', 'createdAt'];
      const rows = issues.map((i: any) => [
        i.id,
        `"${i.title.replace(/"/g, '""')}"`,
        i.category,
        i.status,
        i.netUpvotes,
        `"${i.address.replace(/"/g, '""')}"`,
        i.locationLat,
        i.locationLng,
        i.createdAt
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `lalitpur_civicpulse_contamination_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xs text-slate-500 animate-pulse">Verifying NGO Research Credentials...</p>
        </main>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'ngo' && currentUser.role !== 'municipality_admin')) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-xl font-bold text-white">NGO Developer & Research Portal</h1>
          <p className="text-xs text-slate-400">
            Access to real-time contamination telemetry and API keys is restricted to <strong>Registered NGO Partners (`ngo`)</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => router.push('/login')}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-sky-400" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => router.push('/register/ngo')}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register NGO Account</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  const curlCommand = `curl -X GET "https://civicpulse.lalitpur.gov.np/api/v1/issues?status=CRITICAL" \\
  -H "x-api-key: ${sandboxApiKey || 'cp_lpt_your_key_here'}"`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-950/50">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">NGO & INGO Open Data Portal</h1>
              <p className="text-xs text-slate-400">Anonymized Municipal Telemetry API for Environmental Research in Lalitpur Municipality</p>
            </div>
          </div>

          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export Lalitpur CSV Dataset</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-5 space-y-6">
            
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Generate Scoped NGO Access Key
              </h2>
              <p className="text-xs text-slate-400">
                Provision API keys linked to <strong>{currentUser.organizationName || currentUser.name}</strong> to query real-time Lalitpur contamination data.
              </p>

              <form onSubmit={handleGenerateKey} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Organization Name</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.organizationName || currentUser.name}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription Tier (Nepali Currency)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTier('COMMUNITY')}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                        tier === 'COMMUNITY'
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-sm">Community Tier</div>
                      <div className="text-xs text-emerald-400 font-bold mt-1">Rs. 0 (Free)</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">5,000 req/month</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTier('ENTERPRISE')}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                        tier === 'ENTERPRISE'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-sm">Enterprise Tier</div>
                      <div className="text-xs text-purple-300 font-bold mt-1">Rs. 5,000 / month</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">50,000 req/month</div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={keyGenerating}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-950/40 cursor-pointer"
                >
                  {keyGenerating ? 'Provisioning Key...' : 'Provision NGO API Key'}
                </button>
              </form>

              {generatedKey && (
                <div className="mt-4 p-4 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 text-xs space-y-2">
                  <div className="font-bold flex items-center justify-between">
                    <span>Key Generated!</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 uppercase font-bold">
                      {generatedKey.tier} (Rs. {generatedKey.subscriptionCostNpr})
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-emerald-400 break-all select-all">
                    {generatedKey.apiKey}
                  </div>
                </div>
              )}
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Your Owned API Keys ({keys.length})</h3>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {keys.map((k) => (
                  <div key={k.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{k.orgName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                        {k.tier} • Rs. {k.subscriptionCostNpr}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 truncate">{k.apiKey}</div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Rate Limit: {k.rateLimit.toLocaleString()} req/mo</span>
                      <span>Requests: {k.requestCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="lg:col-span-7 space-y-6">
            
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  Interactive API Sandbox
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  GET /api/v1/issues
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">x-api-key Header</label>
                  <input
                    type="text"
                    placeholder="cp_lpt_..."
                    value={sandboxApiKey}
                    onChange={(e) => setSandboxApiKey(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 placeholder-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter Status</label>
                  <select
                    value={sandboxStatus}
                    onChange={(e) => setSandboxStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">All Statuses</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="REPORTED">REPORTED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter Category</label>
                  <select
                    value={sandboxCategory}
                    onChange={(e) => setSandboxCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">All Categories</option>
                    <option value="GARBAGE_DUMP">GARBAGE_DUMP</option>
                    <option value="SEWAGE_OVERFLOW">SEWAGE_OVERFLOW</option>
                    <option value="WATER_CONTAMINATION">WATER_CONTAMINATION</option>
                    <option value="ILLEGAL_DUMPING">ILLEGAL_DUMPING</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleRunSandbox}
                  disabled={sandboxLoading}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                >
                  {sandboxLoading ? 'Executing...' : 'Execute API Query'}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
                  <span>cURL Request Snippet</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(curlCommand);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="flex items-center gap-1 text-slate-400 hover:text-white"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {curlCommand}
                </pre>
              </div>

              {sandboxResult && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1">Live JSON Output</div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 max-h-[320px] overflow-y-auto">
                    {JSON.stringify(sandboxResult, null, 2)}
                  </pre>
                </div>
              )}

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
