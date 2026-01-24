<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { goto } from '$app/navigation';
	import type { CreateTemplateDto } from '$lib/types/api';
	import { createTemplate } from '$lib/utils/api';
  
  let loading = false;
  let error = '';
  let success = false;
  
  // Template form data matching the DTO structure
  let templateData = {
    name: '',
    description: '',
    format: 'sd-jwt',
    credentialType: '',
    display: {
      background: '#3B82F6', // Default blue
      textColor: '#FFFFFF',
      logo: ''
    },
    fields: [] as Array<{
      name: string;
      required: boolean;
      type: 'string' | 'number' | 'date' | 'select' | 'boolean' | 'array' | 'object';
      description: string;
      pattern: string;
      min: number;
      max: number;
      options: string[];
      defaultValue: any;
      order: number;
      group: string;
    }>,
    tags: [] as string[],
    active: true,
    validityDays: 0,
    metadata: {}
  };
  
  // New field form
  let newField = {
    name: '',
    required: true,
    type: 'string' as 'string' | 'number' | 'date' | 'select' | 'boolean' | 'array' | 'object',
    description: '',
    pattern: '',
    min: '',
    max: '',
    options: '',
    defaultValue: '',
    order: 0,
    group: ''
  };
  
  const credentialFormats = [
    { value: 'sd-jwt', label: 'SD-JWT' },
    { value: 'jwt_vc_json', label: 'JWT VC JSON' },
    { value: 'jwt_vc_json-ld', label: 'JWT VC JSON-LD' },
    { value: 'ldp_vc', label: 'LDP VC' }
  ];
  
  const fieldTypes = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select (Dropdown)' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'array', label: 'Array' },
    { value: 'object', label: 'Object' }
  ];
  
  // Common credential types
  const commonCredentialTypes = [
    'VerifiableIdentityCredential',
    'EducationalCredential',
    'ProfessionalLicense',
    'MembershipCredential',
    'CertificateOfCompletion',
    'ProofOfEmployment',
    'HealthPassport'
  ];
  
  // Color presets for display
  const colorPresets = [
    { background: '#3B82F6', textColor: '#FFFFFF', label: 'Blue' },
    { background: '#10B981', textColor: '#FFFFFF', label: 'Green' },
    { background: '#8B5CF6', textColor: '#FFFFFF', label: 'Purple' },
    { background: '#F59E0B', textColor: '#000000', label: 'Amber' },
    { background: '#EF4444', textColor: '#FFFFFF', label: 'Red' },
    { background: '#6B7280', textColor: '#FFFFFF', label: 'Gray' }
  ];
  
  function addCustomField() {
    if (!newField.name.trim()) {
      error = 'Field name is required';
      return;
    }
    
    const field: any = {
      name: newField.name.trim(),
      type: newField.type,
      required: newField.required,
      description: newField.description.trim(),
      pattern: newField.pattern.trim(),
      order: newField.order,
      group: newField.group.trim()
    };
    
    // Handle numeric fields
    if (newField.min) field.min = parseFloat(newField.min);
    if (newField.max) field.max = parseFloat(newField.max);
    
    // Handle options for select fields
    if (newField.type === 'select' && newField.options.trim()) {
      field.options = newField.options
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);
    }
    
    // Handle default value
    if (newField.defaultValue.trim()) {
      if (newField.type === 'number') {
        field.defaultValue = parseFloat(newField.defaultValue);
      } else if (newField.type === 'boolean') {
        field.defaultValue = newField.defaultValue.toLowerCase() === 'true';
      } else {
        field.defaultValue = newField.defaultValue.trim();
      }
    }
    
    // Use array spread to trigger reactivity
    templateData.fields = [...templateData.fields, field];
    
    // Reset new field form
    newField = {
      name: '',
      required: true,
      type: 'string',
      description: '',
      pattern: '',
      min: '',
      max: '',
      options: '',
      defaultValue: '',
      order: templateData.fields.length + 1, // Update to next order
      group: ''
    };
  }
  
  function removeField(index: number) {
    templateData.fields = templateData.fields.filter((_, i) => i !== index);
  }
  
  function moveFieldUp(index: number) {
    if (index > 0) {
      const fields = [...templateData.fields];
      [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
      fields.forEach((field, i) => field.order = i);
      templateData.fields = fields;
    }
  }
  
  function moveFieldDown(index: number) {
    if (index < templateData.fields.length - 1) {
      const fields = [...templateData.fields];
      [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
      fields.forEach((field, i) => field.order = i);
      templateData.fields = fields;
    }
  }
  
  // Tag management
  let newTag = '';
  function addTag() {
    if (newTag.trim() && !templateData.tags.includes(newTag.trim())) {
      templateData.tags = [...templateData.tags, newTag.trim()];
      newTag = '';
    }
  }
  
  function removeTag(tag: string) {
    templateData.tags = templateData.tags.filter(t => t !== tag);
  }
  
  function applyColorPreset(preset: any) {
    templateData.display.background = preset.background;
    templateData.display.textColor = preset.textColor;
  }
  
  async function handleSubmit() {
    if (!templateData.name.trim()) {
      error = 'Template name is required';
      return;
    }
    
    if (!templateData.description.trim()) {
      error = 'Template description is required';
      return;
    }
    
    if (!templateData.credentialType.trim()) {
      error = 'Credential type is required';
      return;
    }
    
    if (templateData.fields.length === 0) {
      error = 'At least one field is required';
      return;
    }
    
    // Validate display properties
    if (!templateData.display.background) {
      error = 'Display background color is required';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      // Prepare the data for API call
      const submitData: CreateTemplateDto = {
        name: templateData.name.trim(),
        description: templateData.description.trim(),
        format: templateData.format,
        credentialType: templateData.credentialType.trim(),
        display: {
          background: templateData.display.background,
          textColor: templateData.display.textColor || undefined,
          logo: templateData.display.logo?.trim() || undefined
        },
        fields: templateData.fields.map(field => ({
          name: field.name,
          required: field.required,
          type: field.type,
          description: field.description?.trim() || undefined,
          pattern: field.pattern?.trim() || undefined,
          min: field.min || undefined,
          max: field.max || undefined,
          options: field.options?.length > 0 ? field.options : undefined,
          defaultValue: field.defaultValue || undefined,
          order: field.order,
          group: field.group?.trim() || undefined
        })),
        tags: templateData.tags.length > 0 ? templateData.tags : undefined,
        active: templateData.active,
        validityDays: templateData.validityDays > 0 ? templateData.validityDays : undefined,
        metadata: Object.keys(templateData.metadata).length > 0 ? templateData.metadata : undefined
      };
      
      await createTemplate(submitData);
    
      success = true;
      
      setTimeout(() => {
        goto('/credentials/templates');
      }, 2000);
    } catch (err: any) {
      error = err.message || 'Failed to create template';
    } finally {
      loading = false;
    }
  }
  
  function getFieldTypeLabel(type: string): string {
    return fieldTypes.find(t => t.value === type)?.label || type;
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-on-surface">Create Template</h1>
      <p class="text-on-surface-variant">Design a reusable credential template</p>
    </div>
    <Button onclick={() => goto("/credentials/templates")} variant="outlined">
      Back to Templates
    </Button>
  </div>
  
  <!-- Success Alert -->
  {#if success}
    <Alert variant="success">
      <div class="flex items-center justify-between">
        <div>
          <strong>Template created successfully!</strong>
          <div class="text-sm">Redirecting to templates...</div>
        </div>
        <Button onclick={() => goto("/credentials/templates")} variant="text" size="small">
          Go Now
        </Button>
      </div>
    </Alert>
  {/if}
  
  <!-- Error Alert -->
  {#if error}
    <Alert variant="error" onclose={() => error = ''}>
      {error}
    </Alert>
  {/if}
  
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Main Form -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Basic Information -->
      <Card elevation={2} padding="large" class="space-y-4">
        <h3 class="text-lg font-semibold text-on-surface">Basic Information</h3>
        
        <div class="grid grid-cols-1 gap-4">
          <Input
            label="Template Name"
            bind:value={templateData.name}
            required
            placeholder="e.g., Identity Verification Credential"
            disabled={loading}
            helperText="A descriptive name for your template"
          />
          
          <div>
            <label for="description" class="block text-sm font-medium text-on-surface-variant mb-1">
              Description *
            </label>
            <textarea
              name="description"
              bind:value={templateData.description}
              rows="3"
              placeholder="Describe the purpose of this template..."
              disabled={loading}
              class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface focus:border-primary focus:outline-none disabled:opacity-50"
            ></textarea>
          </div>
          
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label for="credentialType" class="block text-sm font-medium text-on-surface-variant mb-1">
                Credential Type *
              </label>
              <select
                name="credentialType"
                bind:value={templateData.credentialType}
                disabled={loading}
                class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="">Select a type</option>
                {#each commonCredentialTypes as type}
                  <option value={type}>{type}</option>
                {/each}
                <option value="custom">Custom Type</option>
              </select>
              {#if templateData.credentialType === 'custom'}
                <Input
                  bind:value={templateData.credentialType}
                  placeholder="Enter custom credential type"
                  class="mt-2"
                />
              {/if}
            </div>
          </div>
          
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Validity Days (Optional)"
              type="number"
              bind:value={templateData.validityDays}
              placeholder="e.g., 365"
              disabled={loading}
              helperText="Number of days the credential is valid"
            />
            
            <div>
              <label for="tags" class="block text-sm font-medium text-on-surface-variant mb-1">
                Tags
              </label>
              <div class="flex gap-2 items-center">
                <Input
                  bind:value={newTag}
                  placeholder="Add a tag"
                  disabled={loading}
                  onkeypress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button onclick={addTag} variant="tonal" size="small" {loading}>
                  Add
                </Button>
              </div>
              <div class="mt-2 flex flex-wrap gap-2">
                {#each templateData.tags as tag}
                  <Badge variant="secondary" onclose={() => removeTag(tag)}>
                    {tag}
                  </Badge>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <!-- Display Configuration -->
      <Card elevation={2} padding="large">
        <h3 class="mb-4 text-lg font-semibold text-on-surface">Display Configuration</h3>
        
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label for="color-presets" class="block text-sm font-medium text-on-surface-variant mb-2">
              Color Presets
            </label>
            <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {#each colorPresets as preset}
                <button
                  type="button"
                  on:click={() => applyColorPreset(preset)}
                  disabled={loading}
                  class={`h-10 rounded-lg border-2 transition-all ${
                    templateData.display.background === preset.background
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-outline-variant'
                  }`}
                  style:background-color={preset.background}
                  title={preset.label}
                >
                  <span class="sr-only">{preset.label}</span>
                </button>
              {/each}
            </div>
          </div>
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="background-color" class="block text-sm font-medium text-on-surface-variant mb-1">
                  Background Color
                </label>
                <div class="flex gap-2 items-center">
                  <input
                    name="background-color"
                    type="color"
                    bind:value={templateData.display.background}
                    disabled={loading}
                    class="h-10 w-10 cursor-pointer rounded-lg border border-outline-variant"
                  />
                  <Input
                    bind:value={templateData.display.background}
                    placeholder="#3B82F6"
                    disabled={loading}
                    class="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <label for="text-color" class="block text-sm font-medium text-on-surface-variant mb-1">
                  Text Color
                </label>
                <div class="flex gap-2 items-center">
                  <input
                    name="text-color"
                    type="color"
                    bind:value={templateData.display.textColor}
                    disabled={loading}
                    class="h-10 w-10 cursor-pointer rounded-lg border border-outline-variant"
                  />
                  <Input
                    bind:value={templateData.display.textColor}
                    placeholder="#FFFFFF"
                    disabled={loading}
                    class="flex-1"
                  />
                </div>
              </div>
            </div>
            
            <Input
              label="Logo URL (Optional)"
              bind:value={templateData.display.logo}
              placeholder="https://example.com/logo.png"
              disabled={loading}
              helperText="URL to display logo on credential"
            />
          </div>
        </div>
        
        <!-- Preview -->
        <div class="mt-4 rounded-lg border border-outline-variant p-4">
          <div class="mb-2 text-sm font-medium text-on-surface-variant">Preview</div>
          <div
            class="rounded-lg p-4 text-center"
            style:background-color={templateData.display.background}
            style:color={templateData.display.textColor}
          >
            <div class="text-lg font-bold">{templateData.name || 'Credential Template'}</div>
            <div class="text-sm opacity-90">{templateData.credentialType || 'Credential Type'}</div>
            {#if templateData.display.logo}
              <div class="mt-2">
                <div class="inline-block h-8 w-8 rounded bg-white/20"></div>
              </div>
            {/if}
          </div>
        </div>
      </Card>
      
      <!-- Custom Field Form -->
      <Card elevation={2} padding="large">
        <h3 class="mb-4 text-lg font-semibold text-on-surface">Add Custom Field</h3>
        
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Field Name *"
              bind:value={newField.name}
              placeholder="e.g., Employment Status"
              disabled={loading}
              helperText="User-friendly label"
            />
            
            <div>
              <label for="type" class="block text-sm font-medium text-on-surface-variant mb-1">
                Field Type *
              </label>
              <select
                name="type"
                bind:value={newField.type}
                disabled={loading}
                class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface focus:border-primary focus:outline-none"
              >
                {#each fieldTypes as type}
                  <option value={type.value}>{type.label}</option>
                {/each}
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Group (Optional)"
              bind:value={newField.group}
              placeholder="e.g., Personal Information"
              disabled={loading}
              helperText="Group fields together"
            />
            
            <Input
              label="Description (Optional)"
              bind:value={newField.description}
              placeholder="Describe this field..."
              disabled={loading}
            />
          </div>
          
          {#if ['string', 'number'].includes(newField.type)}
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              {#if newField.type === 'string'}
                <Input
                  label="Pattern (Optional)"
                  bind:value={newField.pattern}
                  placeholder="Regex pattern"
                  disabled={loading}
                  helperText="e.g., ^[A-Za-z]+$"
                />
              {:else}
                <Input
                  label="Minimum Value (Optional)"
                  bind:value={newField.min}
                  type="number"
                  placeholder="Min"
                  disabled={loading}
                />
                
                <Input
                  label="Maximum Value (Optional)"
                  bind:value={newField.max}
                  type="number"
                  placeholder="Max"
                  disabled={loading}
                />
              {/if}
              
              <Input
                label="Default Value (Optional)"
                bind:value={newField.defaultValue}
                placeholder="Default value"
                disabled={loading}
              />
            </div>
          {:else if newField.type === 'select'}
            <div class="space-y-4">
              <Input
                label="Options *"
                bind:value={newField.options}
                placeholder="Comma-separated values"
                disabled={loading}
                helperText="e.g., Option 1, Option 2, Option 3"
              />
              
              <Input
                label="Default Value (Optional)"
                bind:value={newField.defaultValue}
                placeholder="Default selection"
                disabled={loading}
              />
            </div>
          {:else if newField.type === 'boolean'}
            <div>
              <label for="default-value" class="block text-sm font-medium text-on-surface-variant mb-1">
                Default Value (Optional)
              </label>
              <select
                name="default-value"
                bind:value={newField.defaultValue}
                disabled={loading}
                class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="">Not Set</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          {/if}
          
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                bind:checked={newField.required}
                disabled={loading}
                class="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span class="text-sm text-on-surface-variant">Required Field</span>
            </label>
            
            <Input
              label="Order"
              type="number"
              bind:value={newField.order}
              disabled={loading}
              class="w-24 p-2"
            />
          </div>
          
          <div class="flex justify-end">
            <Button onclick={addCustomField} variant="tonal" {loading}>
              Add Field
            </Button>
          </div>
        </div>
      </Card>
      
      <!-- Fields List -->
      {#if templateData.fields.length > 0}
        <Card elevation={2} padding="large">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-on-surface">
              Template Fields ({templateData.fields.length})
            </h3>
            <Badge variant="secondary">
              {templateData.fields.filter(f => f.required).length} required
            </Badge>
          </div>
          
          <div class="space-y-3">
            {#each templateData.fields as field, index}
              <div class="rounded-lg border border-outline-variant p-4">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <div class="font-medium text-on-surface">{field.name}</div>
                      <Badge size="small" variant={field.required ? 'error' : 'secondary'}>
                        {field.required ? 'Required' : 'Optional'}
                      </Badge>
                      <Badge size="small" variant="primary">
                        {getFieldTypeLabel(field.type)}
                      </Badge>
                      {#if field.group}
                        <Badge size="small" variant="secondary">
                          {field.group}
                        </Badge>
                      {/if}
                      <span class="text-xs text-on-surface-variant">
                        Order: {field.order}
                      </span>
                    </div>
                    
                    {#if field.description}
                      <p class="mt-2 text-sm text-on-surface-variant">{field.description}</p>
                    {/if}
                    
                    <div class="mt-2 flex flex-wrap gap-2">
                      {#if field.pattern}
                        <code class="rounded bg-surface-container-high px-2 py-1 text-xs font-mono text-on-surface-variant">
                          Pattern: {field.pattern}
                        </code>
                      {/if}
                      
                      {#if field.min !== undefined && field.min !== 0}
                        <span class="text-xs text-on-surface-variant">
                          Min: {field.min}
                        </span>
                      {/if}
                      
                      {#if field.max !== undefined && field.max !== 0}
                        <span class="text-xs text-on-surface-variant">
                          Max: {field.max}
                        </span>
                      {/if}
                      
                      {#if field.options?.length > 0}
                        <span class="text-xs text-on-surface-variant">
                          Options: {field.options.join(', ')}
                        </span>
                      {/if}
                      
                      {#if field.defaultValue !== undefined && field.defaultValue !== ''}
                        <span class="text-xs text-on-surface-variant">
                          Default: {field.defaultValue.toString()}
                        </span>
                      {/if}
                    </div>
                  </div>
                  
                  <div class="flex gap-1">
                    <button
                      aria-label="move-field-up"
                      type="button"
                      on:click={() => moveFieldUp(index)}
                      disabled={loading || index === 0}
                      class="rounded p-1 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      aria-label="move-field-down"
                      type="button"
                      on:click={() => moveFieldDown(index)}
                      disabled={loading || index === templateData.fields.length - 1}
                      class="rounded p-1 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      aria-label="remove-field"
                      type="button"
                      on:click={() => removeField(index)}
                      disabled={loading}
                      class="rounded p-1 text-error hover:bg-error-container hover:text-on-error-container"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </Card>
      {/if}
      
      <!-- Submit Button -->
      <div class="flex justify-end gap-2">
        <Button onclick={() => goto("/credentials/templates")} variant="outlined" {loading}>
          Cancel
        </Button>
        <Button onclick={handleSubmit} variant="filled" {loading}>
          {#if loading}
            <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          {/if}
          Create Template
        </Button>
      </div>
    </div>
    
    <!-- Preview Panel -->
    <div>
      <Card elevation={2} padding="large" class="sticky top-6">
        <h3 class="mb-4 text-lg font-semibold text-on-surface">Template Preview</h3>
        
        <div class="space-y-4">
          <!-- Template Info -->
          <div class="rounded-lg bg-surface-container p-4">
            <div class="mb-2 text-sm font-medium text-on-surface-variant">Template Name</div>
            <div class="font-medium text-on-surface">
              {templateData.name || 'Untitled Template'}
            </div>
          </div>
          
          <div class="rounded-lg bg-surface-container p-4">
            <div class="mb-2 text-sm font-medium text-on-surface-variant">Credential Type</div>
            <div class="text-sm text-on-surface">
              {templateData.credentialType || 'Not specified'}
            </div>
          </div>
          
          <div class="rounded-lg bg-surface-container p-4">
            <div class="mb-2 text-sm font-medium text-on-surface-variant">Format</div>
            <div class="text-sm text-on-surface">
              {credentialFormats.find(f => f.value === templateData.format)?.label || templateData.format}
            </div>
          </div>
          
          <!-- Display Preview -->
          <div class="rounded-lg bg-surface-container p-4">
            <div class="mb-2 text-sm font-medium text-on-surface-variant">Display Preview</div>
            <div
              class="rounded p-3 text-center"
              style:background-color={templateData.display.background}
              style:color={templateData.display.textColor}
            >
              <div class="text-sm font-semibold">Sample Credential</div>
              <div class="text-xs opacity-90">Preview</div>
            </div>
          </div>
          
          <!-- Fields Summary -->
          <div class="rounded-lg bg-surface-container p-4">
            <div class="mb-3 flex items-center justify-between">
              <div class="text-sm font-medium text-on-surface-variant">Fields</div>
              <div class="text-xs text-on-surface-variant">
                {templateData.fields.length} total
              </div>
            </div>
            
            {templateData.fields}
            {#if templateData.fields.length === 0}
              <div class="text-center py-4">
                <svg class="mx-auto h-8 w-8 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="mt-2 text-sm text-on-surface-variant">No fields added yet</p>
              </div>
            {:else}
              <div class="space-y-2 max-h-64 overflow-y-auto">
                {#each templateData.fields as field}
                  <div class="rounded border border-outline-variant p-2">
                    <div class="flex items-center justify-between">
                      <div class="text-sm font-medium text-on-surface">{field.name}</div>
                      <Badge size="small" variant={field.required ? 'error' : 'secondary'}>
                        {field.required ? 'R' : 'O'}
                      </Badge>
                    </div>
                    <div class="mt-1 flex items-center justify-between">
                      <span class="text-xs text-on-surface-variant">
                        {getFieldTypeLabel(field.type)}
                      </span>
                      {#if field.group}
                        <span class="text-xs text-on-surface-variant">{field.group}</span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
          
          <!-- Tags Preview -->
          {#if templateData.tags.length > 0}
            <div class="rounded-lg bg-surface-container p-4">
              <div class="mb-2 text-sm font-medium text-on-surface-variant">Tags</div>
              <div class="flex flex-wrap gap-1">
                {#each templateData.tags as tag}
                  <span class="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                    {tag}
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </Card>
    </div>
  </div>
</div>