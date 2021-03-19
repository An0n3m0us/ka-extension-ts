import { getJSON } from "./api-util";

function getKAID (): string {
	// Get KAID from session
	return JSON.stringify((window as any).__APOLLO_CLIENT__.cache.data.data.ROOT_QUERY).match(/kaid_\d+/g)[0];
}

export { getKAID };
