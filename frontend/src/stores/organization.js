import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import request from '@/api/request'

export const useOrganizationStore = defineStore('organization', () => {
  const organizations = ref([])
  const currentOrganizationId = ref(localStorage.getItem('organizationId') || '')
  const loading = ref(false)
  const currentOrganization = computed(() => organizations.value.find(item => String(item.id) === String(currentOrganizationId.value)) || null)

  function setCurrent(id) {
    currentOrganizationId.value = String(id || '')
    if (currentOrganizationId.value) localStorage.setItem('organizationId', currentOrganizationId.value)
  }

  async function load() {
    loading.value = true
    try {
      const response = await request.get('/organizations')
      organizations.value = response.organizations || []
      if (!currentOrganizationId.value && organizations.value[0]) setCurrent(organizations.value[0].id)
      if (!organizations.value.length) await ensureDefault()
      return organizations.value
    } finally { loading.value = false }
  }

  async function ensureDefault() {
    const response = await request.post('/organizations/ensure-default')
    if (response.organization) {
      organizations.value = [response.organization, ...organizations.value.filter(item => item.id !== response.organization.id)]
      setCurrent(response.organization.id)
    }
    return response.organization
  }

  function headers() {
    return currentOrganizationId.value ? { 'x-organization-id': currentOrganizationId.value } : {}
  }

  return { organizations, currentOrganizationId, currentOrganization, loading, setCurrent, load, ensureDefault, headers }
})
