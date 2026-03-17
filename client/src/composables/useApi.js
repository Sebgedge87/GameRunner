import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'

export function useApi() {
  const auth = useAuthStore()
  const campaign = useCampaignStore()

  function apiFetch(path, opts = {}) {
    const headers = {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    }
    if (campaign.activeCampaign?.id) headers['X-Campaign-Id'] = campaign.activeCampaign.id
    return fetch(path, { ...opts, headers })
  }

  return { apiFetch }
}
