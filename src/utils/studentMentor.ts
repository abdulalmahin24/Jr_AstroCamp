// ============================================================
// NASA Jr_AstroCamp — Student Mentor & AI Copilot Knowledge Engine
// Unified project-wide knowledge search (Idea 1) + Live Telemetry & Route Context (Idea 2)
// Grounded in NASA Space Apps, DONKI Space Weather, and BVAD Life Support
// ============================================================

import type { MissionEvent, ChoiceOption, DifficultyMode } from '../types/game.ts';
import type { DifficultyTier } from '../data/difficultyTiers.ts';
import siteGuideData from '../data/chatbotSiteGuide.json' with { type: 'json' };
import { TEACHING_FLASHCARDS } from '../data/teachingFlashcards.ts';
import { SPACE_DISCOVERY_MODULES } from '../data/spacePlaceKnowledge.ts';
import { ALL_76_NASA_MISSIONS } from '../data/allNasaMissions.ts';
import { ASTRONAUT_CHARACTERS } from '../data/astronautCharacters.ts';
import { INITIAL_ACADEMY_FACILITIES, EQUIPMENT_CATALOG } from '../data/academyEquipment.ts';
import { CURRICULUM_MODULES } from '../data/curriculumNotesAudioVideo.ts';
import { LEARNING_QUIZZES } from '../data/learningQuizzes.ts';

export interface StudentMentorContext {
  activeEvent?: MissionEvent | null;
  destination?: 'MOON' | 'MARS' | 'EARTH' | 'DEEP_SPACE';
  currentSol?: number;
  isGameOver?: boolean;
  route?: string;
  currentMissionName?: string;
  difficultyMode?: DifficultyMode | DifficultyTier;
  resources?: {
    power?: number;
    water?: number;
    oxygen?: number;
    food?: number;
    radiation?: number;
    science?: number;
    crewHealth?: number;
    crewMorale?: number;
    shielding?: number;
  };
}

export interface KnowledgeSearchResult {
  reply: string;
  citations: string[];
  matchedTopic?: string;
}

interface KnowledgeEntry {
  id: string;
  title: string;
  keywords: string[];
  searchText: string;
  buildReply: (context?: StudentMentorContext) => string;
  citations: string[];
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'what', 'why', 'how', 'where', 'when', 'who', 'which', 'can', 'could',
  'would', 'should', 'do', 'does', 'did', 'you', 'your', 'me', 'my', 'i',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'about', 'from', 'by',
  'tell', 'explain', 'give', 'show', 'please', 'help', 'know', 'and', 'or',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.-]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

// Build unified knowledge base once from all project data files + site guide JSON
let cachedIndex: KnowledgeEntry[] | null = null;

