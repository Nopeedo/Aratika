import { PolicyTopic } from '@/types'

export interface PolicyTopicMeta {
  label: string
  description: string
  longDescription: string
  icon: string          // Lucide icon name
  color: string         // Tailwind bg colour class
  textColor: string     // Tailwind text colour class
}

export const POLICY_TOPICS: Record<PolicyTopic, PolicyTopicMeta> = {
  housing: {
    label: 'Housing',
    description: 'Affordability, supply, and homelessness',
    longDescription:
      'New Zealand faces a housing affordability crisis. This topic covers government policies on housing supply, first home buyers, public housing, rental regulations, and homelessness.',
    icon: 'Home',
    color: 'bg-orange-100',
    textColor: 'text-orange-700',
  },
  health: {
    label: 'Health',
    description: 'Healthcare system, mental health, and Pharmac',
    longDescription:
      'Covers the public health system, hospital funding, mental health services, Pharmac drug funding decisions, GP access, and aged care.',
    icon: 'Heart',
    color: 'bg-red-100',
    textColor: 'text-red-700',
  },
  economy: {
    label: 'Economy',
    description: 'Growth, tax, cost of living, and jobs',
    longDescription:
      'Encompasses fiscal policy, tax settings, cost of living pressures, employment, business regulation, infrastructure investment, and economic growth strategies.',
    icon: 'TrendingUp',
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  environment: {
    label: 'Environment',
    description: 'Conservation, water quality, and biodiversity',
    longDescription:
      'Covers freshwater quality, native species protection, coastal and marine conservation, resource management, waste reduction, and sustainable land use.',
    icon: 'Leaf',
    color: 'bg-green-100',
    textColor: 'text-green-700',
  },
  education: {
    label: 'Education',
    description: 'Schools, tertiary, and early childhood',
    longDescription:
      'Includes early childhood education funding, school curriculum, teacher pay, NCEA, polytechnics and universities, student loans, and vocational training.',
    icon: 'GraduationCap',
    color: 'bg-purple-100',
    textColor: 'text-purple-700',
  },
  'crime-justice': {
    label: 'Crime & Justice',
    description: 'Law and order, prisons, and courts',
    longDescription:
      'Covers policing, sentencing policy, prison reform, youth justice, gang legislation, court backlogs, and victim support services.',
    icon: 'Scale',
    color: 'bg-slate-100',
    textColor: 'text-slate-700',
  },
  'foreign-policy': {
    label: 'Foreign Policy',
    description: 'International relations, trade, and defence',
    longDescription:
      'Encompasses NZ\'s relationships with Australia, the Pacific, China, the USA, and other nations — plus trade agreements, AUKUS/Five Eyes, and defence spending.',
    icon: 'Globe',
    color: 'bg-cyan-100',
    textColor: 'text-cyan-700',
  },
  'treaty-maori-affairs': {
    label: 'Treaty & Māori Affairs',
    description: 'Te Tiriti, Māori rights, and development',
    longDescription:
      'Covers the principles and application of Te Tiriti o Waitangi, co-governance, Māori health and education outcomes, Treaty settlements, and Māori economic development.',
    icon: 'Landmark',
    color: 'bg-amber-100',
    textColor: 'text-amber-700',
  },
  climate: {
    label: 'Climate',
    description: 'Emissions, renewable energy, and adaptation',
    longDescription:
      'Includes the Emissions Trading Scheme, climate targets, agricultural emissions, renewable energy transition, infrastructure adaptation, and international climate commitments.',
    icon: 'Wind',
    color: 'bg-teal-100',
    textColor: 'text-teal-700',
  },
  immigration: {
    label: 'Immigration',
    description: 'Visas, residency, and migrant rights',
    longDescription:
      'Covers skilled migrant categories, refugee quotas, family reunification, visa processing, seasonal work programmes, and the rights and welfare of migrants in NZ.',
    icon: 'Users',
    color: 'bg-indigo-100',
    textColor: 'text-indigo-700',
  },
}

export const POLICY_TOPIC_ORDER: PolicyTopic[] = [
  'economy',
  'housing',
  'health',
  'education',
  'climate',
  'environment',
  'crime-justice',
  'treaty-maori-affairs',
  'immigration',
  'foreign-policy',
]
