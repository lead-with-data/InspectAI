



import React, { useState, useEffect, useRef } from 'react';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, storage } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestore-error';
import { LogIn, Upload, Loader2, FileText, CheckCircle, AlertTriangle, AlertCircle, Eye, LogOut, Sparkles, Trash2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VideoWorkspace } from './components/VideoWorkspace';

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-violet-500/30 relative overflow-hidden flex flex-col">
      {/* Ambient Glows simulating NixtNode/ZeBeyond */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[150px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-display font-medium tracking-tight text-slate-900">{"}"} InspectAI</span>
        </div>
        <div className="flex gap-8 text-xs font-mono tracking-widest uppercase text-slate-500 items-center hidden md:flex">
          <span className="hover:text-violet-600 cursor-pointer transition">Services</span>
          <span className="hover:text-violet-600 cursor-pointer transition">Technology</span>
          <span className="hover:text-violet-600 cursor-pointer transition">Company</span>
        </div>
        <button onClick={onLogin} className="text-xs font-mono uppercase tracking-widest text-slate-700 hover:text-slate-900 transition-colors bg-white/50 hover:bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm">
          Get started
        </button>
      </nav>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-start px-4 sm:px-6 pt-16 pb-32">
        
        {/* NixtNode inspired Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-5xl flex flex-col items-center"
        >
          <h1 className="text-[3rem] sm:text-[5rem] md:text-[6.5rem] font-display font-medium tracking-tighter leading-[1] text-slate-900">
            <span className="text-slate-400 text-3xl sm:text-5xl font-light inline-block mb-2 sm:mb-4">{"} InspectAI"}</span> <br/>
            Is a Premier Inspection <br/>
            Intelligence Pr<span className="relative inline-block"><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-emerald-500">o</span><div className="absolute inset-0 bg-violet-400/20 blur-md rounded-full"></div></span>vider
          </h1>
          
          <div className="mt-12 w-full max-w-4xl flex justify-end text-left pr-4 md:pr-12">
            <div className="flex flex-col items-start md:items-end gap-6 max-w-md">
              <p className="text-slate-600 font-mono text-[10px] md:text-sm uppercase tracking-widest leading-relaxed border-l border-violet-500/50 pl-4 py-1">
                {"}"} Renowned for powering the backbone of property management ecosystems with state-of-the-art vision services, defect analysis & precise real-time cost estimation.
              </p>
              <button onClick={onLogin} className="text-xs font-mono uppercase tracking-widest text-white hover:bg-slate-800 transition-all bg-slate-900 px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Get started
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bento Box Features Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-24 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Large Card - The Home/Video UI */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-4 sm:p-8 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
              <h3 className="text-3xl font-display font-medium text-slate-900 leading-tight">Size and estimate<br/>property damage fast</h3>
              <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold font-mono uppercase tracking-widest rounded-full border border-emerald-100">Real-time Multimodal</span>
            </div>
            
            {/* Video Player Mockup */}
            <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden mb-6 sm:mb-8 shadow-inner">
              <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80" alt="House" className="w-full h-full object-cover opacity-50 mix-blend-luminosity" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
              
              {/* Bounding Box */}
              <div className="absolute top-[25%] left-[15%] w-[45%] h-[45%] border-[1.5px] border-emerald-400 bg-emerald-400/10 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <div className="absolute -top-7 left-[-1.5px] bg-emerald-400 text-white text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider flex items-center gap-2">
                  Water Damage <span className="text-emerald-100 font-mono">98.2%</span>
                </div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]"></div>
              </div>
              
              {/* Progress Bar */}
              <div className="absolute bottom-6 left-6 right-6 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center px-4 gap-4 shadow-lg">
                <div className="w-4 h-4 rounded-full bg-white flex-shrink-0 flex items-center justify-center shadow-sm">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
                </div>
                <div className="flex-grow h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="w-[40%] h-full bg-emerald-400 rounded-full relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow border border-emerald-500/30"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-start sm:justify-between">
              {['Automotive', 'Real Estate', 'Insurance', 'Construction', 'Restoration'].map((tab, i) => (
                <div key={tab} className={`px-4 sm:px-6 py-2.5 text-xs font-semibold rounded-xl border ${tab === 'Insurance' ? 'border-violet-200 bg-violet-50 text-violet-700 shadow-sm' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'}`}>
                  {tab}
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Small Cards */}
          <div className="flex flex-col gap-6">
            {/* Top Feature Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 flex flex-col justify-center relative overflow-hidden flex-1 group hover:border-violet-200 transition-colors">
              <div className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-6 flex justify-between items-center">
                Automated Extracted Issues
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                </div>
              </div>
              <h4 className="text-4xl font-display font-medium text-slate-900 mb-3 tracking-tight">Pinpoint Hazards</h4>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 font-light">
                Vision AI instantly scans your video feed to extract structural anomalies, logging physical defects without manual entry.
              </p>
              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div> Unique Hazards
                </div>
                <div className="text-[10px] font-bold text-violet-600 bg-violet-50 px-4 py-2 rounded-lg border border-violet-100 uppercase tracking-widest cursor-pointer hover:bg-violet-100 transition-colors">
                  View Detail →
                </div>
              </div>
            </div>
            
            {/* Bottom Feature Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 flex flex-col justify-center flex-1 group hover:border-emerald-200 transition-colors">
              <div className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-6">Current Repair Liability</div>
              <h4 className="text-4xl font-display font-medium text-emerald-600 mb-3 tracking-tight">Instant Estimates</h4>
              <p className="text-slate-500 text-sm leading-relaxed mb-6 font-light">
                Generates a baseline repair cost on the fly using historical contracting data, giving you an immediate financial assessment.
              </p>
              <div className="mt-auto flex items-baseline gap-2 pt-2">
                 <span className="text-emerald-600 font-mono text-[10px] font-bold uppercase tracking-widest border-b border-emerald-200/50 pb-1">Base Estimate Calculation</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}





export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingContext(false);
    });
    return unsub;
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error(err);
      alert("Failed to login");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loadingContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-900 selection:bg-violet-500/30 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/5 blur-[150px] pointer-events-none" />
      
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40 px-6 sm:px-8 py-4 sm:py-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-display font-medium tracking-tight text-slate-900">{"}"} InspectAI</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 bg-white border ${apiKeyError ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'} rounded-full px-4 py-2 transition-all`}>
             <input 
               type={showApiKey ? "text" : "password"}
               placeholder="Gemini API Key"
               value={apiKey}
               onChange={(e) => {
                 setApiKey(e.target.value);
                 setApiKeyError(false);
               }}
               className={`text-xs font-mono w-24 outline-none bg-transparent ${apiKeyError ? 'placeholder-rose-400 text-rose-600' : ''}`}
             />
             <button onClick={() => setShowApiKey(!showApiKey)} className="text-slate-400 hover:text-slate-600">
               {showApiKey ? <Eye className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
             </button>
          </div>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-xs font-mono uppercase tracking-widest text-slate-600 bg-white border border-slate-200 rounded-full px-4 py-2 hover:border-slate-300 transition-all outline-none"
          >
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
            <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
            <option value="gemini-pro-latest">Gemini Pro Latest</option>
            <option value="gemini-flash-latest">Gemini Flash Latest</option>
            <option value="gemini-flash-lite-latest">Gemini Flash-Lite Latest</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </select>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-500 hidden sm:block">{user.email}</span>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-slate-900 transition bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-grow w-full flex flex-col min-h-0 min-w-0">
        <Dashboard user={user} apiKey={apiKey} selectedModel={selectedModel} onApiError={() => setApiKeyError(true)} />
      </main>
    </div>
  );
}

function Dashboard({ user, apiKey, selectedModel, onApiError }: { user: User, apiKey: string, selectedModel: string, onApiError: () => void }) {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pricingGuidelines, setPricingGuidelines] = useState("");
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const d = await getDoc(doc(db, 'userSettings', user.uid));
        if (d.exists() && d.data().pricingGuidelines) {
          setPricingGuidelines(d.data().pricingGuidelines);
        }
      } catch (e) {
        console.error("Could not fetch userSettings", e);
      }
    };
    fetchSettings();
  }, [user]);

  const handleSaveGuidelines = async () => {
    setIsSavingPricing(true);
    try {
      await setDoc(doc(db, 'userSettings', user.uid), { pricingGuidelines }, { merge: true });
    } catch (e) {
      console.error(e);
    }
    setIsSavingPricing(false);
  };

  const processingSteps = [
    "Uploading secure payload...",
    "Extracting spatial keyframes...",
    "Running structural anomaly detection...",
    "Cross-referencing defect databases...",
    "Estimating localized repair costs...",
    "Drafting executive summary..."
  ];

  useEffect(() => {
    if (uploading) {
      const interval = setInterval(() => {
        setProcessingStep(prev => Math.min(prev + 1, processingSteps.length - 1));
      }, 4000); // cycle processing steps every 4 seconds
      return () => clearInterval(interval);
    } else {
      setProcessingStep(0);
    }
  }, [uploading, processingSteps.length]);


  useEffect(() => {
    let q;
    try {
      q = query(collection(db, 'inspections'), where('userId', '==', user.uid));
    } catch(err) {
      console.error(err);
      return; 
    }

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt instanceof Date ? a.createdAt.getTime() : Date.now());
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt instanceof Date ? b.createdAt.getTime() : Date.now());
        // Since Date.now() might make new items identical, if timeA == timeB, we can fallback to ID comparison or keep stable
        if (timeA === timeB) return b.id.localeCompare(a.id);
        return timeB - timeA;
      });
      setInspections(docs);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleDeleteInspection = async (e: React.MouseEvent, inspectionId: string) => {
    e.stopPropagation();
    // In an iframe, window.confirm can be blocked. Let's just allow deletion directly or provide a better custom UI.
    // For now, let's just delete it directly so the user can manage it.
    
    try {
      await deleteDoc(doc(db, 'inspections', inspectionId));
      if (selectedInspection?.id === inspectionId) {
        setSelectedInspection(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inspections/${inspectionId}`);
    }
  };

  // Workspace state
  const [activeVideoFile, setActiveVideoFile] = useState<File | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeWorkspaceInspection, setActiveWorkspaceInspection] = useState<any | null>(null);
  const [showWorkspace, setShowWorkspace] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (!apiKey) {
      alert("Please enter your Gemini API Key in the top right corner before uploading a video.");
      onApiError();
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const file = e.target.files[0];
    
    // Launch the video workspace
    const objectUrl = URL.createObjectURL(file);
    setActiveVideoFile(file);
    setActiveVideoUrl(objectUrl);
    setActiveWorkspaceInspection(null);
    setShowWorkspace(true);
    
    // Clear the input so clicking it again works
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeWorkspace = () => {
    setActiveVideoFile(null);
    if (activeVideoUrl) URL.revokeObjectURL(activeVideoUrl);
    setActiveVideoUrl(null);
    setActiveWorkspaceInspection(null);
    setShowWorkspace(false);
  };

  const hideWorkspace = () => {
    setShowWorkspace(false);
    setActiveWorkspaceInspection(null);
  };

  const openWorkspaceForInspection = (insp: any) => {
     setActiveWorkspaceInspection(insp);
     setActiveVideoUrl(insp.videoUrl || null);
     setShowWorkspace(true);
  };

  const handleSaveReport = async (issues: any[], summary: string, inspectionId?: string, onError?: (error: any) => void) => {
    try {
      console.log("Starting save report. Inspection ID:", inspectionId);
      if (inspectionId) {
        console.log("Updating existing report...");
        await updateDoc(doc(db, 'inspections', inspectionId), {
             updatedAt: serverTimestamp(),
             executiveSummary: summary,
             findings: issues,
             repairRecommendations: issues.map(i => i.description).join(', ')
           });
        console.log("Update complete.");
      } else {
        console.log("Creating new report. activeVideoFile:", activeVideoFile);
        if (!activeVideoFile) {
           throw new Error("No video file found to save.");
        }
        
        let videoUrl = null;
        try {
          console.log("Requesting R2 upload URL...");
          const res = await fetch("/api/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
               filename: activeVideoFile.name,
               contentType: activeVideoFile.type 
            })
          });
          
          if (!res.ok) throw new Error("Failed to get upload URL");
          
          const { uploadUrl, publicUrl } = await res.json();
          
          console.log("Uploading directly to Cloudflare R2...");
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": activeVideoFile.type },
            body: activeVideoFile
          });

          if (!uploadRes.ok) throw new Error("R2 upload failed");
          
          videoUrl = publicUrl;
          console.log("Video uploaded to R2:", videoUrl);
        } catch (e) {
          console.error("Failed to upload video to Cloudflare R2", e);
        }

        console.log("Adding document to Firestore 'inspections' collection...");
        await addDoc(collection(db, 'inspections'), {
          userId: user.uid,
          title: `VideoScan_${activeVideoFile.name.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 40)}`,
          status: 'completed',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          executiveSummary: summary,
          findings: issues,
          videoUrl: videoUrl,
          riskSummary: "Generated from video chat",
          repairRecommendations: issues.map(i => i.description).join(', '),
        });
        console.log("Document added successfully.");
      }
      closeWorkspace();
    } catch (e: any) {
      console.error("Error in handleSaveReport:", e);
      if (onError) onError(e);
      handleFirestoreError(e, OperationType.WRITE, 'inspections');
    }
  };


  if (selectedInspection && !showWorkspace) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <ReportView inspection={selectedInspection} onClose={() => setSelectedInspection(null)} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative w-full h-full min-h-0 min-w-0">
      <div className={`${showWorkspace ? 'hidden' : 'flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 md:px-6'}`}>
        
  
      <div className="grid grid-cols-1 gap-8 mt-2">
        {/* Upload Section - Modern Hero */}
        <section className="relative rounded-[2.5rem] overflow-hidden bg-slate-50 shadow-sm border border-slate-200/50 mb-4">
            {/* Colorful mesh gradient background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] bg-gradient-to-br from-violet-200 via-indigo-100 to-fuchsia-100 opacity-80 blur-3xl transform -rotate-12"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[100%] bg-gradient-to-tl from-emerald-100 via-teal-100 to-transparent blur-3xl rounded-full"></div>
                <div className="absolute top-[10%] right-[20%] w-[30%] h-[60%] bg-blue-100/60 blur-3xl rounded-full"></div>
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 p-8 sm:p-14 lg:p-16">
                {/* Left side text */}
                <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-white/40 backdrop-blur-md mb-8 shadow-sm">
                         <Sparkles className="w-4 h-4 text-violet-600" />
                         <span className="text-[11px] font-bold text-violet-700 uppercase tracking-widest">Vision AI Engine Active</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium text-slate-900 mb-6 tracking-tight leading-[1.1]">
                        Your properties.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Fully inspected.</span>
                    </h2>
                    <p className="text-slate-600 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                       Upload a walkthrough video. Our models will automatically map the property, identify code violations, and draft comprehensive repair estimates in real-time.
                    </p>
                </div>
                
                {/* Right side glass card */}
                <div className="w-full sm:w-auto shrink-0 z-20 relative px-4 sm:px-0">
                     {/* Decorative glass glow */}
                     <div className="absolute -inset-1 bg-gradient-to-b from-white/60 to-transparent rounded-[2.5rem] blur-xl opacity-50"></div>
                     
                     <div className="relative bg-white/70 border border-white/50 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 flex flex-col items-center justify-center gap-6 shadow-xl shadow-violet-900/5">
                        <div className="w-20 h-20 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                           <Upload className="w-8 h-8 -rotate-3" />
                        </div>
                        
                        <div className="text-center w-full max-w-[260px]">
                            <h3 className="text-slate-900 font-medium text-xl mb-1">Analyze Video</h3>
                            <p className="text-slate-500 text-sm mb-8">MP4, MOV, or WEBM accepted.</p>
                            
                            <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold py-4 px-6 transition-all hover:-translate-y-1 active:translate-y-0 shadow-lg flex items-center justify-center gap-2"
                            >
                              Browse Files
                            </button>
                            
                            {activeVideoFile && !showWorkspace && (
                               <button onClick={() => setShowWorkspace(true)} className="w-full mt-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-medium py-3.5 px-6 transition-all backdrop-blur-sm border border-slate-200 shadow-sm flex items-center justify-center gap-2">
                                  <Play className="w-4 h-4 fill-slate-700" />
                                  Resume Session
                               </button>
                            )}
                        </div>
                     </div>
                </div>
            </div>
        </section>

        {/* Pricing Guidelines Section */}
        <section className="bg-white rounded-3xl overflow-hidden flex flex-col shadow-sm border border-slate-200/60 relative p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
               <div>
                 <h2 className="font-display font-medium text-slate-900 text-2xl tracking-tight flex items-center gap-2">
                    Cost Estimations Context
                 </h2>
                 <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                   Provide rate estimates, labor costs, and generic pricing rules. AI will use these guidelines to make accurate localized pricing decisions when extracting damages.
                 </p>
               </div>
            </div>
            
            <div className="flex flex-col relative w-full">
               <textarea 
                  value={pricingGuidelines}
                  onChange={(e) => setPricingGuidelines(e.target.value)}
                  placeholder="e.g. Plumber labor is $120/hr, Paint is $50/gallon, drywall patches average $150. Use standard CA rates..."
                  className="w-full h-32 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none resize-none"
               />
               <div className="flex justify-end mt-4">
                 <button 
                   onClick={handleSaveGuidelines}
                   disabled={isSavingPricing}
                   className="px-6 py-2.5 rounded-xl font-medium text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                 >
                   {isSavingPricing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                   {isSavingPricing ? 'Saving...' : 'Save Context'}
                 </button>
               </div>
            </div>
        </section>

        {/* Recent Inspections Table-like view */}
        <section className="bg-white rounded-3xl overflow-hidden flex flex-col shadow-sm border border-slate-200/60 relative">
          {/* Subtle gradient to frame top */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-transparent"></div>
          
          <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-display font-medium text-slate-900 text-2xl tracking-tight">Recent Scans</h2>
              <p className="text-sm text-slate-500 mt-1">Review inspection reports and manage property insights.</p>
            </div>
            <div className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
               {inspections.length} recorded
            </div>
          </div>
          
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/30">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-violet-500" />
              <div className="text-sm font-medium">Loading history...</div>
            </div>
          ) : inspections.length === 0 ? (
            <div className="flex-1 py-24 px-8 flex flex-col items-center justify-center text-center bg-slate-50/50 m-6 rounded-2xl border border-slate-200/60 border-dashed">
              <div className="w-24 h-24 bg-white rounded-3xl border border-slate-100 flex items-center justify-center md:mb-8 shadow-sm rotate-3 transform transition-transform hover:rotate-6">
                <FileText className="w-10 h-10 text-slate-300 -rotate-3 transform" />
              </div>
              <p className="text-slate-800 font-display font-medium text-2xl mb-3 tracking-tight">Ready for your first scan</p>
              <p className="text-slate-500 max-w-md mx-auto text-[15px] leading-relaxed">Upload a walkthrough video above and our Vision AI will immediately begin processing liabilities, dimensions, and repairs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 sm:p-8">
              {inspections.map((insp) => (
                 <div
                   key={insp.id}
                   onClick={() => insp.status === 'completed' && openWorkspaceForInspection(insp)}
                   className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-lg transition cursor-pointer flex flex-col group relative overflow-hidden"
                 >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                       <div className={`w-12 h-12 flex items-center justify-center shrink-0 rounded-xl ${insp.status === 'completed' ? 'bg-violet-50 text-violet-600' : 'bg-slate-50 text-slate-400'}`}>
                          {insp.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : (insp.status === 'error' ? <AlertCircle className="w-6 h-6" /> : <Loader2 className="w-6 h-6 animate-spin" />)}
                       </div>
                       <div className="flex gap-2">
                           {insp.status === 'completed' && (
                             <button onClick={(e) => { e.stopPropagation(); setSelectedInspection(insp); }} className="px-3 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-50 rounded-lg border border-violet-100 transition-all bg-white shadow-sm flex items-center gap-1.5" title="View Report">
                                <FileText className="w-3.5 h-3.5" />
                                Report
                             </button>
                           )}
                           <button onClick={(e) => handleDeleteInspection(e, insp.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent" title="Delete Scan">
                              <Trash2 className="w-4 h-4" />
                           </button>
                       </div>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-1 mb-1 relative z-10">{insp.propertyAddress || insp.title || 'Untitled Inspection'}</h4>
                    <p className="text-sm text-slate-500 mb-6 relative z-10">{insp.createdAt?.toDate ? new Date(insp.createdAt.toDate()).toLocaleDateString() : 'Just now'}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-100 relative z-10">
                       <div className="flex flex-col">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Issues Found</div>
                          <div className="text-xl font-display font-medium text-slate-900">{insp.findings?.length || 0}</div>
                       </div>
                       <div className="flex flex-col">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Status</div>
                          <div className={`text-sm font-medium ${insp.status === 'completed' ? 'text-emerald-600' : 'text-amber-500'}`}>{insp.status === 'completed' ? 'Completed' : 'Processing'}</div>
                       </div>
                    </div>
                 </div>
              ))}
            </div>
          )}
        </section>
      </div>
      </div>

      {(activeVideoUrl || activeWorkspaceInspection) && (
        <div className={`${showWorkspace ? 'flex flex-col flex-1 w-full relative z-[5]' : 'hidden'}`}>
          <VideoWorkspace 
            videoFile={activeVideoFile} 
            videoUrl={activeVideoUrl} 
            inspection={activeWorkspaceInspection}
            pricingGuidelines={pricingGuidelines}
            apiKey={apiKey}
            selectedModel={selectedModel}
            onClose={hideWorkspace} 
            onSave={handleSaveReport} 
          />
        </div>
      )}
    </div>
  );
}

function ReportView({ inspection, onClose }: { inspection: any, onClose: () => void }) {
  const findings = inspection.findings || [];
  
  const [isExporting, setIsExporting] = useState(false);
  
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      doc.text(`Inspection Report: ${inspection.propertyAddress || inspection.title || 'Untitled'}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${inspection.createdAt?.toDate ? new Date(inspection.createdAt.toDate()).toLocaleDateString() : 'Recently'}`, 14, 22);
  
      doc.addPage();
      doc.text("Executive Summary", 14, 15);
      doc.setFontSize(10);
      doc.text(inspection.executiveSummary || 'No summary provided.', 14, 22, { maxWidth: 180 });
  
      doc.addPage();
      doc.text("Detailed Findings", 14, 15);
      
      const tableData = findings.map((f: any) => [
        f.description || 'N/A',
        f.estimatedCost || f.estimate_range || 'Unknown',
      ]);
      
      autoTable(doc, {
        startY: 20,
        head: [['Finding', 'Estimated Cost']],
        body: tableData,
      });
      
      doc.save(`Report_${inspection.title || 'Inspection'}.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export PDF: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="bg-white border text-left border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col w-full">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 text-xl tracking-tight mb-1">{inspection.propertyAddress || inspection.title || 'Inspection Report'}</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Generated on {inspection.createdAt?.toDate ? new Date(inspection.createdAt.toDate()).toLocaleDateString() : 'Recently'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="text-xs bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
             Back to Home
          </button>
          <button 
            onClick={exportToPDF} 
            disabled={isExporting}
            className="text-xs bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
          >
             {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
             {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>
      
      <div className="p-6 lg:p-8 flex flex-col gap-8 bg-slate-50/30">
        <section className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>
            Executive Summary
          </h3>
          <p className="text-[15px] text-slate-600 leading-relaxed">{inspection.executiveSummary || 'No executive summary provided.'}</p>
        </section>

        <section>
          <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Detailed Findings
            </h3>
            <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">{findings.length} ISSUES DETECTED</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {findings.length > 0 ? findings.map((finding: any, i: number) => (
               <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                  <div className="h-44 bg-slate-100 relative overflow-hidden border-b border-slate-100 shrink-0">
                    {finding.imageUrl ? (
                      <img src={finding.imageUrl} alt="Defect" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                         <span className="text-xs font-medium">No Image</span>
                      </div>
                    )}
                    {finding.timestamp !== undefined && (
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-[10px] font-mono font-medium px-2 py-1 rounded shadow-sm">
                        {Math.floor(finding.timestamp / 60)}:{(Math.floor(finding.timestamp % 60)).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h4 className="font-semibold text-slate-800 text-sm leading-snug">{finding.description || 'Unknown Issue'}</h4>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed mb-4 flex-1">{finding.reasoning || finding.description || 'No reasoning provided.'}</p>
                    
                    <div className="pt-4 border-t border-slate-100 bg-white mt-auto flex justify-between items-center">
                       <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estimated Cost</span>
                       <span className="bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold px-2 py-1 rounded border border-emerald-100/50">
                         {finding.estimatedCost || finding.estimate_range || 'Unknown'}
                       </span>
                    </div>
                  </div>
               </div>
            )) : (
              <div className="col-span-full p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
                 No defective findings detected.
              </div>
            )}
          </div>
        </section>

        <div className="p-4 bg-slate-900 rounded-xl text-white mt-4 border border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-2 relative z-10">
             <div className="w-2 h-2 rounded-full bg-violet-400"></div>
             <strong className="uppercase tracking-widest text-[10px] text-slate-300 font-bold">InspectAI Preliminary Report</strong>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed relative z-10 max-w-4xl">This report is generated by AI from a walkthrough video. All cost estimates and damage assessments must be verified by a licensed human professional. This is not a legal compliance authority substitute.</p>
        </div>
      </div>
    </div>
  );
}