function getKnowledgeIndex(): KnowledgeEntry[] {
  if (cachedIndex) return cachedIndex;

  const entries: KnowledgeEntry[] = [];

  // 1. Site Guide & Core Technical Copilot JSON
  for (const item of siteGuideData) {
    entries.push({
      id: item.id,
      title: item.title,
      keywords: item.keywords.map((k) => k.toLowerCase()),
      searchText: `${item.title} ${item.keywords.join(' ')} ${item.reply}`.toLowerCase(),
      buildReply: () => item.reply,
      citations: item.citations,
    });
  }

  // 2. STEM Teaching Flashcards (with age/tier adaptation!)
  for (const card of TEACHING_FLASHCARDS) {
    const titleWords = card.title.toLowerCase();
    entries.push({
      id: `flashcard-${card.id}`,
      title: card.title,
      keywords: [
        titleWords,
        card.id.replace('card-', '').replace(/-/g, ' '),
        card.category.toLowerCase().replace('_', ' '),
      ],
      searchText: `${card.title} ${card.shortSummary} ${card.audioScript} ${card.equationOrFormula || ''} ${card.ageAdaptations.ENGINEER.text}`.toLowerCase(),
      buildReply: (ctx) => {
        const tier: DifficultyTier = (ctx?.difficultyMode as DifficultyTier) || 'CADET';
        const adapted = card.ageAdaptations[tier] || card.ageAdaptations.CADET;
        return (
          `${card.emoji} **${card.title}** *(${tier} Tier Briefing)*\n\n` +
          `${adapted.text}\n\n` +
          (card.equationOrFormula ? `• **Formula / Physics**: \`${card.equationOrFormula}\`\n` : '') +
          `• **Key Takeaway**: ${adapted.keyTakeaway}\n` +
          `• **Summary**: ${card.shortSummary}`
        );
      },
      citations: [card.nasaDocReference],
    });
  }

  // 3. Outer Space Discovery Modules & Sections (Earth, Moon, Mars, Deep Space)
  for (const mod of SPACE_DISCOVERY_MODULES) {
    for (const sec of mod.sections) {
      entries.push({
        id: `spaceplace-${mod.id}-${sec.heading}`,
        title: `${mod.title} — ${sec.heading}`,
        keywords: [sec.heading.toLowerCase(), mod.category.toLowerCase()],
        searchText: `${mod.title} ${sec.heading} ${sec.body} ${sec.didYouKnow}`.toLowerCase(),
        buildReply: () =>
          `🪐 **${sec.heading}** *(${mod.title})*\n\n` +
          `${sec.body}\n\n` +
          `💡 **Did You Know?** ${sec.didYouKnow}\n\n` +
          `📊 **Planetary Telemetry**: Gravity ${mod.telemetry.surfaceGravity} • Temp ${mod.telemetry.surfaceTempRange} • Day ${mod.telemetry.dayLength}`,
        citations: [sec.nasaSource],
      });
    }
    for (const tab of mod.interactiveTabs) {
      entries.push({
        id: `spacetab-${mod.id}-${tab.label}`,
        title: `${tab.label} (${mod.title})`,
        keywords: [tab.label.toLowerCase()],
        searchText: `${tab.label} ${tab.content} ${mod.title}`.toLowerCase(),
        buildReply: () =>
          `🔭 **${tab.label}** *(${mod.title})*\n\n${tab.content}\n\n` +
          `• **Atmosphere**: ${mod.telemetry.atmosphereComposition}\n` +
          `• **Gravity**: ${mod.telemetry.surfaceGravity} | **Orbit**: ${mod.telemetry.orbitalPeriod}`,
        citations: [`NASA Space Place — ${mod.title}`],
      });
    }
  }

  // 4. Astronaut Characters Roster
  for (const astro of ASTRONAUT_CHARACTERS) {
    const nameLower = astro.name.toLowerCase();
    const lastName = nameLower.split(' ').pop() || nameLower;
    entries.push({
      id: `astronaut-${astro.id}`,
      title: `${astro.name} (${astro.historicalTitle})`,
      keywords: [nameLower, lastName, astro.historicFlight.toLowerCase()],
      searchText: `${astro.name} ${astro.historicalTitle} ${astro.historicFlight} ${astro.biography} ${astro.famousQuote} ${astro.specialPerk.name}`.toLowerCase(),
      buildReply: () =>
        `${astro.avatar} **${astro.name}** — *${astro.historicalTitle}* (${astro.countryFlag})\n\n` +
        `${astro.biography}\n\n` +
        `• **Historic Flights**: ${astro.historicFlight}\n` +
        (astro.totalTimeInSpace ? `• **Time in Space**: ${astro.totalTimeInSpace} (${astro.spacewalkCount ?? 0} EVAs)\n` : '') +
        `• **In-Game Commander Perk**: **${astro.specialPerk.name}** — ${astro.specialPerk.description} (*${astro.specialPerk.statBonus}*)\n` +
        `• **Famous Quote**: *"${astro.famousQuote}"*`,
      citations: [`NASA Astronaut Biographies — ${astro.agency}`, 'Jr_AstroCamp Astronaut Academy'],
    });
  }

  // 5. Academy Facilities & 3D Equipment Catalog
  for (const fac of INITIAL_ACADEMY_FACILITIES) {
    entries.push({
      id: `facility-${fac.id}`,
      title: fac.name,
      keywords: [fac.name.toLowerCase(), fac.modelType.replace('_', ' ')],
      searchText: `${fac.name} ${fac.description} ${fac.realNasaContext} ${fac.bonus}`.toLowerCase(),
      buildReply: () =>
        `${fac.icon} **${fac.name}** *(Astronaut Academy Facility)*\n\n` +
        `${fac.description}\n\n` +
        `• **Real NASA Heritage**: ${fac.realNasaContext}\n` +
        `• **Mission Bonus**: ${fac.bonus} (Upgrade cost: ${fac.costToUpgrade.toLocaleString()} coins)`,
      citations: ['NASA Johnson Space Center Training Division', 'Jr_AstroCamp Astronaut Academy'],
    });
  }

  for (const item of EQUIPMENT_CATALOG) {
    const specsList = Object.entries(item.specs)
      .map(([k, v]) => `  - **${k}**: ${v}`)
      .join('\n');
    entries.push({
      id: `equip-${item.id}`,
      title: item.name,
      keywords: [item.name.toLowerCase(), item.id.replace('item-', '').replace(/-/g, ' ')],
      searchText: `${item.name} ${item.description} ${item.nasaFact} ${Object.values(item.specs).join(' ')}`.toLowerCase(),
      buildReply: () =>
        `${item.icon} **${item.name}** *(${item.category} • Mass: ${item.massKg} kg)*\n\n` +
        `${item.description}\n\n` +
        `**Technical Specifications:**\n${specsList}\n\n` +
        `• **NASA Flight Heritage**: ${item.nasaFact}`,
      citations: ['NASA Aerospace Hardware Catalog', 'Jr_AstroCamp 3D Equipment Locker'],
    });
  }

  // 6. Curriculum Modules (Handwritten Notebook Key Ideas & Vocabulary)
  for (const mod of CURRICULUM_MODULES) {
    for (const idea of mod.notebook.keyIdeas) {
      entries.push({
        id: `curriculum-${idea.id}`,
        title: `${idea.title} (${mod.name})`,
        keywords: [idea.title.toLowerCase(), mod.notebook.nasaMission.toLowerCase()],
        searchText: `${idea.title} ${idea.explanation} ${mod.name} ${mod.notebook.bigQuestion} ${mod.audio.recap}`.toLowerCase(),
        buildReply: () =>
          `📓 **${idea.title}** *(${mod.name})*\n\n` +
          `${idea.explanation}\n\n` +
          `• **Historical NASA Tie-In**: ${mod.notebook.nasaMission}\n` +
          `• **Quick Check**: ${idea.fillInPrompt} *(Answer: **${idea.correctAnswer}**)*\n` +
          `• **Lesson Recap**: ${mod.audio.recap}`,
        citations: [mod.notebook.nasaCitation],
      });
    }
    for (const vocab of mod.notebook.vocabulary) {
      entries.push({
        id: `vocab-${mod.id}-${vocab.term}`,
        title: `${vocab.term} (Aerospace Glossary)`,
        keywords: [vocab.term.toLowerCase()],
        searchText: `${vocab.term} ${vocab.definition} ${mod.name}`.toLowerCase(),
        buildReply: () =>
          `📘 **${vocab.term}** *(${mod.name} Glossary)*\n\n` +
          `${vocab.definition}\n\n` +
          `• **Related NASA Mission**: ${mod.notebook.nasaMission}`,
        citations: [mod.notebook.nasaCitation],
      });
    }
  }

  // 7. Learning Quizzes Q&A
  for (const quiz of Object.values(LEARNING_QUIZZES)) {
    for (const qItem of quiz.questions) {
      entries.push({
        id: `quiz-${qItem.id}`,
        title: qItem.question,
        keywords: [qItem.question.toLowerCase()],
        searchText: `${qItem.question} ${qItem.options[qItem.correctIndex]} ${qItem.explanation}`.toLowerCase(),
        buildReply: () =>
          `🧠 **Flight Readiness Question**: *${qItem.question}*\n\n` +
          `✅ **Answer**: **${qItem.options[qItem.correctIndex]}**\n\n` +
          `• **Scientific Explanation**: ${qItem.explanation}`,
        citations: [qItem.nasaRef],
      });
    }
  }

  // 8. All 76 Authentic NASA Missions
  for (const m of ALL_76_NASA_MISSIONS) {
    const nameLower = m.name.toLowerCase();
    const idLower = m.id.toLowerCase();
    entries.push({
      id: `mission-${m.id}`,
      title: `${m.name}: ${m.tagline}`,
      keywords: [
        nameLower,
        idLower,
        `mission ${m.number}`,
        m.primaryInstrument.toLowerCase(),
        m.targetLocation.toLowerCase(),
      ],
      searchText: `${m.name} ${m.tagline} ${m.nasaProgram} ${m.launchYear} ${m.targetLocation} ${m.primaryInstrument} ${m.scientificProblem.title} ${m.scientificProblem.summary} ${m.operationalGuide}`.toLowerCase(),
      buildReply: () =>
        `${m.missionPatchEmoji} **${m.name} (${m.launchYear})** — *${m.tagline}*\n\n` +
        `• **Program & Era**: ${m.nasaProgram} (${m.missionType}) • Target: **${m.targetLocation}** (${m.destinationName})\n` +
        `• **Environment**: Gravity ${m.gravityG}G | Temp ${m.surfaceTempC} | Atmosphere: ${m.atmosphere}\n` +
        `• **Primary Instrument**: ${m.primaryInstrument}\n` +
        `• **Scientific Challenge (${m.scientificProblem.title})**: ${m.scientificProblem.summary}\n` +
        `• **Operational Flight Guide**: ${m.operationalGuide}`,
      citations: [`${m.nasaCitation.title} (${m.nasaCitation.docNumber})`],
    });
  }

  cachedIndex = entries;
  return entries;
}

