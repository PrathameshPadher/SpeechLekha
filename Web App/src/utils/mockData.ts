import { KnowledgeDocument, VoiceSession, GraphNode, GraphLink, UserSettings } from '../types';

export const INITIAL_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: '01-photosynthesis',
    filename: '01-photosynthesis.md',
    title: 'Photosynthesis',
    folder: 'Biology',
    updatedAt: 'Updated just now',
    linksCount: 12,
    linkedConcepts: ['Chlorophyll', 'Calvin Cycle', 'C3 Plants', 'C4 Plants', 'ATP Synthase', 'Light Reaction', 'Photorespiration'],
    tags: ['bioenergetics', 'plants', 'chloroplast', 'botany'],
    preview: 'Photosynthesis converts light energy into chemical energy. It happens in two stages: the light-dependent reactions in thylakoids and the Calvin cycle in the stroma...',
    content: `# Photosynthesis

Photosynthesis is the foundational biological process by which autotrophic organisms convert solar photons into chemical energy stored in carbohydrates ($6CO_2 + 6H_2O \\xrightarrow{light} C_6H_{12}O_6 + 6O_2$).

## Key Concepts
• Converts incident solar flux into biochemical bonds within ATP and NADPH
• Uses [[Chlorophyll]] pigments localized in thylakoid membranes to harvest photons
• Operates via coupled bi-phasic mechanisms: **Light-dependent reactions** and the enzymatic **Calvin cycle**
• Serves as the primary oxygenic driver for terrestrial and oceanic biosystems

## Biophysical Stages

### 1. Light-Dependent Reactions
Takes place across the thylakoid membrane. Photon excitation at Photosystem II (P680) initiates photolysis of water ($2H_2O \\rightarrow O_2 + 4H^+ + 4e^-$). The high-energy electrons transfer along the cytochrome $b_6f$ complex, driving a proton gradient into the lumen that powers [[ATP Synthase]]. Photons absorbed at Photosystem I (P700) subsequently reduce $NADP^+$ to $NADPH$.

### 2. Light-Independent Reactions (The [[Calvin Cycle]])
Occurs in the chloroplast stroma. Catalyzed by the enzyme [[Rubisco]], inorganic $CO_2$ is fixed onto ribulose 1,5-bisphosphate (RuBP), proceeding through carboxylation, reduction, and RuBP regeneration to synthesize glyceraldehyde 3-phosphate (G3P).

## C3 vs C4 Plants Comparison

| Metabolic Feature | C3 Plants | C4 Plants |
| :--- | :--- | :--- |
| Primary $CO_2$ Fixation Enzyme | [[Rubisco]] (Dual Carboxylase/Oxygenase) | [[PEP Carboxylase]] (High affinity) |
| Initial Fixation Product | 3-PGA (3-carbon molecule) | Oxaloacetate (4-carbon dicarboxylic acid) |
| Cellular Anatomy | Undifferentiated Mesophyll | Kranz Anatomy (Kranz bundle-sheath spatial separation) |
| Optimal Climate | Temperate, moderate humidity ($15^{\\circ}-25^{\\circ}\\text{C}$) | Arid, tropical, high irradiance ($30^{\\circ}-45^{\\circ}\\text{C}$) |
| Energy Loss to [[Photorespiration]] | Up to 25–40% under heat/drought | Minimal (< 1–2%) due to concentrated bundle $CO_2$ |
| Water-Use Efficiency (WUE) | Moderate (~400–500 g $H_2O$ / g dry matter) | Exceptional (~250–300 g $H_2O$ / g dry matter) |
| Model Organisms | Wheat, Rice, Barley, Spinach, Soybeans | Maize (*Zea mays*), Sugarcane, Sorghum, Millet |

## Connected Knowledge

- Precursor pathways: [[Light Reaction]], [[Thylakoid Membrane]]
- Coupled metabolic counter-pathways: [[Cellular Respiration]], [[Photorespiration]]
- Enzymatic machinery: [[Rubisco]], [[ATP Synthase]], [[Chlorophyll]]`
  },
  {
    id: '00-index',
    filename: '00-index.md',
    title: 'Knowledge Vault Index',
    folder: 'Biology',
    updatedAt: '10 mins ago',
    linksCount: 18,
    linkedConcepts: ['Photosynthesis', 'Cellular Biology', 'Bioenergetics', 'Metabolic Pathways'],
    tags: ['index', 'vault', 'meta'],
    preview: 'Master knowledge map for the Biological Sciences vault. Aggregates all live voice notes, extracted entity graphs, and metabolic pathway nodes...',
    content: `# Knowledge Vault Index — Biological Sciences

Comprehensive knowledge vault generated autonomously from live spoken lectures, research sessions, and voice synthesis.

## Core Disciplines

### 🌿 Botany & Plant Physiology
- [[01-photosynthesis]] — Photochemistry, Calvin cycle, and carbon assimilation
- [[02-c3-vs-c4]] — Evolutionary divergence, Kranz anatomy, and photorespiration bypasses
- [[key-terms]] — Taxonomic and biochemical glossary

### 🔬 Cellular & Molecular Bioenergetics
- [[Thylakoid Membrane]] — Proton motive force and electron transfer complexes
- [[Calvin Cycle]] — Dark reaction stoichiometry and carbohydrate synthesis
- [[Cellular Respiration]] — Glycolysis, Krebs cycle, and oxidative phosphorylation

### 📊 Schematics & Renderings
- [[diagrams]] — Z-scheme, electron transport chain topology, and Kranz bundle cross-sections`
  },
  {
    id: '02-c3-vs-c4',
    filename: '02-c3-vs-c4.md',
    title: 'C3 vs C4 Photosynthetic Pathways',
    folder: 'Biology',
    updatedAt: '1 hour ago',
    linksCount: 8,
    linkedConcepts: ['Photosynthesis', 'Rubisco', 'Photorespiration', 'Kranz Anatomy'],
    tags: ['adaptation', 'evolution', 'c4-pathway'],
    preview: 'Detailed comparative analysis of carbon fixation mechanisms in angiosperms with focus on RuBisCO oxygenation kinetics and Kranz spatial compartmentalization...',
    content: `# C3 vs C4 Photosynthetic Pathways

An evolutionary adaptation to high solar radiation and low atmospheric carbon concentrations.

## Evolutionary Drivers
During the Oligocene epoch, declining atmospheric $CO_2$ coupled with heightened temperatures accelerated photorespiration in standard C3 flora. C4 lineages independently evolved over 60 times across various families (e.g., Poaceae, Chenopodiaceae) to conquer RuBisCO's catalytic promiscuity with $O_2$.

## The Kranz Anatomy Mechanism
1. **Outer Mesophyll Cells:** Atmospheric $CO_2$ is hydrated to $HCO_3^-$ and fixed by **Phosphoenolpyruvate (PEP) carboxylase**, which exhibits zero oxygenase affinity.
2. **Malate Transport:** The resulting 4-carbon organic acid (malate/aspartate) diffuses through plasmodesmata into bundle-sheath cells.
3. **Internal Decarboxylation:** Malate is decarboxylated adjacent to [[Rubisco]], creating an artificial $CO_2$ concentration 10× higher than ambient levels, suppressing [[Photorespiration]].`
  },
  {
    id: 'key-terms',
    filename: 'key-terms.md',
    title: 'Key Terms & Glossary',
    folder: 'Biology',
    updatedAt: 'Yesterday',
    linksCount: 15,
    linkedConcepts: ['Chlorophyll', 'Rubisco', 'ATP Synthase', 'Calvin Cycle'],
    tags: ['glossary', 'terms', 'reference'],
    preview: 'Definitive terminology and biochemical definitions extracted across voice recording sessions in Bioenergetics...',
    content: `# Key Terms & Glossary

- **[[Chlorophyll]]**: Magnesium-porphyrin pigment embedded in thylakoid light-harvesting complexes absorbing primarily in blue (430 nm) and red (660 nm) spectra.
- **[[Rubisco]]**: Ribulose-1,5-bisphosphate carboxylase-oxygenase, the planet's most abundant protein, responsible for carbon fixation in the [[Calvin Cycle]].
- **[[ATP Synthase]]**: Multi-subunit rotary nanomachine utilizing trans-thylakoid electrochemical gradients ($pH_{in} \\approx 4.5$) to phosphorylate ADP into ATP.
- **[[Photorespiration]]**: Energetically wasteful salvage pathway triggered when Rubisco binds $O_2$ instead of $CO_2$, generating 2-phosphoglycolate.`
  },
  {
    id: 'diagrams',
    filename: 'diagrams.md',
    title: 'Diagrams & Pathways',
    folder: 'Biology',
    updatedAt: '2 days ago',
    linksCount: 6,
    linkedConcepts: ['Light Reaction', 'Thylakoid Membrane', 'Photosynthesis'],
    tags: ['diagrams', 'visual', 'schematic'],
    preview: 'Rendered diagrams depicting the Z-scheme electron flux, chloroplast compartmentalization, and dual-cell Kranz anatomy...',
    content: `# Diagrams & Pathways

\`\`\`
[ Photon (680nm) ] ➔ [ PS II (P680) ] ➔ [ Plastoquinone (PQ) ]
                                            │
                                            ▼
[ ATP Synthase ] ◀── [ H+ Gradient ] ◀── [ Cytochrome b6f ]
                                            │
                                            ▼
[ Photon (700nm) ] ➔ [ PS I (P700) ]  ➔ [ Plastocyanin (PC) ]
                            │
                            ▼
                     [ Ferredoxin ] ➔ [ FNR ] ➔ [ NADPH ]
\`\`\`

*Figure 1.1: Linear Electron Flow (Z-Scheme) across Thylakoid Membrane.*`
  },
  {
    id: 'neural-asr-architecture',
    filename: 'neural-asr-architecture.md',
    title: 'Neural ASR & Knowledge Extraction',
    folder: 'Research',
    updatedAt: '3 days ago',
    linksCount: 9,
    linkedConcepts: ['Whisper ASR', 'Entity Extraction', 'Ontology'],
    tags: ['ai', 'speech', 'transformers'],
    preview: 'SpeechLekha voice pipeline architecture notes: streaming chunked audio through Whisper ASR encoder and neural entity extraction...',
    content: `# Neural ASR & Real-Time Knowledge Extraction

Notes on the end-to-end local streaming voice-to-vault pipeline.

## Architectural Pipeline
1. **Audio Capture**: Browser Web Audio API at 16kHz mono sampling rate with client-side VAD (Voice Activity Detection).
2. **Acoustic Transcription**: Quantized Whisper Large-v3 with beam search decoding and confidence scoring.
3. **Structured Entity Extraction**: Dynamic JSON token streaming classifying terminology into concepts, markdown hierarchies, and cross-references.`
  }
];

