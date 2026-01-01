import AsyncStorage from "@react-native-async-storage/async-storage";
import { AgentConfig, ConfigService } from "src/config/config.service";

const AGENT_STORAGE_KEY = "credo-agent-storage";

export class CredoAgentStore {
    private static instance: CredoAgentStore;

    private constructor() {}

    static getInastance(): CredoAgentStore {
        if (!this.instance) {
            this.instance = new CredoAgentStore();
        }
        return this.instance;
    }

    async load(): Promise<ConfigService | null> {
        const raw = await AsyncStorage.getItem(AGENT_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        return JSON.parse(raw) as ConfigService;
    }

    async save(data: AgentConfig): Promise<void> {
        await AsyncStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(data));
    }

    async clear(): Promise<void> {
        await AsyncStorage.removeItem(AGENT_STORAGE_KEY);
    }
}
