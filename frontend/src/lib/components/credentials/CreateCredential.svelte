<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { createCredentialOffer, getTemplateById } from '$lib/utils/api';
  import { goto } from '$app/navigation';
  import type { CreateCredentialOfferDto, Template } from '$lib/types/api';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  let loading = false;
  let templateLoading = false;
  let error = '';
  let success = false;
  let createdCredential: any = null;
  
  let template: Template | null = null;
  let templateFields: Array<{
    id: string;
    name: string;
    path: string[];
    required: boolean;
    type: string;
    description: string | null;
    pattern: string | null;
    min: number | null;
    max: number | null;
    options: string[] | null;
    defaultValue: any;
    order: number;
    value: string;
  }> = [];
  
  // Form data
  let formData: CreateCredentialOfferDto = {
    credentialId: '',
    holderDid: '',
    claims: {}
  };
  
  const templateId = $page.url.searchParams.get('template') || '';
  
  onMount(async () => {
    if (templateId) {
      await loadTemplate();
    }
  });
  
  async function loadTemplate() {
    if (!templateId) return;
    
    templateLoading = true;
    error = '';
    
    try {
      template = await getTemplateById(templateId);
      formData.credentialId = templateId;
      
      // Initialize template fields with values
      templateFields = template.fields.map(field => {
        let value = '';
        
        if (field.type === 'boolean') {
          // Handle boolean defaults
          value = field.defaultValue === true ? 'true' : 
                  field.defaultValue === false ? 'false' : '';
        } else if (field.defaultValue !== null && field.defaultValue !== undefined) {
          value = String(field.defaultValue);
        }
        
        return {
          ...field,
          value
        };
      });
      
    } catch (err: any) {
      error = `Failed to load template: ${err.message}`;
    } finally {
      templateLoading = false;
    }
  }
  
  function updateFieldValue(index: number, value: string) {
    templateFields[index].value = value;
  }
  
  async function handleSubmit() {
    if (!formData.credentialId.trim()) {
      error = 'Credential ID is required';
      return;
    }
    
    if (!formData.holderDid.trim()) {
      error = 'Holder DID is required';
      return;
    }
    
    if (!template) {
      error = 'Template is required';
      return;
    }
    
    // Validate required fields
    const missingFields = templateFields
      .filter(field => field.required && !field.value.trim())
      .map(field => field.name);
    
    if (missingFields.length > 0) {
      error = `Missing required fields: ${missingFields.join(', ')}`;
      return;
    }
    
    // Validate patterns
    for (const field of templateFields) {
      if (field.pattern && field.value.trim()) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(field.value)) {
          error = `Invalid format for ${field.name}`;
          return;
        }
      }
      
      // Validate min/max for numeric fields
      if (field.type === 'number' && field.value.trim()) {
        const numValue = parseFloat(field.value);
        if (field.min !== null && numValue < field.min) {
          error = `${field.name} must be at least ${field.min}`;
          return;
        }
        if (field.max !== null && numValue > field.max) {
          error = `${field.name} must be at most ${field.max}`;
          return;
        }
      }
      
      // Validate options for select fields
      if (field.options && field.value.trim()) {
        if (!field.options.includes(field.value)) {
          error = `Invalid option for ${field.name}. Must be one of: ${field.options.join(', ')}`;
          return;
        }
      }
    }
    
    // Build claims object using field paths
    const claims: Record<string, any> = {};
    
    templateFields.forEach(field => {
      if (field.value.trim()) {
        // Build nested object based on path
        let current: any = claims;
        for (let i = 0; i < field.path.length - 1; i++) {
          const pathPart = field.path[i];
          if (!current[pathPart]) {
            current[pathPart] = {};
          }
          current = current[pathPart];
        }
        
        const lastPath = field.path[field.path.length - 1];
        // Convert value based on type
        if (field.type === 'number') {
          current[lastPath] = parseFloat(field.value);
        } else if (field.type === 'boolean') {
          current[lastPath] = field.value.toLowerCase() === 'true';
        } else {
          current[lastPath] = field.value;
        }
      }
    });
    
    const submissionData: CreateCredentialOfferDto = {
      credentialId: formData.credentialId,
      holderDid: formData.holderDid,
      claims
    };
    
    loading = true;
    error = '';
    
    try {
      const response = await createCredentialOffer(submissionData);
      createdCredential = response;
      success = true;
    } catch (err: any) {
      error = err.message || 'Failed to create credential';
    } finally {
      loading = false;
    }
  }
  
  function resetForm() {
    formData = {
      credentialId: '',
      holderDid: '',
      claims: {}
    };
    if (template) {
      formData.credentialId = template.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
      templateFields = template.fields.map(field => ({
        ...field,
        value: field.defaultValue || ''
      }));
    }
    success = false;
    createdCredential = null;
  }
  
  function getInputType(fieldType: string): string {
    switch (fieldType) {
      case 'email': return 'email';
      case 'number': return 'number';
      case 'date': return 'date';
      case 'tel': return 'tel';
      case 'url': return 'url';
      case 'password': return 'password';
      default: return 'text';
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-on-surface">Create Credential Offer</h2>
      <p class="text-on-surface-variant">
        {#if template}
          Using template: {template.name}
        {:else}
          Issue a new verifiable credential to a holder
        {/if}
      </p>
    </div>
    <Button onclick={() => goto("/credentials")} variant="outlined">
      Back to Dashboard
    </Button>
  </div>
  
  <!-- Success Message -->
  {#if success && createdCredential}
    <Alert variant="success" onclose={resetForm}>
      <div class="flex items-center justify-between">
        <div>
          <strong>Credential created successfully!</strong>
          <div class="text-sm">Credential ID: {createdCredential.id}</div>
        </div>
        <div class="flex gap-2">
          <Button onclick={() => goto(`/credentials/view/${createdCredential.id}`)} size="small">
            View Details
          </Button>
          <Button onclick={resetForm} variant="outlined" size="small">
            Create Another
          </Button>
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
  
  {#if !templateId}
    <!-- No Template Selected -->
    <Card class="py-12 text-center">
      <svg class="mx-auto h-12 w-12 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-on-surface">No template selected</h3>
      <p class="mt-1 text-on-surface-variant">
        Please select a template from the templates page first
      </p>
      <div class="mt-6">
        <Button onclick={() => goto('/credentials/templates')} variant="filled">
          Browse Templates
        </Button>
      </div>
    </Card>
  
  {:else if templateLoading}
    <!-- Loading Template -->
    <Card class="py-12 text-center">
      <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p class="text-on-surface-variant">Loading template...</p>
    </Card>
  
  {:else if template}
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Main Form -->
      <div class="lg:col-span-2">
        <Card elevation={2} padding="large" class="space-y-6">
          <!-- Template Information -->
          <div class="rounded-lg bg-surface-container p-4">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-lg font-semibold text-on-surface">{template.name}</h3>
                <p class="text-sm text-on-surface-variant">{template.description}</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <Badge variant="primary">{template.credentialType}</Badge>
                  <Badge variant="secondary">{template.format}</Badge>
                  {#if template.validityDays}
                    <Badge variant="warning">Valid for {template.validityDays} days</Badge>
                  {/if}
                  {#if template.tags.length > 0}
                    {#each template.tags.slice(0, 3) as tag}
                      <Badge>{tag.name}</Badge>
                    {/each}
                    {#if template.tags.length > 3}
                      <Badge>+{template.tags.length - 3} more</Badge>
                    {/if}
                  {/if}
                </div>
              </div>
              <Button onclick={() => goto(`/credentials/templates/${template!.id}`)} variant="text" size="small">
                View Template
              </Button>
            </div>
          </div>
          
          <!-- Basic Information -->
          <div>
            <h3 class="mb-3 text-lg font-semibold text-on-surface">Credential Details</h3>
            <div class="grid grid-cols-1 gap-4">
              <Input
                label="Holder DID"
                bind:value={formData.holderDid}
                required
                placeholder="did:example:123456789abcdefghi"
                disabled={loading}
                helperText="Decentralized Identifier of the holder"
              />
            </div>
          </div>
          
          <!-- Template Fields Section -->
          <div>
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-on-surface">Credential Data</h3>
              <Badge variant="secondary">
                {templateFields.filter(f => f.required).length} required, {templateFields.length} total
              </Badge>
            </div>
            
            <div class="space-y-6">
              {#each templateFields.sort((a, b) => a.order - b.order) as field, index}
                <div class="rounded-lg border border-outline-variant p-4">
                  <div class="mb-3">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-on-surface">{field.name}</span>
                      {#if field.required}
                        <Badge size="small" variant="error">Required</Badge>
                      {/if}
                    </div>
                    {#if field.description}
                      <p class="mt-1 text-sm text-on-surface-variant">{field.description}</p>
                    {/if}
                    <div class="mt-1 text-xs text-on-surface-variant">
                      <code class="bg-surface-container-high px-1 py-0.5 rounded">
                        {field.path.join('.')}
                      </code>
                      <span class="ml-2">Type: {field.type}</span>
                      {#if field.pattern}
                        <span class="ml-2">Pattern: {field.pattern}</span>
                      {/if}
                      {#if field.min !== null && field.max !== null}
                        <span class="ml-2">Range: {field.min} to {field.max}</span>
                      {:else if field.min !== null}
                        <span class="ml-2">Min: {field.min}</span>
                      {:else if field.max !== null}
                        <span class="ml-2">Max: {field.max}</span>
                      {/if}
                    </div>
                  </div>
                  
                  <div>
                    {#if field.options}
                      <!-- Select Field -->
                      <label for="select" class="block text-sm font-medium text-on-surface-variant mb-1">
                        Select {field.name}
                      </label>
                      <select
                        bind:value={field.value}
                        disabled={loading}
                        class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface focus:border-primary focus:outline-none disabled:opacity-50"
                      >
                        <option value="">Select an option</option>
                        {#each field.options as option}
                          <option value={option}>{option}</option>
                        {/each}
                      </select>
                      
                    {:else if field.type === 'boolean'}
                      <!-- Boolean Field -->
                      <div class="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`field-${field.id}`}
                          checked={field.value === 'true'}
                          disabled={loading}
                          class="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                          onchange={(e) => {
                            field.value = (e.target! as any).checked ? 'true' : 'false'
                          }}
                        />
                        <label for={`field-${field.id}`} class="text-sm text-on-surface">
                          {field.name}
                        </label>
                      </div>
                      
                    {:else if field.type === 'textarea'}
                      <!-- Textarea Field -->
                      <label for="field-name" class="block text-sm font-medium text-on-surface-variant mb-1">
                        {field.name}
                      </label>
                      <textarea
                        bind:value={field.value}
                        rows="3"
                        placeholder={`Enter ${field.name.toLowerCase()}...`}
                        disabled={loading}
                        class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface focus:border-primary focus:outline-none disabled:opacity-50"
                      ></textarea>
                      
                    {:else}
                      <!-- Standard Input Field -->
                      <Input
                        label={field.name}
                        type={getInputType(field.type) as any}
                        bind:value={field.value}
                        placeholder={`Enter ${field.name.toLowerCase()}...`}
                        disabled={loading}
                        required={field.required}
                        helperText={field.description || undefined}
                      />
                      
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Submit Button -->
          <div class="pt-4">
            <Button
              onclick={handleSubmit}
              variant="filled"
              size="large"
              {loading}
              fullWidth
            >
              {#if loading}
                <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              {/if}
              Create Credential Offer
            </Button>
          </div>
        </Card>
      </div>
      
      <!-- Preview Panel -->
      <div>
        <Card elevation={2} padding="large" class="sticky top-6">
          <h3 class="mb-4 text-lg font-semibold text-on-surface">Preview</h3>
          
          <div class="space-y-4">
            <!-- Template Info -->
            <div class="rounded-lg bg-surface-container p-4">
              <div class="mb-2 text-sm font-medium text-on-surface-variant">Template</div>
              <div class="font-medium text-on-surface">{template.name}</div>
              <div class="mt-1 text-xs text-on-surface-variant">{template.description}</div>
            </div>
            
            <!-- Credential Info -->
            <div class="rounded-lg bg-surface-container p-4">
              <div class="mb-2 text-sm font-medium text-on-surface-variant">Credential ID</div>
              <div class="font-mono text-sm text-on-surface break-all">
                {formData.credentialId || 'Not set'}
              </div>
            </div>
            
            <div class="rounded-lg bg-surface-container p-4">
              <div class="mb-2 text-sm font-medium text-on-surface-variant">Holder DID</div>
              <div class="font-mono text-sm text-on-surface break-all">
                {formData.holderDid || 'Not set'}
              </div>
            </div>
            
            <!-- Fields Summary -->
            <div class="rounded-lg bg-surface-container p-4">
              <div class="mb-3 flex items-center justify-between">
                <div class="text-sm font-medium text-on-surface-variant">Fields Summary</div>
                <div class="text-xs text-on-surface-variant">
                  {templateFields.filter(f => f.value.trim()).length}/{templateFields.length} filled
                </div>
              </div>
              
              <div class="space-y-2 max-h-64 overflow-y-auto">
                {#each templateFields.filter(f => f.value.trim()) as field}
                  <div class="rounded border border-outline-variant p-2">
                    <div class="flex items-center justify-between">
                      <div class="text-sm font-medium text-on-surface truncate">{field.name}</div>
                      {#if field.required}
                        <Badge size="small" variant="error">R</Badge>
                      {/if}
                    </div>
                    <div class="mt-1">
                      <div class="text-xs text-on-surface-variant truncate">{field.value}</div>
                      <div class="text-xs text-on-surface-variant">
                        {field.path.join('.')} • {field.type}
                      </div>
                    </div>
                  </div>
                {/each}
                
                {#if templateFields.filter(f => f.value.trim()).length === 0}
                  <div class="text-center py-4">
                    <svg class="mx-auto h-6 w-6 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="mt-2 text-xs text-on-surface-variant">No data entered yet</p>
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Validation Status -->
            <div class="rounded-lg bg-surface-container p-4">
              <div class="mb-2 text-sm font-medium text-on-surface-variant">Validation</div>
              <div class="space-y-2">
                {#each templateFields as field}
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-on-surface-variant truncate">{field.name}</span>
                    <div>
                      {#if field.required && !field.value.trim()}
                        <Badge size="small" variant="error">Missing</Badge>
                      {:else if field.value.trim()}
                        <Badge size="small" variant="success">Valid</Badge>
                      {:else}
                        <Badge size="small">Optional</Badge>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  {/if}
</div>