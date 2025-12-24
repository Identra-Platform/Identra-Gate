# Identra-Gate
A lightweight web platform for organizations to issue, verify, and manage decentralized credentials. Built for institutions that want to participate in the Identra network as verified trust providers.


## API Endpoints
### Setup:
- `GET /health`: Server health check:
  ```json
  //Response
  {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
  ```
- `GET /setup/status`: Check if setup is required
  ```json
  //Response
  {
    "requiresSetup": true,
    "serverName": null,
    "version": "1.0.0"
  }
  ```
- `POST /setup/initialize`: Perform initial setup
  ```json
  //Request
  {
    "serverName": "My Organization",
    "adminEmail": "admin@example.com",
    "adminPassword": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "adminName": "Admin User"
  }
  ```
  ```json
  //Response
  {
    "success": true,
    "recoveryPhrase": "apple brave chair dance eagle flame grape house image jolly knife lemon",
    "message": "Save this recovery phrase securely. It will not be shown again.",
    "adminUser": {
      "id": "usr_123",
      "email": "admin@example.com",
      "name": "Admin User"
    }
  }
  ```
- `POST /setup/verify-recovery`: Verify recvery phrase
  ```json
  //Request
  {
    "email": "admin@example.com",
    "recoveryPhrase": "apple brave chair dance eagle flame grape house image jolly knife lemon"
  }
  ```
  ```json
  //Response
  {
    "valid": true,
    "token": "reset_token_abc123",
    "message": "Recovery phrase verified"
  }
  ```
- `POST /setup/reset`: Reset setup
  ```json
  //Request
  {
    "adminPassword": "CurrentAdminPass123!",
    "recoveryPhrase": "apple brave chair dance eagle flame grape house image jolly knife lemon",
    "confirmReset": true
  }
  ```
  ```json
  //Response
  {
    "success": true,
    "message": "Setup has been reset. Restart required.",
    "restartToken": "restart_token_xyz"
  }
  ```

### Auth
- `POST /auth/login`: Login
  ```json
  //Request
  {
    "email": "user@example.com",
    "password": "UserPass123!",
    "rememberMe": false
  }
  ```
  ```json
  //Response
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": "usr_456",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user"
    }
  }
  ```
