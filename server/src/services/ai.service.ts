import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface PreVisitAnalysis {
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  chiefComplaint: string;
  suggestedQuestions: string[];
  summary: string;
}

export interface PostVisitAnalysis {
  friendlySummary: string;
  medicationSchedule: Array<{
    medicine: string;
    dosage: string;
    frequency: string;
    instructions: string;
  }>;
  followUpSteps: string[];
  warningsToWatch: string[];
}

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (ENV.GEMINI_API_KEY) {
      try {
        this.genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
      } catch (err) {
        logger.warn('Failed to initialize Google Generative AI client. Heuristic fallback will be used.');
      }
    } else {
      logger.info('No GEMINI_API_KEY provided. Intelligent heuristic clinical engine is active.');
    }
  }

  /**
   * Generates pre-visit clinical summary & urgency triage
   * Guided Prompt: "Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: <symptoms>"
   */
  public async analyzePreVisitSymptoms(symptoms: string): Promise<PreVisitAnalysis> {
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are an expert clinical triage assistant.
Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor.
Symptoms: "${symptoms}"

Respond ONLY with a valid JSON object in this exact schema without any markdown formatting or extra text:
{
  "urgencyLevel": "LOW" | "MEDIUM" | "HIGH",
  "chiefComplaint": "string (one concise sentence summarizing main issue)",
  "suggestedQuestions": [
    "Question 1 for doctor",
    "Question 2 for doctor",
    "Question 3 for doctor"
  ],
  "summary": "Brief 2-sentence clinical briefing for the doctor."
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        let urgency: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        const rawUrgency = (parsed.urgencyLevel || '').toUpperCase();
        if (rawUrgency.includes('HIGH')) urgency = 'HIGH';
        else if (rawUrgency.includes('MED')) urgency = 'MEDIUM';
        else urgency = 'LOW';

        return {
          urgencyLevel: urgency,
          chiefComplaint: parsed.chiefComplaint || 'Reported health concern',
          suggestedQuestions: Array.isArray(parsed.suggestedQuestions) && parsed.suggestedQuestions.length === 3
            ? parsed.suggestedQuestions
            : this.generateDefaultQuestions(symptoms),
          summary: parsed.summary || `Patient reports: ${symptoms}`,
        };
      } catch (err: any) {
        logger.warn(`Gemini API call failed (${err.message}). Falling back to heuristic triage engine.`);
      }
    }

    // Deterministic Heuristic Clinical Engine Fallback
    return this.heuristicPreVisitAnalysis(symptoms);
  }

  /**
   * Generates patient-friendly post-visit care plan
   * Guided Prompt: "Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: <notes>"
   */
  public async generatePostVisitSummary(notes: string): Promise<PostVisitAnalysis> {
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are an empathetic medical communicator.
Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: "${notes}"

Respond ONLY with a valid JSON object in this exact schema:
{
  "friendlySummary": "Clear, compassionate 2-3 paragraph explanation in plain English suitable for the patient.",
  "medicationSchedule": [
    {
      "medicine": "Name of medicine",
      "dosage": "Dosage (e.g. 500mg)",
      "frequency": "Timing / Frequency (e.g. Twice daily after meals)",
      "instructions": "Specific guidance (e.g. Drink plenty of water)"
    }
  ],
  "followUpSteps": [
    "Step 1 (e.g. Schedule blood test in 7 days)",
    "Step 2 (e.g. Return if fever persists > 48 hrs)"
  ],
  "warningsToWatch": [
    "Red flag sign 1 to seek emergency care",
    "Red flag sign 2"
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
          friendlySummary: parsed.friendlySummary || 'Thank you for your visit. Please follow your prescribed treatment plan.',
          medicationSchedule: Array.isArray(parsed.medicationSchedule) ? parsed.medicationSchedule : [],
          followUpSteps: Array.isArray(parsed.followUpSteps) ? parsed.followUpSteps : ['Stay well hydrated and get adequate rest.'],
          warningsToWatch: Array.isArray(parsed.warningsToWatch) ? parsed.warningsToWatch : ['Contact the clinic immediately if symptoms worsen significantly.'],
        };
      } catch (err: any) {
        logger.warn(`Gemini API call failed (${err.message}). Falling back to heuristic post-visit engine.`);
      }
    }

    // Deterministic Heuristic Clinical Engine Fallback
    return this.heuristicPostVisitAnalysis(notes);
  }

  /**
   * Deterministic Pre-visit symptom classifier
   */
  private heuristicPreVisitAnalysis(symptoms: string): PreVisitAnalysis {
    const lower = symptoms.toLowerCase();

    // High urgency red flags
    const highKeywords = ['chest pain', 'shortness of breath', 'difficulty breathing', 'sudden weakness', 'unconscious', 'severe bleeding', 'high fever 104', 'worst headache of life', 'paralysis', 'suicidal'];
    // Medium urgency keywords
    const mediumKeywords = ['persistent fever', 'fever', 'vomiting', 'diarrhea', 'sharp pain', 'rash', 'fracture', 'sprain', 'migraine', 'dizziness', 'infection', 'earache', 'asthma'];

    let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    if (highKeywords.some((k) => lower.includes(k))) {
      urgencyLevel = 'HIGH';
    } else if (mediumKeywords.some((k) => lower.includes(k))) {
      urgencyLevel = 'MEDIUM';
    }

    const chiefComplaint = symptoms.length > 80 ? symptoms.slice(0, 77) + '...' : symptoms;

    return {
      urgencyLevel,
      chiefComplaint: chiefComplaint.charAt(0).toUpperCase() + chiefComplaint.slice(1),
      suggestedQuestions: this.generateDefaultQuestions(symptoms),
      summary: `Patient presents with symptoms of ${chiefComplaint}. Triage urgency calculated as ${urgencyLevel}.`,
    };
  }

  /**
   * Deterministic Post-visit summary generator
   */
  private heuristicPostVisitAnalysis(notes: string): PostVisitAnalysis {
    const lines = notes.split('\n').map((l) => l.trim()).filter(Boolean);
    const friendlySummary = `During your consultation, the doctor evaluated your condition and noted: ${notes}. Your recovery plan has been structured to optimize healing and symptom relief.`;

    const medicationSchedule: Array<{ medicine: string; dosage: string; frequency: string; instructions: string }> = [];
    const followUpSteps: string[] = [
      'Take prescribed medications regularly as directed.',
      'Maintain adequate hydration and rest for the next 3 to 5 days.',
      'Schedule a follow-up review if symptoms do not improve within 72 hours.',
    ];
    const warningsToWatch: string[] = [
      'Seek immediate medical attention if you experience severe shortness of breath, sudden high fever, or unexpected allergic reactions.',
    ];

    // Simple heuristic to extract medicine-like lines
    lines.forEach((line) => {
      if (line.match(/(mg|tablet|capsule|syrup|daily|times|od|bd|tds)/i)) {
        medicationSchedule.push({
          medicine: line.split('-')[0]?.trim() || line,
          dosage: 'As prescribed',
          frequency: line.includes('twice') ? 'Twice daily' : line.includes('three') ? '3 times daily' : 'Once daily',
          instructions: 'Take with or after meals.',
        });
      }
    });

    if (medicationSchedule.length === 0) {
      medicationSchedule.push({
        medicine: 'Standard Care / Supportive Medication',
        dosage: 'As directed',
        frequency: 'Daily',
        instructions: 'Follow oral instructions given during consultation.',
      });
    }

    return {
      friendlySummary,
      medicationSchedule,
      followUpSteps,
      warningsToWatch,
    };
  }

  private generateDefaultQuestions(symptoms: string): string[] {
    const lower = symptoms.toLowerCase();
    if (lower.includes('chest') || lower.includes('breath') || lower.includes('heart')) {
      return [
        'How long have you felt chest discomfort, and does it radiate to your arm or jaw?',
        'Are you experiencing associated breathlessness, palpitations, or lightheadedness?',
        'Do you have a personal or family history of hypertension or cardiac conditions?',
      ];
    }
    if (lower.includes('fever') || lower.includes('cough') || lower.includes('throat')) {
      return [
        'How many days has the fever or cough been present, and what is the highest recorded temperature?',
        'Have you noticed productive phlegm, chills, body aches, or loss of taste/smell?',
        'Have you taken any over-the-counter antipyretics or antibiotics recently?',
      ];
    }
    if (lower.includes('skin') || lower.includes('rash') || lower.includes('itch')) {
      return [
        'When did the skin reaction first appear, and has it spread to other areas?',
        'Have you started any new skincare products, medications, or been exposed to unusual allergens?',
        'Is the area painful, warm to touch, or oozing any fluid?',
      ];
    }
    return [
      'When did the symptoms first start and have they become progressively worse?',
      'What activities or remedies make the symptoms better or worse?',
      'Are there any other associated symptoms or current medications the doctor should know about?',
    ];
  }
}

export const aiService = new AIService();
