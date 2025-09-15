export type ApiError = { error: string; details?: string };

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

async function handleJson<T>(res: Response): Promise<T> {
	const text = await res.text();
	let data: any;
	try {
		data = text ? JSON.parse(text) : {};
	} catch {
		throw new Error(`Invalid JSON from API (status ${res.status})`);
	}
	if (!res.ok) {
		const message = (data && data.error) ? data.error : `HTTP ${res.status}`;
		throw new Error(message);
	}
	return data as T;
}

export async function health(): Promise<{ ok?: boolean; chainId?: number; contractAddress?: string } & ApiError> {
	const res = await fetch(`${API_BASE}/health`);
	try {
		return await res.json();
	} catch {
		return { error: `Failed to parse /health` } as ApiError;
	}
}

export async function addProduce(input: { cropName: string; quantity: number; harvestDate: string }): Promise<{ success: boolean; batchId: number; transactionHash: string; blockNumber: number | null }>{
	const res = await fetch(`${API_BASE}/produce`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleJson(res);
}

export async function transferOwnership(input: { batchId: number; recipient: string; price: number }): Promise<{ success: boolean; transactionHash: string; blockNumber: number | null }>{
	const res = await fetch(`${API_BASE}/transfer`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleJson(res);
}

export async function getProduce(batchId: number): Promise<{ cropName: string; quantity: number; harvestDate: string; farmer: string; history: Array<{ from: string; to: string; price: number; txHash: string }> }>{
	const res = await fetch(`${API_BASE}/getProduce/${batchId}`);
	return handleJson(res);
}
