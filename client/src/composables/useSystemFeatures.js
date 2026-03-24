import { computed } from 'vue'
import { useCampaignStore } from '@/stores/campaign'

// Per-system feature flags — controls which mechanics are visible in the UI.
const SYSTEM_FEATURES = {
  dnd5e: {
    hasStress: false, hasSanity: false,
    usesXP: false, usesMilestone: true,
    hasDndBeyond: true, hasBuiltinSheet: false,
    maxLevel: 20,
    sheetLabel: 'D&D Beyond',
  },
  coc: {
    hasStress: false, hasSanity: true,
    usesXP: true, usesMilestone: false,
    hasDndBeyond: false, hasBuiltinSheet: true,
    maxLevel: 10,
    sheetLabel: 'Character Sheet',
    coreStats: [
      { key: 'str', label: 'STR' }, { key: 'con', label: 'CON' },
      { key: 'siz', label: 'SIZ' }, { key: 'dex', label: 'DEX' },
      { key: 'app', label: 'APP' }, { key: 'edu', label: 'EDU' },
      { key: 'int', label: 'INT' }, { key: 'pow', label: 'POW' },
      { key: 'luck', label: 'Luck' },
    ],
  },
  alien: {
    hasStress: true, hasSanity: false,
    usesXP: true, usesMilestone: false,
    hasDndBeyond: false, hasBuiltinSheet: true,
    maxLevel: 5,
    sheetLabel: 'Character Sheet',
    coreStats: [
      { key: 'strength', label: 'Strength' }, { key: 'agility', label: 'Agility' },
      { key: 'wits', label: 'Wits' }, { key: 'empathy', label: 'Empathy' },
    ],
  },
  coriolis: {
    hasStress: true, hasSanity: false,
    usesXP: true, usesMilestone: false,
    hasDndBeyond: false, hasBuiltinSheet: true,
    maxLevel: 5,
    sheetLabel: 'Character Sheet',
    coreStats: [
      { key: 'strength', label: 'Strength' }, { key: 'agility', label: 'Agility' },
      { key: 'wits', label: 'Wits' }, { key: 'empathy', label: 'Empathy' },
    ],
  },
  dune: {
    hasStress: false, hasSanity: false,
    usesXP: true, usesMilestone: false,
    hasDndBeyond: false, hasBuiltinSheet: true,
    maxLevel: 10,
    sheetLabel: 'Character Sheet',
    coreStats: [
      { key: 'bod', label: 'Body' }, { key: 'agi', label: 'Agility' },
      { key: 'mnd', label: 'Mind' }, { key: 'soc', label: 'Social' },
      { key: 'spi', label: 'Spirit' },
    ],
  },
  achtung: {
    hasStress: true, hasSanity: true,
    usesXP: true, usesMilestone: false,
    hasDndBeyond: false, hasBuiltinSheet: true,
    maxLevel: 10,
    sheetLabel: 'Character Sheet',
    coreStats: [
      { key: 'str', label: 'STR' }, { key: 'con', label: 'CON' },
      { key: 'siz', label: 'SIZ' }, { key: 'dex', label: 'DEX' },
      { key: 'int', label: 'INT' }, { key: 'pow', label: 'POW' },
    ],
  },
  custom: {
    hasStress: true, hasSanity: true,
    usesXP: true, usesMilestone: false,
    hasDndBeyond: false, hasBuiltinSheet: true,
    maxLevel: 20,
    sheetLabel: 'Character Sheet',
    coreStats: [
      { key: 'str', label: 'STR' }, { key: 'dex', label: 'DEX' },
      { key: 'con', label: 'CON' }, { key: 'int', label: 'INT' },
      { key: 'wis', label: 'WIS' }, { key: 'cha', label: 'CHA' },
    ],
  },
}

const DEFAULTS = {
  hasStress: true, hasSanity: true,
  usesXP: true, usesMilestone: false,
  hasDndBeyond: false, hasBuiltinSheet: true,
  maxLevel: 20, sheetLabel: 'Character Sheet',
  coreStats: [
    { key: 'str', label: 'STR' }, { key: 'dex', label: 'DEX' },
    { key: 'con', label: 'CON' }, { key: 'int', label: 'INT' },
    { key: 'wis', label: 'WIS' }, { key: 'cha', label: 'CHA' },
  ],
}

export function useSystemFeatures() {
  const campaign = useCampaignStore()
  const features = computed(() => {
    const sys = campaign.activeCampaign?.system
    return SYSTEM_FEATURES[sys] ?? DEFAULTS
  })
  return {
    hasStress:       computed(() => features.value.hasStress),
    hasSanity:       computed(() => features.value.hasSanity),
    usesXP:          computed(() => features.value.usesXP),
    usesMilestone:   computed(() => features.value.usesMilestone),
    hasDndBeyond:    computed(() => features.value.hasDndBeyond),
    hasBuiltinSheet: computed(() => features.value.hasBuiltinSheet),
    maxLevel:        computed(() => features.value.maxLevel),
    sheetLabel:      computed(() => features.value.sheetLabel),
    coreStats:       computed(() => features.value.coreStats ?? DEFAULTS.coreStats),
  }
}
