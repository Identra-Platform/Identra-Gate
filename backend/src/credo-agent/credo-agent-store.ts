import path from "path";
import { AgentConfig, ConfigService } from "src/config/config.service";

const AGENT_STORAGE_KEY = "credo-agent-storage";

export class CredoAgentStore {
    private static instance: CredoAgentStore;

    private constructor() {
        path.join(process.cwd(), 'data', 'agent-storage.json');
        this.ensureStorageDirectory();
    }

    private async ensureStorageDirectory(): Promise<void> {
        const dir = path.dirname(AGENT_STORAGE_PATH);
        try {
        await fs.access(dir);
        } catch {
        await fs.mkdir(dir, { recursive: true });
        }
    }

    static getInstance(): CredoAgentStore {
        if (!this.instance) {
            this.instance = new CredoAgentStore();
        }
        return this.instance;
    }

    async load(): Promise<AgentConfig | null> {
        const raw = localStorage.getItem(AGENT_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        return JSON.parse(raw) as AgentConfig;
    }

    async save(data: AgentConfig): Promise<void> {
        localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(data));
    }

    async clear(): Promise<void> {
        localStorage.removeItem(AGENT_STORAGE_KEY);
    }
}
