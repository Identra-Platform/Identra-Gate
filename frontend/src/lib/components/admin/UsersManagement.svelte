<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import { getUsers, createUser, updateUser, deleteUser } from '$lib/utils/api';
  import { onMount } from 'svelte';
  import type { User, CreateUserDto } from '$lib/types/api';
	import { Search } from 'lucide-svelte';
  
  let users: User[] = [];
  let loading = true;
  let error = '';
  let searchQuery = '';
  let roleFilter = '';
  let showCreateForm = false;
  let showEditForm = false;
  let currentUser: User | null = null;
  
  // Form data
  let formData: CreateUserDto = {
    email: '',
    name: '',
    password: '',
    roles: []
  };
  let confirmPassword = '';
  
  const roles = ['admin', 'verifier', 'issuer'];
  
  onMount(async () => {
    await loadUsers();
  });
  
  async function loadUsers() {
    loading = true;
    error = '';
    
    try {
      const response = await getUsers({
        search: searchQuery || undefined,
        role: roleFilter || undefined
      });
      users = response.users;
      console.log(users);
    } catch (err: any) {
      error = err.message || 'Failed to load users';
    } finally {
      loading = false;
    }
  }
  
  function handleSearch() {
    console.log(searchQuery);
    loadUsers();
  }
  
  function clearFilters() {
    searchQuery = '';
    roleFilter = '';
    loadUsers();
  }
  
  function openCreateForm() {
    showCreateForm = true;
    showEditForm = false;
    formData = { email: '', name: '', password: '', roles: [] };
    confirmPassword = '';
  }
  
  function openEditForm(user: User) {
    showEditForm = true;
    showCreateForm = false;
    currentUser = user;
    formData = {
      email: user.email,
      name: user.name,
      password: '',
      roles: [...user.roles]
    };
    confirmPassword = '';
  }
  
  function closeForms() {
    showCreateForm = false;
    showEditForm = false;
    currentUser = null;
  }
  
  async function handleCreateUser() {
    if (!formData.password) {
      error = 'Password is required';
      return;
    }
    
    if (formData.password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    
    if (formData.roles.length === 0) {
      error = 'At least one role must be selected';
      return;
    }
    
    try {
      await createUser(formData);
      await loadUsers();
      closeForms();
      error = '';
    } catch (err: any) {
      error = err.message || 'Failed to create user';
    }
  }
  
  async function handleUpdateUser() {
    if (!currentUser) return;
    
    if (formData.password && formData.password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    
    try {
      const updateData: any = {
        email: formData.email,
        name: formData.name,
        roles: formData.roles
      };
      
      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await updateUser(currentUser.id, updateData);
      await loadUsers();
      closeForms();
      error = '';
    } catch (err: any) {
      error = err.message || 'Failed to update user';
    }
  }
  
  async function handleDeleteUser(user: User) {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }
    
    try {
      await deleteUser(user.id);
      await loadUsers();
    } catch (err: any) {
      error = err.message || 'Failed to delete user';
    }
  }
  
  function toggleRole(role: string) {
    if (formData.roles.includes(role)) {
      formData.roles = formData.roles.filter(r => r !== role);
    } else {
      formData.roles = [...formData.roles, role];
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-on-surface">User Management</h2>
      <p class="text-on-surface-variant">Manage system users and their permissions</p>
    </div>
    <Button onclick={openCreateForm} variant="filled">
      <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add User
    </Button>
  </div>
  
  <!-- Filters -->
  <Card elevation={1} class="p-4">
    <div class="flex items-center flex-col gap-4 sm:flex-row">
      <div class='lg:flex-1'>
        <Input
          label="Search Users"
          placeholder="Search by name or email..."
          bind:value={searchQuery}
          oninput={handleSearch}
          trailingIcon={Search}
        />
      </div>
      <div class="sm:w-48 self-stretch">
        <label for="roleFilter" class="block text-sm font-medium text-on-surface-variant mb-1">
          Filter by Role
        </label>
        <select
          id="roleFilter"
          bind:value={roleFilter}
          on:change={handleSearch}
          class="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
        >
          <option value="">All Roles</option>
          {#each roles as role}
            <option value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
          {/each}
        </select>
      </div>
      <div class="items-end">
        <Button onclick={handleSearch} variant='filled' size='small'>
          Search
        </Button>
        <Button onclick={clearFilters} variant="text" size="small">
          Clear Filters
        </Button>
      </div>
    </div>
  </Card>
  
  <!-- Error Alert -->
  {#if error}
    <Alert variant="error" onclose={() => error = ''}>
      {error}
    </Alert>
  {/if}
  
  <!-- User Form (Create/Edit) -->
  {#if showCreateForm || showEditForm}
    <Card elevation={2} class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-on-surface">
          {showCreateForm ? 'Create New User' : 'Edit User'}
        </h3>
        <Button onclick={closeForms} variant="text" size="small">
          Cancel
        </Button>
      </div>
      
      <form on:submit|preventDefault={showCreateForm ? handleCreateUser : handleUpdateUser} class="space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Full Name"
            bind:value={formData.name}
            required
            placeholder="John Doe"
          />
          <Input
            label="Email Address"
            type="email"
            bind:value={formData.email}
            required
            placeholder="john@example.com"
          />
        </div>
        
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={showCreateForm ? 'Password' : 'New Password (leave blank to keep current)'}
            type="password"
            bind:value={formData.password}
            required={showCreateForm}
            placeholder="••••••••"
          />
          <Input
            label="Confirm Password"
            type="password"
            bind:value={confirmPassword}
            required={showCreateForm}
            placeholder="••••••••"
          />
        </div>
        
        <!-- Role Selection -->
        <fieldset class="mb-4">
          <legend id="user-roles-legend" class="block text-sm font-medium text-on-surface-variant mb-2">
            User Roles
          </legend>
          <div role="group" aria-labelledby="user-roles-legend" class="flex flex-wrap gap-2">
            {#each roles as role}
              <button
                type="button"
                on:click={() => toggleRole(role)}
                class={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  formData.roles.includes(role)
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            {/each}
          </div>
        </fieldset>
        
        <div class="flex justify-end gap-2 pt-4">
          <Button onclick={closeForms} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="filled">
            {showCreateForm ? 'Create User' : 'Update User'}
          </Button>
        </div>
      </form>
    </Card>
  {/if}
  
  <!-- Users Table -->
  <Card elevation={2} class="overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-surface-container-high">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
              User
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
              Roles
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
              Created
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase text-on-surface-variant">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant">
          {#if loading}
            <tr>
              <td colspan="4" class="px-6 py-8 text-center">
                <div class="flex items-center justify-center">
                  <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              </td>
            </tr>
          {:else if users.length === 0}
            <tr>
              <td colspan="4" class="px-6 py-8 text-center text-on-surface-variant">
                No users found
              </td>
            </tr>
          {:else}
            {#each users as user}
              <tr class="hover:bg-surface-container-high/50">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                      <span class="font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div class="font-medium text-on-surface">{user.name}</div>
                      <div class="text-sm text-on-surface-variant">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    {#each user.roles as role}
                      <Badge
                        variant={role === 'admin' ? 'primary' : 'secondary'}
                        size="small"
                      >
                        {role}
                      </Badge>
                    {/each}
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-on-surface-variant">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td class="px-6 py-4">
                  <div class="flex gap-2">
                    <Button
                      onclick={() => openEditForm(user)}
                      variant="text"
                      size="small"
                    >
                      Edit
                    </Button>
                    <Button
                      onclick={() => handleDeleteUser(user)}
                      variant="text"
                      size="small"
                      class="text-error hover:text-on-error-container"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </Card>
</div>