export const FOLDER_TREE = [
  {
    name: 'Biology',
    isOpen: true,
    files: ['00-index.md', '01-photosynthesis.md', '02-c3-vs-c4.md', 'key-terms.md', 'diagrams.md'],
    subfolders: [
      { name: 'Plant Biology', files: ['01-photosynthesis.md', '02-c3-vs-c4.md'] },
      { name: 'Cellular Biology', files: ['key-terms.md', 'diagrams.md'] }
    ]
  },
  {
    name: 'Physics',
    isOpen: false,
    files: ['quantum-electrodynamics.md', 'thermodynamics-laws.md'],
    subfolders: []
  },
  {
    name: 'Chemistry',
    isOpen: false,
    files: ['organic-synthesis.md', 'reaction-kinetics.md'],
    subfolders: []
  },
  {
    name: 'Research',
    isOpen: true,
    files: ['neural-asr-architecture.md', 'knowledge-graphs.md'],
    subfolders: []
  },
  {
    name: 'Personal Notes',
    isOpen: false,
    files: ['weekly-sync-notes.md', 'reading-list-q4.md'],
    subfolders: []
  }
];

export const DEMO_SESSION: VoiceSession = {
  id: 'demo',
  title: 'Photosynthesis Lecture & Comparison',
  folder: 'Biology',
  date: 'Today · 10:24 AM',
  duration: '00:42',
  durationSeconds: 42,
  confidence: 99.4,
  transcript: `Photosynthesis converts light energy into chemical energy. It happens in two stages, the light-dependent reactions and the Calvin cycle. Chlorophyll absorbs red and blue light. Compare C3 and C4 plants and explain why C4 plants are more efficient in hot environments. C4 plants use PEP carboxylase and Kranz anatomy to eliminate photorespiration.`,
  keyConcepts: [
    {
      title: 'Light & Chemical Energy Conversion',
      description: 'Excitation of chlorophyll pigments in thylakoid membranes generating ATP & NADPH via photolysis.',
      category: 'Bioenergetics',
      confidence: 99.8
    },
    {
      title: 'Biphasic Dual Mechanism',
      description: 'Coupling of thylakoid electron transport chain with stroma-localized dark carbon fixation (Calvin Cycle).',
      category: 'Biochemical Pathway',
      confidence: 99.2
    },
    {
      title: 'C3 vs C4 Photorespiratory Bypass',
      description: 'Spatial separation of carbon capture via PEP carboxylase in mesophyll and Kranz bundle-sheath Rubisco.',
      category: 'Evolutionary Adaptation',
      confidence: 98.9
    }
  ],
  connections: [
    { source: 'Photosynthesis', target: 'Chlorophyll', relation: 'absorbs light via' },
    { source: 'Photosynthesis', target: 'Calvin Cycle', relation: 'drives dark stage in' },
    { source: 'C3 Plants', target: 'Photorespiration', relation: 'experiences energy loss in' },
    { source: 'C4 Plants', target: 'Kranz Anatomy', relation: 'compartmentalized within' }
  ],
  generatedMarkdown: `# Photosynthesis

## Key Concepts
• Converts light energy into chemical energy
• Uses chlorophyll to absorb light
• Light-dependent reactions + Calvin cycle

## C3 vs C4 Plants

| Feature | C3 | C4 |
| :--- | :--- | :--- |
| First product | 3-carbon | 4-carbon |
| Environment | Moderate | Hot / dry |
| Efficiency | Lower | Higher |

[[Chlorophyll]]　[[Calvin Cycle]]　[[C3 Plants]]`
};