/**
 * Scores all project knowledge entries against the user's query and returns the best match.
 */
export function searchProjectKnowledge(
  query: string,
  context?: StudentMentorContext
): KnowledgeSearchResult | null {
  const qLower = query.trim().toLowerCase();
  const qTokens = tokenize(qLower);
  if (qTokens.length === 0 && qLower.length < 3) return null;

  const index = getKnowledgeIndex();
  let bestEntry: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of index) {
    let score = 0;

    // Exact phrase match in keywords
    for (const kw of entry.keywords) {
      if (kw.length >= 3 && qLower.includes(kw)) {
        score += 18 + Math.min(kw.length, 15);
      } else if (qLower.length >= 4 && kw.includes(qLower)) {
        score += 12;
      }
    }

    // Title match
    const titleLower = entry.title.toLowerCase();
    if (titleLower === qLower) {
      score += 40;
    } else if (qLower.length >= 4 && titleLower.includes(qLower)) {
      score += 20;
    }

    // Token matches
    let matchedTokens = 0;
    for (const tok of qTokens) {
      if (titleLower.includes(tok)) {
        score += 8;
        matchedTokens++;
      } else if (entry.keywords.some((k) => k.includes(tok))) {
        score += 6;
        matchedTokens++;
      } else if (entry.searchText.includes(tok)) {
        score += 3;
        matchedTokens++;
      }
    }

    // Bonus if majority of query tokens matched
    if (qTokens.length > 1 && matchedTokens === qTokens.length) {
      score += 12;
    }

    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  // Require a meaningful confidence score so unrelated emotional/choice prompts don't misfire
  if (!bestEntry || bestScore < 9) {
    return null;
  }

  return {
    reply: bestEntry.buildReply(context),
    citations: bestEntry.citations,
    matchedTopic: bestEntry.title,
  };
}

/**
 * Idea 2: Builds a live diagnostic summary from the player's current outpost telemetry & active page.
 */
