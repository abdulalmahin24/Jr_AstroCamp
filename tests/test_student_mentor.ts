import assert from 'node:assert/strict';
import type { MissionEvent } from '../src/types/game.ts';
import {
  getStudentMentorReply,
  getMissionAssistantResponse,
  getContextualQuickPrompts,
} from '../src/utils/studentMentor.ts';

const event: MissionEvent = {
  id: 'mentor-test',
  sol: 3,
  title: 'Solar panels in a dust storm',
  urgency: 'HIGH',
  nasaCitation: {
    title: 'NASA space weather lesson',
    docNumber: 'DONKI',
    description: 'Solar activity records',
  },
  comicPanels: [],
  options: [
    {
      id: 'protect',
      title: 'Protect the panels',
      description: 'Retract the solar panels.',
      tradeOffText: 'Less power for science tonight.',
      resourceDelta: { power: -10 },
      consequenceNarrative: 'The panels are protected.',
      educationalInsight: 'Power is limited.',
    },
    {
      id: 'expose',
      title: 'Keep collecting sunlight',
      description: 'Leave the panels extended.',
      tradeOffText: 'Dust may reduce their output.',
      resourceDelta: { power: 5 },
      consequenceNarrative: 'The panels collect sunlight.',
      educationalInsight: 'Dust can affect solar panels.',
    },
  ],
};

const context = {
  activeEvent: event,
  destination: 'MOON' as const,
  currentSol: 3,
  isGameOver: false,
};

const choiceReply = getStudentMentorReply('Can you help me choose?', context);
assert.match(choiceReply, /You’re not alone/);
assert.match(choiceReply, /Retract the solar panels/);
assert.match(choiceReply, /Less power for science tonight/);
assert.match(choiceReply, /There may not be a perfect choice/);

const reassurance = getStudentMentorReply('I feel worried and stuck', context);
assert.match(reassurance, /you don’t have to solve everything at once/i);

const radiationReply = getStudentMentorReply('What about radiation?', context);
assert.match(radiationReply, /not a medical measurement/);
assert.match(radiationReply, /NASA DONKI/);

const scienceReply = getStudentMentorReply('Where does this data come from?', {
  ...context,
  activeEvent: {
    ...event,
    dataAttribution: {
      label: 'ARCHIVED',
      recordId: 'CME-123',
      sourceUrl: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/CME/123',
    },
  },
});
assert.match(scienceReply, /ARCHIVED/);
assert.match(scienceReply, /CME-123/);
assert.match(scienceReply, /gameplay effect is not itself a NASA measurement/);

// Idea 1: Project-wide Knowledge Base Search (Site Guide JSON + 76 Missions + Astronauts + Flashcards)
const siteGuideReply = getMissionAssistantResponse('How does multiplayer co-op work?');
assert.match(siteGuideReply.reply, /4-Player Co-Op Multiplayer/i);

const missionReply = getMissionAssistantResponse('Tell me about Apollo 11');
assert.match(missionReply.reply, /Apollo 11/i);

const astronautReply = getMissionAssistantResponse('Who is Kalpana Chawla?');
assert.match(astronautReply.reply, /Kalpana Chawla/i);

const flashcardReply = getMissionAssistantResponse('Explain Sabatier methanation', {
  ...context,
  difficultyMode: 'COMMANDER',
});
assert.match(flashcardReply.reply, /Sabatier/i);

// Idea 2: Live Telemetry Diagnostics & Context-Aware Quick Prompts
const diagReply = getStudentMentorReply('Diagnose my low outpost resources!', {
  ...context,
  resources: { power: 22, oxygen: 88, water: 30, food: 75, radiation: 10 },
});
assert.match(diagReply, /Power is low \(22%\)/);
assert.match(diagReply, /Water is low \(30%\)/);

const simPrompts = getContextualQuickPrompts({ ...context, route: 'simulators' });
assert.ok(simPrompts.some((p) => p.includes('7 Minutes of Terror')));

console.log('Student Mentor: supportive guidance, mission choices, NASA attribution, radiation caveats, unified KB search, and live telemetry verified in Jr_Astronaut.');

