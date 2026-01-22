<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { createVerificationRequest } from '$lib/utils/api';
  import { goto } from '$app/navigation';
  import { type CreateAuthorizationRequestDto, type CredentialRequest, type CredentialField, FieldType, type CredentialVerificationField, type CredentialVerificationRequest } from '$lib/types/api';
  import QrCodeDisplay from '../ui/QrCodeDisplay.svelte';
  
  let loading = false;
  let error = '';
  let createdSession: any = null;
  
  // Form data - using writables for better reactivity
  let verificationRequest: CreateAuthorizationRequestDto = $state({
    credentialRequests: [],
    metadata: {
      purpose: '',
      expirationDays: 30
    }
  });
  
  // Current credential request being edited
  let currentRequest: CredentialVerificationRequest = $state({
    requestName: '',
    credentialType: '',
    fields: [],
    settings: {
      allowMultipleUse: false
    }
  });
  
  // Current field being edited
  let currentField: CredentialVerificationField = $state({
    fieldName: '',
    fieldType: FieldType.Text,
    allowedValues: [],
    required: true
  });
  
  let allowedValueInput = '';
  
  const fieldTypes = [
    { value: FieldType.Text, label: 'Text' },
    { value: FieldType.Date, label: 'Date' },
    { value: FieldType.Number, label: 'Number' },
    { value: FieldType.Select, label: 'Select' }
  ];
  
  const commonCredentialTypes = [
    'VerifiableIdentityCredential',
    'EducationalCredential',
    'ProfessionalLicense',
    'MembershipCredential',
    'CertificateOfCompletion',
    'ProofOfEmployment',
    'HealthPassport'
  ];
  
  function addField() {
    if (!currentField.fieldName.trim()) {
      error = 'Field name is required';
      return;
    }
    
    currentRequest.fields.push({ ...currentField });
    
    // Reset current field
    currentField.fieldName = '';
    currentField.fieldType = FieldType.Text;
    currentField.allowedValues = [];
    currentField.required = true;
    allowedValueInput = '';
  }
  
  function removeField(index: number) {
    // Create a new array without the removed field
    currentRequest.fields = currentRequest.fields.filter((_, i) => i !== index);
  }
  
  function addAllowedValue() {
    if (!allowedValueInput.trim()) return;
    
    // Create a new array with the added value
    currentField.allowedValues = [...(currentField.allowedValues || []), allowedValueInput.trim()];
    allowedValueInput = '';
  }
  
  function removeAllowedValue(index: number) {
    if (currentField.allowedValues) {
      // Create a new array without the removed value
      currentField.allowedValues = currentField.allowedValues.filter((_, i) => i !== index);
    }
  }
  
  function addCredentialRequest() {
    if (!currentRequest.requestName.trim() || !currentRequest.credentialType.trim()) {
      error = 'Request name and credential type are required';
      return;
    }
    
    if (currentRequest.fields.length === 0) {
      error = 'At least one field is required for each credential request';
      return;
    }
    
    // Add the current request to the list
    verificationRequest.credentialRequests = [
      ...verificationRequest.credentialRequests,
      {
        requestName: currentRequest.requestName,
        credentialType: currentRequest.credentialType,
        fields: [...currentRequest.fields],
        settings: {
          allowMultipleUse: currentRequest.settings.allowMultipleUse
        }
      }
    ];
    
    // Reset current request
    currentRequest.requestName = '';
    currentRequest.credentialType = '';
    currentRequest.fields = [];
    currentRequest.settings.allowMultipleUse = false;
  }
  
  function removeCredentialRequest(index: number) {
    // Create a new array without the removed request
    verificationRequest.credentialRequests = verificationRequest.credentialRequests.filter((_, i) => i !== index);
  }
  
  async function handleSubmit() {
    if (verificationRequest.credentialRequests.length === 0) {
      error = 'At least one credential request is required';
      return;
    }
    
    if (!verificationRequest.metadata.purpose?.trim()) {
      error = 'Verification purpose is required';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const response = await createVerificationRequest(verificationRequest);
      createdSession = response;
    } catch (err: any) {
      error = err.message || 'Failed to create verification request';
    } finally {
      loading = false;
    }
  }
  
  function resetForm() {
    verificationRequest = {
      credentialRequests: [],
      metadata: {
        purpose: '',
        expirationDays: 30
      }
    };
    createdSession = null;
  }
  
  // Helper functions for template
  function getFieldLabel(field: CredentialVerificationField): string {
    return `${field.fieldName} (${field.fieldType})`;
  }
  
  function updateFieldValue<T extends keyof CredentialVerificationField>(field: CredentialVerificationField, key: T, value: CredentialVerificationField[T]) {
    field[key] = value;
  }
  
  // Update function for template bindings
  function updateCurrentField<T extends keyof CredentialVerificationField>(key: T, value: CredentialVerificationField[T]) {
    currentField[key] = value;
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-on-surface">Create Verification Request</h2>
      <p class="text-on-surface-variant">Request credentials from holders using QR codes</p>
    </div>
    <Button onclick={() => goto("/verification")} variant="outlined">
      Back to Dashboard
    </Button>
  </div>
  
  <!-- Success State -->
  {#if createdSession}
    <Alert variant="success" onclose={resetForm}>
      <div class="space-y-4">
        <div>
          <strong>Verification request created successfully!</strong>
          <div class="text-sm">Session ID: {createdSession.id}</div>
        </div>
        
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- QR Code Display -->
          <div>
            <h4 class="mb-3 font-medium text-on-surface">Scan QR Code</h4>
            <div class="flex justify-center">
              <QrCodeDisplay
                data={createdSession.request.data}
                size={300}
              />
            </div>
          </div>
          
          <!-- Session Info -->
          <div>
            <h4 class="mb-3 font-medium text-on-surface">Session Information</h4>
            <div class="space-y-3">
              <div class="rounded-lg bg-surface-container p-3">
                <div class="text-sm font-medium text-on-surface-variant">Expires</div>
                <div class="text-on-surface">
                  {new Date(createdSession.expiresAt).toLocaleString()}
                </div>
              </div>
              
              <div class="rounded-lg bg-surface-container p-3">
                <div class="text-sm font-medium text-on-surface-variant">Requested Credentials</div>
                <div class="mt-1 space-y-1">
                  {#each createdSession.requestedCredentials as credential}
                    <div class="text-sm text-on-surface">
                      • {credential.credentialType}
                    </div>
                  {/each}
                </div>
              </div>
              
              <div class="flex gap-2">
                <Button
                  onclick={() => goto(`/verification/view/${createdSession.id}`)}
                  variant="filled"
                  fullWidth
                >
                  View Session Details
                </Button>
                <Button
                  onclick={resetForm}
                  variant="outlined"
                  fullWidth
                >
                  Create Another
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Alert>
  {/if}
  
  <!-- Error Alert -->
  {#if error}
    <Alert variant="error" onclose={() => error = ''}>
      {error}
    </Alert>
  {/if}
  
  {#if !createdSession}
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Main Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Metadata -->
        <Card elevation={2} padding="large">
          <h3 class="mb-4 text-lg font-semibold text-on-surface">Verification Details</h3>
          
          <div class="space-y-4">
            <Input
              label="Verification Purpose"
              value={verificationRequest.metadata.purpose}
              oninput={(e) => verificationRequest.metadata.purpose = (e.target as any).value}
              placeholder="e.g., Identity verification for KYC"
              required
              disabled={loading}
              helperText="Describe why you need to verify these credentials"
            />
            
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label for="expiration-days" class="block text-sm font-medium text-on-surface-variant mb-1">
                  Expiration Days
                </label>
                <input
                  type="number"
                  id="expiration-days"
                  min="1"
                  max="365"
                  value={verificationRequest.metadata.expirationDays}
                  oninput={(e) => verificationRequest.metadata.expirationDays = parseInt((e.target as any).value) || 30}
                  disabled={loading}
                  class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface focus:border-primary focus:outline-none"
                />
                <p class="mt-1 text-xs text-on-surface-variant">
                  How long the verification request will be valid
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        <!-- Credential Requests -->
        <Card elevation={2} padding="large">
          <h3 class="mb-4 text-lg font-semibold text-on-surface">Credential Requests</h3>
          
          <!-- Add New Credential Request -->
          <div class="mb-6 rounded-lg border border-outline-variant p-4">
            <h4 class="mb-3 font-medium text-on-surface">Add Credential Request</h4>
            
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Request Name"
                  value={currentRequest.requestName}
                  oninput={(e) => currentRequest.requestName = (e.target as any).value}
                  placeholder="e.g., Identity Verification"
                  disabled={loading}
                />
                <div>
                  <label for="credential-type" class="block text-sm font-medium text-on-surface-variant mb-1">
                    Credential Type
                  </label>
                  <div class="flex gap-2">
                    <select
                      id="credential-type"
                      value={currentRequest.credentialType}
                      onchange={(e) => currentRequest.credentialType = (e.target as any).value}
                      disabled={loading}
                      class="flex-1 rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface focus:border-primary focus:outline-none"
                    >
                      <option value="">Select a type</option>
                      {#each commonCredentialTypes as type}
                        <option value={type}>{type}</option>
                      {/each}
                      <option value="custom">Custom Type</option>
                    </select>
                    {#if currentRequest.credentialType === 'custom'}
                      <Input
                        placeholder="Custom type..."
                        value={currentRequest.credentialType}
                        oninput={(e) => currentRequest.credentialType = (e.target as any).value}
                        class="flex-1"
                        disabled={loading}
                      />
                    {/if}
                  </div>
                </div>
              </div>
              
              <div>
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentRequest.settings.allowMultipleUse}
                    onchange={(e) => currentRequest.settings.allowMultipleUse = (e.target as any).checked}
                    disabled={loading}
                    class="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span class="text-sm text-on-surface-variant">Allow multiple credentials of this type</span>
                </label>
              </div>
              
              <!-- Fields Section -->
              <div>
                <div class="mb-3 flex items-center justify-between">
                  <h5 class="font-medium text-on-surface">Fields ({currentRequest.fields.length})</h5>
                  <Badge variant="secondary">
                    {currentRequest.fields.filter(f => f.required).length} required
                  </Badge>
                </div>
                
                <!-- Add Field Form -->
                <div class="mb-4 rounded-lg bg-surface-container p-4">
                  <h6 class="mb-3 text-sm font-medium text-on-surface">Add Field</h6>
                  
                  <div class="space-y-3">
                    <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <Input
                        label="Field Name"
                        value={currentField.fieldName}
                        oninput={(e) => updateCurrentField('fieldName', (e.target as any).value)}
                        placeholder="e.g., fullName"
                        disabled={loading}
                      />
                      <div>
                        <label for="field-type" class="block text-sm font-medium text-on-surface-variant mb-1">
                          Field Type
                        </label>
                        <select
                          id="field-type"
                          value={currentField.fieldType}
                          onchange={(e) => updateCurrentField('fieldType', (e.target as any).value as FieldType)}
                          disabled={loading}
                          class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                        >
                          {#each fieldTypes as type}
                            <option value={type.value}>{type.label}</option>
                          {/each}
                        </select>
                      </div>
                      <div class="flex items-end">
                        <label class="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={currentField.required}
                            onchange={(e) => updateCurrentField('required', (e.target as any).checked)}
                            disabled={loading}
                            class="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                          />
                          <span class="text-sm text-on-surface-variant">Required</span>
                        </label>
                      </div>
                    </div>
                    
                    {#if currentField.fieldType === FieldType.Select}
                      <div>
                        <div class="mb-2 flex items-center justify-between">
                          <label for="allowed-values" class="text-sm font-medium text-on-surface-variant">
                            Allowed Values
                          </label>
                          <Button
                            onclick={addAllowedValue}
                            variant="text"
                            size="small"
                            disabled={!allowedValueInput.trim() || loading}
                          >
                            Add Value
                          </Button>
                        </div>
                        
                        <div class="flex gap-2">
                          <Input
                            value={allowedValueInput}
                            oninput={(e) => allowedValueInput = (e.target as any).value}
                            placeholder="Enter allowed value..."
                            disabled={loading}
                            onkeypress={(e) => e.key === 'Enter' && addAllowedValue()}
                          />
                        </div>
                        
                        {#if currentField.allowedValues && currentField.allowedValues.length > 0}
                          <div class="mt-2 flex flex-wrap gap-2">
                            {#each currentField.allowedValues as value, index}
                              <Badge
                                size="small"
                                variant="secondary"
                                onclick={() => removeAllowedValue(index)}
                                class="cursor-pointer hover:bg-surface-container"
                              >
                                {value} ×
                              </Badge>
                            {/each}
                          </div>
                        {/if}
                      </div>
                    {/if}
                    
                    <div class="flex justify-end">
                      <Button
                        onclick={addField}
                        variant="tonal"
                        size="small"
                        disabled={!currentField.fieldName.trim() || loading}
                      >
                        Add Field
                      </Button>
                    </div>
                  </div>
                </div>
                
                <!-- Current Fields List -->
                {#if currentRequest.fields.length > 0}
                  <div class="space-y-2">
                    {#each currentRequest.fields as field, index}
                      <div class="flex items-center justify-between rounded-lg bg-surface-container-high p-3">
                        <div>
                          <div class="font-medium text-on-surface">{field.fieldName}</div>
                          <div class="text-xs text-on-surface-variant">
                            Type: {field.fieldType}
                            {#if field.required}
                              • <span class="text-error">Required</span>
                            {/if}
                            {#if field.allowedValues && field.allowedValues.length > 0}
                              • Allowed: {field.allowedValues.join(', ')}
                            {/if}
                          </div>
                        </div>
                        <button
                          aria-label="remove field"
                          onclick={() => removeField(index)}
                          disabled={loading}
                          class="text-error hover:text-on-error-container"
                        >
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="rounded-lg bg-surface-container-high p-4 text-center text-sm text-on-surface-variant">
                    No fields added yet
                  </div>
                {/if}
              </div>
              
              <div class="flex justify-end">
                <Button
                  onclick={addCredentialRequest}
                  variant="filled"
                  disabled={!currentRequest.requestName.trim() || !currentRequest.credentialType.trim() || currentRequest.fields.length === 0 || loading}
                >
                  Add Credential Request
                </Button>
              </div>
            </div>
          </div>
          
          <!-- Added Credential Requests -->
          {#if verificationRequest.credentialRequests.length > 0}
            <div>
              <h4 class="mb-3 font-medium text-on-surface">Credential Requests ({verificationRequest.credentialRequests.length})</h4>
              
              <div class="space-y-3">
                {#each verificationRequest.credentialRequests as request, index}
                  <Card elevation={1} class="p-4">
                    <div class="mb-3 flex items-start justify-between">
                      <div>
                        <div class="font-semibold text-on-surface">{request.requestName}</div>
                        <div class="text-sm text-on-surface-variant">{request.credentialType}</div>
                      </div>
                      <div class="flex gap-2">
                        <Badge size="small" variant="secondary">
                          {request.fields.length} fields
                        </Badge>
                        <button
                          aria-label="remove credential request"
                          onclick={() => removeCredentialRequest(index)}
                          disabled={loading}
                          class="text-error hover:text-on-error-container"
                        >
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div class="space-y-2">
                      {#each request.fields.slice(0, 3) as field}
                        <div class="text-sm text-on-surface-variant">
                          • {field.fieldName} ({field.fieldType})
                        </div>
                      {/each}
                      {#if request.fields.length > 3}
                        <div class="text-sm text-on-surface-variant">
                          • ...and {request.fields.length - 3} more fields
                        </div>
                      {/if}
                    </div>
                  </Card>
                {/each}
              </div>
            </div>
          {:else}
            <div class="rounded-lg bg-surface-container-high p-6 text-center">
              <svg class="mx-auto h-12 w-12 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h4 class="mt-4 font-medium text-on-surface">No Credential Requests Added</h4>
              <p class="mt-1 text-sm text-on-surface-variant">
                Add at least one credential request to create a verification
              </p>
            </div>
          {/if}
        </Card>
        
        <!-- Submit Button -->
        <Button
          onclick={handleSubmit}
          variant="filled"
          size="large"
          {loading}
          fullWidth
          disabled={verificationRequest.credentialRequests.length === 0}
        >
          {#if loading}
            <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          {/if}
          Create Verification Request
        </Button>
      </div>
      
      <!-- Preview Panel -->
      <div>
        <Card elevation={2} padding="large" class="sticky top-6">
          <h3 class="mb-4 text-lg font-semibold text-on-surface">Request Preview</h3>
          
          <div class="space-y-4">
            <div class="rounded-lg bg-surface-container p-4">
              <div class="mb-1 text-sm font-medium text-on-surface-variant">Purpose</div>
              <div class="text-sm text-on-surface">
                {verificationRequest.metadata.purpose || 'Not specified'}
              </div>
            </div>
            
            <div class="rounded-lg bg-surface-container p-4">
              <div class="mb-1 text-sm font-medium text-on-surface-variant">Expiration</div>
              <div class="text-sm text-on-surface">
                {verificationRequest.metadata.expirationDays || 30} days
              </div>
            </div>
            
            <div class="rounded-lg bg-surface-container p-4">
              <div class="mb-2 text-sm font-medium text-on-surface-variant">
                Credential Requests ({verificationRequest.credentialRequests.length})
              </div>
              <div class="space-y-2">
                {#each verificationRequest.credentialRequests as request}
                  <div class="border-l-2 border-primary pl-2">
                    <div class="text-sm font-medium text-on-surface">{request.requestName}</div>
                    <div class="text-xs text-on-surface-variant">
                      {request.credentialType} • {request.fields.length} fields
                    </div>
                  </div>
                {/each}
                {#if verificationRequest.credentialRequests.length === 0}
                  <div class="text-sm text-on-surface-variant italic">No requests added</div>
                {/if}
              </div>
            </div>
            
            <div class="rounded-lg bg-surface-container p-4">
              <div class="mb-1 text-sm font-medium text-on-surface-variant">Total Fields</div>
              <div class="text-lg font-bold text-on-surface">
                {verificationRequest.credentialRequests.reduce((total, req) => total + req.fields.length, 0)}
              </div>
            </div>
            
            <div class="rounded-lg bg-surface-container p-4">
              <div class="mb-1 text-sm font-medium text-on-surface-variant">Required Fields</div>
              <div class="text-lg font-bold text-primary">
                {verificationRequest.credentialRequests.reduce((total, req) => 
                  total + req.fields.filter(f => f.required).length, 0
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  {/if}
</div>