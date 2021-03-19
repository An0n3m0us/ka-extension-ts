import { ExtensionImpl } from "./extension-impl";
import { ACE, ScratchpadUI } from "./types/data";

declare global {
	interface Window {
		// KA: KA;
		ace: ACE;
		__APOLLO_CLIENT__: {
        cache: {
            data: {
                data: {
                    ROOT_QUERY: string
                }
            }
        }
    }
		ScratchpadUI?: ScratchpadUI;
		ScratchpadAutosuggest: { enableLiveCompletion: () => void; };
		$LAB: { queueWait: (f: () => void) => void; };
	}
}

const impl: ExtensionImpl = new ExtensionImpl();
impl.init();
