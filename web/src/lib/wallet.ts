export async function connectWallet(): Promise<string | null> {
	const anyWindow = window as any;
	if (!anyWindow.ethereum) return null;
	const accounts = await anyWindow.ethereum.request({ method: 'eth_requestAccounts' });
	return (accounts && accounts[0]) || null;
}

export async function addLocalhostNetwork() {
	const anyWindow = window as any;
	if (!anyWindow.ethereum) return;
	await anyWindow.ethereum.request({
		method: 'wallet_addEthereumChain',
		params: [{
			chainId: '0x7A69', // 31337
			chainName: 'Hardhat Localhost',
			nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
			rpcUrls: ['http://127.0.0.1:8545'],
			blockExplorerUrls: [],
		}],
	});
}

export async function switchToLocalhost() {
	const anyWindow = window as any;
	if (!anyWindow.ethereum) return;
	try {
		await anyWindow.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x7A69' }] });
	} catch {
		await addLocalhostNetwork();
	}
}

export async function requestFaucet(address: string, apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000', apiKey = 'dev-api-key') {
	const res = await fetch(`${apiBase}/faucet`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
		body: JSON.stringify({ to: address, amount: 1 }),
	});
	if (!res.ok) throw new Error(`Faucet failed: ${res.status}`);
	return res.json();
}