export function buildLiveTelemetryDiagnostic(context?: StudentMentorContext): string {
  if (!context?.resources) return '';

  const r = context.resources;
  const alerts: string[] = [];

  if (r.oxygen !== undefined && r.oxygen < 45) {
    alerts.push(`🫁 **Oxygen is low (${Math.round(r.oxygen)}%)** — prioritize ECLSS OGA electrolysis or Sabatier loop repairs.`);
  }
  if (r.power !== undefined && r.power < 45) {
    alerts.push(`⚡ **Power is low (${Math.round(r.power)}%)** — conserve habitat loads or switch to Kilopower/MMRTG backup.`);
  }
  if (r.water !== undefined && r.water < 45) {
    alerts.push(`💧 **Water is low (${Math.round(r.water)}%)** — extract polar permafrost ice or boost UPA recycling.`);
  }
  if (r.food !== undefined && r.food < 40) {
    alerts.push(`🌱 **Food reserves are low (${Math.round(r.food)}%)** — check Hydroponic Greenhouse LED efficiency.`);
  }
  if (r.radiation !== undefined && r.radiation > 45) {
    alerts.push(`☢️ **Radiation exposure is elevated (${Math.round(r.radiation)} mSv)** — seal the Sintered Regolith Storm Vault!`);
  }
  if (r.crewHealth !== undefined && r.crewHealth < 55) {
    alerts.push(`🩺 **Crew Health is strained (${Math.round(r.crewHealth)}%)** — avoid risky EVAs until life support stabilizes.`);
  }

  const destLabel = context.destination === 'MARS' ? 'Mars (Jezero Crater)' : 'Moon (Shackleton Crater)';
  const solLabel = context.currentSol ? `Sol ${context.currentSol}` : 'Sol 1';
  const statsLine = [
    r.oxygen !== undefined ? `O₂: ${Math.round(r.oxygen)}%` : null,
    r.power !== undefined ? `Power: ${Math.round(r.power)}%` : null,
    r.water !== undefined ? `Water: ${Math.round(r.water)}%` : null,
    r.food !== undefined ? `Food: ${Math.round(r.food)}%` : null,
    r.radiation !== undefined ? `Rad: ${Math.round(r.radiation)}` : null,
    r.science !== undefined ? `Science: ${Math.round(r.science)} pts` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  if (alerts.length > 0) {
    return (
      `📡 **Live Telemetry Alert (${destLabel} • ${solLabel})**:\n` +
      `\`${statsLine}\`\n` +
      alerts.map((a) => `• ${a}`).join('\n')
    );
  }

  return (
    `📡 **Live Outpost Telemetry (${destLabel} • ${solLabel})**: All primary life-support systems nominal!\n` +
    `\`${statsLine}\``
  );
}

/**
 * Idea 2: Dynamic quick-inquiry prompt pills tailored to the user's active page, destination, and resource state.
 */
export function getContextualQuickPrompts(
  context?: StudentMentorContext,
  mode: 'mentor' | 'copilot' = 'mentor'
): string[] {
  const prompts: string[] = [];
  const r = context?.resources;

  // Urgent resource prompt if any resource is low
  if (r && ((r.power !== undefined && r.power < 45) || (r.oxygen !== undefined && r.oxygen < 45) || (r.water !== undefined && r.water < 45))) {
    prompts.push('📡 Diagnose my low outpost resources!');
  }

  // Active event choice helper
  if (context?.activeEvent) {
    prompts.push('Can you help me choose on this Sol?');
  }

  // Route-specific prompts
  switch (context?.route) {
    case 'simulators':
      prompts.push('🚀 What is the 7 Minutes of Terror in EDL?', '🛸 How to perform orbital docking?', '🕳️ Explain Black Hole event horizons');
      break;
    case 'learning':
      prompts.push('📚 What is in the Learning Hub & Comics?', '💧 Explain Sabatier CO2 to water math', '🔭 How does the James Webb Telescope see back in time?');
      break;
    case 'academy':
      prompts.push('🧑‍🚀 Tell me about NASA Spacesuits (xEMU & ACES)', '🏛️ What can I upgrade in the Astronaut Academy?', '👨‍🚀 Tell me about Neil Armstrong & Kalpana Chawla');
      break;
    case 'campaign':
      prompts.push('🌕 Tell me about Apollo 11 & Apollo 13', '🛰️ Tell me about Voyager 1 gravity slingshots', '🪐 Tell me about Europa Clipper & ocean worlds');
      break;
    case 'teacher':
      prompts.push('🎓 How do Teacher Hub & Co-Op Multiplayer work?', 'Where does this data come from?');
      break;
    default:
      if (mode === 'copilot') {
        prompts.push(
          '🚀 What is the 7 Minutes of Terror in EDL?',
          '💧 Explain ECLSS closed-loop water & air math',
          '🛰️ What are Quindar tones and orbital velocity?',
          '🪐 Tell me about Europa Clipper & ocean worlds',
          '⚛️ Explain Kilopower KRUSTY nuclear reactor'
        );
      } else {
        prompts.push(
          'Can you help me with this mission?',
          'Why do astronauts need power?',
          'What if I make a mistake?',
          'Where does this data come from?',
          'What about radiation?',
          context?.destination === 'MARS' ? 'How does MOXIE make oxygen on Mars?' : 'Surviving the 14-day lunar night'
        );
      }
      break;
  }

  return Array.from(new Set(prompts)).slice(0, 6);
}

/**
 * Unified response generator returning both reply text and authentic NASA citations.
 */
export function getMissionAssistantResponse(
  query: string,
  context?: StudentMentorContext
): KnowledgeSearchResult {
  const q = query.trim().toLowerCase();
  const event = context?.activeEvent;
  const sol = context?.currentSol ?? 1;
  const dest = context?.destination ?? 'MOON';

  // ── 0. LIVE TELEMETRY & DIAGNOSTIC CHECK (Idea 2) ──────────────────
  if (
    q.includes('diagnose') ||
    q.includes('how am i doing') ||
    q.includes('my resources') ||
    q.includes('check systems') ||
    q.includes('outpost status') ||
    q.includes('telemetry status') ||
    q.includes('low outpost resources')
  ) {
    const diag = buildLiveTelemetryDiagnostic(context);
    const eventNote = event
      ? `\n\n**Active Sol ${sol} Event**: *"${event.title}"* (${event.urgency} urgency). Ask **"Can you help me choose?"** for a full breakdown of your options!`
      : '';
    return {
      reply:
        (diag || `Outpost systems on Sol ${sol} (${dest}) are online and standing by.`) +
        eventNote,
      citations: ['NASA Mission Control Telemetry Console', 'NASA BVAD TP-2015-218570'],
    };
  }

  // ── 1. SCIENCE / DATA ORIGIN INQUIRIES (Required by Space Apps & Tests) ──
  if (
    q.includes('where does this data come from') ||
    q.includes('data source') ||
    q.includes('nasa data') ||
    q.includes('data come from') ||
    q.includes('is this real') ||
    q.includes('attribution')
  ) {
    if (event?.dataAttribution) {
      const { label, recordId, sourceUrl } = event.dataAttribution;
      return {
        reply:
          `Greetings, Cadet! This mission challenge is directly linked to authentic NASA heliophysics records from NASA DONKI ` +
          `(Space Weather Database of Notifications, Knowledge, Information).\n\n` +
          `• Dataset Status: ${label}\n` +
          `• NASA Record Identifier: ${recordId}\n` +
          `• Primary Scientific Source: ${sourceUrl}\n\n` +
          `Important scientific note: While this cosmic phenomenon is recorded in real NASA telemetry, remember that the gameplay effect is not itself a NASA measurement. ` +
          `Our simulation models how such events could affect outpost power and life support to help you learn real engineering trade-offs!`,
        citations: ['NASA DONKI Space Weather Database', sourceUrl],
      };
    }

    const citationTitle = event?.nasaCitation?.title || 'NASA Space Science & Bioastronautics';
    const docNumber = event?.nasaCitation?.docNumber || 'DONKI / BVAD';
    return {
      reply:
        `Great scientific inquiry, Cadet! Our mission simulations are derived from verified NASA open data portals across four platforms:\n\n` +
        `1. **NASA Open Data** (data.nasa.gov) — Apollo Passive Seismic Experiment (PSE) shallow moonquake catalogs (Nakamura 1979).\n` +
        `2. **NASA API Portal** (api.nasa.gov) — NASA DONKI space weather API for solar flares, Coronal Mass Ejections (CMEs), and proton flux alerts.\n` +
        `3. **NASA Earthdata** (earthdata.nasa.gov) — Planetary altimetry grids (MOLA) and atmospheric density models.\n` +
        `4. **NASA JPL Planetary Data System** (jpl.nasa.gov) — Mars Curiosity & Perseverance REMS/MEDA atmospheric and dust opacity telemetry.\n\n` +
        `• Reference: ${citationTitle} (${docNumber}).\n\n` +
        `Always remember: while based on authentic NASA space telemetry, each gameplay effect is not itself a NASA measurement, but an educational physical model to teach critical decision-making!`,
      citations: ['NASA Open Data Portal', `${citationTitle} (${docNumber})`],
    };
  }

  // ── 2. RADIATION AND HEALTH CAVEATS (Required by Space Apps & Tests) ──
  if (
    q.includes('what about radiation') ||
    q === 'radiation' ||
    q.includes('radiation counter') ||
    q.includes('sievert') ||
    q.includes('msv') ||
    (q.includes('radiation') && !q.includes('vault') && !q.includes('belt'))
  ) {
    return {
      reply:
        `Radiation is one of the most critical challenges for human spaceflight outside Earth's protective magnetosphere!\n\n` +
        `In deep space, astronauts face Galactic Cosmic Rays (GCRs) and Solar Particle Events (SPEs). Real NASA missions monitor space weather using NASA DONKI ` +
        `(Space Weather Database of Notifications, Knowledge, Information) and deploy regolith berms, polyethylene water walls, and underground storm shelters.\n\n` +
        `Important Cadet Notice: The radiation counter shown in this outpost trainer is an educational indicator designed to teach shielding strategies; it is not a medical measurement of clinical human health. ` +
        `If a storm warning sounds, seal the storm vault and shelter your crew until the solar particle event subsides!`,
      citations: ['NASA DONKI Space Weather Database', 'NASA Space Radiation Health Project (SRHP)'],
    };
  }

  // ── 3. ANXIETY, OVERWHELM, OR BEING STUCK (Required by Tests) ────────
  if (
    q.includes('what if i make a mistake') ||
    q.includes('mistake') ||
    q.includes('what if i fail') ||
    q.includes('make mistake')
  ) {
    return {
      reply:
        `Mistakes are an essential part of becoming a great astronaut and aerospace engineer!\n\n` +
        `At NASA, flight teams run hundreds of simulation tests before any real launch. In these simulations, engines intentionally glitch, dust storms hit, and solar panels get covered in dust. ` +
        `Every single error gives engineers valuable telemetry to improve their design.\n\n` +
        `In this mission simulator, you can never truly fail—each choice teaches you how real life-support stoichiometry and orbital mechanics work. ` +
        `If a resource runs low, just pause, adjust your plan, and try again. You've got this, Cadet!`,
      citations: ['NASA Flight Simulation Training Methodology'],
    };
  }

  if (
    q.includes('worried') ||
    q.includes('stuck') ||
    q.includes('scared') ||
    q.includes('overwhelmed') ||
    q.includes('stressed') ||
    q.includes('confused') ||
    q.includes('lost') ||
    q.includes('too hard') ||
    q.includes('give up') ||
    q.includes('fail')
  ) {
    return {
      reply:
        `Take a steady breath, Cadet. You’re not alone, and you don’t have to solve everything at once.\n\n` +
        `Every Apollo astronaut, shuttle commander, and ISS flight director has faced unexpected emergencies where systems flashed warning lights. ` +
        `In aerospace engineering, failure is simply information: each choice teaches us how to calibrate our life-support balance for the next Sol.\n\n` +
        `Let’s pause and focus on the single most urgent priority right now: is your Oxygen and Water stable? If they are above critical levels, your crew has time to think. ` +
        `Take it one step at a time—you have what it takes to command this outpost!`,
      citations: ['NASA Behavioral Health & Performance (BHP)'],
    };
  }

  // ── 4. DECISION SUPPORT & CHOICE TRADE-OFFS (Required by Tests) ──────
  if (
    q.includes('choose') ||
    q.includes('help me decide') ||
    q.includes('what should i do') ||
    q.includes('which option') ||
    q.includes('which choice') ||
    q.includes('help me choose') ||
    q.includes('recommend') ||
    q.includes('advice')
  ) {
    const liveDiag = buildLiveTelemetryDiagnostic(context);
    const diagBlock = liveDiag ? `\n\n${liveDiag}` : '';

    if (event && event.options && event.options.length > 0) {
      const optionsBreakdown = event.options
        .map((opt: ChoiceOption, index: number) => {
          const deltaStrings: string[] = [];
          if (opt.resourceDelta) {
            Object.entries(opt.resourceDelta).forEach(([res, val]) => {
              if (val !== undefined && val !== 0) {
                deltaStrings.push(`${res}: ${val > 0 ? '+' : ''}${val}`);
              }
            });
          }
          const deltaSummary = deltaStrings.length > 0 ? ` (${deltaStrings.join(', ')})` : '';
          return (
            `Option ${index + 1}: **${opt.title}**\n` +
            `• Action: ${opt.description}\n` +
            `• Trade-off: ${opt.tradeOffText}${deltaSummary}\n` +
            `• Engineering insight: ${opt.educationalInsight}`
          );
        })
        .join('\n\n');

      return {
        reply:
          `You’re not alone, Commander! Making tough decisions under pressure is what aerospace leadership is all about.\n\n` +
          `Let’s examine the situation on Sol ${sol} for "${event.title}":\n\n` +
          `${optionsBreakdown}${diagBlock}\n\n` +
          `There may not be a perfect choice in spaceflight—every option involves managing scarce resources against unknown risks. ` +
          `Look at your current resource reserves: if one vital system is dangerously low, choose the path that protects your crew’s survival first. I believe in your judgment!`,
        citations: [
          event.nasaCitation
            ? `${event.nasaCitation.title} (${event.nasaCitation.docNumber})`
            : 'NASA BVAD TP-2015-218570',
        ],
      };
    }

    return {
      reply:
        `You’re not alone, Commander! When facing decisions in the cosmos, always evaluate your three vital pillars: Oxygen, Power, and Water. ` +
        `There may not be a perfect choice in spaceflight, but prioritizing your crew's life support over short-term science gains is the hallmark of a great flight commander. ` +
        `Check your current Sol telemetry, identify your weakest resource buffer, and make the safest choice!${diagBlock}`,
      citations: ['NASA BVAD TP-2015-218570'],
    };
  }

  // ── 5. CORE CADET ONBOARDING & SURVIVAL SCENARIOS ────────────────────
  if (q.includes('why do astronauts need power') || (q.includes('why') && q.includes('power'))) {
    return {
      reply:
        `In space, electrical power is literally life!\n\n` +
        `Here is why power is so critical for astronauts on the Moon and Mars:\n` +
        `1. **Life Support (ECLSS)**: Powers air scrubbers to remove toxic CO2, water recycling distillation, and oxygen pumps.\n` +
        `2. **Thermal Control**: Space swings from boiling +120°C in sunlight down to -130°C during the lunar night. Continuous electrical heaters keep habitats and spacesuits from freezing solid.\n` +
        `3. **Communications & Telemetry**: High-gain antenna dishes need continuous electricity to transmit radio signals back to Earth.\n` +
        `4. **Science & Rovers**: Battery charging powers scientific drills, rovers, and experiments.\n\n` +
        `NASA uses high-efficiency solar arrays paired with Kilopower nuclear Stirling reactors to guarantee power day and night!`,
      citations: ['NASA Glenn Research Center / Kilopower Project', 'NASA BVAD TP-2015-218570'],
    };
  }

  if (
    q.includes('can you help me with this mission') ||
    q.includes('help me with this mission') ||
    q.includes('help with mission')
  ) {
    const liveDiag = buildLiveTelemetryDiagnostic(context);
    return {
      reply:
        `You bet! You don't have to tackle this alone—we can break it down step-by-step:\n\n` +
        `1. **Monitor the Big Three**: Always watch your Oxygen, Power, and Water gauges. As long as those are in the green, your outpost is secure.\n` +
        `2. **Review the Trade-Offs**: When an event occurs on Sol ${sol}${event ? ` (*"${event.title}"*)` : ''}, read each option carefully. Look at what resources it costs versus the science points it yields.\n` +
        `3. **Safety First**: Prioritizing your crew's life support over risky experiments is the hallmark of a great flight commander.` +
        (liveDiag ? `\n\n${liveDiag}` : '') +
        `\n\nWhat specific system or event on Sol ${sol} would you like to review together?`,
      citations: ['Jr_AstroCamp Flight Director Guide', 'NASA BVAD TP-2015-218570'],
    };
  }

  if (q.includes('moonquake') || q.includes('seismic') || q.includes('nakamura') || q.includes('resonance') || (q.includes('shake') && q.includes('moon'))) {
    return {
      reply:
        `🌕 **Moon Survival Mission 1: Shallow Moonquake & Regolith Resonance**\n\n` +
        `• **Target Site**: Mare Tranquillitatis (Apollo 11 PSE Station S11, -1,850m elevation)\n` +
        `• **NASA Source**: NASA Open Data (data.nasa.gov) & Nakamura et al. (1979) Apollo PSE catalog\n` +
        `• **The Physical Hazard**: Unlike Earth rocks that attenuate seismic waves in 1–2 minutes due to moisture, the Moon is bone dry. Lunar regolith has an exceptionally high seismic quality factor (Q > 3,500). When a tectonic moonquake strikes, the ground rings like a bronze bell for **60 to 120 minutes**!\n` +
        `• **Commander Survival Protocol**:\n` +
        `  1. Deploy hydraulic dampening outriggers to decouple habitat living quarters from high-frequency shear waves.\n` +
        `  2. Depressurize residual hypergolic propellant lines to prevent slosh resonance ruptures.\n` +
        `  3. Drive titanium micro-spike anchors into basalt bedrocks to resist sliding.\n\n` +
        `Would you like to simulate this mission in the 3D Hangar?`,
      citations: ['Nakamura et al. (1979) Apollo PSE Catalog', 'NASA Open Data (data.nasa.gov)'],
    };
  }

  if (q.includes('malapert') || q.includes('solar storm') || q.includes('cme') || q.includes('proton') || q.includes('x7.2') || (q.includes('solar') && q.includes('flare'))) {
    return {
      reply:
        `🌕 **Moon Survival Mission 2: Malapert Mountain Class X7.2 Solar Storm**\n\n` +
        `• **Target Site**: Malapert Mountain Plateau (Lunar South Pole, +5,000m elevation)\n` +
        `• **NASA Source**: NASA API Portal (api.nasa.gov/DONKI) & LRO CRaTER instrument\n` +
        `• **The Physical Hazard**: An extreme Class X7.2 solar flare launches relativistic Solar Energetic Particle (SEP) protons (>100 MeV) directly along Parker Spiral magnetic lines at 2,200 km/s. They strike the unshielded lunar surface in just **18 minutes** with biological doses reaching 1.85 Gray (lethal without shielding)!\n` +
        `• **Commander Survival Protocol**:\n` +
        `  1. Issue an immediate 18-minute emergency EVA recall into subterranean storm shelters.\n` +
        `  2. Ingress the 2.0-meter compacted regolith bunker with surrounding potable water wall jackets (hydrogen stops protons with zero Bremsstrahlung gamma rays).\n` +
        `  3. Switch sensitive avionics and volatile RAM to rad-hard sleep mode to avoid single-event latchups.\n\n` +
        `You can test this in the Hardcore Survival Simulator!`,
      citations: ['NASA DONKI Space Weather API', 'NASA LRO CRaTER Instrument'],
    };
  }

  if (q.includes('dust storm') || q.includes('rems') || (q.includes('dust') && q.includes('mars')) || q.includes('tau') || q.includes('mmrtg')) {
    return {
      reply:
        `🔴 **Mars Survival Mission 1: REMS Extreme Planet-Encircling Dust Storm**\n\n` +
        `• **Target Site**: Gale Crater (Curiosity) & Jezero Crater (Perseverance)\n` +
        `• **NASA Source**: NASA JPL PDS (jpl.nasa.gov) Curiosity REMS & Perseverance MEDA sensors\n` +
        `• **The Physical Hazard**: Massive southern summer convection cells loft micron-sized ferric oxide dust into the stratosphere, spiking atmospheric optical depth (Tau) past 3.5–4.5 and blocking 99% of sunlight! Solar power collapses from 590 W/m² to <15 W/m², surface nights drop to -85°C, and dust generates 20 kV/m electrostatic friction.\n` +
        `• **Commander Survival Protocol**:\n` +
        `  1. Switch base electrical power from compromised solar arrays to the nuclear MMRTG Stirling thermal bus.\n` +
        `  2. Direct waste radioactive decay heat through thermal fluid loops to prevent battery electrolytes from freezing solid at -40°C.\n` +
        `  3. Deploy electrostatic grounding drag cables to safely dissipate triboelectric charge.\n\n` +
        `Check out the Mars Survival Simulator to command this scenario!`,
      citations: ['NASA JPL PDS Curiosity REMS & Perseverance MEDA'],
    };
  }

  if (q.includes('coprates') || q.includes('canyon') || q.includes('chasma') || q.includes('katabatic') || q.includes('permafrost') || q.includes('valles marineris')) {
    return {
      reply:
        `🔴 **Mars Survival Mission 2: Coprates Chasma Hypersonic Canyon Entry & Permafrost**\n\n` +
        `• **Target Site**: Coprates Chasma, Valles Marineris (-6,800m below datum, 7 km cliff walls)\n` +
        `• **NASA Source**: NASA Earthdata (earthdata.nasa.gov) MOLA MEGDR laser altimetry & MRO SHARAD\n` +
        `• **The Physical Hazard**: At -6.8 km depth, atmospheric pressure is 50% denser (1,150 Pa), but extreme nocturnal radiative cooling causes catastrophic **45 m/s (160 km/h) katabatic down-draft winds** cascading down the sheer 7-kilometer cliffs into boulder-strewn 30° scree slopes!\n` +
        `• **Commander Survival Protocol**:\n` +
        `  1. Engage LIDAR Terrain-Relative Navigation (TRN) to paint canyon wall contours and counter optical shadows.\n` +
        `  2. Execute a pulsed high-thrust retro-burn at 500m to cancel turbulent katabatic wind shear vectors.\n` +
        `  3. Deploy high-torque cryogenic diamond core drills to extract pure sub-surface permafrost ice lenses at 0.8m depth.\n\n` +
        `Launch this high-speed descent in the Mars EDL & Survival Simulator!`,
      citations: ['NASA Earthdata MOLA Laser Altimetry & MRO SHARAD'],
    };
  }

  // ── 6. PROJECT-WIDE KNOWLEDGE BASE SEARCH (Idea 1) ───────────────────
  const kbMatch = searchProjectKnowledge(query, context);
  if (kbMatch) {
    return kbMatch;
  }

  // ── 7. DESTINATION GENERAL GUIDANCE ──────────────────────────────────
  if (q.includes('moon') || q.includes('lunar') || (dest === 'MOON' && q.includes('base'))) {
    return {
      reply:
        `Commanding an Artemis Base Camp at the Lunar South Pole (Shackleton Crater) requires unique tactics:\n\n` +
        `1. **The 14-Day Lunar Night**: Nights last ~354 continuous hours. Make sure your Kilopower reactor and energy storage can keep habitat thermal heaters alive.\n` +
        `2. **Water Ice Mining**: Cold permanently shadowed regions trap volatile water-ice. Extracting it reduces reliance on Earth resupply.\n` +
        `3. **Electrostatic Regolith Dust**: Lunar dust is abrasive and glass-like. Keep airlocks cycled and check seal integrity often.`,
      citations: ['NASA Artemis Plan — Lunar Surface Operations'],
    };
  }

  if (q.includes('mars') || q.includes('martian') || (dest === 'MARS' && q.includes('base'))) {
    return {
      reply:
        `Commanding a Martian Outpost in Jezero Crater comes with high rewards and great challenges:\n\n` +
        `1. **Dust Storm Seasons**: Planet-encircling dust storms can obscure the Sun for weeks, cutting solar power by 80%+.\n` +
        `2. **Atmospheric ISRU**: The atmosphere is 95% CO2. Use MOXIE solid-oxide electrolysis to produce O2 for breathing and methane ascent fuel.\n` +
        `3. **Communication Delay**: Radio signals take 7 to 14 minutes each way to Earth. You are autonomous—trust your mission logs!`,
      citations: ['NASA Moon to Mars Architecture Definition Document'],
    };
  }

  // ── 8. CONTEXT-AWARE FALLBACK (With Live Telemetry & Topic Guide) ────
  const liveDiag = buildLiveTelemetryDiagnostic(context);
  return {
    reply:
      `Hello Cadet! I searched the Jr_AstroCamp mission logs for **"${query}"**.\n\n` +
      (liveDiag ? `${liveDiag}\n\n` : '') +
      `You can ask me specific questions about any part of this platform:\n` +
      `• **Current Mission**: *"Can you help me choose?"* or *"Diagnose my low outpost resources"*\n` +
      `• **76 NASA Missions**: Ask by name (e.g., *"Apollo 11"*, *"Apollo 13"*, *"Artemis III"*, *"Voyager 1"*, *"James Webb"*, *"Perseverance"*)\n` +
      `• **Space Engineering**: *"Sabatier reactor"*, *"MOXIE oxygen"*, *"7 Minutes of Terror"*, *"Kilopower reactor"*, *"Orbital docking"*, *"Black holes"*\n` +
      `• **Astronauts & Gear**: *"Neil Armstrong"*, *"Kalpana Chawla"*, *"Sally Ride"*, *"xEMU Spacesuit"*, *"NBL Spacewalk Pool"*\n` +
      `• **Website Guide**: *"How to play"*, *"Simulators Hub"*, *"Learning Hub & Comics"*, *"Co-Op Multiplayer"*`,
    citations: ['Jr_AstroCamp Knowledge Index', 'NASA Space Apps 2026'],
  };
}

/**
 * Generates an empathetic, educational, and supportive reply string from the Student Mentor.
 * Preserves exact signature for existing callers and unit tests.
 */
export function getStudentMentorReply(query: string, context?: StudentMentorContext): string {
  return getMissionAssistantResponse(query, context).reply;
}
