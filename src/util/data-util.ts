import { getJSON } from "./api-util";

function getKAID (): string {
	// Get KAID from session

	let kaids = localStorage["ka:4:mastery_accelerant_prompt"].match(/kaid_\d+/g);
	let dates = localStorage["ka:4:mastery_accelerant_prompt"].match(/:\d{13}\}/g)

	let combined = [];
	for (var i = 0; i < kaids.length; i += 1) {
			combined.push(dates[i] + kaids[i]);
	}
	combined.sort()

	return combined[combined.length-1].match(/kaid_\d+/g)[0];
}

export { getKAID };
