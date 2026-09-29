import { describe, expect, it } from 'vitest';
import { CHAINS } from './chains.js';
import { fetchEvmAddress, parseEvmTx } from './evm.js';
import { activityRange, traceAddress } from './trace.js';
import { parseUtxoTx, summarizeUtxoStats } from './utxo.js';

const ME = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
const A = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
const B = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';

/** Minimal Esplora transaction in the shape returned by mempool.space. */
function utxoTx(txid, vin, vout, status = { confirmed: true, block_time: 1700000000 }) {
	return {
		txid,
		vin: vin.map(([address, value]) => ({
			is_coinbase: false,
			prevout: { scriptpubkey_address: address, value }
		})),
		vout: vout.map(([address, value]) =>
			address ? { scriptpubkey_address: address, value } : { value }
		),
		fee: 100,
		status
	};
}

describe('summarizeUtxoStats', () => {
	it('adds confirmed and mempool totals', () => {
		const stats = summarizeUtxoStats({
			chain_stats: { funded_txo_sum: 1000, spent_txo_sum: 400, tx_count: 3 },
			mempool_stats: { funded_txo_sum: 50, spent_txo_sum: 0, tx_count: 1 }
		});
		expect(stats).toEqual({
			balance: 650n,
			received: 1050n,
			sent: 400n,
			txCount: 4,
			pendingTxCount: 1
		});
	});
});

describe('parseUtxoTx', () => {
	it('parses an incoming payment', () => {
		const tx = parseUtxoTx(
			utxoTx(
				't1',
				[[A, 5000]],
				[
					[ME, 3000],
					[A, 1900]
				]
			),
			ME
		);
		expect(tx).toMatchObject({ direction: 'in', amount: 3000n, counterparties: [A] });
		expect(tx.time).toEqual(new Date(1700000000 * 1000));
	});

	it('parses an outgoing payment with change', () => {
		const tx = parseUtxoTx(
			utxoTx(
				't2',
				[[ME, 10000]],
				[
					[B, 6000],
					[ME, 3900],
					[null, 0]
				],
				{ confirmed: false }
			),
			ME
		);
		expect(tx).toMatchObject({
			direction: 'out',
			amount: 6100n,
			counterparties: [B],
			confirmed: false,
			time: null
		});
	});

	it('parses a self transfer', () => {
		const tx = parseUtxoTx(utxoTx('t3', [[ME, 10000]], [[ME, 9900]]), ME);
		expect(tx).toMatchObject({ direction: 'self', amount: 100n, counterparties: [] });
	});
});

const ETH = '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe';
const OTHER = '0xF193DC997806F669ec087855191b584Dee117376';

/** Minimal Blockscout transaction. */
function evmTx(hash, from, to, value, extra = {}) {
	return {
		hash,
		from: { hash: from },
		to: to ? { hash: to } : null,
		value,
		status: 'ok',
		result: 'success',
		method: '0x41c0e1b5',
		block_number: 1,
		fee: { type: 'actual', value: '21000' },
		timestamp: '2026-09-18T04:28:23.000000Z',
		...extra
	};
}

describe('parseEvmTx', () => {
	it('detects direction case-insensitively', () => {
		expect(parseEvmTx(evmTx('0x1', OTHER, ETH.toLowerCase(), '1000'), ETH)).toMatchObject({
			direction: 'in',
			amount: 1000n,
			counterparties: [OTHER],
			method: null
		});
		expect(parseEvmTx(evmTx('0x2', ETH, OTHER, '5', { method: 'transfer' }), ETH)).toMatchObject({
			direction: 'out',
			counterparties: [OTHER],
			method: 'transfer'
		});
		expect(parseEvmTx(evmTx('0x3', ETH, ETH, '0'), ETH).direction).toBe('self');
	});

	it('handles failed transactions and contract creation', () => {
		const tx = parseEvmTx(
			evmTx('0x4', ETH, null, '0', { status: 'error', created_contract: { hash: OTHER } }),
			ETH
		);
		expect(tx).toMatchObject({ failed: true, direction: 'out', counterparties: [OTHER] });
	});
});

/** Fake fetch serving fixed JSON bodies by URL. */
function fakeFetch(routes) {
	return async (url) => {
		const body = routes[url];
		if (body === undefined) return new Response('not found', { status: 404 });
		return new Response(JSON.stringify(body), { status: 200 });
	};
}

describe('fetchEvmAddress', () => {
	it('combines address info, counters and transactions', async () => {
		const base = `${CHAINS.eth.api}/addresses/${ETH}`;
		const data = await fetchEvmAddress(CHAINS.eth, ETH, {
			fetch: fakeFetch({
				[base]: {
					coin_balance: '5774491790776062094343',
					is_contract: true,
					ens_domain_name: null,
					metadata: { tags: [{ name: 'Ethereum Foundation' }] }
				},
				[`${base}/counters`]: { transactions_count: '3274', token_transfers_count: '12' },
				[`${base}/transactions`]: { items: [evmTx('0x1', OTHER, ETH, '1')] }
			})
		});
		expect(data.balance).toBe(5774491790776062094343n);
		expect(data.txCount).toBe(3274);
		expect(data.txs).toHaveLength(1);
		expect(data.extra).toContainEqual({ label: 'Labels', value: 'Ethereum Foundation' });
		expect(data.extra).toContainEqual({ label: 'Account type', value: 'Contract' });
	});
});

describe('traceAddress', () => {
	it('loads a UTXO address and derives first and last activity', async () => {
		const base = `${CHAINS.btc.api}/address/${ME}`;
		const result = await traceAddress(
			{ chain: 'btc', address: ME },
			{
				fetch: fakeFetch({
					[base]: {
						chain_stats: { funded_txo_sum: 3000, spent_txo_sum: 0, tx_count: 2 },
						mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 }
					},
					[`${base}/txs`]: [
						utxoTx('new', [[A, 5000]], [[ME, 2000]], { confirmed: true, block_time: 2000 }),
						utxoTx('old', [[A, 5000]], [[ME, 1000]], { confirmed: true, block_time: 1000 })
					]
				})
			}
		);
		expect(result.balance).toBe(3000n);
		expect(result.firstSeen).toEqual(new Date(1000 * 1000));
		expect(result.lastSeen).toEqual(new Date(2000 * 1000));
	});
});

describe('activityRange', () => {
	it('leaves first seen unknown when history is partial', () => {
		const txs = [{ time: new Date(2000) }, { time: null }, { time: new Date(1000) }];
		expect(activityRange(txs, 10)).toEqual({ firstSeen: null, lastSeen: new Date(2000) });
		expect(activityRange([], 0)).toEqual({ firstSeen: null, lastSeen: null });
	});
});
