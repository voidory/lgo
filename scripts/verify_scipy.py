"""Independent cross-check of the JS engine (reads build/engine-dump.json).
Python rebuilds the point group and orbital representation from the raw generators/orbitals, then
  1. checks the JS projectors are idempotent, symmetric and commute with every D(R) built here,
  2. checks projector ranks add up to n,
  3. recomputes sign feasibility with scipy.optimize.linprog for ALL 3^n patterns and compares with the JS table.
Note: the group/orbital construction here follows the same geometric definition, so this is an independent
implementation of the same model, not an independent check of the model's physical assumptions."""
import json, itertools, numpy as np
from scipy.optimize import linprog
data = json.load(open('build/engine-dump.json'))

def close(gens):
    key = lambda M: tuple(np.round(M, 6).flatten() + 0.0)
    els = [np.eye(3)]; seen = {key(np.eye(3))}
    i = 0
    while i < len(els):
        for g in gens:
            m = np.array(g) @ els[i]
            if key(m) not in seen: seen.add(key(m)); els.append(m)
        i += 1
    return els

def rep(els, orbs):
    n = len(orbs); out = []
    for R in els:
        D = np.zeros((n, n))
        for i, o in enumerate(orbs):
            p = R @ np.array(o['pos']); j = [k for k, q in enumerate(orbs) if np.allclose(q['pos'], p, atol=1e-6)][0]
            sg = 1
            if o['dir'] is not None:
                d = R @ np.array(o['dir'])
                sg = 1 if np.allclose(d, orbs[j]['dir'], atol=1e-6) else -1 if np.allclose(d, -np.array(orbs[j]['dir']), atol=1e-6) else None
                assert sg is not None
            D[j, i] = sg
        out.append(D)
    return out

def feasible(B, s, tol=1e-7):
    B = np.array(B).T  # n x D
    n, D = B.shape; s = np.array(s)
    nz = np.where(s != 0)[0]; z = np.where(s == 0)[0]
    if len(nz) == 0: return False
    A_ub = np.hstack([-(s[nz, None] * B[nz]), np.ones((len(nz), 1))]); b_ub = np.zeros(len(nz))
    A_eq = np.hstack([B[z], np.zeros((len(z), 1))]) if len(z) else None; b_eq = np.zeros(len(z)) if len(z) else None
    res = linprog(c=np.r_[np.zeros(D), -1], A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq, bounds=[(-1, 1)] * D + [(None, 1)], method='highs')
    return res.status == 0 and -res.fun > tol

def canon(p):
    f = next((x for x in p if x != 0), 1)
    q = p if f == 1 else tuple(-x for x in p)
    return ''.join('+' if x > 0 else '-' if x < 0 else '0' for x in q)

total_mismatch = 0; total_checked = 0
for case in data:
    els = close(case['generators']); assert len(els) == case['order'], (case['id'], len(els))
    Ds = rep(els, case['orbitals']); n = case['n']
    rank_sum = 0
    for ir in case['irreps']:
        P = np.array(ir['projector'])
        assert np.allclose(P @ P, P, atol=1e-8) and np.allclose(P, P.T, atol=1e-8)
        assert all(np.allclose(D @ P, P @ D, atol=1e-8) for D in Ds)
        rank_sum += round(np.trace(P))
        s2 = sum(np.trace(P @ D) ** 2 for D in Ds); assert abs(s2 - len(els) * ir['mult'] ** 2) < 1e-6, (case['id'], ir['name'], s2)
        js = set(case['feasible'][ir['name']]); py = set()
        for p in itertools.product([-1, 0, 1], repeat=n):
            total_checked += 1
            if feasible(ir['basis'], p): py.add(canon(p))
        if js != py:
            total_mismatch += len(js ^ py); print('MISMATCH', case['id'], ir['name'], sorted(js ^ py))
    assert rank_sum == n, (case['id'], rank_sum)
    print('ok', case['id'], 'order', len(els), 'ranks', [round(np.trace(np.array(i['projector']))) for i in case['irreps']])
print('patterns checked', total_checked, 'mismatches', total_mismatch)
