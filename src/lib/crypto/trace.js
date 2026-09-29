import { CHAINS } from './chains.js';
import { fetchEvmAddress } from './evm.js';
import { fetchUtxoAddress } from './utxo.js';

/**
 * First and last activity, derived from the loaded transactions. The first one is
 * only known when the whole history fits in the loaded page.
 * @param {{ time: Date | null }[]} txs newest first
 * @param {number} txCount
 */
export function activityRange(txs, txCount) {
	const times = txs.map((tx) => tx.time).filter(Boolean);
	if (!times.length) return { firstSeen: null, lastSeen: null };
	const sorted = times.toSorted((a, b) => a.getTime() - b.getTime());
	return {
		firstSeen: txs.length >= txCount ? sorted[0] : null,
		lastSeen: sorted.at(-1)
	};
}

/**
 * Loads the on-chain data of an address already checked by analyzeAddress().
 * @param {{ chain: 'btc' | 'ltc' | 'eth', address: string }} target
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 */
export async function traceAddress(target, options = {}) {
	const chain = CHAINS[target.chain];
	const data =
		chain.kind === 'evm'
			? await fetchEvmAddress(chain, target.address, options)
			: await fetchUtxoAddress(chain, target.address, options);
	return { ...data, ...activityRange(data.txs, data.txCount) };
}
