import { fetchJson } from '$lib/net.js';
import { formatNumber, t } from '$lib/i18n/i18n.svelte.js';

/**
 * Summary row whose label (and optionally value) is translated when read, so it follows
 * language changes.
 * @param {string} labelKey
 * @param {() => string} value
 */
function row(labelKey, value) {
	return {
		get label() {
			return t(labelKey);
		},
		get value() {
			return value();
		}
	};
}

/**
 * Labels Blockscout attaches to an address: ENS name, contract name, public tags.
 * @param {any} info
 */
function addressLabels(info) {
	const labels = [
		info.ens_domain_name,
		info.name,
		...(info.public_tags ?? []).map((tag) => tag.display_name ?? tag.label),
		...(info.metadata?.tags ?? []).map((tag) => tag.name)
	];
	return [...new Set(labels.filter(Boolean))];
}

/**
 * Describes a Blockscout transaction from the point of view of one address.
 * Only the native ETH value is counted (token transfers are not).
 * @param {any} tx
 * @param {string} address
 */
export function parseEvmTx(tx, address) {
	const self = address.toLowerCase();
	const from = tx.from?.hash ?? null;
	const to = tx.to?.hash ?? tx.created_contract?.hash ?? null;
	const isFrom = from?.toLowerCase() === self;
	const isTo = to?.toLowerCase() === self;
	const direction = isFrom && isTo ? 'self' : isFrom ? 'out' : 'in';
	const other = direction === 'out' ? to : direction === 'in' ? from : null;

	return {
		id: tx.hash,
		time: tx.timestamp ? new Date(tx.timestamp) : null,
		confirmed: tx.block_number != null,
		failed: tx.status === 'error' || tx.result === 'error',
		coinbase: false,
		direction,
		amount: BigInt(tx.value ?? 0),
		fee: tx.fee?.value != null ? BigInt(tx.fee.value) : null,
		method: tx.method && !/^0x[0-9a-f]*$/i.test(tx.method) ? tx.method : null,
		counterparties: other ? [other] : []
	};
}

/**
 * Loads balance, counters and latest transactions of an Ethereum address from Blockscout.
 * @param {{ api: string, decimals: number }} chain
 * @param {string} address
 * @param {{ signal?: AbortSignal, fetch?: typeof fetch }} [options]
 */
export async function fetchEvmAddress(chain, address, options = {}) {
	const base = `${chain.api}/addresses/${address}`;
	const opts = { ...options, allowNotFound: true };
	const [info, counters, page] = await Promise.all([
		fetchJson(base, opts),
		fetchJson(`${base}/counters`, opts),
		fetchJson(`${base}/transactions`, opts)
	]);

	const extra = [];
	if (info) {
		const labels = addressLabels(info);
		extra.push(
			row('crypto.row.accountType', () => t(info.is_contract ? 'crypto.contract' : 'crypto.wallet'))
		);
		if (labels.length) extra.push(row('crypto.row.labels', () => labels.join(', ')));
		if (info.is_scam) extra.push(row('crypto.row.warning', () => t('crypto.scamFlag')));
		if (info.creator_address_hash)
			extra.push(row('crypto.row.createdBy', () => info.creator_address_hash));
	}
	if (counters?.token_transfers_count && counters.token_transfers_count !== '0') {
		const transfers = Number(counters.token_transfers_count);
		extra.push(row('crypto.row.tokenTransfers', () => formatNumber(transfers)));
	}

	return {
		balance: BigInt(info?.coin_balance ?? 0),
		received: null,
		sent: null,
		txCount: Number(counters?.transactions_count ?? 0),
		pendingTxCount: 0,
		extra,
		txs: (page?.items ?? []).map((tx) => parseEvmTx(tx, address))
	};
}
