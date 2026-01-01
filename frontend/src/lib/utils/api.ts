import type { HealthResponse, InitializeRequest, InitializeResponse, LoginRequest, LoginResponse, LogoutResponse, RecoveryVerifyRequest, RecoveryVerifyResponse, RefreshTokenRequest, RefreshTokenResponse, ResetRequest, ResetResponse, SetupStatusResponse } from "$lib/types/api";

const API_BASE = 'http://localhost:3000';

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health?detailed=true`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function checkSetupStatus(): Promise<SetupStatusResponse> {
  const response = await fetch(`${API_BASE}/setup/status`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function initializeSetup(data: InitializeRequest): Promise<InitializeResponse> {
  const response = await fetch('/setup/initialize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function verifyRecovery(data: RecoveryVerifyRequest): Promise<RecoveryVerifyResponse> {
  const response = await fetch('/setup/verify-recovery', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function resetSetup(data: ResetRequest): Promise<ResetResponse> {
  const response = await fetch('/setup/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function logout(): Promise<LogoutResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}