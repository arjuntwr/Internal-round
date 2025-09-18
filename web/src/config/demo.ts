// Global demo mode flag. Set VITE_DEMO_MODE=true/false in .env to control demo tweaks.
const envVal = (import.meta as any).env?.VITE_DEMO_MODE as string | undefined;
export const DEMO_MODE: boolean = envVal !== undefined ? envVal === 'true' : true;
