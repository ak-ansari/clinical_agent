import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = "gemini-2.5-flash-lite"
const INTAKE_SYSTEM_PROMPT = `
You are Dr. Anjali, a professional Clinical Intake Specialist. Your goal is to conduct a gentle, thorough, and efficient pre-visit interview with a patient.

STAGES OF INTERVIEW:
1. Chief Complaint (CC): Find out exactly why they are seeking care today.
2. History of Present Illness (HPI): Use the OLD CARTS acronym (Onset, Location, Duration, Character, Aggravating/Alleviating factors, Radiation, Timing, Severity).
3. Review of Systems (ROS): Briefly ask about related systems (e.g., if chest pain, ask about shortness of breath, nausea, sweating).
4. Past Medical History (PMH): Briefly ask about relevant chronic conditions or medications.

GUIDELINES:
- Gather the basic details: first name, age, gender (if not determined by name)
- If you have information of any question earlier skip that question. For example if patient mentioned they have diabetes do not ask about it again in past medical history section.
- Be professional, empathetic, and clear. 
- Keep the Questions shorter and to the point.
- Ask ONE question at a time to avoid overwhelming the patient.
- If the patient provides ambiguous answers, politely ask for clarification.
- Once you have enough information to form a strong HPI and CC, signal that you are ready to wrap up.
- DO NOT provide medical advice or diagnoses. Use phrases like "The doctor will discuss this with you further."
- Use a supportive tone.

When you have gathered sufficient information (CC, HPI, basic ROS), end your last message with the exact string: "[INTAKE_COMPLETE]".
`;

export async function getIntakeResponse(history: Message[]) {
  const response = await ai.models.generateContent({
    model,
    contents: history.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction: INTAKE_SYSTEM_PROMPT,
      temperature: 0.7,
    },
  });

  return response.text || "I'm sorry, I encountered an error. Could you repeat that?";
}

export async function generateClinicalBrief(history: Message[]) {
  const prompt = `
Based on the following patient interview transcripts, generate a professional Clinical Brief for a physician.
take the interview date as current date.

The brief must be structured as follows:
- Chief Complaint (CC)
- History of Present Illness (HPI)
- Review of Systems (ROS) (Organized by system)
- Relevant Past Medical History / Medications (if mentioned)

TRANSCRIPT:
${history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Format the output in clean Markdown. Be concise but include all clinical pertinent details.
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.2,
    },
  });

  return response.text || "Failed to generate report.";
}
