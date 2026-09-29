/**
 * Supported chains: display units, data API and explorer links.
 * Bitcoin and Litecoin use the same Esplora-style API (mempool.space / litecoinspace.org),
 * Ethereum uses Blockscout.
 */
export const CHAINS = {
	btc: {
		id: 'btc',
		name: 'Bitcoin',
		symbol: 'BTC',
		decimals: 8,
		displayDecimals: 8,
		kind: 'utxo',
		api: 'https://mempool.space/api',
		explorers: [
			{
				name: 'mempool.space',
				address: (a) => `https://mempool.space/address/${a}`,
				tx: (id) => `https://mempool.space/tx/${id}`
			},
			{
				name: 'Blockchair',
				address: (a) => `https://blockchair.com/bitcoin/address/${a}`,
				tx: (id) => `https://blockchair.com/bitcoin/transaction/${id}`
			}
		]
	},
	ltc: {
		id: 'ltc',
		name: 'Litecoin',
		symbol: 'LTC',
		decimals: 8,
		displayDecimals: 8,
		kind: 'utxo',
		api: 'https://litecoinspace.org/api',
		explorers: [
			{
				name: 'litecoinspace.org',
				address: (a) => `https://litecoinspace.org/address/${a}`,
				tx: (id) => `https://litecoinspace.org/tx/${id}`
			},
			{
				name: 'Blockchair',
				address: (a) => `https://blockchair.com/litecoin/address/${a}`,
				tx: (id) => `https://blockchair.com/litecoin/transaction/${id}`
			}
		]
	},
	eth: {
		id: 'eth',
		name: 'Ethereum',
		symbol: 'ETH',
		decimals: 18,
		displayDecimals: 6,
		kind: 'evm',
		api: 'https://eth.blockscout.com/api/v2',
		explorers: [
			{
				name: 'Blockscout',
				address: (a) => `https://eth.blockscout.com/address/${a}`,
				tx: (id) => `https://eth.blockscout.com/tx/${id}`
			},
			{
				name: 'Etherscan',
				address: (a) => `https://etherscan.io/address/${a}`,
				tx: (id) => `https://etherscan.io/tx/${id}`
			}
		]
	}
};
