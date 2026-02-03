<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { goto } from '$app/navigation';
  import { deleteTemplate, getTemplates } from '$lib/utils/api';
	import type { Template, TemplateTag } from '$lib/types/api';

  let searchQuery = '';
  let tagFilter: string | null = null;
  
  // Load templates
  let templates: Template[] = [];
  let allTags: TemplateTag[] = [];
  
  // Load data
  getTemplates().then(data => {
    templates = data;
    
    // Extract unique tags from all templates
    const tagSet = new Map<string, TemplateTag>();
    data.forEach(template => {
      template.tags.forEach(tag => {
        if (!tagSet.has(tag.name)) {
          tagSet.set(tag.name, tag);
        }
      });
    });
    allTags = Array.from(tagSet.values());
  });
  
  // Computed filtered templates
  $: filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = !tagFilter || 
      template.tags.some(tag => tag.name === tagFilter);
    
    return matchesSearch && matchesTag;
  });
  
  // Computed active/inactive counts
  $: activeTemplates = templates.filter(t => t.active).length;
  $: inactiveTemplates = templates.filter(t => !t.active).length;
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getFormatBadgeColor(format: string): string {
    switch (format) {
      case 'sd-jwt': return 'bg-blue-100 text-blue-800';
      case 'jwt_vc_json': return 'bg-green-100 text-green-800';
      case 'jwt_vc_json-ld': return 'bg-purple-100 text-purple-800';
      case 'ldp_vc': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function getStatusBadge(active: boolean): string {
    return active 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  }
  
  function getStatusText(active: boolean): string {
    return active ? 'Active' : 'Inactive';
  }
  
  function truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  // Function to handle template deletion
  async function removeTemplate(id: string, name: string) {
    if (confirm(`Are you sure you want to delete template "${name}"?`)) {
      try {
        // Call delete API
        const response = await deleteTemplate(id);
        
        if (response.status === 200) {
          templates = templates.filter(t => t.id !== id);
        } else {
          throw new Error('Failed to delete template');
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template');
      }
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-on-surface">Credential Templates</h2>
      <p class="text-on-surface-variant">
        {templates.length} templates ({activeTemplates} active, {inactiveTemplates} inactive)
      </p>
    </div>
    <Button onclick={() => goto("/credentials/templates/create")} variant="filled">
      <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      New Template
    </Button>
  </div>
  
  <!-- Stats -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
    <Card elevation={1} class="p-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-on-surface">{templates.length}</div>
        <div class="text-sm text-on-surface-variant">Total Templates</div>
      </div>
    </Card>
    <Card elevation={1} class="p-4">
      <div class="text-center">
        <div class="text-2xl font-bold">{activeTemplates}</div>
        <div class="text-sm text-on-surface-variant">Active</div>
      </div>
    </Card>
    <Card elevation={1} class="p-4">
      <div class="text-center">
        <div class="text-2xl font-bold">{inactiveTemplates}</div>
        <div class="text-sm text-on-surface-variant">Inactive</div>
      </div>
    </Card>
    <Card elevation={1} class="p-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-on-surface">{allTags.length}</div>
        <div class="text-sm text-on-surface-variant">Unique Tags</div>
      </div>
    </Card>
  </div>
  
  <!-- Filters -->
  <Card elevation={1} class="p-4">
    <div class="flex flex-col gap-4 sm:flex-row">
      <div class="flex-1">
        <Input
          label="Search Templates"
          placeholder="Search by name, description, or credential type..."
          bind:value={searchQuery}
        />
      </div>
      <div class="w-full sm:w-48">
        <label for="tagFilter" class="block text-sm font-medium text-on-surface-variant mb-1">
          Filter by Tag
        </label>
        <select
          name="tagFilter"
          bind:value={tagFilter}
          class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        >
          <option value={null}>All Tags</option>
          {#each allTags as tag}
            <option value={tag.name}>{tag.name}</option>
          {/each}
        </select>
      </div>
    </div>
  </Card>
  
  <!-- Templates Grid -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each filteredTemplates as template}
      <Card elevation={2} class="h-full overflow-hidden hover:shadow-3 transition-shadow">
        <!-- Template Status Badge -->
        <div class="absolute right-4 top-4 z-10">
          <Badge class={getStatusBadge(template.active)}>
            {getStatusText(template.active)}
          </Badge>
        </div>
        
        <!-- Template Header with Background -->
        <div 
          class="h-24 p-4 relative rounded-xl"
          style:background-color={template.display.background}
          style:color={template.display.textColor}
        >
          <div class="absolute inset-0 bg-black opacity-10"></div>
          <div class="relative z-10 flex h-full items-center">
            {#if template.display.logo}
              <img 
                src={template.display.logo} 
                alt={`${template.name} logo`}
                class="mr-3 h-12 w-12 rounded-full bg-white p-2"
              />
            {/if}
            <div>
              <h3 class="text-lg font-semibold">{template.name}</h3>
              <p class="text-sm opacity-90">{template.credentialType}</p>
            </div>
          </div>
        </div>
        
        <!-- Template Content -->
        <div class="p-5">
          <!-- Description -->
          <p class="mb-4 text-sm text-on-surface-variant">
            {truncateText(template.description, 120)}
          </p>
          
          <!-- Format Badge -->
          <div class="mb-4">
            <Badge class={getFormatBadgeColor(template.format)}>
              {template.format.toUpperCase()}
            </Badge>
          </div>
          
          <!-- Tags -->
          <div class="mb-4">
            <div class="mb-2 text-sm font-medium text-on-surface-variant">Tags</div>
            <div class="flex flex-wrap gap-1">
              {#each template.tags.slice(0, 3) as tag}
                <span class="rounded-full bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant">
                  {tag.name}
                </span>
              {/each}
              {#if template.tags.length > 3}
                <span class="rounded-full bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant">
                  +{template.tags.length - 3} more
                </span>
              {/if}
            </div>
          </div>
          
          <!-- Fields Preview -->
          <div class="mb-4">
            <div class="mb-2 text-sm font-medium text-on-surface-variant">
              Fields ({template.fields.length})
            </div>
            <div class="space-y-1">
              {#each template.fields.slice(0, 3) as field}
                <div class="flex items-center justify-between text-sm">
                  <span class="text-on-surface">{field.name}</span>
                  <span class="rounded-full bg-surface-container-low px-2 py-0.5 text-xs text-on-surface-variant">
                    {field.type}
                  </span>
                </div>
              {/each}
              {#if template.fields.length > 3}
                <div class="pt-1 text-xs text-on-surface-variant">
                  +{template.fields.length - 3} more fields
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Validity and Dates -->
          <div class="space-y-2 border-t border-outline-variant pt-3 text-xs text-on-surface-variant">
            {#if template.validityDays}
              <div class="flex items-center">
                <svg class="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Valid for {template.validityDays} days
              </div>
            {/if}
            <div class="flex items-center">
              <svg class="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Updated {formatDate(template.updatedAt)}
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="mt-4 flex gap-2">
            <Button
              onclick={() => goto(`/credentials/create?template=${template.id}`)}
              variant="filled"
              size="small"
              disabled={!template.active}
              class="flex-1"
            >
              {#if template.active}
                Issue Credential
              {:else}
                Template Inactive
              {/if}
            </Button>
            <Button
              onclick={() => removeTemplate(template.id, template.name)}
              variant="text"
              size="small"
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>
    {/each}
  </div>
  
  <!-- Empty State -->
  {#if filteredTemplates.length === 0}
    <Card class="py-12 text-center">
      <svg class="mx-auto h-12 w-12 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-on-surface">No templates found</h3>
      <p class="mt-1 text-on-surface-variant">
        {#if searchQuery || tagFilter}
          Try adjusting your search or filters
        {:else}
          Create your first template to get started
        {/if}
      </p>
      <div class="mt-6">
        <Button onclick={() => goto("/credentials/templates/create")} variant="filled">
          Create Template
        </Button>
      </div>
    </Card>
  {/if}
</div>
