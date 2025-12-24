# Identra-Gate
A lightweight web platform for organizations to issue, verify, and manage decentralized credentials. Built for institutions that want to participate in the Identra network as verified trust providers.


## API Endpoints
### Setup:
- `GET /health`: Server health check
- `GET /setup/status`: Check if setup is required
- `POST /setup/initialize`: Perform initial setup
- `POST /setup/verify-recovery`: Verify recvery phrase
- `POST /setup/reset`: Reset setup

### Auth
- `POST /auth/login`: Login
- `POST /auth/logout`: Logout
- `POST /auth/refresh`: Refresh token

### User Management
- `GET /users/me`: Get current user
- `PUT /users/me`: Update current user
- `GET /users`: List users
- `POST /users`: Create user
- `GET /users/:id`: Get user by ID
- `PUT /users/:id`: Update user
- `DELETE /users/:id`: Delete user
- `POST /users/:id/roles`: Update user roles

### Recovery and Security
- `POST /recovery/generate`: Generate new recovery phrase
- `POST /recovery/verify`: Verify recovery code

### Server Audit
- `GET /logs`: Get server logs
- `GET /metrics`: Server metrics

### Session Management
- `GET /sessions`: List active sessions
- `DELETE /sessions/:id`: Revoke specific session
- `DELETE /sessions/all`: Revoke all other sessions

### Credential Templates
- `GET /credentials/templates`: List all templates
- `POST /credentials/templates`: Create new template
- `GET /credentials/templates/:id`: Get template by ID
- `PUT /credentials/templates/:id`: Update template
- `DELETE /credentials/templates/:id`: Delete template
- `POST /credentials/templates/:id/clone`: Clone template

### Credential Issuance
- `POST /credentials/issue`: Issue new Credential
- `POST /credentials/issue/bulk`: Bulk issue credentials
- `GET /credentials`: List issued credentials
- `GET /credentials/:id`: Get credential by ID
- `PUT /credentials/:id`: Update credential
- `DELETE /credentials/:id`: Revoke credential

### Credential Verification
- `GET /verify/:credentialId`: Public verify by ID
- `POST /verify/manual`: Manual verification
- `GET /verify/status/:credentialId`: Check verification status
- `POST /verify/webhook`: Webhook for verification results
- `GET /verifications`: List all verifications
- `GET /verifications/:id`: Get verification details