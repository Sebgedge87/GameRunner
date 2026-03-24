import { computed } from 'vue'
import { useCampaignStore } from '@/stores/campaign'

// Per-system feature flags — controls which mechanics are visible in the UI.
const SYSTEM_FEATURES = {
  dnd5e:   { hasStress: false, hasSanity: false },
  coc:     { hasStress: false, hasSanity: true  },
  alien:   { hasStress: true,  hasSanity: false },
  coriolis:{ hasStress: true,  hasSanity: false },
  dune:    { hasStress: false, hasSanity: false },
  achtung: { hasStress: true,  hasSanity: true  },
  custom:  { hasStress: true,  hasSanity: true  },
}

const DEFAULTS = { hasStress: true, hasSanity: true }

export function useSystemFeatures() {
  const campaign = useCampaignStore()
  const features = computed(() => {
    const sys = campaign.activeCampaign?.system
    return SYSTEM_FEATURES[sys] ?? DEFAULTS
  })
  return {
    hasStress: computed(() => features.value.hasStress),
    hasSanity: computed(() => features.value.hasSanity),
  }
}
