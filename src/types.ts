export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ClinicalBrief {
  chiefComplaint: string;
  hpi: string;
  ros: {
    general: string[];
    respiratory?: string[];
    cardiovascular?: string[];
    gastrointestinal?: string[];
    neurological?: string[];
    musculoskeletal?: string[];
    skin?: string[];
    other?: string[];
  };
  assessments?: string;
  plan?: string;
}

export type IntakeStage = 'lobby' | 'interviewing' | 'summarizing' | 'completed';
