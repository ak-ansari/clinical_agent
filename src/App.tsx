import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Stethoscope, 
  Send, 
  User, 
  Bot, 
  ChevronRight, 
  ClipboardCheck, 
  Clock, 
  RotateCcw,
  FileText,
  Download,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { Message, IntakeStage } from './types';
import { getIntakeResponse, generateClinicalBrief } from './services/geminiService';
import { useVoice } from './hooks/useVoice';

export default function App() {
  const [stage, setStage] = useState<IntakeStage>('lobby');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isRecording, transcript, startRecording, stopRecording, speak, hasSupport } = useVoice();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const startIntake = async () => {
    setStage('interviewing');
    const initialMessage: Message = {
      role: 'assistant',
      content: "Hello, I'm Dr. Anjali. I'll be helping with your clinical intake today. To get started, could you please tell me your good name please"
    };
    setMessages([initialMessage]);
    
    // Vocal welcome
    if (isVoiceEnabled) {
      speak(initialMessage.content);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    window.speechSynthesis.cancel();
    const messageContent = overrideInput || input;
    if (!messageContent.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: messageContent.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await getIntakeResponse(newMessages);
      
      const isComplete = responseText.includes('[INTAKE_COMPLETE]');
      const cleanResponse = responseText.replace('[INTAKE_COMPLETE]', '').trim();

      setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
      
      if (isVoiceEnabled) {
        speak(cleanResponse);
      }
      
      if (isComplete) {
        setTimeout(() =>{ 
          window.speechSynthesis.cancel();
          setStage('summarizing')
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      const errorMsg = "I apologize, I'm having trouble connecting. Could you please try again?";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      if (isVoiceEnabled) speak(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (transcript && !isRecording) {
      handleSend(transcript);
    }
  }, [transcript, isRecording]);

  useEffect(() => {
    if (stage === 'summarizing') {
      const createReport = async () => {
        try {
          const generatedReport = await generateClinicalBrief(messages);
          setReport(generatedReport);
          setStage('completed');
        } catch (error) {
          console.error(error);
        }
      };
      createReport();
    }
  }, [stage, messages]);

  const reset = () => {
    setStage('lobby');
    setMessages([]);
    setReport(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans selection:bg-blue-100 p-4 md:p-6">
      <AnimatePresence mode="wait">
        {stage === 'lobby' && (
          <div className="max-w-5xl mx-auto pt-12 md:pt-24">
            <header className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-2xl tracking-tight text-slate-900 leading-none">Pulse</span>
              </div>
            </header>

            <motion.div 
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6">
                <Clock className="w-4 h-4" />
                Avg. intake time: 4 mins
              </div>
              <h1 className="text-4xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
                Secure Pre-Visit <br /> 
                <span className="text-blue-600">Clinical Intake</span>
              </h1>
              <p className="text-slate-600 text-lg max-w-xl mx-auto mb-10 leading-relaxed font-medium">
                Connect with Dr. Anjali, our AI-powered intake specialist, to provide your symptoms and history before your provider sees you.
              </p>
              <button 
                onClick={startIntake}
                className="group relative inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 hover:shadow-slate-300 active:scale-95"
              >
                Start Your Intake
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: ClipboardCheck, title: "Structured Briefs", desc: "Generates industry-standard CC, HPI, and ROS reports." },
                  { icon: Bot, title: "Empathetic AI", desc: "Natural, patient-centered conversation flow." },
                  { icon: FileText, title: "Ready for EHR", desc: "Markdown formatted output for easy integration." }
                ].map((item, i) => (
                  <div key={i} className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm text-left hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 text-slate-700">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {stage === 'interviewing' && (
          <motion.div 
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1200px] mx-auto flex flex-col gap-4 h-[calc(100vh-3rem)]"
          >
            {/* Top Header Bento Row */}
            <div className="flex flex-col md:flex-row gap-4 h-auto md:h-24 shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex-1 flex items-center gap-4 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {messages.length > 0 ? "PT" : "?"}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Current Session: Pre-Visit Intake</h1>
                  <p className="text-sm text-slate-500 font-medium italic">Provider: Dr. Anjali (AI) &bull; Mode: Clinical Interview</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-200 uppercase tracking-wider">Active</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200 uppercase tracking-wider">HIPAA Secured</span>
                </div>
              </div>
              
              <div className="bg-blue-600 rounded-2xl p-4 w-full md:w-72 flex flex-col justify-center items-center text-white shadow-lg shadow-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold tracking-widest uppercase opacity-90">Live Transcription</span>
                </div>
                <div className="flex items-end gap-1 h-8 px-4">
                  {[4, 8, 6, 5, 8, 4, 7, 5, 9, 3].map((h, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: isTyping ? [h*2, h*4, h*2] : h*2 }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                      className="w-1 bg-white/40 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
              {/* Conversation Panel */}
              <div className="col-span-1 md:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conversation Stream</span>
                  <div className="flex items-center gap-3">
                     <button 
                       onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                       className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600"
                       title={isVoiceEnabled ? "Mute Aria" : "Unmute Aria"}
                     >
                       {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                     </button>
                     <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Ready to Assist</span>
                  </div>
                </div>
                
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]"
                >
                  {messages.map((m, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i} 
                      className={cn(
                        "flex gap-4",
                        m.role === 'user' ? "flex-row-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm",
                        m.role === 'user' ? "bg-slate-800 text-white" : "bg-blue-600 text-white"
                      )}>
                        {m.role === 'user' ? 'PT' : 'AI'}
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                        m.role === 'user' 
                          ? "bg-white border border-slate-200 text-slate-800 rounded-tr-none max-w-[80%]" 
                          : "bg-blue-50 text-slate-800 rounded-tl-none max-w-[80%]"
                      )}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                        AI
                      </div>
                      <div className="p-4 bg-blue-50 rounded-2xl rounded-tl-none animate-pulse">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                  <div className="flex-1 relative flex gap-2">
                    {hasSupport && (
                      <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center transition-all shadow-md flex-shrink-0",
                          isRecording 
                            ? "bg-red-500 text-white animate-pulse" 
                            : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                        )}
                        title={isRecording ? "Stop Recording" : "Voice Input"}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    )}
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={isRecording ? "Listening..." : "Type your response or symptoms..."}
                      className="flex-1 bg-white border border-slate-300 rounded-full px-6 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping || isRecording}
                    className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-90 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status/Brief Preview Panel */}
              <div className="col-span-1 md:col-span-4 flex flex-col gap-4 min-h-0">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col shadow-sm">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Health Profile</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Guest Patient</p>
                        <p className="text-[10px] text-slate-500">Virtual Encounter #8A2</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex-1 flex flex-col overflow-hidden shadow-sm">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Interview Context</h3>
                  <div className="flex-1 text-sm text-slate-600 leading-relaxed space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    <p>Current phase: <span className="text-blue-600 font-bold">Information Gathering</span></p>
                    <p className="text-xs italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                      Dr. Anjali is using the OLD CARTS clinical framework to capture a high-quality History of Present Illness (HPI).
                    </p>
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Captured Points</p>
                       <ul className="space-y-1.5">
                          {messages.filter(m => m.role === 'user').length > 0 ? (
                            messages.filter(m => m.role === 'user').slice(-3).map((m, i) => (
                              <li key={i} className="text-xs flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-blue-400" />
                                <span className="line-clamp-1">{m.content}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-slate-400 italic">Waiting for initial complaint...</li>
                          )}
                       </ul>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={reset}
                  className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-colors uppercase tracking-widest shadow-sm"
                >
                  Discard Session
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'summarizing' && (
          <motion.div 
            key="summarizing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <div className="text-center max-w-sm">
              <div className="relative inline-block mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <ClipboardCheck className="absolute inset-0 m-auto w-10 h-10 text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Structuring Your Brief</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                Dr. Anjali working to convert your conversation into a high-fidelity Clinical HPI report.
              </p>
            </div>
          </motion.div>
        )}

        {stage === 'completed' && report && (
          <motion.div 
            key="completed"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto py-8 space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">Draft Generated</div>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date().toLocaleDateString()}</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Clinical Intake Brief</h2>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button 
                  onClick={reset}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Patient
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
                <div className="p-8 md:p-12 markdown-body">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              </div>

              <div className="md:col-span-4 space-y-6">
                <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-200">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Verification Steps</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                         <div className="w-2 h-2 bg-white rounded-full opacity-0" />
                      </div>
                      <div>
                        <p className="text-xs font-bold mb-1">Capture HPI</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Successfully extracted from dialogue data.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                         <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <div>
                        <p className="text-xs font-bold mb-1">Provider Review</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium underline decoration-dotted">Pending clinical validation by MD/DO/NP.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100">
                  <div className="flex gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <h4 className="font-bold text-amber-900 text-sm">Regulatory Notice</h4>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                    This summary is AI-generated and for supportive clinical use only. Pulse does not provide diagnoses. Ensure all critical systems (Cardiac, Neuro) are manually verified during physical exam.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
