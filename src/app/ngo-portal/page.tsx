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
      link.setAttribute('download', `lalitpur_PublicCare_contamination_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p style={{ fontSize: '12px', color: '#59524A' }} className="animate-pulse">Verifying NGO Research Credentials...</p>
        </main>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'ngo' && currentUser.role !== 'municipality_admin')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
        <Navbar />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-20 text-center space-y-4">
          <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
            <Lock style={{ width: '32px', height: '32px', color: '#0F6E64' }} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: '#211D17' }}>NGO Developer & Research Portal</h1>
          <p style={{ fontSize: '12px', color: '#59524A' }}>
            Access to real-time contamination telemetry and API keys is restricted to <strong>Registered NGO Partners (`ngo`)</strong>.
          </p>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', paddingTop: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/login')}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', color: '#211D17', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <LogIn style={{ width: '16px', height: '16px', color: '#0F6E64' }} />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => router.push('/register/ngo')}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', backgroundColor: '#0F6E64', border: 'none', color: '#FFFFFF', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <UserPlus style={{ width: '16px', height: '16px' }} />
              <span>Register NGO Account</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  const curlCommand = `curl -X GET "https://PublicCare.lalitpur.gov.np/api/v1/issues?status=CRITICAL" \\
  -H "x-api-key: ${sandboxApiKey || 'cp_lpt_your_key_here'}"`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }} className="sm:flex-row sm:items-center sm:justify-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#0F6E64', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key style={{ width: '24px', height: '24px', color: '#FFFFFF' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#211D17', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>NGO & INGO Open Data Portal</h1>
              <p style={{ fontSize: '12px', color: '#59524A' }}>Anonymized Municipal Telemetry API for Environmental Research in Lalitpur Municipality</p>
            </div>
          </div>

          <button
            onClick={exportCsv}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', color: '#211D17', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}
          >
            <Download style={{ width: '16px', height: '16px', color: '#0F6E64' }} />
            <span>Export Lalitpur CSV Dataset</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          
          <div className="lg:col-span-5 space-y-6">
            
            <div style={{ padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }} className="space-y-4">
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#211D17', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
                <Sparkles style={{ width: '20px', height: '20px', color: '#0F6E64' }} />
                Generate Scoped NGO Access Key
              </h2>
              <p style={{ fontSize: '12px', color: '#59524A', marginBottom: '16px' }}>
                Provision API keys linked to <strong>{currentUser.organizationName || currentUser.name}</strong> to query real-time Lalitpur contamination data.
              </p>

              <form onSubmit={handleGenerateKey} className="space-y-4">
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#211D17', marginBottom: '4px' }}>Organization Name</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.organizationName || currentUser.name}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', backgroundColor: '#F5F1E9', border: '1px solid #D6CFC0', fontSize: '12px', color: '#59524A', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#211D17', marginBottom: '4px' }}>Subscription Tier (Nepali Currency)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTier('COMMUNITY')}
                      style={{ padding: '12px', borderRadius: '12px', border: tier === 'COMMUNITY' ? '1px solid #0F6E64' : '1px solid #D6CFC0', backgroundColor: tier === 'COMMUNITY' ? '#E1F0EA' : '#FFFFFF', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#211D17' }}>Community Tier</div>
                      <div style={{ fontSize: '12px', color: '#157F4A', fontWeight: 'bold', marginTop: '4px' }}>Rs. 0 (Free)</div>
                      <div style={{ fontSize: '10px', color: '#59524A', marginTop: '2px' }}>5,000 req/month</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTier('ENTERPRISE')}
                      style={{ padding: '12px', borderRadius: '12px', border: tier === 'ENTERPRISE' ? '1px solid #C1592B' : '1px solid #D6CFC0', backgroundColor: tier === 'ENTERPRISE' ? '#FBEAE1' : '#FFFFFF', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#211D17' }}>Enterprise Tier</div>
                      <div style={{ fontSize: '12px', color: '#C1592B', fontWeight: 'bold', marginTop: '4px' }}>Rs. 5,000 / month</div>
                      <div style={{ fontSize: '10px', color: '#59524A', marginTop: '2px' }}>50,000 req/month</div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={keyGenerating}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0F6E64', color: '#FFFFFF', fontWeight: 'bold', fontSize: '12px', border: 'none', cursor: 'pointer', marginTop: '8px' }}
                >
                  {keyGenerating ? 'Provisioning Key...' : 'Provision NGO API Key'}
                </button>
              </form>

              {generatedKey && (
                <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', backgroundColor: '#E1F0EA', border: '1px solid #157F4A', color: '#0B5850', fontSize: '12px' }} className="space-y-2">
                  <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Key Generated!</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FFFFFF', border: '1px solid #157F4A', color: '#157F4A', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      {generatedKey.tier} (Rs. {generatedKey.subscriptionCostNpr})
                    </span>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '4px', backgroundColor: '#FFFFFF', fontFamily: 'monospace', fontSize: '11px', color: '#211D17', wordBreak: 'break-all', userSelect: 'all', border: '1px solid #D6CFC0' }}>
                    {generatedKey.apiKey}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }} className="space-y-3">
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#211D17', fontFamily: 'var(--font-display)' }}>Your Owned API Keys ({keys.length})</h3>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {keys.map((k) => (
                  <div key={k.id} style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#FAF8F4', border: '1px solid #D6CFC0', fontSize: '12px' }} className="space-y-1">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 'bold', color: '#211D17' }}>{k.orgName}</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFE9DC', color: '#59524A' }}>
                        {k.tier} • Rs. {k.subscriptionCostNpr}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#59524A' }} className="truncate">{k.apiKey}</div>
                    <div style={{ fontSize: '10px', color: '#7A7266', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                      <span>Rate Limit: {k.rateLimit.toLocaleString()} req/mo</span>
                      <span>Requests: {k.requestCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="lg:col-span-7 space-y-6">
            
            <div style={{ padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }} className="space-y-4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#211D17', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
                  <Terminal style={{ width: '20px', height: '20px', color: '#0F6E64' }} />
                  Interactive API Sandbox
                </h2>
                <span style={{ fontSize: '12px', fontWeight: 600, padding: '6px 10px', borderRadius: '8px', backgroundColor: '#E1F0EA', color: '#0B5850', border: '1px solid #157F4A' }}>
                  GET /api/v1/issues
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#F5F1E9', border: '1px solid #D6CFC0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#59524A', marginBottom: '4px' }}>x-api-key Header</label>
                  <input
                    type="text"
                    placeholder="cp_lpt_..."
                    value={sandboxApiKey}
                    onChange={(e) => setSandboxApiKey(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '12px', fontFamily: 'monospace', color: '#0F6E64' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#59524A', marginBottom: '4px' }}>Filter Status</label>
                  <select
                    value={sandboxStatus}
                    onChange={(e) => setSandboxStatus(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '12px', color: '#211D17' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="REPORTED">REPORTED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#59524A', marginBottom: '4px' }}>Filter Category</label>
                  <select
                    value={sandboxCategory}
                    onChange={(e) => setSandboxCategory(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '12px', color: '#211D17' }}
                  >
                    <option value="">All Categories</option>
                    <option value="GARBAGE_DUMP">GARBAGE_DUMP</option>
                    <option value="SEWAGE_OVERFLOW">SEWAGE_OVERFLOW</option>
                    <option value="WATER_CONTAMINATION">WATER_CONTAMINATION</option>
                    <option value="ILLEGAL_DUMPING">ILLEGAL_DUMPING</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  onClick={handleRunSandbox}
                  disabled={sandboxLoading}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#0F6E64', color: '#FFFFFF', fontWeight: 600, fontSize: '12px', border: 'none', cursor: 'pointer' }}
                >
                  {sandboxLoading ? 'Executing...' : 'Execute API Query'}
                </button>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#59524A', marginBottom: '4px' }}>
                  <span>cURL Request Snippet</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(curlCommand);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#59524A', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {copiedCode ? <Check style={{ width: '14px', height: '14px', color: '#157F4A' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#332E26', border: '1px solid #59524A', fontSize: '11px', fontFamily: 'monospace', color: '#F5F1E9', overflowX: 'auto', margin: 0 }}>
                  {curlCommand}
                </pre>
              </div>

              {sandboxResult && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#59524A', marginBottom: '4px' }}>Live JSON Output</div>
                  <pre style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#332E26', border: '1px solid #59524A', fontSize: '11px', fontFamily: 'monospace', color: '#F5F1E9', maxHeight: '320px', overflowY: 'auto', margin: 0 }}>
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
