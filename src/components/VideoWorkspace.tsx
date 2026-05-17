

import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Play, Pause, AlertTriangle, Send, Sparkles, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Issue {
  timestamp: number;
  description: string;
  reasoning: string;
  estimatedCost: string;
  imageUrl?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  imageUrl?: string;
}

interface VideoWorkspaceProps {
  videoFile?: File | null;
  videoUrl?: string | null;
  inspection?: any;
  pricingGuidelines?: string;
  apiKey: string;
  selectedModel: string;
  onClose: () => void;
  onSave: (issues: Issue[], summary: string, inspectionId?: string) => void;
}

export function VideoWorkspace({ videoFile, videoUrl, inspection, pricingGuidelines, apiKey, selectedModel, onClose, onSave }: VideoWorkspaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const [isAnalyzing, setIsAnalyzing] = useState(!inspection);
  const [issues, setIssues] = useState<Issue[]>(inspection?.findings || []);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [summary, setSummary] = useState(inspection?.executiveSummary || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'annotations' | 'chat'>('annotations');

  const [showModelPopup, setShowModelPopup] = useState(false);
  const [pendingApiAction, setPendingApiAction] = useState<"analyze" | "chat" | null>(null);

  // Sync if inspection prop changes
  useEffect(() => {
    if (inspection) {
      setIssues(inspection.findings || []);
      setSummary(inspection.executiveSummary || '');
      setIsAnalyzing(false);
    }
  }, [inspection]);

  // Generate thumbnails for anomalies
  useEffect(() => {
    if (!videoUrl) return;
    if (issues.length > 0 && !issues.some(i => i.imageUrl)) {
      let active = true;
      const generate = async () => {
        const v = document.createElement('video');
        v.src = videoUrl;
        v.muted = true;
        v.playsInline = true;
        v.crossOrigin = 'anonymous';
        v.load();
        
        await new Promise(r => { 
          v.onloadeddata = r;
          v.onloadedmetadata = r;
          v.onerror = r;
          setTimeout(r, 2000); // 2 second timeout
        });
        
        const newIssues = [...issues];
        let hasChanges = false;
        
        for (let i = 0; i < newIssues.length; i++) {
           if (!active) break;
           const issue = newIssues[i];
           if (issue.imageUrl) continue;
           
           v.currentTime = issue.timestamp;
           await new Promise(r => { 
             const handle = () => { r(null); v.removeEventListener('seeked', handle); };
             v.addEventListener('seeked', handle);
             setTimeout(handle, 800); // 800ms timeout
           });
           
           const canvas = document.createElement('canvas');
           canvas.width = 320; // lower res for smaller size
           const ratio = canvas.width / (v.videoWidth || 640);
           canvas.height = Math.max((v.videoHeight || 360) * ratio, 1);
           try {
             const ctx = canvas.getContext('2d');
             ctx?.drawImage(v, 0, 0, canvas.width, canvas.height);
             const dataUri = canvas.toDataURL('image/jpeg', 0.5);
             if (dataUri.length > 50) {
                 newIssues[i] = { ...issue, imageUrl: dataUri };
                 hasChanges = true;
             }
           } catch(e) {
             console.error("Thumbnail capture error", e);
           }
        }
        if (active && hasChanges) setIssues([...newIssues]);
      };
      generate();
      return () => { active = false; };
    }
  }, [issues, videoUrl]);

  useEffect(() => {
    if (!videoFile) return;
    
    // Start backend analysis
    const analyze = async () => {
      try {
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('model', selectedModel);
        if (pricingGuidelines) {
          formData.append('pricingGuidelines', pricingGuidelines);
        }
        
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiUrl}/api/analyze-video`, {
          method: 'POST',
          headers: {
             'X-Gemini-API-Key': apiKey,
          },
          body: formData,
        });
        
        if (!res.ok) {
          if (res.status === 429) {
            setShowModelPopup(true);
            setPendingApiAction("analyze");
            return;
          }
          let errorText = await res.text();
          try {
            const errObj = JSON.parse(errorText);
            if (errObj.error) errorText = errObj.error;
          } catch(e) {}
          throw new Error(errorText);
        }
        const text = await res.text();
        
        let data;
        try {
          if (text.trim().startsWith('<')) {
             if (text.toLowerCase().includes('cookie check')) {
               setChatMessages(prev => [...prev, { role: 'assistant', content: "AI session blocked. Please open this app in a new tab to authorize your browser cookies." }]);
               throw new Error("AI session blocked.");
             }
             throw new Error("Server returned HTML instead of expected JSON.");
          }
          data = JSON.parse(text);
        } catch (err: any) {
          throw new Error(err.message || "Invalid response format received from server.");
        }
        
        setIssues(data.issues || []);
        setSummary(data.systemMessage || 'Video inspection completed.');
        
        if (data.systemMessage) {
           setChatMessages([{ role: 'assistant', content: data.systemMessage }]);
        } else {
           setChatMessages([{ role: 'assistant', content: "I've analyzed the video. You can click on the issues to jump to them, or ask me any questions about specific frames. Note: if you ask a question, I will look at the current frame of the video." }]);
        }
      } catch (e: any) {
        console.error(e);
        setChatMessages([{ role: 'assistant', content: `Error analyzing video: ${e.message}` }]);
      } finally {
        setIsAnalyzing(false);
      }
    };
    
    if (pendingApiAction === "analyze") {
       setIsAnalyzing(true);
       setPendingApiAction(null);
    }
    analyze();
  }, [videoFile, selectedModel, pendingApiAction]);

  const handleSave = () => {
    setIsSaving(true);
    onSave(issues, summary, inspection?.id, () => setIsSaving(false));
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || isSending) return;
    
    const time = currentTime;
    const frameBase64 = captureFrame();
    const newMsg: Message = { role: 'user', content: chatInput, timestamp: time, imageUrl: frameBase64 || undefined };
    
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
    setIsSending(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Gemini-API-Key': apiKey,
        },
        body: JSON.stringify({
          message: newMsg.content,
          imageBase64: newMsg.imageUrl,
          model: selectedModel,
          pricingGuidelines: pricingGuidelines || undefined,
          history: chatMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      
      if (!res.ok) {
        if (res.status === 429) {
           setShowModelPopup(true);
           setPendingApiAction("chat");
           // Revert the message so the user can send it again once the model is picked
           setChatMessages(prev => prev.filter(m => m !== newMsg));
           setChatInput(newMsg.content);
           setIsSending(false);
           return;
        }
        let errorText = await res.text();
        try {
          const errObj = JSON.parse(errorText);
          if (errObj.error) errorText = errObj.error;
        } catch(e) {}
        throw new Error(errorText);
      }
      const text = await res.text();
      
      let data;
      try {
        if (text.trim().startsWith('<')) {
           if (text.toLowerCase().includes('cookie check')) {
             setChatMessages(prev => [...prev, { role: 'assistant', content: "AI session blocked. Please open this app in a new tab to authorize your browser cookies." }]);
             throw new Error("AI session blocked.");
           }
           throw new Error("Server returned HTML instead of expected JSON.");
        }
        data = JSON.parse(text);
      } catch (err: any) {
        throw new Error(err.message || "Invalid response format received from server.");
      }
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Sorry, an error occurred: ${e.message}` }]);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-slate-50 font-sans text-slate-800 absolute inset-0 z-50 overflow-hidden">
      
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-20">
        <button onClick={onClose} className="text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition cursor-pointer">
          <span>&larr;</span> Back to Projects
        </button>
        <div className="flex items-center gap-3 w-auto">
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-violet-700 bg-violet-50 px-4 py-2 rounded-full text-xs font-semibold border border-violet-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Auto-detecting Anomalies...
            </div>
          )}
          {!isAnalyzing && (
            <button onClick={handleSave} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium text-sm flex items-center gap-2 px-6 py-2 rounded-full transition shadow-sm border border-violet-500/30 cursor-pointer">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Save Report
            </button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-slate-50 border-t border-slate-200">
        
        {/* Left Area: Video Player & Timeline */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
          {/* Main Video Area */}
          <div className="flex-1 relative flex items-center justify-center p-4 md:p-6 min-h-0">
             {videoUrl ? (
               <div className="w-full h-full relative rounded-[2rem] overflow-hidden shadow-sm bg-black flex items-center justify-center border border-slate-200">
                 <video 
                   ref={videoRef}
                   src={videoUrl}
                   className="w-full h-full object-contain max-h-full"
                   onTimeUpdate={handleTimeUpdate}
                   onPlay={() => setIsPlaying(true)}
                   onPause={() => setIsPlaying(false)}
                   onClick={() => isPlaying ? videoRef.current?.pause() : videoRef.current?.play()}
                   playsInline
                 />
               </div>
             ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 gap-4 bg-white rounded-[2rem] border border-slate-200 w-full h-full shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 hidden md:flex">
                     <AlertTriangle className="w-8 h-8 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-medium mb-1">Video Unavailable</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">This report corresponds to a previous session. The original video isn't stored centrally. Chat history and timeline annotations are intact.</p>
                  </div>
                </div>
             )}
          </div>

          {/* New Integrated Timeline Area */}
          <div className="h-[260px] shrink-0 bg-slate-50 border-t border-slate-200 p-4 pt-3 flex flex-col relative z-20">
             <div className="flex items-center justify-between mb-3 px-2">
               <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Timeline Workspace</div>
               <div className="flex items-center gap-4">
                  <div className="text-slate-600 font-mono text-xs text-right w-16 font-medium">{formatTime(currentTime)}</div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => jumpToTime(Math.max(0, currentTime - 5))} className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors" title="-5s">
                      <span className="text-[10px] font-bold">-5</span>
                    </button>
                    <button disabled={!videoUrl} onClick={() => isPlaying ? videoRef.current?.pause() : videoRef.current?.play()} className="w-8 h-8 rounded-full bg-violet-600 disabled:bg-slate-100 disabled:text-slate-400 text-white flex items-center justify-center shrink-0 hover:bg-violet-700 transition-all shadow-md shadow-violet-500/20">
                      {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
                    </button>
                    <button onClick={() => {
                        const duration = videoRef.current?.duration || (issues.length > 0 ? Math.max(...issues.map(i => i.timestamp)) + 10 : 60);
                        jumpToTime(Math.min(duration, currentTime + 5));
                    }} className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors" title="+5s">
                      <span className="text-[10px] font-bold">+5</span>
                    </button>
                  </div>
               </div>
             </div>
             
             {/* Timeline Scroll Container */}
             <div className="flex-1 relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50">
                 
                 {/* Inner wide container setting the min-width to force scroll */}
                 <div className="h-full flex flex-row relative min-w-max" style={{ width: `max(100%, ${(videoRef.current?.duration || (issues.length > 0 ? Math.max(...issues.map(i => i.timestamp)) + 10 : 60)) * 80}px)` }}>
                     
                     {/* Sticky Label Sidebar */}
                     <div className="sticky left-0 w-[140px] flex flex-col pt-3 pb-8 justify-center gap-6 z-40 bg-white/95 backdrop-blur-md border-r border-slate-200 shrink-0 shadow-[4px_0_16px_rgba(0,0,0,0.03)]">
                         <div className="h-10 flex items-center px-5 shrink-0">
                              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest leading-tight">Video<br/>Track</span>
                         </div>
                         <div className="h-[120px] flex justify-start pt-5 px-5 shrink-0">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Anomalies</span>
                         </div>
                     </div>

                     {/* The Unified Timeline Flow Container */}
                     <div className="flex-1 relative py-5 flex flex-col justify-center shrink-0 pr-[140px] pl-[140px]">
                         
                         {/* Core Timeline Track */}
                         <div className="relative w-full"
                              onClick={(e) => {
                                   const rect = e.currentTarget.getBoundingClientRect();
                                   const duration = videoRef.current?.duration || (issues.length > 0 ? Math.max(...issues.map(i => i.timestamp)) + 10 : 60);
                                   const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                                   jumpToTime(pos * duration);
                              }}
                         >
                             {/* Playhead */}
                             <div className="absolute top-[-16px] bottom-[-30px] left-0 right-0 pointer-events-none z-30">
                                 <div 
                                     className="absolute top-0 bottom-0 w-0 transition-transform duration-75"
                                     style={{ left: `${(videoRef.current?.duration || (issues.length > 0 ? Math.max(...issues.map(i => i.timestamp)) + 10 : 60)) ? (currentTime / (videoRef.current?.duration || (issues.length > 0 ? Math.max(...issues.map(i => i.timestamp)) + 10 : 60))) * 100 : 0}%` }}
                                 >
                                     <div className="absolute top-0 bottom-0 w-[1.5px] bg-violet-600 -translate-x-1/2 shadow-[0_0_10px_rgba(139,92,246,0.3)]"></div>
                                     <div className="absolute top-0 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-[3px] border-violet-600 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.12)]"></div>
                                 </div>
                             </div>

                             {/* Track 1: Video */}
                             <div className="relative h-10 w-full bg-slate-50 border border-slate-200/80 rounded-lg overflow-hidden flex items-center shrink-0 cursor-pointer hover:bg-slate-100 transition-colors">
                                 <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px)' }}></div>
                             </div>

                             {/* Track 2: Annotations Axis */}
                             <div className="relative h-[120px] w-full mt-4 bg-transparent shrink-0">
                                 {/* Horizontal Axis Dividers for "sub-tracks" */}
                                 <div className="absolute left-0 right-0 top-0 h-[1px] bg-slate-200 pointer-events-none"></div>
                                 <div className="absolute left-0 right-0 top-[40px] h-[1px] bg-slate-100 pointer-events-none"></div>
                                 <div className="absolute left-0 right-0 top-[80px] h-[1px] bg-slate-100 pointer-events-none"></div>

                                 {issues.map((issue, idx) => {
                                    const duration = videoRef.current?.duration || (issues.length > 0 ? Math.max(...issues.map(i => i.timestamp)) + 10 : 60);
                                    const positionPct = (issue.timestamp / duration) * 100;
                                    const topOffset = (idx % 3) * 40 + 4; // 3 lanes (0, 40px, 80px) + padding

                                    return (
                                     <div
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); jumpToTime(issue.timestamp); setActiveTab('annotations'); }}
                                        className="absolute h-8 flex items-center bg-white border border-slate-200 rounded-xl shadow-sm hover:border-violet-400 hover:shadow-md hover:z-40 cursor-pointer overflow-hidden transition-all group/pill"
                                        style={{ left: `${positionPct}%`, top: `${topOffset}px`, width: '180px' }}
                                     >
                                        <div className="h-full w-[3px] bg-violet-500 shrink-0"></div>
                                        <div className="flex-1 px-3 min-w-0 flex items-center gap-2 justify-between">
                                            <span className="text-[11px] font-medium text-slate-800 line-clamp-1 truncate" title={issue.description}>{(issue as any).category || issue.description}</span>
                                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded shrink-0 font-mono font-medium border border-emerald-100">{issue.estimatedCost}</span>
                                        </div>
                                     </div>
                                    );
                                 })}
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
          </div>
        </div>

        {/* Right Sidebar: Tabs & Content */}
        <div className="w-full md:w-[420px] bg-white flex flex-col shrink-0 z-10 border-l border-slate-200 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
           
           {/* Sidebar Tabs */}
           <div className="flex p-3 bg-white border-b border-slate-200 gap-2 shrink-0">
             <button 
               onClick={() => setActiveTab('annotations')} 
               className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'annotations' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
             >
               <MapPin className="w-4 h-4" /> Properties
             </button>
             <button 
               onClick={() => setActiveTab('chat')} 
               className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'chat' ? 'bg-violet-50 text-violet-700 shadow-sm border border-violet-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
             >
               <Sparkles className="w-4 h-4" /> AI Inquiry
             </button>
           </div>
           
           {activeTab === 'annotations' ? (
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 hide-scrollbar">
               {/* Summary Card */}
               <details className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" open>
                   <summary className="px-4 py-3 cursor-pointer font-bold text-slate-800 text-sm flex justify-between items-center bg-slate-50 border-b border-white group-open:border-slate-100 transition-colors select-none">
                       Executive Summary
                       <span className="transform transition-transform text-slate-400 group-open:rotate-180">▼</span>
                   </summary>
                   <div className="p-4 text-sm text-slate-600 leading-relaxed bg-white">
                       {summary || (isAnalyzing ? "Analysis in progress..." : "No summary available.")}
                   </div>
               </details>

               <div className="flex items-center justify-between pt-2 px-1">
                   <h3 className="text-sm font-bold text-slate-700">Detected Anomalies ({issues.length})</h3>
               </div>

               {isAnalyzing && issues.length === 0 && (
                 <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
                   <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                   <p className="text-sm font-medium">Scanning video for issues...</p>
                 </div>
               )}

               <div className="space-y-3 pb-8">
                  {issues.map((issue, idx) => (
                    <details 
                      key={idx} 
                      className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      <summary 
                        onClick={() => jumpToTime(issue.timestamp)}
                        className="p-3 cursor-pointer flex items-start gap-3 hover:bg-slate-50 transition-colors select-none marker:content-none list-none"
                      >
                         <div className="w-[100px] h-[60px] bg-slate-100 rounded-md overflow-hidden shrink-0 relative border border-slate-200">
                           {issue.imageUrl ? (
                             <img src={issue.imageUrl} className="w-full h-full object-cover" alt="Thumb" />
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                               <Loader2 className="w-3.5 h-3.5 animate-spin opacity-50" />
                             </div>
                           )}
                           <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-mono font-medium px-1.5 py-0.5 rounded shadow-sm">
                             {formatTime(issue.timestamp)}
                           </div>
                         </div>
                         <div className="flex-1 min-w-0 pr-4 relative">
                            <h4 className="font-semibold text-slate-800 text-sm leading-tight mb-1 truncate pr-16">{issue.description}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1 truncate">{issue.reasoning}</p>
                            <span className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-100/50">{issue.estimatedCost}</span>
                         </div>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-open:rotate-180 transition-transform">
                            ▼
                         </div>
                      </summary>
                      
                      {/* Expanded Content */}
                      <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/30">
                         <p className="text-sm text-slate-600 mb-4 leading-relaxed">{issue.reasoning}</p>
                         <div className="flex items-center justify-between">
                            <button onClick={() => jumpToTime(issue.timestamp)} className="text-violet-600 hover:bg-violet-50 font-medium text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-violet-100">
                              <Play className="w-3.5 h-3.5 fill-current" /> Play Segment
                            </button>
                            <button 
                              onClick={() => { setActiveTab('chat'); jumpToTime(issue.timestamp); }}
                              className="text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 font-medium text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-violet-500" /> Ask AI &rarr;
                            </button>
                         </div>
                      </div>
                    </details>
                  ))}
               </div>
             </div>
           ) : (
             <>
               {/* Chat List */}
               <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50 scroll-smooth flex flex-col relative w-full hide-scrollbar">
                  {chatMessages.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-32 text-slate-400 opacity-60">
                       <Sparkles className="w-8 h-8 mb-3" />
                       <span className="text-sm">Ask about any frame...</span>
                     </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full`}>
                      <div className={`w-fit max-w-[92%] rounded-2xl p-4 text-[13px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200'}`}>
                        {msg.imageUrl && (
                          <div className="mb-3 relative rounded-lg overflow-hidden border border-black/10 shadow-sm w-full">
                            <img src={msg.imageUrl} alt="Frame" className="w-full h-auto object-cover max-h-[160px]" />
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono border border-white/10">
                              {msg.timestamp !== undefined ? formatTime(msg.timestamp) : ''}
                            </div>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap word-break-words overflow-hidden" style={{ wordBreak: 'break-word'}}>{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex items-start">
                      <div className="bg-white rounded-[20px] rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1 border border-slate-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
               </div>

               {/* Dedicated Contextual Chat Input */}
               <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] shrink-0 max-w-full z-10 relative">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl flex flex-col focus-within:border-violet-400 focus-within:ring-[3px] focus-within:ring-violet-500/10 transition-all shadow-sm max-w-full">
                    
                    {/* Visual Frame Context Indicator */}
                    <div className="bg-slate-100/70 px-3 py-2 border-b border-slate-200 flex items-center justify-between border-dashed">
                       <div className="flex items-center gap-2">
                         <div className="w-5 h-4 bg-slate-800 rounded-sm flex items-center justify-center overflow-hidden shrink-0">
                           <Play className="w-2 h-2 text-white fill-current" />
                         </div>
                         <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                           Frame Locked <span className="text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded inline-block font-mono bg-white border border-slate-200 shadow-sm">{formatTime(currentTime)}</span>
                         </span>
                       </div>
                    </div>

                    <div className="flex items-end p-2 gap-2 bg-white rounded-b-xl">
                      <textarea 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Ask AI about this frame..."
                        className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-2.5 px-2 text-[13px] text-slate-800 placeholder:text-slate-400 hide-scrollbar w-full"
                        rows={1}
                      />
                      <button 
                        onClick={sendMessage}
                        disabled={!chatInput.trim() || isSending}
                        className="bg-violet-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-violet-700 text-white p-2.5 rounded-[10px] transition mb-0.5 shrink-0 shadow-sm cursor-pointer"
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  </div>
               </div>
             </>
           )}
        </div>
      </div>

      {showModelPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-200">
              <h3 className="text-xl font-display font-medium text-slate-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> API Quota Reached
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                You have exhausted your free quota for <strong>{selectedModel}</strong>. Please select a different model to continue.
              </p>
              
              <div className="mb-6">
                 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Select Alternative Model</label>
                 <select 
                   value={selectedModel} 
                   onChange={(e) => setSelectedModel(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                 >
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                 </select>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                 <button onClick={() => { setShowModelPopup(false); setPendingApiAction(null); }} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
                    Cancel
                 </button>
                 <button onClick={() => { setShowModelPopup(false); /* The useEffect will automatically re-trigger if pendingApiAction is analyze, or we can handle chat manually. But wait, for chat we need to manually retry if it was chat? */ if (pendingApiAction === 'chat') { sendMessage(); } /* analyze is handled by effect */ }} className="px-5 py-2.5 rounded-xl font-medium text-white bg-violet-600 hover:bg-violet-700 transition shadow-sm cursor-pointer border border-transparent">
                    Retry Request
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

