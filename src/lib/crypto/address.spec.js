import { describe, expect, it } from 'vitest';
import { analyzeAddress, isValidEip55 } from './address.js';

describe('analyzeAddress', () => {
	it.each([
		['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'btc', 'p2pkh'],
		['3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', 'btc', 'p2sh'],
		['bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 'btc', 'p2wpkh'],
		['bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3', 'btc', 'p2wsh'],
		['bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297', 'btc', 'p2tr'],
		['LQTpS3VaYTjCr4s9Y1t5zbeY26zevf7Fb3', 'ltc', 'p2pkh'],
		['MMhrNxMbivRqAHUrt43zkAmtptqL9JCPu1', 'ltc', 'p2sh'],
		['ltc1q6vy2wem8r5eygwe4dlujj76fvv8pd2wdgzyfcn', 'ltc', 'p2wpkh'],
		['0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', 'eth', 'account'],
		['0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae', 'eth', 'account']
	])('detects %s', async (address, chain, type) => {
		const result = await analyzeAddress(`  ${address} `);
		expect(result).toMatchObject({ ok: true, chain, type });
	});

	it('normalizes uppercase bech32 and strips URI schemes', async () => {
		const upper = await analyzeAddress('BC1QAR0SRRR7XFKVY5L643LYDNW9RE59GTZZWF5MDQ');
		expect(upper).toMatchObject({
			ok: true,
			address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
		});
		const uri = await analyzeAddress('bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=1');
		expect(uri).toMatchObject({ ok: true, address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' });
	});

	it('rejects bad checksums', async () => {
		expect((await analyzeAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb')).ok).toBe(false);
		expect((await analyzeAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdr')).ok).toBe(false);
		expect((await analyzeAddress('0xDE0b295669a9FD93d5F28D9Ec85E40f4cb697BAe')).error).toMatch(
			/EIP-55/
		);
	});

	it('rejects bech32m used for SegWit v0 and bech32 for v1', async () => {
		// BIP-350 test vectors.
		expect((await analyzeAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kemeawh')).ok).toBe(false);
		expect(
			(await analyzeAddress('bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqh2y7hd')).ok
		).toBe(false);
		expect(await analyzeAddress('bc1zw508d6qejxtdg4y5r3zarvaryvaxxpcs')).toMatchObject({
			ok: true,
			type: 'witness-v2'
		});
	});

	it('rejects testnet, mixed-case and unknown input', async () => {
		expect((await analyzeAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx')).error).toMatch(
			/Testnet/
		);
		expect((await analyzeAddress('bc1QAR0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).ok).toBe(false);
		expect((await analyzeAddress('hello')).ok).toBe(false);
		expect((await analyzeAddress('')).ok).toBe(false);
	});
});

describe('isValidEip55', () => {
	it('checks EIP-55 test vectors', async () => {
		expect(await isValidEip55('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);
		expect(await isValidEip55('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359')).toBe(true);
		expect(await isValidEip55('0x5aaeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(false);
	});
});
