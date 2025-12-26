export interface SetupStatus {
    requiredSetup: boolean;
    serverName?: string;
    version: string;
}

export interface SetupResult {
    success: boolean;
    message: string;
    recoveryPhrase?: string;
    adminUser?: {
        id: string;
        email: string;
        name: string;
    }
}

export interface RecoveryVerification {
    valid: boolean;
    message?: string;
    token?: string;
}