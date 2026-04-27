# AI Clinical Agent

An AI-powered clinical intake system that conducts pre-visit patient interviews and generates structured clinical briefs for healthcare providers.

## Overview

This application simulates a clinical intake conversation between an AI assistant (Dr. Anjali) and a patient. The agent gathers essential clinical information through a guided interview process and produces a formatted clinical brief containing:

- **Chief Complaint (CC)**: The primary reason for the patient's visit
- **History of Present Illness (HPI)**: Detailed symptom history using the OLD CARTS framework
- **Review of Systems (ROS)**: Assessment of related organ systems
- **Past Medical History (PMH)**: Relevant chronic conditions and medications

## Features

- **Voice Interaction**: Speak directly to the AI using voice input (Speech Recognition) and hear responses (Text-to-Speech)
- **Guided Intake Flow**: Multi-stage interview process (Lobby → Interviewing → Summarizing → Completed)
- **Smart Questioning**: AI adapts questions based on patient responses, avoiding redundant questions
- **Clinical Brief Generation**: Automatically generates a structured clinical summary at the end of the intake
- **Modern UI**: Clean, professional interface with real-time typing indicators and smooth animations

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Motion (Framer Motion)
- **AI Model**: Google Gemini 1.1 Pro
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Google Gemini API Key

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the project root and add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

### Running the Application

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
# Build the application
npm run build
```

## Usage

1. **Start Intake**: Click the "Start Intake" button to begin the interview
2. **Voice or Text**: Use the microphone button to speak or type your responses in the chat
3. **Conversation**: Answer Dr. Anjali's questions about your symptoms and medical history
4. **Complete**: Once sufficient information is gathered, the AI will signal completion and generate a clinical brief
5. **View & Export**: Review the generated clinical brief and download it if needed

## Project Structure

```
src/
├── App.tsx              # Main application component
├── main.tsx             # React entry point
├── index.css            # Global styles
├── types.ts             # TypeScript type definitions
├── hooks/
│   └── useVoice.ts      # Voice input/output hook
├── services/
│   └── geminiService.ts # Gemini AI integration
└── lib/
    └── utils.ts         # Utility functions
```

## Clinical Brief Output Format

The generated clinical brief follows standard medical documentation format:

```markdown
# Clinical Brief

## Chief Complaint
[Primary reason for visit]

## History of Present Illness
[Detailed symptom history with OLD CARTS elements]

## Review of Systems
- General: [...]
- Respiratory: [...]
- Cardiovascular: [...]
- [Other relevant systems]

## Past Medical History
[Relevant conditions and medications]
```

## License

MIT