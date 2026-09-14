export interface Product {
  slug: string
  category: string
  categoryColor: string
  name: string
  model: string
  summary: string
  imageTone: string
  tag?: string
  highlights: string[]
  specifications: Array<{ label: string; value: string }>
}

export interface Solution {
  slug: string
  title: string
  icon: string
  summary: string
  scenarios: string[]
  equipment: string[]
  benefits: string[]
}

export const products: Product[] = [
  {
    slug: 'hv-power-cable-yjv-8-7-15kv',
    category: 'Power Cable',
    categoryColor: '#7c3aed',
    name: 'HV Power Cable HSE-185',
    model: 'HSE-185',
    summary: 'High-voltage XLPE insulated power cable for substations and industrial distribution.',
    imageTone: 'cable',
    tag: 'Best Seller',
    highlights: [
      'ISO9001 & IEC certified production',
      'Custom conductor and sheath options',
      'OEM/ODM customization available',
      'Free spare parts and field service',
    ],
    specifications: [
      { label: 'Rated Voltage', value: '8.7/15kV' },
      { label: 'Conductor', value: 'Copper or aluminum core' },
      { label: 'Insulation', value: 'XLPE' },
      { label: 'Operating Temp', value: '-40°C - +90°C' },
      { label: 'Certifications', value: 'ISO9001, IEC, CE' },
    ],
  },
  {
    slug: 'grid-tie-solar-inverter-gl-100kw',
    category: 'Solar Inverter',
    categoryColor: '#f59e0b',
    name: 'Grid-Tie Solar Inverter GL-100kW',
    model: 'GL-100KW',
    summary: 'Three-phase 100kW on-grid solar inverter with MPPT, suitable for commercial solar.',
    imageTone: 'solar',
    tag: 'Hot',
    highlights: [
      'High-efficiency MPPT conversion',
      'IP65 outdoor-ready enclosure',
      'Remote monitoring and diagnostics',
      'Grid-compliant protection features',
    ],
    specifications: [
      { label: 'Rated Power', value: '100kW' },
      { label: 'Input Voltage', value: 'Customizable DC range' },
      { label: 'Protection Rating', value: 'IP65' },
      { label: 'Frequency', value: '50/60 Hz' },
      { label: 'Certifications', value: 'CE, IEC, RoHS' },
    ],
  },
  {
    slug: 'diesel-generator-set-dg-500kva',
    category: 'Generator',
    categoryColor: '#111827',
    name: 'Diesel Generator Set DG-500kVA',
    model: 'DG-500KVA',
    summary: '500kVA standby diesel generator with Perkins engine, automatic ATS and remote monitoring.',
    imageTone: 'generator',
    highlights: [
      'Standby and prime power modes',
      'Automatic transfer switch support',
      'Low-noise canopy option',
      'Remote operation and alerts',
    ],
    specifications: [
      { label: 'Power Output', value: '500kVA' },
      { label: 'Engine', value: 'Perkins compatible' },
      { label: 'Control', value: 'ATS and remote monitoring' },
      { label: 'Cooling', value: 'Water-cooled' },
      { label: 'Certifications', value: 'ISO, CE' },
    ],
  },
  {
    slug: 'smart-energy-meter-em-3ph',
    category: 'Smart Meter',
    categoryColor: '#06b6d4',
    name: 'Smart Energy Meter EM-3Ph',
    model: 'EM-3Ph',
    summary: 'Three-phase smart energy meter with WiFi, Modbus RTU and cloud monitoring platform.',
    imageTone: 'meter',
    highlights: [
      'WiFi and Modbus RTU support',
      'Cloud monitoring dashboard',
      'DIN rail installation',
      'Accurate three-phase metering',
    ],
    specifications: [
      { label: 'Phase', value: 'Three-phase' },
      { label: 'Communication', value: 'WiFi, Modbus RTU' },
      { label: 'Mounting', value: 'DIN rail' },
      { label: 'Accuracy', value: 'Class 1.0' },
      { label: 'Certifications', value: 'CE, RoHS' },
    ],
  },
  {
    slug: 'oil-immersed-transformer-s13-2000kva',
    category: 'Transformer',
    categoryColor: '#ef4444',
    name: 'Oil-Immersed Transformer S13-2000kVA',
    model: 'S13-2000kVA',
    summary: 'High-efficiency 2000kVA oil-immersed distribution transformer with low loss.',
    imageTone: 'transformer',
    highlights: [
      'Low-loss S13 series design',
      'Custom voltage ratio support',
      'Outdoor distribution ready',
      'Routine test report included',
    ],
    specifications: [
      { label: 'Capacity', value: '2000kVA' },
      { label: 'Cooling', value: 'Oil-immersed natural cooling' },
      { label: 'Voltage', value: 'Customizable' },
      { label: 'Loss Grade', value: 'S13 low-loss' },
      { label: 'Certifications', value: 'IEC, ISO9001' },
    ],
  },
  {
    slug: 'mv-switchgear-kyn28-12',
    category: 'Switchgear',
    categoryColor: '#16a34a',
    name: 'MV Switchgear CTL-28',
    model: 'CTL-28',
    summary: '12kV indoor metal-clad switchgear with vacuum circuit breaker and arc-proof design.',
    imageTone: 'switchgear',
    tag: 'Popular',
    highlights: [
      '12kV metal-clad design',
      'Vacuum circuit breaker',
      'Arc-proof compartment structure',
      'Custom panel configuration',
    ],
    specifications: [
      { label: 'Rated Voltage', value: '12kV' },
      { label: 'Breaker', value: 'Vacuum circuit breaker' },
      { label: 'Structure', value: 'Metal-clad indoor cabinet' },
      { label: 'Protection', value: 'Arc-proof design' },
      { label: 'Certifications', value: 'IEC, CE' },
    ],
  },
]

export const categories = [
  'All Categories',
  'Power Cable',
  'Solar Inverter',
  'Generator',
  'Smart Meter',
  'Transformer',
  'Switchgear',
]

export const solutions: Solution[] = [
  {
    slug: 'grid-infrastructure',
    title: 'Grid Infrastructure',
    icon: 'tower',
    summary: 'High-voltage cable and transformer solutions for national grid expansion projects.',
    scenarios: ['Substation expansion', 'Urban power distribution', 'Industrial parks'],
    equipment: ['HV power cables', 'Oil-immersed transformers', 'MV switchgear'],
    benefits: ['Stable grid capacity', 'Lower line loss', 'Certified equipment supply'],
  },
  {
    slug: 'solar-farm',
    title: 'Solar Farm Solutions',
    icon: 'panel',
    summary: 'Complete solar inverter and smart meter integration for commercial solar power plants.',
    scenarios: ['Utility solar farms', 'Commercial rooftops', 'Hybrid energy projects'],
    equipment: ['Grid-tie inverters', 'Smart meters', 'Switchgear panels'],
    benefits: ['Higher generation efficiency', 'Remote monitoring', 'Grid-ready compliance'],
  },
  {
    slug: 'industrial-backup',
    title: 'Industrial Backup Power',
    icon: 'factory',
    summary: 'Diesel generator and switchgear solutions for factories, data centers and critical sites.',
    scenarios: ['Factories', 'Data centers', 'Critical infrastructure'],
    equipment: ['Diesel generators', 'ATS panels', 'MV/LV switchgear'],
    benefits: ['Fast power recovery', 'Reliable standby capacity', 'Lower downtime risk'],
  },
]

export const qualitySteps = [
  'Incoming Inspection',
  'In-Process QC',
  'Final Testing',
  'Outgoing QA',
]

