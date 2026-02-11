import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Target, ScanStatus, ScanResult } from './types';
import { scanSector } from './services/gemini';
import RadarLoader from './components/RadarLoader';
import TargetCard from './components/TargetCard';
import { ShieldAlert, Eye, Download, Sparkles, Orbit, Globe, ScrollText, History, Trash2, X, Bookmark, Search, ListFilter, Target as TargetIcon } from 'lucide-react';

export default function App() {
  const [sector, setSector] = useState('');
  const [region, setRegion] = useState('Afrique de l\'Ouest');
  const [trigger, setTrigger] = useState('ALL'); // New Trigger State
  const [status, setStatus] = useState<ScanStatus>(ScanStatus.IDLE);
  const [targets, setTargets] = useState<Target[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [savedScans, setSavedScans] = useState<ScanResult[]>([]);
  
  // Filtering & Sorting State
  const [filterTerm, setFilterTerm] = useState('');
  const [sortType, setSortType] = useState<'default' | 'urgency' | 'growth' | 'gap'>('urgency');

  const resultsRef = useRef<HTMLDivElement>(null);

  // EDO TENSEI: Load History & Saved Scans on Mount
  useEffect(() => {
    // History
    const savedHistory = localStorage.getItem('byakugan_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load Edo Tensei scrolls", e);
      }
    }
    
    // Saved Scans
    const savedBookmarks = localStorage.getItem('byakugan_saved');
    if (savedBookmarks) {
      try {
        setSavedScans(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error("Failed to load Forbidden Scrolls", e);
      }
    }
  }, []);

  // EDO TENSEI: Save History
  const saveToHistory = (newTargets: Target[], sec: string, reg: string, trig: string) => {
    const newEntry: ScanResult = {
      targets: newTargets,
      sector: sec,
      region: reg,
      trigger: trig,
      timestamp: new Date().toISOString()
    };
    const updatedHistory = [newEntry, ...history].slice(0, 10); // Keep last 10
    setHistory(updatedHistory);
    localStorage.setItem('byakugan_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('byakugan_history');
  };

  const resurrectScan = (entry: ScanResult) => {
    setSector(entry.sector);
    setRegion(entry.region);
    setTrigger(entry.trigger || 'ALL');
    setTargets(entry.targets);
    setStatus(ScanStatus.COMPLETE);
    setHistoryOpen(false);
  };

  // FORBIDDEN SCROLLS: Save/Unsave Scan
  const toggleSaveScan = () => {
    if (status !== ScanStatus.COMPLETE) return;

    // Create signature to identify unique scans
    const currentSignature = JSON.stringify(targets);
    
    const existingIndex = savedScans.findIndex(s => 
        s.sector === sector && 
        s.region === region && 
        JSON.stringify(s.targets) === currentSignature
    );

    let newSaved;
    if (existingIndex >= 0) {
        newSaved = savedScans.filter((_, i) => i !== existingIndex);
    } else {
        const newEntry: ScanResult = {
            targets,
            sector,
            region,
            trigger,
            timestamp: new Date().toISOString()
        };
        newSaved = [newEntry, ...savedScans];
    }
    
    setSavedScans(newSaved);
    localStorage.setItem('byakugan_saved', JSON.stringify(newSaved));
  };

  const removeSavedScan = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newSaved = savedScans.filter((_, i) => i !== index);
    setSavedScans(newSaved);
    localStorage.setItem('byakugan_saved', JSON.stringify(newSaved));
  };

  const isCurrentScanSaved = () => {
    if (status !== ScanStatus.COMPLETE) return false;
    const currentSignature = JSON.stringify(targets);
    return savedScans.some(s => 
        s.sector === sector && 
        s.region === region && 
        JSON.stringify(s.targets) === currentSignature
    );
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector.trim()) return;

    setStatus(ScanStatus.SCANNING);
    setError(null);
    setTargets([]);
    setFilterTerm('');
    setSortType('urgency'); // Default sort by urgency for better utility

    try {
      const results = await scanSector(sector, region, trigger);
      setTargets(results);
      setStatus(ScanStatus.COMPLETE);
      saveToHistory(results, sector, region, trigger);
    } catch (err: any) {
      setError(err.message || "VISION OCCULTÉE. ERREUR DE CHAKRA.");
      setStatus(ScanStatus.ERROR);
    }
  };

  useEffect(() => {
    if (status === ScanStatus.COMPLETE && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [status]);

  const handleExport = () => {
    let content = `# PARCHEMIN D'INTELLIGENCE\nSECTEUR: ${sector.toUpperCase()} // ZONE: ${region.toUpperCase()} // TRIGGER: ${trigger}\n\n`;
    targets.forEach(t => {
      content += `## [${t.urgencyScore}] ${t.name}\n`;
      content += `- **Localisation :** ${t.location}\n`;
      content += `- **Déclencheur :** ${t.triggerType}\n`;
      content += `- **Signal :** ${t.growthSignal}\n`;
      content += `- **Point Aveugle :** ${t.visualGap}\n`;
      content += `- **Angle d'Attaque :** ${t.attackAngle}\n`;
      content += `- **Décideur :** ${t.humanTarget}\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BYAKUGAN_INTEL_${sector.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Filter & Sort Logic
  const displayedTargets = useMemo(() => {
    let result = [...targets];

    // Filter
    if (filterTerm) {
        const term = filterTerm.toLowerCase();
        result = result.filter(t => 
            t.name.toLowerCase().includes(term) ||
            t.location.toLowerCase().includes(term) ||
            t.growthSignal.toLowerCase().includes(term) ||
            t.visualGap.toLowerCase().includes(term) ||
            t.attackAngle.toLowerCase().includes(term)
        );
    }

    // Sort
    switch (sortType) {
        case 'urgency':
            // HOT > WARM > COLD
            const scoreMap = { 'HOT': 3, 'WARM': 2, 'COLD': 1 };
            result.sort((a, b) => scoreMap[b.urgencyScore] - scoreMap[a.urgencyScore]);
            break;
        case 'growth':
            result.sort((a, b) => a.growthSignal.localeCompare(b.growthSignal));
            break;
        case 'gap':
            result.sort((a, b) => a.visualGap.localeCompare(b.visualGap));
            break;
        default:
            result.sort((a, b) => a.id - b.id);
    }

    return result;
  }, [targets, filterTerm, sortType]);

  return (
    <div className="min-h-screen bg-chakra-bg text-byakugan-pale font-mono selection:bg-byakugan-main selection:text-black overflow-x-hidden relative">
      
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-byakugan-main/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      
      {/* EDO TENSEI SIDEBAR TOGGLE */}
      <button 
        onClick={() => setHistoryOpen(true)}
        className="fixed top-6 right-6 z-40 bg-black/40 border border-byakugan-main/30 p-3 rounded-full hover:bg-byakugan-main hover:text-black transition-all group"
        title="Ouvrir les archives Edo Tensei"
      >
        <ScrollText size={20} className="group-hover:scale-110 transition-transform" />
        {/* Badge if saved items exist */}
        {savedScans.length > 0 && (
           <span className="absolute top-0 right-0 w-3 h-3 bg-byakugan-main rounded-full animate-pulse"></span>
        )}
      </button>

      {/* EDO TENSEI DRAWER */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-[#0a0510] border-l border-byakugan-main/20 shadow-2xl transform transition-transform duration-500 z-50 ${historyOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
           <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <h3 className="font-clan font-bold text-lg text-white flex items-center gap-2">
                 <History size={18} className="text-byakugan-main" /> ARCHIVES
              </h3>
              <button onClick={() => setHistoryOpen(false)} className="text-gray-500 hover:text-white">
                 <X size={20} />
              </button>
           </div>
           
           <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
              {/* SAVED SCANS */}
              {savedScans.length > 0 && (
                  <div className="mb-8 animate-fade-in">
                      <h4 className="text-byakugan-main text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-byakugan-main/10 pb-2">
                          <Bookmark size={12} className="fill-byakugan-main" /> PARCHEMINS SCELLÉS
                      </h4>
                      <div className="space-y-3">
                          {savedScans.map((entry, idx) => (
                              <div key={`saved-${idx}`} className="bg-byakugan-main/5 p-4 rounded-sm border border-byakugan-main/30 hover:border-byakugan-main/60 hover:bg-byakugan-main/10 transition-all cursor-pointer group relative overflow-hidden" onClick={() => resurrectScan(entry)}>
                                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                      <button onClick={(e) => removeSavedScan(e, idx)} className="text-byakugan-main/50 hover:text-red-400 p-1 bg-black/50 rounded-full">
                                          <X size={12} />
                                      </button>
                                  </div>
                                  <div className="flex justify-between items-start mb-2 relative z-10">
                                      <span className="text-[10px] text-byakugan-main font-bold uppercase tracking-wider">{entry.sector}</span>
                                      {entry.trigger && entry.trigger !== 'ALL' && (
                                         <span className="text-[8px] bg-byakugan-main/20 text-byakugan-main px-1.5 py-0.5 rounded-sm">{entry.trigger}</span>
                                      )}
                                  </div>
                                  <div className="text-xs text-gray-300 group-hover:text-white transition-colors relative z-10">
                                      {entry.region}
                                  </div>
                                  <div className="text-[10px] text-byakugan-pale/50 mt-2 text-right tracking-widest uppercase relative z-10">
                                      {new Date(entry.timestamp).toLocaleDateString()}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* HISTORY SCANS */}
              <div>
                  <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                      <History size={12} /> MÉMOIRE TEMPORELLE
                  </h4>
                  <div className="space-y-3">
                      {history.length === 0 ? (
                          <p className="text-center text-xs text-gray-600 mt-4 italic">Aucune trace dans le temps.</p>
                      ) : (
                          history.map((entry, idx) => (
                              <div key={`hist-${idx}`} className="bg-white/5 p-4 rounded-sm border border-transparent hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer group" onClick={() => resurrectScan(entry)}>
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="text-[10px] text-gray-300 group-hover:text-byakugan-glow font-bold uppercase tracking-wider transition-colors">{entry.sector}</span>
                                      <span className="text-[10px] text-gray-600 group-hover:text-gray-400">{new Date(entry.timestamp).toLocaleDateString()}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                                      {entry.region}
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
           </div>

           {history.length > 0 && (
               <button 
                onClick={clearHistory}
                className="mt-4 flex items-center justify-center gap-2 text-xs text-red-500/50 hover:text-red-500 py-3 border-t border-white/5 transition-colors"
               >
                   <Trash2 size={12} /> BRÛLER LA MÉMOIRE (HISTORIQUE)
               </button>
           )}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-5xl">
        
        {/* Clan Header */}
        <header className="flex flex-col items-center justify-center mb-16 space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-byakugan-main/20 blur-xl rounded-full group-hover:bg-byakugan-main/40 transition-all duration-700"></div>
            <div className="w-16 h-16 bg-black border border-byakugan-main/30 rounded-full flex items-center justify-center relative z-10">
              <Eye className="text-byakugan-main" size={28} />
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-clan font-black text-white tracking-widest mb-2">
              BYAKUGAN <span className="text-byakugan-main font-thin">VISION</span>
            </h1>
            <p className="text-[10px] md:text-xs text-byakugan-pale/50 tracking-[0.5em] uppercase font-light">
              Elite Market Intelligence Dōjutsu
            </p>
          </div>
        </header>

        {/* Input Section (The Scroll) */}
        <main className="mb-20">
          <div className="max-w-2xl mx-auto text-center mb-12">
            
            <form onSubmit={handleScan} className="relative group flex flex-col gap-4">
              
              <div className="flex flex-col md:flex-row gap-4">
                 {/* Trigger Selector */}
                 <div className="relative flex items-center bg-chakra-base rounded-sm border border-byakugan-main/20 p-1 md:w-1/4 focus-within:border-byakugan-main/60 transition-all group-focus-within:border-byakugan-main/60">
                     <div className="pl-3 pr-2 text-byakugan-main/50">
                        <TargetIcon size={16} />
                     </div>
                     <select 
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                        className="w-full bg-transparent text-white focus:outline-none py-3 font-clan text-xs uppercase tracking-wide appearance-none cursor-pointer"
                        disabled={status === ScanStatus.SCANNING}
                     >
                         <option value="ALL" className="bg-chakra-card">Tous Signaux</option>
                         <option value="Levée de fonds" className="bg-chakra-card text-green-400">Levée de Fonds</option>
                         <option value="Recrutement" className="bg-chakra-card text-blue-400">Recrutement</option>
                         <option value="Nouveau CEO" className="bg-chakra-card text-purple-400">Nouveau CEO</option>
                         <option value="Crise" className="bg-chakra-card text-red-400">Crise / Scandale</option>
                         <option value="Lancement Produit" className="bg-chakra-card text-yellow-400">Lancement Produit</option>
                     </select>
                 </div>

                {/* Region Selector */}
                 <div className="relative flex items-center bg-chakra-base rounded-sm border border-byakugan-main/20 p-1 md:w-1/4 focus-within:border-byakugan-main/60 transition-all">
                    <div className="pl-3 pr-2 text-byakugan-main/50">
                        <Globe size={16} />
                    </div>
                    <select 
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full bg-transparent text-white focus:outline-none py-3 font-clan text-xs uppercase tracking-wide appearance-none cursor-pointer"
                        disabled={status === ScanStatus.SCANNING}
                    >
                        <option value="Afrique de l'Ouest" className="bg-chakra-card">Afrique de l'Ouest (Alpha)</option>
                        <option value="Burkina Faso" className="bg-chakra-card">Burkina Faso (Focus)</option>
                        <option value="Côte d'Ivoire" className="bg-chakra-card">Côte d'Ivoire</option>
                        <option value="Sénégal" className="bg-chakra-card">Sénégal</option>
                        <option value="Afrique Centrale" className="bg-chakra-card">Afrique Centrale</option>
                        <option value="Maghreb" className="bg-chakra-card">Maghreb</option>
                    </select>
                 </div>

                {/* Input Wrapper */}
                <div className="relative flex items-center bg-chakra-base rounded-sm border border-byakugan-main/20 p-1 flex-grow focus-within:border-byakugan-main/60 focus-within:shadow-[0_0_20px_rgba(167,139,250,0.2)] transition-all duration-300">
                    <div className="pl-4 pr-2">
                    <Sparkles size={16} className="text-byakugan-main/50" />
                    </div>
                    <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="Secteur à infiltrer..."
                    className="w-full bg-transparent text-white placeholder-byakugan-pale/20 focus:outline-none py-3 font-clan text-sm tracking-wide"
                    disabled={status === ScanStatus.SCANNING}
                    />
                    <button 
                    type="submit"
                    disabled={status === ScanStatus.SCANNING || !sector}
                    className="bg-byakugan-main/10 text-byakugan-main hover:bg-byakugan-main hover:text-black px-6 py-2 rounded-sm border border-byakugan-main/30 hover:border-transparent transition-all disabled:opacity-30 disabled:cursor-not-allowed font-clan text-xs font-bold uppercase tracking-widest duration-300 whitespace-nowrap"
                    >
                    {status === ScanStatus.SCANNING ? 'Activation...' : 'Voir'}
                    </button>
                </div>
              </div>
              
              {/* Decorative Lines below input */}
              <div className="flex justify-center gap-1 mt-2">
                 <div className="w-2 h-0.5 bg-byakugan-main/20"></div>
                 <div className="w-16 h-0.5 bg-byakugan-main/20"></div>
                 <div className="w-2 h-0.5 bg-byakugan-main/20"></div>
              </div>
            </form>
          </div>

          {/* Results Area */}
          <div className="min-h-[200px] relative">
             
             {status === ScanStatus.IDLE && (
               <div className="text-center opacity-30 mt-12">
                 <Orbit size={32} className="mx-auto mb-4 text-byakugan-pale animate-spin-slow" />
                 <p className="font-clan text-xs tracking-widest">EN ATTENTE DE CIBLE</p>
               </div>
             )}

             {status === ScanStatus.SCANNING && (
               <div className="z-10">
                 <RadarLoader />
                 <p className="text-center text-xs text-byakugan-main/50 mt-4 animate-pulse">
                     Analyse des fréquences {trigger !== 'ALL' ? `de type ${trigger}` : 'globales'}...
                 </p>
               </div>
             )}

             {status === ScanStatus.ERROR && (
               <div className="text-center p-8 border border-red-900/30 bg-red-950/10 rounded-sm max-w-md mx-auto">
                 <ShieldAlert size={32} className="mx-auto mb-4 text-red-400" />
                 <h3 className="text-lg font-clan text-red-400 mb-2">VISION BLOQUÉE</h3>
                 <p className="text-red-400/70 text-xs mb-4">{error}</p>
                 <button 
                    onClick={() => setStatus(ScanStatus.IDLE)}
                    className="text-xs border-b border-red-400 text-red-400 hover:text-white pb-1 transition-colors"
                 >
                   ROMPEZ LE SCEAU ET RÉESSAYEZ
                 </button>
               </div>
             )}

             {status === ScanStatus.COMPLETE && (
               <div className="w-full animate-fade-in-up" ref={resultsRef}>
                 <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-white/5 pb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-clan text-white mb-2">POINTS VITAUX DÉVOILÉS</h2>
                        <div className="flex gap-4">
                            <p className="text-byakugan-main text-xs font-mono tracking-wider">SECTEUR: {sector.toUpperCase()}</p>
                            {trigger !== 'ALL' && (
                                <p className="text-byakugan-main text-xs font-mono tracking-wider">TRIGGER: {trigger.toUpperCase()}</p>
                            )}
                            <p className="text-byakugan-pale/50 text-xs font-mono tracking-wider">ZONE: {region.toUpperCase()}</p>
                            <p className="text-byakugan-pale/50 text-xs font-mono tracking-wider">CIBLES: {displayedTargets.length}</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                          onClick={toggleSaveScan}
                          className={`group flex items-center gap-2 text-xs border px-5 py-2 rounded-sm transition-all ${isCurrentScanSaved() ? 'border-byakugan-main bg-byakugan-main/10 text-byakugan-main' : 'border-white/10 hover:border-byakugan-main/50 text-gray-400 hover:text-white'}`}
                        >
                          <Bookmark size={14} className={isCurrentScanSaved() ? 'fill-current' : 'group-hover:text-byakugan-main transition-colors'} />
                          <span className="font-clan tracking-wider">{isCurrentScanSaved() ? 'SCELLÉ' : 'SCELLER'}</span>
                        </button>
                        
                        <button 
                          onClick={handleExport}
                          className="group flex items-center gap-2 text-xs border border-white/10 hover:border-byakugan-main/50 px-5 py-2 rounded-sm transition-all text-gray-400 hover:text-white"
                        >
                          <Download size={14} className="group-hover:text-byakugan-main transition-colors" />
                          <span className="font-clan tracking-wider">EXPORTER</span>
                        </button>
                    </div>
                 </div>

                 {/* FILTER & SORT CONTROLS */}
                 <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white/5 p-4 rounded-sm border border-white/5 items-center justify-between">
                    {/* Search */}
                    <div className="relative w-full md:w-auto flex-grow max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-byakugan-main transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="Filtrer les signaux (Nom, Ville, Chakra)..." 
                            value={filterTerm}
                            onChange={(e) => setFilterTerm(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-sm py-2 pl-9 pr-4 text-xs text-gray-300 focus:outline-none focus:border-byakugan-main/50 transition-all placeholder-gray-600"
                        />
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                            <ListFilter size={10} /> TRIER PAR :
                        </span>
                        <div className="flex bg-black/50 rounded-sm p-1 border border-white/10">
                             <button 
                                onClick={() => setSortType('urgency')}
                                className={`px-3 py-1 text-[10px] uppercase tracking-wide rounded-sm transition-all ${sortType === 'urgency' ? 'bg-byakugan-main text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                            >
                                Urgence
                            </button>
                            <button 
                                onClick={() => setSortType('growth')}
                                className={`px-3 py-1 text-[10px] uppercase tracking-wide rounded-sm transition-all ${sortType === 'growth' ? 'bg-byakugan-main text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                            >
                                Flux
                            </button>
                            <button 
                                onClick={() => setSortType('gap')}
                                className={`px-3 py-1 text-[10px] uppercase tracking-wide rounded-sm transition-all ${sortType === 'gap' ? 'bg-byakugan-main text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                            >
                                Faille
                            </button>
                        </div>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {displayedTargets.length > 0 ? (
                     displayedTargets.map((target) => (
                       <TargetCard key={target.id} target={target} />
                     ))
                   ) : (
                     <div className="col-span-1 lg:col-span-2 text-center py-12 border border-dashed border-white/10 rounded-sm">
                        <p className="text-gray-500 font-clan text-sm">AUCUNE CIBLE DÉTECTÉE AVEC CES PARAMÈTRES</p>
                     </div>
                   )}
                 </div>

                 <div className="mt-16 text-center">
                    <button className="relative px-8 py-3 group overflow-hidden rounded-sm">
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-byakugan-main/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                        <span className="relative text-byakugan-main font-clan text-sm tracking-[0.2em] uppercase border-b border-byakugan-main/30 pb-1 group-hover:border-byakugan-main transition-colors">
                            Engager la Manoeuvre Cinematic
                        </span>
                    </button>
                 </div>
               </div>
             )}
          </div>
        </main>

        <footer className="text-center text-byakugan-pale/20 text-[10px] py-8 border-t border-white/5 mt-auto">
           <p className="font-clan tracking-widest">CINEMATIC LAUNCH™ // SECRET ARTS</p>
        </footer>
      </div>
    </div>
  );
}