- `POST /auth/logout`: Logout
  ```json
  //Response
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```
- `POST /auth/refresh`: Refresh token
  ```json
  //Request
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
  ```json
  //Response
  {
    "accessToken": "new_access_token_abc",
    "refreshToken": "new_refresh_token_xyz",
    "expiresIn": 3600
  }
  ```

### User Management
- `GET /users/me`: Get current user
  ```json
  //Response
  {
    "id": "usr_456",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLogin": "2024-01-15T10:30:00Z"
  }
  ```
- `GET /users`: List users
  ```
  Query Params: ?page=1&limit=20&search=john&role=admin
  ```
  ```json
  // Response
  {
    "users": [
      {
        "id": "usr_123",
        "email": "admin@example.com",
        "name": "Admin User",
        "role": "admin",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
  ```
- `POST /users`: Create user
  ```json
  // Request
  {
    "email": "newuser@example.com",
    "name": "New User",
    "password": "TempPass123!",
    "role": "user",
    "sendWelcomeEmail": true
  }
  ```
  ```json
  // Response
  {
    "success": true,
    "user": {
      "id": "usr_789",
      "email": "newuser@example.com",
      "name": "New User",
      "role": "user"
    },
    "message": "User created successfully"
  }
  ```
- `GET /users/:id`: Get user by ID
  ```
  URL param: id
  ```
  ```json
  // Response
  {
    "id": "usr_123",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
  ```
- `PUT /users/:id`: Update user
  ```json
  // Request
  {
    "name": "Updated User",
    "email": "updated@example.com",
    "role": "admin",
    "active": true
  }
  ```
  ```json
  // Response
  {
    "success": true,
    "user": {
      "id": "usr_123",
      "email": "updated@example.com",
      "name": "Updated User",
      "role": "admin"
    }
  }
  ```
- `DELETE /users/:id`: Delete user
  ```
  URL param: id
  ```
  ```json
  // Response
  {
    "success": true,
    "message": "User deleted successfully"
  }
  ```
- `POST /users/:id/roles`: Update user roles
  ```json
  // Request
  {
    "role": "admin",
    "reason": "Promoted to administrator"
  }
  ```
  ```json
  // Response
  {
    "success": true,
    "message": "User role updated to admin"
  }
  ```

### Server Audit
- `GET /logs`: Get server logs
  ```
  Query params: ?level=error&from=2024-01-01&to=2024-01-15&limit=100
  ```
  ```json
  // Response
  {
    "logs": [
      {
        "timestamp": "2024-01-15T10:30:00Z",
        "level": "info",
        "message": "User login successful",
        "userId": "usr_123",
        "ip": "192.168.1.1"
      }
    ],
    "total": 150,
    "filtered": 45
  }
  ```
- `GET /metrics`: Server metrics
  ```
  Query params: ?period=7d
  ```
  ```json
  // Response
  {
    "users": {
      "total": 150,
      "active": 120,
      "newToday": 5
    },
    "credentials": {
      "issued": 1000,
      "verified": 850,
      "revoked": 20
    },
    "system": {
      "uptime": "7 days",
      "memoryUsage": "65%",
      "cpuLoad": "30%"
    }
  }
  ```

### Credential Templates
- `GET /credentials/templates`: List all templates
  ```
  Query params: ?active=true&limit=20
  ```
  ```json
  // Response
  {
    "templates": [
      {
        "id": "tpl_123",
        "name": "Employee ID",
        "description": "Employee identification card",
        "schema": {
          "fields": ["name", "employeeId", "department", "photo"]
        },
        "active": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
  ```
- `POST /credentials/templates`: Create new template
  ```json
  // Request
  {
    "name": "Visitor Pass",
    "description": "Temporary visitor credentials",
    "schema": {
      "fields": [
        {"name": "visitorName", "type": "string", "required": true},
        {"name": "host", "type": "string", "required": true},
        {"name": "validFrom", "type": "date", "required": true},
        {"name": "validUntil", "type": "date", "required": true}
      ]
    },
    "validityDays": 7,
    "design": {
      "backgroundColor": "#ffffff",
      "textColor": "#000000",
      "logoUrl": "/logos/company.png"
    }
  }
  ```
  ```json
  // Response
  {
    "success": true,
    "template": {
      "id": "tpl_456",
      "name": "Visitor Pass",
      "schema": {...},
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
  ```
- `GET /credentials/templates/:id`: Get template by ID
  ```
  URL param: id
  ```
  ```json
  // Response
  {
    "id": "tpl_123",
    "name": "Employee ID",
    "description": "Employee identification card",
    "schema": {...},
    "design": {...},
    "active": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
  ```
- `PUT /credentials/templates/:id`: Update template
  ```json
  // Request
  {
    "name": "Updated Template Name",
    "description": "Updated description",
    "schema": {...},
    "active": true
  }
  ```
  ```json
  // Response
  {
    "success": true,
    "template": {
      "id": "tpl_123",
      "name": "Updated Template Name",
      "updatedAt": "2024-01-15T11:30:00Z"
    }
  }
  ```
- `DELETE /credentials/templates/:id`: Delete template
  ```
  URL param: id
  ```
  ```json
  // Response
  {
    "success": true,
    "message": "Template deleted"
  }
  ```
- `POST /credentials/templates/:id/clone`: Clone template
  ```json
  // Request
  {
    "newName": "Employee ID - Copy",
    "newDescription": "Cloned template"
  }
  ```
  ```json
  // Response
  {
    "success": true,
    "newTemplate": {
      "id": "tpl_789",
      "name": "Employee ID - Copy",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
  ```

### Credential Issuance
- `POST /credentials/issue`: Issue new Credential
  ```json
  // Request
  {
    "templateId": "tpl_123",
    "recipient": {
      "email": "employee@example.com",
      "name": "John Doe"
    },
    "data": {
      "employeeId": "EMP-001",
      "department": "Engineering",
      "joinDate": "2024-01-01"
    },
    "validity": {
      "from": "2024-01-15",
      "until": "2025-01-15"
    },
    "sendNotification": true
  }
  ```
  ```json
  // Response
  {
    "success": true,
    "credential": {
      "id": "cred_abc123",
      "templateId": "tpl_123",
      "recipient": "employee@example.com",
      "status": "issued",
      "issuedAt": "2024-01-15T10:30:00Z",
      "expiresAt": "2025-01-15T23:59:59Z"
    }
  }
  ```
- `POST /credentials/issue/bulk`: Bulk issue credentials
  ```json
  // Request
  {
    "templateId": "tpl_123",
    "credentials": [
      {
        "recipient": {"email": "user1@example.com", "name": "User One"},
        "data": {"employeeId": "EMP-001"}
      },
      {
        "recipient": {"email": "user2@example.com", "name": "User Two"},
        "data": {"employeeId": "EMP-002"}
      }
    ],
    "validity": {
      "from": "2024-01-15",
      "until": "2025-01-15"
    }
  }
  ```
  ```json
  // Response
  {
    "success": true,
    "batchId": "batch_xyz789",
    "issuedCount": 2,
    "failedCount": 0,
    "credentials": [
      {"id": "cred_abc123", "recipient": "user1@example.com", "status": "issued"},
      {"id": "cred_def456", "recipient": "user2@example.com", "status": "issued"}
    ]
  }
  ```
- `GET /credentials`: List issued credentials
  ```
  Query params: ?status=active&templateId=tpl_123&limit=20&page=1
  ```
  ```json
  // Response
  {
    "credentials": [
      {
        "id": "cred_abc123",
        "templateId": "tpl_123",
        "recipient": "employee@example.com",
        "status": "active",
        "issuedAt": "2024-01-15T10:30:00Z",
        "expiresAt": "2025-01-15T23:59:59Z",
        "data": {"employeeId": "EMP-001"}
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
  ```
- `GET /credentials/:id`: Get credential by ID
  ```
  URL param: id
  ```
  ```json
  // Response
  {
    "id": "cred_abc123",
    "templateId": "tpl_123",
    "templateName": "Employee ID",
    "recipient": {
      "email": "employee@example.com",
      "name": "John Doe"
    },
    "data": {
      "employeeId": "EMP-001",
      "department": "Engineering",
      "photoUrl": "/photos/emp-001.jpg"
    },
    "status": "active",
    "issuedAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2025-01-15T23:59:59Z",
    "revokedAt": null,
    "verificationCount": 5
  }
  ```
- `DELETE /credentials/:id`: Revoke credential
  ```
  URL param: id
  ```
  ```json
  // Response
  {
    "success": true,
    "message": "Credential revoked",
    "revokedAt": "2024-01-15T11:30:00Z"
  }
  ```

### Credential Verification
- `GET /verify/:credentialId`: Public verify by ID
  ```
  URL param: credentialId
  ```
  ```json
  // Response
  {
    "credentialId": "cred_abc123",
    "valid": true,
    "status": "active",
    "verificationTime": "2024-01-15T10:35:00Z",
    "details": {
      "template": "Employee ID",
      "recipient": "John Doe",
      "issued": "2024-01-15",
      "expires": "2025-01-15",
      "data": {
        "employeeId": "EMP-001",
        "department": "Engineering"
      }
    },
    "message": "Credential is valid"
  }
  ```
- `POST /verify/manual`: Manual verification
  ```json
  // Request
  {
    "credentialId": "cred_abc123",
    "verifierNotes": "Checked at front desk",
    "location": "Main Entrance",
    "verifierId": "verifier_123"
  }
  ```
  ```json
  // Response
  {
    "success": true,
    "verificationId": "verif_xyz789",
    "credentialId": "cred_abc123",
    "valid": true,
    "timestamp": "2024-01-15T10:35:00Z",
    "verifier": "Front Desk Officer"
  }
  ```
- `GET /verify/status/:credentialId`: Check verification status
  ```
  URL param: credentialId
  ```
  ```json
  // Response
  {
    "credentialId": "cred_abc123",
    "status": "active",
    "lastVerified": "2024-01-15T10:35:00Z",
    "totalVerifications": 5,
    "verificationHistory": [
      {
        "timestamp": "2024-01-15T10:35:00Z",
        "verifier": "Front Desk",
        "location": "Main Entrance",
        "result": "valid"
      }
    ]
  }
  ```
- `GET /verifications`: List all verifications
  ```
  Query params: ?from=2024-01-01&to=2024-01-15&credentialId=cred_abc123&limit=50
  ```
  ```json
  // Response
  {
    "verifications": [
      {
        "id": "verif_xyz789",
        "credentialId": "cred_abc123",
        "timestamp": "2024-01-15T10:35:00Z",
        "verifier": "Front Desk Officer",
        "location": "Main Entrance",
        "result": "valid",
        "method": "manual"
      }
    ],
    "total": 150,
    "valid": 145,
    "invalid": 5
  }
  ```
- `GET /verifications/:id`: Get verification details
  ```
  URL param: id
  ```
  ```json
  // Response
  {
    "id": "verif_xyz789",
    "credentialId": "cred_abc123",
    "timestamp": "2024-01-15T10:35:00Z",
    "verifier": {
      "id": "user_123",
      "name": "Front Desk Officer"
    },
    "location": "Main Entrance",
    "result": "valid",
    "method": "manual",
    "notes": "Checked ID and confirmed match",
    "deviceInfo": {
      "ip": "192.168.1.100",
      "userAgent": "ScannerApp/1.0"
    }
  }
  ```

### Trusted Issuers Management
- `GET /issuers`: List all trusted issuers
  ```
  Query params: ?verified=true&limit=20&page=1
  ```
  ```json
  // Response
  {
    "issuers": [
      {
        "id": "iss_123",
        "did": "did:key:z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP",
        "name": "University of Example",
        "domain": "example.edu",
        "status": "verified",
        "verifiedAt": "2024-01-15T10:30:00Z",
        "trustLevel": "high",
        "credentialTypes": ["degree", "student_id"],
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
  ```
- `POST /issuers`: Add new trusted issuer
  ```json
  // Request
  {
    "did": "did:key:z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP",
    "name": "University of Example",
    "domain": "example.edu",
    "contactEmail": "trust@example.edu",
    "trustLevel": "high",
    "credentialTypes": ["degree", "student_id"],
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----",
    "verificationMethod": "did:key:z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP#z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP",
    "metadata": {
      "institutionType": "university",
      "accreditation": "regional",
      "country": "US"
    }
  }
  ```
  ```json
  // Response
  {
    "success": true,
    "issuer": {
      "id": "iss_123",
      "did": "did:key:z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP",
      "name": "University of Example",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "message": "Issuer added for verification"
  }
  ```
- `GET /issuers/:id`: Get issuer by ID
  ```
  URL param: id
  ```
  ```json
  // Response
  {
    "id": "iss_123",
    "did": "did:key:z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP",
    "name": "University of Example",
    "domain": "example.edu",
    "contactEmail": "trust@example.edu",
    "status": "verified",
    "trustLevel": "high",
    "credentialTypes": ["degree", "student_id"],
    "verificationStatus": {
      "didVerified": true,
      "domainVerified": true,
      "signatureVerified": true
    },
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----",
    "verificationMethod": "did:key:z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP#z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP",
    "metadata": {
      "institutionType": "university",
      "accreditation": "regional",
      "country": "US",
      "established": 1990
    },
    "verifiedAt": "2024-01-15T10:30:00Z",
    "verifiedBy": "admin@example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
  ```
- `PUT /issuers/:id`: Update issuer information
  ```json
  // Request
  {
    "trustLevel": "medium",
    "credentialTypes": ["degree", "student_id", "transcript"],
    "status": "suspended",
    "suspensionReason": "Security concerns",
    "metadata": {
      "institutionType": "university",
      "accreditation": "regional",
      "country": "US",
      "established": 1990,
      "contactPerson": "John Doe"
    }
  }
  ```
  ```json
  // Response
  {
    "success": true,
    "issuer": {
      "id": "iss_123",
      "trustLevel": "medium",
      "status": "suspended",
      "updatedAt": "2024-01-15T11:30:00Z"
    },
    "message": "Issuer updated successfully"
  }
  ```
- `DELETE /issuers/:id`: Remove trusted issuer
  ```
  URL param: id
  ```
  ```json
  // Response
  {
    "success": true,
    "message": "Issuer removed from trusted list",
    "removedAt": "2024-01-15T11:30:00Z"
  }
  ```