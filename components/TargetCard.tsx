import React, { useState, useRef } from 'react';
import { Target, SocialAudit } from '../types';
import { ScanEye, MapPin, TrendingUp, Zap, User, CircleDashed, Eye, Activity, X, Crosshair, Play, Square, Volume2, Mail, Linkedin, Clapperboard, FileText, Clock, AlertCircle } from 'lucide-react';
import { analyzeDeepDive, generateMissionBriefing } from '../services/gemini';

interface TargetCardProps {
  target: Target;
}

const TargetCard: React.FC<TargetCardProps> = ({ target }) => {
  const [isDiving, setIsDiving] = useState(false);
  const [audit, setAudit] = useState<SocialAudit | null>(null);
  const [activeTab, setActiveTab] = useState<'intel' | 'tactics'>('intel');
  
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const handleDeepDive = async () => {
    if (audit) return;
    setIsDiving(true);
    try {
      const result = await analyzeDeepDive(target);
      setAudit(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDiving(false);
    }
  };

  const handlePlayBriefing = async () => {
    if (isPlaying) {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
        }
        setIsPlaying(false);
        return;
    }

    setIsLoadingAudio(true);
    try {
        const base64Audio = await generateMissionBriefing(target);
        if (!base64Audio) return;

        // Decode and Play
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        
        source.onended = () => setIsPlaying(false);
        
        sourceNodeRef.current = source;
        source.start();
        setIsPlaying(true);

    } catch (e) {
        console.error("Audio failure", e);
    } finally {
        setIsLoadingAudio(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 4) return 'text-red-500';
    if (score < 7) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  const getUrgencyBadge = (urgency: string) => {
      switch(urgency) {
          case 'HOT': return <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-2 py-0.5 text-[9px] rounded-sm flex items-center gap-1 font-bold animate-pulse"><AlertCircle size={10} /> HOT</span>;
          case 'WARM': return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 px-2 py-0.5 text-[9px] rounded-sm flex items-center gap-1 font-bold"><Clock size={10} /> WARM</span>;
          default: return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/50 px-2 py-0.5 text-[9px] rounded-sm flex items-center gap-1 font-bold"><Clock size={10} /> COLD</span>;
      }
  };

  return (
    <div className="group relative bg-chakra-card/50 backdrop-blur-sm border border-white/5 hover:border-byakugan-main/50 transition-all duration-500 overflow-hidden rounded-sm flex flex-col h-full">
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{backgroundImage: 'radial-gradient(#a78bfa 1px, transparent 1px)', backgroundSize: '16px 16px'}}>
      </div>
      
      {/* Strategic Header Overlay */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-byakugan-main/20 to-transparent"></div>

      {/* Header */}
      <div className="p-5 border-b border-white/5 relative">
        <div className="flex justify-between items-start z-10 relative mb-1">
             <div className="flex items-center gap-2">
                 {getUrgencyBadge(target.urgencyScore)}
                 <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-sm border border-white/10 text-gray-400 uppercase tracking-wider">{target.triggerType}</span>
             </div>
             
             <button 
                onClick={handlePlayBriefing}
                disabled={isLoadingAudio}
                className={`flex items-center justify-center w-6 h-6 rounded-full border transition-all ${isPlaying ? 'border-byakugan-main text-byakugan-main animate-pulse' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}
                title="Écouter le briefing"
            >
                {isLoadingAudio ? (
                    <CircleDashed size={10} className="animate-spin" />
                ) : isPlaying ? (
                    <Square size={8} className="fill-current" />
                ) : (
                    <Volume2 size={10} />
                )}
            </button>
        </div>

        <div className="flex justify-between items-start z-10 relative">
            <div>
                <h3 className="text-xl font-clan font-bold text-white group-hover:text-byakugan-glow transition-colors mt-2">
                {target.name}
                </h3>
            </div>
        </div>
        <div className="flex items-center text-[10px] text-gray-400 gap-1 mt-1">
             <MapPin size={10} className="text-byakugan-main" />
             {target.location}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5 font-mono text-sm relative flex-grow">
        {/* Decorative vertical line */}
        <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-byakugan-main/50 to-transparent"></div>
        
        {/* Sections */}
        <div className="pl-6 space-y-4">
            
            {/* Growth */}
            <div className="group/item">
                <h4 className="text-byakugan-main text-[10px] font-bold uppercase mb-1 flex items-center gap-2 tracking-wider">
                    <TrendingUp size={10} /> Flux de Chakra
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed group-hover/item:text-gray-200 transition-colors">{target.growthSignal}</p>
            </div>

            {/* Gap */}
            <div className="group/item">
                <h4 className="text-byakugan-pale text-[10px] font-bold uppercase mb-1 flex items-center gap-2 tracking-wider opacity-80">
                    <ScanEye size={10} /> Point Aveugle
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed group-hover/item:text-gray-200 transition-colors">{target.visualGap}</p>
            </div>

            {/* Angle */}
            <div className="group/item">
                <h4 className="text-white text-[10px] font-bold uppercase mb-1 flex items-center gap-2 tracking-wider">
                    <Zap size={10} /> Technique Secrète
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed group-hover/item:text-gray-200 transition-colors">{target.attackAngle}</p>
            </div>
        </div>
      </div>

      {/* Deep Dive Results (Expandable) */}
      {audit && (
          <div className="bg-black/40 border-t border-white/10 animate-fade-in flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-white/5">
                  <button 
                    onClick={() => setActiveTab('intel')}
                    className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'intel' ? 'text-byakugan-main bg-byakugan-main/5' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                      <FileText size={12} /> Analyse
                  </button>
                  <button 
                    onClick={() => setActiveTab('tactics')}
                    className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'tactics' ? 'text-byakugan-main bg-byakugan-main/5' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                      <Crosshair size={12} /> Tactiques
                  </button>
              </div>

              {/* Content */}
              <div className="p-4">
                  {activeTab === 'intel' ? (
                      <div className="animate-fade-in">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Score Visuel</span>
                              <span className={`font-clan font-bold text-lg ${getScoreColor(audit.score)}`}>{audit.score}/10</span>
                          </div>
                          
                          <div className="w-full h-1 bg-gray-800 rounded-full mb-3 overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${audit.score < 4 ? 'bg-red-500' : audit.score < 7 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                style={{width: `${audit.score * 10}%`}}
                              ></div>
                          </div>
                          <p className="text-xs text-gray-300 italic border-l-2 border-byakugan-main/30 pl-2 mb-2">
                              "{audit.critique}"
                          </p>
                      </div>
                  ) : (
                      <div className="space-y-3 animate-fade-in">
                           {/* Email */}
                           <div className="bg-white/5 p-2 rounded-sm border border-white/5">
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase mb-1">
                                    <Mail size={10} /> Email Subject
                                </div>
                                <p className="text-xs text-white font-mono select-all selection:bg-byakugan-main selection:text-black">
                                    {audit.tactics.emailSubject}
                                </p>
                           </div>
                           
                           {/* LinkedIn */}
                           <div className="bg-white/5 p-2 rounded-sm border border-white/5">
                                <div className="flex items-center gap-2 text-[10px] text-blue-400 uppercase mb-1">
                                    <Linkedin size={10} /> LinkedIn Hook
                                </div>
                                <p className="text-xs text-white font-mono select-all selection:bg-byakugan-main selection:text-black">
                                    "{audit.tactics.linkedInHook}"
                                </p>
                           </div>

                           {/* Video */}
                           <div className="bg-white/5 p-2 rounded-sm border border-white/5">
                                <div className="flex items-center gap-2 text-[10px] text-red-400 uppercase mb-1">
                                    <Clapperboard size={10} /> Video Concept
                                </div>
                                <p className="text-xs text-gray-300 italic">
                                    {audit.tactics.videoConcept}
                                </p>
                           </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-white/5 bg-black/20 mt-auto">
           <div className="flex items-center gap-2 text-gray-500 pl-2">
              <User size={12} className="text-byakugan-main" />
              <span className="text-gray-300 font-clan text-xs tracking-wide">{target.humanTarget}</span>
           </div>
           
           <div className="flex gap-2">
               {!audit ? (
                   <button 
                      onClick={handleDeepDive}
                      disabled={isDiving}
                      className="group flex items-center gap-2 bg-byakugan-main/5 hover:bg-byakugan-main/20 border border-byakugan-main/30 hover:border-byakugan-main/60 text-byakugan-main px-4 py-1.5 rounded-sm transition-all text-[10px] uppercase tracking-wider font-bold"
                   >
                      {isDiving ? (
                          <Activity size={12} className="animate-pulse" />
                      ) : (
                          <Eye size={12} className="group-hover:scale-110 transition-transform" />
                      )}
                      {isDiving ? 'Percer...' : 'Deep Dive'}
                   </button>
               ) : (
                   <button onClick={() => setAudit(null)} className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1">
                       <X size={10} /> REPLIER
                   </button>
               )}
           </div>
      </div>
    </div>
  );
};

export default TargetCard;