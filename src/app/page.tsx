'use client';

import { useState } from 'react';

interface Hierarchy {
  root: string;
  tree: any;
  depth?: number;
  has_cycle?: boolean;
}

interface Summary {
  total_trees: number;
  total_cycles: number;
  largest_tree_root: string;
}

interface ApiResponse {
  user_id: string;
  email_id: string;
  college_roll_number: string;
  hierarchies: Hierarchy[];
  invalid_entries: string[];
  duplicate_edges: string[];
  summary: Summary;
}

export default function Home() {
  const [input, setInput] = useState<string>('["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello"]');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(input);
      } catch (e) {
        throw new Error("Invalid JSON format. Please enter an array of strings like [\"A->B\", \"B->C\"]");
      }

      if (!Array.isArray(parsedData)) {
        throw new Error("Input must be a JSON array of strings.");
      }

      const res = await fetch('/bfhl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: parsedData }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to fetch from API");
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const TreeView = ({ data }: { data: any }) => {
    if (typeof data !== 'object' || data === null || Object.keys(data).length === 0) return null;

    return (
      <div className="tree-node-container">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="tree-node">
            <span className="node-label">{key}</span>
            <TreeView data={value} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <main>
      <div className="container">
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #818cf8, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            BFHL SRM Challenge
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Hierarchical Node Processor & Tree Visualizer
          </p>
        </header>

        <section className="glass-card">
          <div className="input-group">
            <label className="label">Enter Node List (JSON Array)</label>
            <textarea
              rows={5}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='["A->B", "B->C"]'
            />
          </div>
          <button className="btn" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="loading-spinner"></div> : "Analyze Hierarchies"}
          </button>
          {error && (
            <div style={{ marginTop: '1rem', color: 'var(--error)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}
        </section>

        {response && (
          <div className="response-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '2rem' }}>Process Insights</h2>
                <p style={{ color: 'var(--text-muted)' }}>Found {response.hierarchies.length} groups in {response.user_id}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-primary">{response.college_roll_number}</span>
              </div>
            </div>

            <div className="grid">
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Trees</span>
                    <span className="badge badge-success">{response.summary.total_trees}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Cycles</span>
                    <span className="badge badge-error">{response.summary.total_cycles}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Largest Tree Root</span>
                    <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{response.summary.largest_tree_root || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Edge Statistics</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Invalid Entries</span>
                    <span className={response.invalid_entries.length > 0 ? 'badge badge-error' : 'badge badge-success'}>
                      {response.invalid_entries.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Duplicate Edges</span>
                    <span className={response.duplicate_edges.length > 0 ? 'badge badge-primary' : ''}>
                      {response.duplicate_edges.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Hierarchies</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {response.hierarchies.map((h, i) => (
                  <div key={i} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: h.has_cycle ? 'var(--error)' : 'var(--primary)', display: 'flex', alignItems: 'center', fontWeight: '700', fontSize: '1.2rem', justifyContent: 'center' }}>
                          {h.root}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.1rem' }}>Root: {h.root}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {h.has_cycle ? 'Cyclic Group' : `Tree Depth: ${h.depth}`}
                          </span>
                        </div>
                      </div>
                      {h.has_cycle && <span className="badge badge-error">Cycle Detected</span>}
                    </div>

                    {!h.has_cycle ? (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--card-border)' }}>
                        <TreeView data={h.tree} />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', border: '1px dashed var(--card-border)', borderRadius: '1rem' }}>
                        Tree visualization unavailable for cyclic relationships
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Raw JSON Response</h3>
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <pre style={{ margin: '0', borderRadius: '0' }}>
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        <footer style={{ marginTop: '4rem', padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--card-border)' }}>
          <p>© 2026 SRM Full Stack Challenge - Built with Next.js & Premium Aesthetics</p>
        </footer>
      </div>
    </main>
  );
}