export const GRAPH_NODES: GraphNode[] = [
  {
    id: 'photosynthesis',
    label: 'Photosynthesis',
    group: 'core',
    val: 28,
    docId: '01-photosynthesis',
    description: 'Central bioenergetic pathway converting solar photon flux into chemical potential energy.',
    connectionsCount: 8,
    mentionsCount: 24,
    relatedConcepts: ['Chlorophyll', 'Calvin Cycle', 'C3 Plants', 'C4 Plants', 'Light Reaction', 'ATP Synthase']
  },
  {
    id: 'chlorophyll',
    label: 'Chlorophyll',
    group: 'pigment',
    val: 18,
    docId: 'key-terms',
    description: 'Porphyrin pigment complex centered with magnesium, tuned to absorb red (660nm) and blue (430nm) light.',
    connectionsCount: 5,
    mentionsCount: 16,
    relatedConcepts: ['Photosynthesis', 'Light Reaction', 'Thylakoid Membrane']
  },
  {
    id: 'calvin-cycle',
    label: 'Calvin Cycle',
    group: 'pathway',
    val: 22,
    docId: '01-photosynthesis',
    description: 'Stromatic enzymatic cycle fixing inorganic CO2 into phosphoglycerate through Rubisco catalysis.',
    connectionsCount: 6,
    mentionsCount: 19,
    relatedConcepts: ['Photosynthesis', 'Rubisco', 'C3 Plants', 'C4 Plants']
  },
  {
    id: 'c3-plants',
    label: 'C3 Plants',
    group: 'species',
    val: 17,
    docId: '02-c3-vs-c4',
    description: 'Standard temperate flora utilizing direct RuBP carboxylation, vulnerable to photorespiratory losses.',
    connectionsCount: 5,
    mentionsCount: 12,
    relatedConcepts: ['Photosynthesis', 'Calvin Cycle', 'Photorespiration', 'Rubisco']
  },
  {
    id: 'c4-plants',
    label: 'C4 Plants',
    group: 'species',
    val: 19,
    docId: '02-c3-vs-c4',
    description: 'Specialized tropical angiosperms featuring PEP carboxylase carbon pre-fixation and Kranz bundle sheath.',
    connectionsCount: 6,
    mentionsCount: 15,
    relatedConcepts: ['Photosynthesis', 'Kranz Anatomy', 'Photorespiration', 'Calvin Cycle']
  },
  {
    id: 'light-reaction',
    label: 'Light Reaction',
    group: 'pathway',
    val: 20,
    docId: 'diagrams',
    description: 'Z-scheme photolysis and non-cyclic electron flow across Photosystems II and I generating NADPH and ATP.',
    connectionsCount: 5,
    mentionsCount: 14,
    relatedConcepts: ['Photosynthesis', 'Thylakoid Membrane', 'ATP Synthase', 'Chlorophyll']
  },
  {
    id: 'photorespiration',
    label: 'Photorespiration',
    group: 'metabolism',
    val: 16,
    docId: '02-c3-vs-c4',
    description: 'Oxygenase catalytic loop of Rubisco yielding toxic phosphoglycolate requiring high metabolic recycling energy.',
    connectionsCount: 4,
    mentionsCount: 9,
    relatedConcepts: ['Rubisco', 'C3 Plants', 'C4 Plants']
  },
  {
    id: 'atp-synthase',
    label: 'ATP Synthase',
    group: 'enzyme',
    val: 16,
    docId: 'key-terms',
    description: 'Rotary membrane engine exploiting trans-thylakoid chemiosmotic electrochemical gradient to phosphorylate ADP.',
    connectionsCount: 4,
    mentionsCount: 11,
    relatedConcepts: ['Light Reaction', 'Photosynthesis', 'Thylakoid Membrane']
  },
  {
    id: 'rubisco',
    label: 'Rubisco',
    group: 'enzyme',
    val: 20,
    docId: 'key-terms',
    description: 'Ribulose-1,5-bisphosphate carboxylase/oxygenase, rate-limiting enzyme of the global biosphere.',
    connectionsCount: 6,
    mentionsCount: 22,
    relatedConcepts: ['Calvin Cycle', 'C3 Plants', 'C4 Plants', 'Photorespiration']
  },
  {
    id: 'thylakoid-membrane',
    label: 'Thylakoid Membrane',
    group: 'structure',
    val: 16,
    docId: 'diagrams',
    description: 'Internal folded lipid bilayer harboring chlorophyll antenna complexes and electron transport carriers.',
    connectionsCount: 4,
    mentionsCount: 10,
    relatedConcepts: ['Light Reaction', 'Chlorophyll', 'ATP Synthase']
  },
  {
    id: 'kranz-anatomy',
    label: 'Kranz Anatomy',
    group: 'structure',
    val: 15,
    docId: '02-c3-vs-c4',
    description: 'Distinctive radial wreath-like arrangement of bundle sheath cells in C4 leaves insulating Rubisco.',
    connectionsCount: 3,
    mentionsCount: 8,
    relatedConcepts: ['C4 Plants', 'Photorespiration']
  },
  {
    id: 'cellular-respiration',
    label: 'Cellular Respiration',
    group: 'core',
    val: 18,
    docId: '00-index',
    description: 'Mitochondrial catabolic oxidation of glucose yielding ATP, reciprocal pathway to oxygenic photosynthesis.',
    connectionsCount: 4,
    mentionsCount: 13,
    relatedConcepts: ['Photosynthesis', 'ATP Synthase', 'Calvin Cycle']
  }
];

