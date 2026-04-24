import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!Array.isArray(data)) {
      return NextResponse.json({ is_success: false, message: "Invalid input: data must be an array" }, { status: 400 });
    }

    const user_id = "rahulsheoran_24042026";
    const email_id = "rs3604@srmist.edu.in";
    const college_roll_number = "RA2311030010256";

    const invalid_entries: string[] = [];
    const duplicate_edges: string[] = [];
    const seen_edges = new Set<string>();
    const valid_edges: [string, string][] = [];
    const all_nodes = new Set<string>();

    // 1. Process Edges
    for (const entry of data) {
      if (typeof entry !== 'string') {
        invalid_entries.push(String(entry));
        continue;
      }

      const trimmed = entry.trim();
      const match = trimmed.match(/^([A-Z])->([A-Z])$/);

      if (!match) {
        invalid_entries.push(trimmed);
        continue;
      }

      const parent = match[1];
      const child = match[2];

      if (parent === child) {
        invalid_entries.push(trimmed);
        continue;
      }

      const edgeKey = `${parent}->${child}`;
      if (seen_edges.has(edgeKey)) {
        if (!duplicate_edges.includes(edgeKey)) {
          duplicate_edges.push(edgeKey);
        }
        continue;
      }

      seen_edges.add(edgeKey);
      valid_edges.push([parent, child]);
      all_nodes.add(parent);
      all_nodes.add(child);
    }

    // 2. Build Adjacency List and Parent Tracking (Multi-parent rule)
    const adj: Record<string, string[]> = {};
    const child_to_parent: Record<string, string> = {};
    const filtered_valid_edges: [string, string][] = [];
    
    for (const [p, c] of valid_edges) {
      if (child_to_parent[c]) {
        // Multi-parent case: discard subsequent edges
        continue;
      }
      child_to_parent[c] = p;
      filtered_valid_edges.push([p, c]);
      if (!adj[p]) adj[p] = [];
      adj[p].push(c);
    }

    // 3. Group Nodes (Connected Components)
    const parent_map: Record<string, string> = {};
    const find = (i: string): string => {
      if (!parent_map[i]) parent_map[i] = i;
      if (parent_map[i] === i) return i;
      return parent_map[i] = find(parent_map[i]);
    };

    const union = (i: string, j: string) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) parent_map[rootI] = rootJ;
    };

    for (const [p, c] of filtered_valid_edges) {
      union(p, c);
    }

    const groups: Record<string, string[]> = {};
    all_nodes.forEach(node => {
      const root = find(node);
      if (!groups[root]) groups[root] = [];
      groups[root].push(node);
    });

    // 4. Process Each Group
    const hierarchies: any[] = [];
    let total_trees = 0;
    let total_cycles = 0;
    let largest_depth = -1;
    let largest_tree_root = "";

    Object.values(groups).forEach(groupNodes => {
      // Find roots in this group
      const in_degree: Record<string, number> = {};
      groupNodes.forEach(n => in_degree[n] = 0);
      groupNodes.forEach(p => {
        (adj[p] || []).forEach(c => {
          in_degree[c] = (in_degree[c] || 0) + 1;
        });
      });

      const roots = groupNodes.filter(n => in_degree[n] === 0).sort();
      
      if (roots.length === 0) {
        // Pure cycle
        const cycleRoot = [...groupNodes].sort()[0];
        hierarchies.push({
          root: cycleRoot,
          tree: {},
          has_cycle: true
        });
        total_cycles++;
      } else {
        // For each root, check if it's a valid tree
        // Note: The problem implies independent trees. If multiple nodes have in_degree 0, they are separate roots.
        roots.forEach(root => {
          let has_cycle = false;
          const visited = new Set<string>();
          const recursionStack = new Set<string>();

          const buildTree = (node: string): any => {
            if (recursionStack.has(node)) {
              has_cycle = true;
              return {};
            }
            if (visited.has(node)) return {}; // Should not happen with multi-parent rule

            visited.add(node);
            recursionStack.add(node);
            
            const children = adj[node] || [];
            const result: any = {};
            children.forEach(c => {
              result[c] = buildTree(c);
            });
            
            recursionStack.delete(node);
            return result;
          };

          const treeContent = { [root]: buildTree(root) };

          const getDepth = (node: any): number => {
            const keys = Object.keys(node);
            if (keys.length === 0) return 1;
            let maxChildDepth = 0;
            keys.forEach(k => {
              maxChildDepth = Math.max(maxChildDepth, getDepth(node[k]));
            });
            return 1 + maxChildDepth;
          };

          if (has_cycle) {
            hierarchies.push({
              root: root,
              tree: {},
              has_cycle: true
            });
            total_cycles++;
          } else {
            const depth = getDepth(treeContent[root]);
            hierarchies.push({
              root: root,
              tree: treeContent,
              depth: depth
            });
            total_trees++;

            if (depth > largest_depth) {
              largest_depth = depth;
              largest_tree_root = root;
            } else if (depth === largest_depth) {
              if (!largest_tree_root || root < largest_tree_root) {
                largest_tree_root = root;
              }
            }
          }
        });
      }
    });

    // Sort hierarchies by root lexicographically
    hierarchies.sort((a, b) => a.root.localeCompare(b.root));

    const response = {
      user_id,
      email_id,
      college_roll_number,
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root: largest_tree_root || (total_trees > 0 ? "" : undefined)
      }
    };

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    return NextResponse.json({ is_success: false, message: error.message }, { status: 500 });
  }
}
