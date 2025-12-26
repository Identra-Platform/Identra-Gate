export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthUser;
}

export interface RefreshResult {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}