export const GRAPH_LINKS: GraphLink[] = [
  { source: 'photosynthesis', target: 'chlorophyll', label: 'harvests with' },
  { source: 'photosynthesis', target: 'calvin-cycle', label: 'contains' },
  { source: 'photosynthesis', target: 'light-reaction', label: 'contains' },
  { source: 'photosynthesis', target: 'c3-plants', label: 'manifests in' },
  { source: 'photosynthesis', target: 'c4-plants', label: 'manifests in' },
  { source: 'photosynthesis', target: 'cellular-respiration', label: 'reciprocal of' },
  { source: 'light-reaction', target: 'thylakoid-membrane', label: 'occurs at' },
  { source: 'light-reaction', target: 'atp-synthase', label: 'energizes' },
  { source: 'light-reaction', target: 'chlorophyll', label: 'excites' },
  { source: 'calvin-cycle', target: 'rubisco', label: 'catalyzed by' },
  { source: 'calvin-cycle', target: 'c3-plants', label: 'primary path in' },
  { source: 'calvin-cycle', target: 'c4-plants', label: 'sheath stage in' },
  { source: 'c3-plants', target: 'photorespiration', label: 'suffers from' },
  { source: 'c4-plants', target: 'kranz-anatomy', label: 'structures via' },
  { source: 'c4-plants', target: 'photorespiration', label: 'suppresses' },
  { source: 'rubisco', target: 'photorespiration', label: 'binds oxygen in' },
  { source: 'atp-synthase', target: 'cellular-respiration', label: 'shared engine in' }
];

export const DEFAULT_SETTINGS: UserSettings = {
  general: {
    appearance: 'cinematic',
    language: 'English (US)',
    fontSize: 'standard',
    keyboardShortcuts: true
  },
  voice: {
    microphone: 'Default - Internal High Definition Microphone',
    speechModel: 'Whisper Large-v3 (Local Quantized)',
    noiseSuppression: true,
    autoDetectLanguage: true,
    confidenceThreshold: 95
  },
  ai: {
    proactiveStructuring: true,
    autoWikilinks: true,
    autoDiagrams: true,
    autoOrganize: true,
    summaryDetail: 'balanced'
  },
  knowledge: {
    defaultVault: '~/SpeechLekha/Vault',
    markdownFormat: 'obsidian',
    autoSaveInterval: 5,
    bidirectionalLinks: true
  },
  privacy: {
    localProcessing: true,
    selfHostedMode: true,
    telemetry: false,
    dataRetentionDays: 0
  }
};
