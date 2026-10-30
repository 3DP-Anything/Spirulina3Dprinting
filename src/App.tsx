/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useDeferredValue, useRef } from 'react';
import { ModelViewer } from './components/ModelViewer';
import { ParameterControls } from './components/ParameterControls';
import { GCodePlayerControls } from './components/GCodePlayerControls';
import { GCodeTextureControls } from './components/GCodeTextureControls';
import { SettingsAccessModal } from './components/SettingsAccessModal';
import { AboutAppModal } from './components/AboutAppModal';
import { PrintFlowTestSection } from './components/PrintFlowTestSection';
import { CursorSmiley } from './components/CursorSmiley';
import { ModelNameInput } from './components/ModelNameInput';
import { CauldronIcon } from './components/CauldronIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, Settings, Info, Box, FileCode, Beaker, Upload, Save, FileDown, Route, Loader2, RotateCcw,
  PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight, AlertCircle, Smile, FileJson, Camera, FileText, RefreshCw,
  Pause, Play, Sparkles, Lock, Unlock, Eye, Check, ZoomIn, ZoomOut, Maximize2, X, ChevronDown, ChevronUp, Youtube
} from 'lucide-react';
import { ModelParams, PrinterSettings, TextureType, DEFAULT_MODEL_PARAMS, DEFAULT_PRINTER_SETTINGS } from './lib/types';
import { RESTRICT_SETTINGS_ACCESS, YOUTUBE_CHANNEL_URL, PASTE_RECIPE_PDF_URL, PASTE_RECIPE_PDF_FILE_NAME, getPdfUrl } from './parameters/index';
import { generateGCode, generateTestFlowGCode } from './lib/gcode';
import { downloadGCode, exportToSTL } from './lib/export';
import { parseGCode, getGCodeExplanation, formatTime } from './lib/gcode-parser';
import { checkExceedsBuildVolume } from './lib/geometry';
import { motion, AnimatePresence } from 'motion/react';
import { Switch } from '@/components/ui/switch';
import { translations, UKFlagSVG, WelshFlagSVG } from './lib/i18n';
import { ProjectLogoAnimated } from './components/ProjectLogoAnimated';
import { jsPDF } from "jspdf";

// Shared Dialogue configurations are now handled inside the CursorSmiley component

// CursorSmiley is imported from helper component node at the top level of the module

export default function App() {
  const [language, setLanguage] = useState<'en' | 'cy'>('en');
  
  const t = (key: string) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const getStlQualityLabel = (val: number | string | undefined) => {
    const numVal = typeof val === 'number' ? val : val === 'low' ? 0.5 : val === 'high' ? 2.0 : 1.0;
    if (numVal < 0.70) return language === 'cy' ? 'Isel (Ffased)' : 'Low (Faceted)';
    if (numVal > 1.30) return language === 'cy' ? 'Uchel (Llyfn)' : 'High (Smooth)';
    return language === 'cy' ? 'Diofyn (Cytbwys)' : 'Default (Balanced)';
  };

  const [params, setParams] = useState<ModelParams>(DEFAULT_MODEL_PARAMS);
  const exceedsBuildVolume = useMemo(() => {
    return checkExceedsBuildVolume(params);
  }, [params]);
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);

  const [sizeRestrictionWarning, setSizeRestrictionWarning] = useState<boolean>(false);

  useEffect(() => {
    if (sizeRestrictionWarning) {
      const timer = setTimeout(() => {
        setSizeRestrictionWarning(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sizeRestrictionWarning]);

  const handleParamsChange = (newParams: ModelParams | ((prev: ModelParams) => ModelParams)) => {
    setParams((prev) => {
      const nextParams = typeof newParams === 'function' ? newParams(prev) : newParams;
      if (settings.limitToBuildVolume && checkExceedsBuildVolume(nextParams)) {
        setSizeRestrictionWarning(true);
        return prev;
      }
      return nextParams;
    });
  };
  const [localSettings, setLocalSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [isSettingsAuthModalOpen, setIsSettingsAuthModalOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [startGcodeCollapsed, setStartGcodeCollapsed] = useState(true);
  const [endGcodeCollapsed, setEndGcodeCollapsed] = useState(true);
  const [isSmileyActive, setIsSmileyActive] = useState(true);
  const [activeTab, setActiveTab] = useState('model');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  const sidebarBg = showSettings 
    ? 'bg-[#404040]' 
    : activeTab === 'model' 
      ? 'bg-[#F0FDF4]' 
      : activeTab === 'gcode' 
        ? 'bg-[#FFFBEB]' 
        : activeTab === 'save' 
          ? 'bg-[#FFF7ED]' 
          : 'bg-[#FAF8F5]';

  const [gcode, setGcode] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcProgress, setCalcProgress] = useState(0);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [exportFileName, setExportFileName] = useState(DEFAULT_PRINTER_SETTINGS.modelName || 'model');

  const handleFileNameChange = (val: string) => {
    setExportFileName(val);
    setStlFileName(val);
    setSaveModelName(val);
    setLastGeneratedFileName(val);
    // Dynamically update the Model Name comment line in existing G-code if already generated
    setGcode((prev) => {
      if (!prev) return prev;
      return prev.replace(/^; Model Name: .*$/m, `; Model Name: ${val || 'MODEL'}`);
    });
  };

  const getGCodeDownloadFileName = (baseName: string) => {
    return baseName || 'model';
  };

  // G-code Playback State
  const [playhead, setPlayhead] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [viewMode, setViewMode] = useState<'path' | 'material'>('path');
  const lastTimeRef = useRef(performance.now());

  // Parse G-code whenever it changes
  const gcodeData = useMemo(() => parseGCode(gcode), [gcode]);

  // Track if current gcode is consistent with current params and settings
  const [lastGeneratedParams, setLastGeneratedParams] = useState<ModelParams | null>(null);
  const [lastGeneratedSettings, setLastGeneratedSettings] = useState<PrinterSettings | null>(null);

  // States for top bar interactive minimized state & G-code status animation
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null);
  const [hoveredExportId, setHoveredExportId] = useState<string | null>(null);
  const [visualProgress, setVisualProgress] = useState(100);
  const visualProgressRef = useRef(100);
  const updateVisualProgress = (val: number) => {
    setVisualProgress(val);
    visualProgressRef.current = val;
  };
  const [isVisualLoading, setIsVisualLoading] = useState(false);

  // Mouse drag-to-scroll for the workflow navigation bar
  const navScrollRef = useRef<HTMLDivElement>(null);
  const [isNavDragging, setIsNavDragging] = useState(false);
  const [navStartX, setNavStartX] = useState(0);
  const [navScrollLeft, setNavScrollLeft] = useState(0);

  const handleNavMouseDown = (e: React.MouseEvent) => {
    if (!navScrollRef.current) return;
    setIsNavDragging(true);
    setNavStartX(e.pageX - navScrollRef.current.offsetLeft);
    setNavScrollLeft(navScrollRef.current.scrollLeft);
  };

  const handleNavMouseLeaveOrUp = () => {
    setIsNavDragging(false);
  };

  const handleNavMouseMove = (e: React.MouseEvent) => {
    if (!isNavDragging || !navScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - navScrollRef.current.offsetLeft;
    const walk = (x - navStartX) * 1.5; // drag sensitivity multiplier
    navScrollRef.current.scrollLeft = navScrollLeft - walk;
  };

  // Re-calculate G-code
  const handleRecalculateGCode = () => {
    setLastGeneratedParams(null);
    setLastGeneratedSettings(null);
    setPlayhead(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (isCalculating) {
      setIsVisualLoading(true);
      updateVisualProgress(0);
    }
  }, [isCalculating]);

  useEffect(() => {
    if (!isVisualLoading) return;

    let animationFrameId: number;
    let startTime = Date.now();
    
    // If calculation already completed when the effect initializes, backtrace start time to make the progression smooth
    if (!isCalculating && visualProgressRef.current > 0) {
      startTime = Date.now() - (visualProgressRef.current / 100) * 2000;
    }

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      
      if (isCalculating) {
        // While generating, smoothly ramp up to 90% over 1.8 seconds.
        // If it takes longer, asymptotically proceed towards 95% so it never hits 100% prematurely.
        let progress = 0;
        if (elapsed < 1800) {
          progress = (elapsed / 1800) * 90;
        } else {
          progress = 90 + (1 - Math.exp(-(elapsed - 1800) / 3000)) * 5;
        }
        updateVisualProgress(Math.floor(progress));
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        // Once done, let's play the progress bar until at least 2.0 seconds have elapsed
        if (elapsed < 2000) {
          const progress = (elapsed / 2000) * 100;
          updateVisualProgress(Math.floor(progress));
          animationFrameId = requestAnimationFrame(updateProgress);
        } else {
          updateVisualProgress(100);
          // Wait a brief tick for the 100% animation, then auto-hide
          const timerId = setTimeout(() => {
            setIsVisualLoading(false);
          }, 150);
          return () => clearTimeout(timerId);
        }
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isVisualLoading, isCalculating]);

  useEffect(() => {
    setActiveTab('model');
    setIsSidebarCollapsed(false);
  }, []);

  // Use deferred params to prevent the 3D viewer from blocking the input thread
  const deferredParams = useDeferredValue(params);

  // Initialize local settings when panel opens
  useEffect(() => {
    if (showSettings) {
      setLocalSettings(settings);
    }
  }, [showSettings, settings]);

  const [lastGeneratedFileName, setLastGeneratedFileName] = useState(exportFileName);

  // Check if G-code needs recalculation (only geometry/params and printer settings affect toolpaths)
  const isGcodeStale = useMemo(() => {
    const paramsChanged = JSON.stringify(params) !== JSON.stringify(lastGeneratedParams);
    const settingsChanged = JSON.stringify(settings) !== JSON.stringify(lastGeneratedSettings);
    return paramsChanged || settingsChanged;
  }, [params, lastGeneratedParams, settings, lastGeneratedSettings]);

  // Handle G-Code generation
  useEffect(() => {
    if (activeTab !== 'gcode' && activeTab !== 'save') return;
    if (!isGcodeStale && gcode) return;

    let isMounted = true;
    
    const runCalculation = async () => {
      setIsCalculating(true);
      setCalcProgress(0);
      
      try {
        const generated = await generateGCode(deferredParams, settings, (p) => {
          if (isMounted) setCalcProgress(p);
        }, exportFileName);
        
        if (isMounted) {
          setGcode(generated);
          setLastGeneratedParams(deferredParams);
          setLastGeneratedSettings(settings);
          setLastGeneratedFileName(exportFileName);
          setIsCalculating(false);
          // Auto-expand sidebar if it's collapsed when G-code is ready
          setIsSidebarCollapsed(false);
          // Set view to G-code
          setPlayhead(1);
        }
      } catch (error) {
        console.error("G-code generation failed", error);
        if (isMounted) setIsCalculating(false);
      }
    };

    const timer = setTimeout(runCalculation, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [deferredParams, settings, activeTab, isGcodeStale, gcode, exportFileName]);

  // Playback Loop
  useEffect(() => {
    let frameId: number;
    const animate = (time: number) => {
      if (isPlaying && gcodeData.points.length > 1 && gcodeData.totalDistance > 0) {
        const delta = (time - lastTimeRef.current) / 1000;
        const speed = settings.speed || 10;
        const step = (speed * playbackSpeed * 16) / gcodeData.totalDistance; 
        
        if (isFinite(step) && !isNaN(delta) && delta > 0) {
          setPlayhead(prev => {
            let next = prev + step * delta;
            if (next >= 1) {
              setIsPlaying(false);
              next = 1;
            }
            return next;
          });
        }
      }
      lastTimeRef.current = time;
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, gcodeData, playbackSpeed, settings.speed]);

  const currentLineIndex = useMemo(() => {
    const { cumulativeDistances, totalDistance, gcodeLines, movementToLineMap } = gcodeData;
    if (!gcodeLines.length || !cumulativeDistances.length || totalDistance === 0) return 0;
    const progressVal = isNaN(playhead) ? 0 : Math.max(0, Math.min(1, playhead));
    const targetDist = progressVal * totalDistance;
    
    let low = 0;
    let high = cumulativeDistances.length - 1;
    let moveIdx = 0;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (cumulativeDistances[mid] >= targetDist - 0.0001) {
        moveIdx = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return Math.max(0, movementToLineMap[moveIdx] || 0);
  }, [gcodeData, playhead]);

  const lastLayerComment = useMemo(() => {
    const { gcodeLines } = gcodeData;
    for (let i = currentLineIndex; i >= 0; i--) {
      const line = gcodeLines[i]?.trim();
      if (line?.toLowerCase().includes('layer')) {
        const match = line.match(/layer\s*(\d+)/i);
        if (match) return `Layer ${match[1]}`;
        const match2 = line.match(/layer(\d+)/i);
        if (match2) return `Layer ${match2[1]}`;
        return line.startsWith(';') ? line.substring(1).trim() : line;
      }
    }
    return null;
  }, [gcodeData, currentLineIndex]);

  const currentLayerNumber = useMemo(() => {
    if (!lastLayerComment) return 0;
    const match = lastLayerComment.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }, [lastLayerComment]);

  const totalLayersInfo = useMemo(() => {
    const { gcodeLines } = gcodeData;
    let maxLayerNum = 0;
    for (let i = 0; i < gcodeLines.length; i++) {
      const line = gcodeLines[i]?.trim();
      if (line && line.toLowerCase().includes('layer')) {
        const match = line.match(/layer\s*(\d+)/i);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxLayerNum) maxLayerNum = num;
        }
        const match2 = line.match(/layer(\d+)/i);
        if (match2) {
          const num2 = parseInt(match2[1]);
          if (num2 > maxLayerNum) maxLayerNum = num2;
        }
      }
    }
    if (maxLayerNum === 0) {
      const zStart = settings.baseLayers * settings.layerHeight;
      const layers = Math.ceil((params.height - zStart) / settings.layerHeight);
      maxLayerNum = settings.baseLayers + layers;
    }
    return maxLayerNum;
  }, [gcodeData, params.height, settings.baseLayers, settings.layerHeight]);

  const goToLine = (index: number) => {
    const { gcodeLines, cumulativeDistances, totalDistance } = gcodeData;
    if (!gcodeLines.length || !cumulativeDistances.length || totalDistance === 0) return;
    setIsPlaying(false);
    
    const targetLine = Math.max(0, Math.min(gcodeLines.length - 1, index));
    // To land on targetLine, we want a targetDist such that:
    // cumulativeDistances[targetLine-1] < targetDist <= cumulativeDistances[targetLine]
    const prevDist = targetLine > 0 ? (cumulativeDistances[targetLine - 1] || 0) : 0;
    const currentDist = cumulativeDistances[targetLine] || prevDist;
    
    // Jump to the safe start of the line's segment
    const targetDist = prevDist + Math.min(0.01, (currentDist - prevDist) * 0.1);
    setPlayhead(totalDistance > 0 ? Math.max(0, Math.min(1, targetDist / totalDistance)) : 0);
  };

  const jumpToLayer = (direction: 'next' | 'prev') => {
    const { gcodeLines } = gcodeData;
    if (!gcodeLines.length) return;
    setIsPlaying(false);
    
    if (direction === 'next') {
      for (let i = currentLineIndex + 1; i < gcodeLines.length; i++) {
        const line = gcodeLines[i].toLowerCase();
        if (line.includes('; layer') || (line.startsWith(';') && line.includes('layer'))) {
          goToLine(i);
          return;
        }
      }
      goToLine(gcodeLines.length - 1);
    } else {
      let currentLayerTagIndex = -1;
      for (let i = currentLineIndex; i >= 0; i--) {
        const line = gcodeLines[i].toLowerCase();
        if (line.includes('; layer') || (line.startsWith(';') && line.includes('layer'))) {
          currentLayerTagIndex = i;
          break;
        }
      }

      const isAtLayerStart = currentLayerTagIndex !== -1 && (currentLineIndex - currentLayerTagIndex) < 10;
      if (isAtLayerStart && currentLayerTagIndex !== -1) {
        for (let i = currentLayerTagIndex - 1; i >= 0; i--) {
          const line = gcodeLines[i].toLowerCase();
          if (line.includes('; layer') || (line.startsWith(';') && line.includes('layer'))) {
            goToLine(i);
            return;
          }
        }
        goToLine(0);
      } else if (currentLayerTagIndex !== -1) {
        goToLine(currentLayerTagIndex);
      } else {
        goToLine(0);
      }
    }
  };

  const currentBuildTimeSeconds = isFinite(gcodeData.totalDistance) ? (playhead * gcodeData.totalDistance) / (settings.speed || 1) : 0;
  const totalBuildTimeSeconds = isFinite(gcodeData.totalDistance) && gcodeData.totalDistance > 0 ? gcodeData.totalDistance / (settings.speed || 1) : 0;

  const [showSTLDialog, setShowSTLDialog] = useState(false);
  const [stlThickness, setStlThickness] = useState(1.2);
  const [stlFileName, setStlFileName] = useState(DEFAULT_PRINTER_SETTINGS.modelName || 'model');
  const [isStlPreviewOn, setIsStlPreviewOn] = useState(false);
  const [is3mfPreviewOn, setIs3mfPreviewOn] = useState(false);

  // New Custom States for Model Picture and Technical Drawing
  const [showA4SheetIn3D, setShowA4SheetIn3D] = useState(false);
  const [modelPicFormat, setModelPicFormat] = useState<'jpeg' | 'png' | 'pdf'>('jpeg');
  const [techDrawingDesigner, setTechDrawingDesigner] = useState('');
  const [techDrawingFormat, setTechDrawingFormat] = useState<'jpeg' | 'png' | 'pdf' | 'svg'>('jpeg');
  const [isTechDrawingActive, setIsTechDrawingActive] = useState(false);
  const [techDrawingPreviewUrl, setTechDrawingPreviewUrl] = useState<string | null>(null);

  const [selectedControls, setSelectedControls] = useState({
    grid: true,
    basePlate: true,
    axis: true,
    buildVolume: true
  });

  useEffect(() => {
    const handleSync = (e: any) => {
      setSelectedControls({
        grid: !!e.detail?.grid,
        basePlate: !!e.detail?.basePlate,
        axis: !!e.detail?.axis,
        buildVolume: !!e.detail?.buildVolume
      });
    };
    const handleClosePreview = () => {
      setShowA4SheetIn3D(false);
    };
    const handleCloseTech = () => {
      setIsTechDrawingActive(false);
    };
    window.addEventListener('view-controls-sync', handleSync);
    window.addEventListener('close-model-picture-preview', handleClosePreview);
    window.addEventListener('close-tech-drawing-preview', handleCloseTech);
    return () => {
      window.removeEventListener('view-controls-sync', handleSync);
      window.removeEventListener('close-model-picture-preview', handleClosePreview);
      window.removeEventListener('close-tech-drawing-preview', handleCloseTech);
    };
  }, []);

  useEffect(() => {
    setIsStlPreviewOn(false);
    setIs3mfPreviewOn(false);
    setShowA4SheetIn3D(false);
    setIsTechDrawingActive(false);
  }, [activeTab, showSettings]);

  // Live WYSIWYG technical drawing generator
  useEffect(() => {
    const triggerExport = () => {
      window.dispatchEvent(new CustomEvent('export-picture', { 
        detail: { 
          fileName: exportFileName,
          a4: true,
          frame: true,
          titleBox: true,
          date: true,
          views2D: true,
          grid: false,
          basePlate: false,
          axis: false,
          buildVolume: false,
          designer: techDrawingDesigner,
          scale: 'Auto',
          format: 'jpeg',
          isPreview: true
        } 
      }));
    };

    if (isTechDrawingActive) {
      const timer = setTimeout(triggerExport, 300);

      // Trigger immediately when the screenshot exporter is fully mounted and ready
      const handleExporterReady = () => {
        triggerExport();
      };
      window.addEventListener('screenshot-exporter-ready', handleExporterReady);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('screenshot-exporter-ready', handleExporterReady);
      };
    } else {
      setTechDrawingPreviewUrl(null);
    }
  }, [
    isTechDrawingActive,
    techDrawingDesigner,
    exportFileName,
    deferredParams
  ]);

  const deactivateGridAndOthers = () => {
    setSelectedControls({
      grid: false,
      basePlate: false,
      axis: false,
      buildVolume: false
    });
  };

  // Direct WebGL canvas screenshot exporter
  const handleModelPictureExport = () => {
    deactivateGridAndOthers();
    window.dispatchEvent(new CustomEvent('export-picture', { 
      detail: { 
        fileName: exportFileName || "extruder",
        a4: true,
        frame: false,
        titleBox: false,
        date: false,
        views2D: false, // No 2D views or standard dimensions, just a blank A4 sheet composite!
        grid: false,
        basePlate: false,
        axis: false,
        buildVolume: false,
        designer: '',
        scale: 'Auto',
        format: modelPicFormat, // Selected format: jpeg, png, or pdf
        isPreview: false
      } 
    }));
  };

  const [showSaveModelDialog, setShowSaveModelDialog] = useState(false);
  const [saveModelName, setSaveModelName] = useState(DEFAULT_PRINTER_SETTINGS.modelName || 'model');

  const [savePicA4, setSavePicA4] = useState(true);
  const [savePicFrame, setSavePicFrame] = useState(false);
  const [savePicTitleBox, setSavePicTitleBox] = useState(false);
  const [savePicDate, setSavePicDate] = useState(false);
  const [savePic2DViews, setSavePic2DViews] = useState(false);
  const [savePicGrid, setSavePicGrid] = useState(false);
  const [savePicBasePlate, setSavePicBasePlate] = useState(false);
  const [savePicAxis, setSavePicAxis] = useState(false);
  const [savePicBuildVolume, setSavePicBuildVolume] = useState(false);
  const [savePicDesigner, setSavePicDesigner] = useState('');
  const [savePicScale, setSavePicScale] = useState('Auto');
  const [savePicFormat, setSavePicFormat] = useState<'jpeg' | 'pdf' | 'svg'>('jpeg');

  const allChecked = savePicFrame && savePicTitleBox && savePicDate && savePic2DViews && savePicGrid && savePicBasePlate && savePicAxis && savePicBuildVolume;

  const handleSelectAllChange = (checked: boolean) => {
    setSavePicFrame(checked);
    setSavePicTitleBox(checked);
    setSavePicDate(checked);
    setSavePic2DViews(checked);
    setSavePicGrid(checked);
    setSavePicBasePlate(checked);
    setSavePicAxis(checked);
    setSavePicBuildVolume(checked);
  };

  const sidebarAllChecked = savePicFrame && savePicTitleBox && savePicDate && savePic2DViews;

  const handleSidebarSelectAllChange = (checked: boolean) => {
    setSavePicFrame(checked);
    setSavePicTitleBox(checked);
    setSavePicDate(checked);
    setSavePic2DViews(checked);
  };

  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Synchronous preview generation when toggling options in real-time
  useEffect(() => {
    if (showPreviewModal) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('export-picture', { 
          detail: { 
            fileName: exportFileName,
            a4: savePicA4,
            frame: savePicFrame,
            titleBox: savePicTitleBox,
            date: savePicDate,
            views2D: savePic2DViews,
            grid: savePicGrid,
            basePlate: savePicBasePlate,
            axis: savePicAxis,
            buildVolume: savePicBuildVolume,
            designer: savePicDesigner,
            scale: savePicScale,
            format: savePicFormat,
            isPreview: true
          } 
        }));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [
    showPreviewModal,
    savePicA4,
    savePicFrame,
    savePicTitleBox,
    savePicDate,
    savePic2DViews,
    savePicGrid,
    savePicBasePlate,
    savePicAxis,
    savePicBuildVolume,
    savePicDesigner,
    savePicScale,
    savePicFormat,
    exportFileName
  ]);

  useEffect(() => {
    const handlePreview = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.dataUrl) {
         if (isTechDrawingActive) {
           setTechDrawingPreviewUrl(customEvent.detail.dataUrl);
         } else {
           setPreviewDataUrl(customEvent.detail.dataUrl);
           setShowPreviewModal(true);
         }
      }
    };
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.grid !== undefined) setSavePicGrid(customEvent.detail.grid);
        if (customEvent.detail.basePlate !== undefined) setSavePicBasePlate(customEvent.detail.basePlate);
        if (customEvent.detail.axis !== undefined) setSavePicAxis(customEvent.detail.axis);
        if (customEvent.detail.buildVolume !== undefined) setSavePicBuildVolume(customEvent.detail.buildVolume);
      }
    };
    window.addEventListener('drawing-preview-ready', handlePreview);
    window.addEventListener('view-controls-sync', handleSync);
    return () => {
      window.removeEventListener('drawing-preview-ready', handlePreview);
      window.removeEventListener('view-controls-sync', handleSync);
    };
  }, [isTechDrawingActive]);

  // Zoom & Pan states for the technical drawing preview modal
  const [zoomScale, setZoomScale] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Reset zoom & pan when opening modal
  useEffect(() => {
    if (showPreviewModal) {
      setZoomScale(1);
      setPanPos({ x: 0, y: 0 });
    }
  }, [showPreviewModal]);

  const handlePreviewMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
  };

  const handlePreviewMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanPos({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handlePreviewMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  const handlePreviewWheel = (e: React.WheelEvent) => {
    const zoomFactor = 0.15;
    let nextZoom = zoomScale + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
    nextZoom = Math.min(Math.max(nextZoom, 1), 6);
    setZoomScale(nextZoom);
    if (nextZoom === 1) {
      setPanPos({ x: 0, y: 0 });
    }
  };

  const handleSTLRequest = () => {
    setShowSTLDialog(true);
  };

  const confirmSTLExport = (thickness: number | null) => {
    deactivateGridAndOthers();
    setShowSTLDialog(false);
    const event = new CustomEvent('export-stl', { detail: { thickness, fileName: stlFileName } });
    window.dispatchEvent(event);
  };

  const confirm3MFExport = (thickness: number | null) => {
    deactivateGridAndOthers();
    setShowSTLDialog(false);
    const event = new CustomEvent('export-3mf', { detail: { thickness, fileName: stlFileName } });
    window.dispatchEvent(event);
  };

  const exportParams = (fileName: string) => {
    deactivateGridAndOthers();
    const currentSettings = showSettings ? localSettings : settings;
    const lines: string[] = [];

    // 1 - Model Settings
    lines.push('# 1 - Model Settings');
    const modelKeys = [
      'shapeType', 'sides', 'radius', 'height', 'rotation', 'draftAngle',
      'cornerRadius', 'taperSplitPoint', 'twistSplitPoint', 'bulgeSplitPoint',
      'color', 'bulge', 'neckSize',
      'starInnerRadiusRatio', 'flowerPetalDepth', 'gearToothDepth',
      'swooshCurvature', 'reverseSwoosh', 'flatSegments', 'stlQuality',
      'ribsEnabled', 'ribCount', 'ribDepth', 'ribWidth', 'ribInverse', 'ribProfile',
      'cubeMode', 'cubeX', 'cubeY', 'cubeZ'
    ];
    modelKeys.forEach((key) => {
      const val = (params as any)[key];
      if (val !== undefined && val !== null) {
        lines.push(`${key}: ${val}`);
      }
    });

    // 2 - Texture Settings
    lines.push('');
    lines.push('# 2 - Texture Settings');
    lines.push(`enableTexture: ${currentSettings.enableTexture !== undefined ? currentSettings.enableTexture : false}`);
    lines.push(`enableGcodeTexture: ${currentSettings.enableGcodeTexture !== undefined ? currentSettings.enableGcodeTexture : false}`);
    const textureKeys = [
      'textureType', 'reverseTexture', 'fadeTexture',
      'textureWaviness', 'textureDensity', 'textureFluting', 'textureDiamond',
      'scaleType', 'scaleSize', 'pixelSize', 'bubbleSize',
      'stripeCount', 'stripeProfile',
      'gcodeTextureEnabled', 'gcodeTextureDepth', 'gcodeTextureDivergence',
      'gcodeTextureFrequency', 'gcodeTextureLayerInterval', 'gcodeTextureWidth',
      'gcodeTextureAngleOffset'
    ];
    textureKeys.forEach((key) => {
      let val = (params as any)[key];
      if (key === 'gcodeTextureDepth' && val === undefined) {
        val = params.gcodeTextureDivergence ?? 2;
      }
      if (key === 'gcodeTextureDivergence' && val === undefined) {
        val = params.gcodeTextureDepth ?? 2;
      }
      if (val !== undefined && val !== null) {
        lines.push(`${key}: ${val}`);
      }
    });

    // 3 - 3D Printer Settings
    lines.push('');
    lines.push('# 3 - 3D Printer Settings');
    const printerKeys = [
      'pistonDiameter', 'depositionWidth', 'nozzleDiameter', 'layerHeight', 'extrusionWidth', 'speed',
      'extrusionMultiplier', 'flow', 'separateFlow', 'wallFlow', 'baseFlow',
      'eConstant', 'retractionDistance', 'baseLayers', 'wallCount', 'vaseMode',
      'scale', 'enableSkirt', 'skirtDistance', 'continuousExtrusion',
      'compensateWallShrinkage', 'wallShrinkageDraft',
      'lockRibDepth', 'lockRibWidth',
      'allowCustomSize', 'defaultWidth', 'defaultHeight', 'maxWidth', 'maxHeight',
      'limitToBuildVolume', 'cubeMode', 'testFlowBaseLineDistance', 'testFlowWallLineDistance', 'testFlowLineDistance', 'approachSpeed', 'exitSpeed', 'startGcode', 'endGcode'
    ];
    printerKeys.forEach((key) => {
      const val = (currentSettings as any)[key];
      if (val !== undefined && val !== null) {
        if (key === 'startGcode' || key === 'endGcode') {
          const escaped = String(val).replace(/\r/g, '').replace(/\n/g, '\\n');
          lines.push(`${key}: ${escaped}`);
        } else {
          lines.push(`${key}: ${val}`);
        }
      }
    });

    // Additional properties not in explicit lists
    const coveredModel = new Set([...modelKeys, ...textureKeys]);
    Object.entries(params).forEach(([key, value]) => {
      if (!coveredModel.has(key) && value !== undefined && value !== null) {
        lines.push(`${key}: ${value}`);
      }
    });
    const coveredPrinter = new Set([...printerKeys, 'enableTexture', 'enableGcodeTexture', 'restrictSettingsAccess', 'testFlowBaseGapMultiplier', 'testFlowWallGapMultiplier']);
    Object.entries(currentSettings).forEach(([key, value]) => {
      if (!coveredPrinter.has(key) && value !== undefined && value !== null) {
        lines.push(`${key}: ${value}`);
      }
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) return;

        const parsedData: Record<string, any> = {};

        // Try JSON parsing first
        try {
          const json = JSON.parse(content);
          if (json && typeof json === 'object' && !Array.isArray(json)) {
            Object.assign(parsedData, json);
          }
        } catch {
          // Key-Value parsing
          const lines = content.split(/\r?\n/);
          let currentMultilineKey: string | null = null;
          let multilineBuffer: string[] = [];

          const flushMultiline = () => {
            if (currentMultilineKey) {
              parsedData[currentMultilineKey] = multilineBuffer.join('\n');
              currentMultilineKey = null;
              multilineBuffer = [];
            }
          };

          for (const rawLine of lines) {
            const trimmed = rawLine.trim();
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || (trimmed.startsWith(';') && !trimmed.startsWith(';simage:'))) {
              continue;
            }

            const separatorIdx = rawLine.indexOf(':');
            if (separatorIdx !== -1) {
              const potentialKey = rawLine.slice(0, separatorIdx).trim();
              if (/^[a-zA-Z0-9_]+$/.test(potentialKey)) {
                flushMultiline();
                const rawValue = rawLine.slice(separatorIdx + 1).trim();
                if (potentialKey === 'startGcode' || potentialKey === 'endGcode') {
                  if (rawValue.includes('\\n')) {
                    parsedData[potentialKey] = rawValue.replace(/\\n/g, '\n');
                  } else {
                    currentMultilineKey = potentialKey;
                    multilineBuffer = [rawValue];
                  }
                } else {
                  parsedData[potentialKey] = rawValue;
                }
                continue;
              }
            }

            if (currentMultilineKey) {
              multilineBuffer.push(rawLine);
            }
          }
          flushMultiline();
        }

        // Convert raw string values to proper types (boolean, number, string)
        const typedData: Record<string, any> = {};
        for (const [k, v] of Object.entries(parsedData)) {
          if (v === undefined || v === null) continue;
          if (typeof v === 'boolean' || typeof v === 'number') {
            typedData[k] = v;
          } else if (typeof v === 'string') {
            const cleanStr = v.trim().replace(/^["']|["']$/g, '');
            const lower = cleanStr.toLowerCase();
            if (lower === 'true') {
              typedData[k] = true;
            } else if (lower === 'false') {
              typedData[k] = false;
            } else if (lower === 'null') {
              typedData[k] = null;
            } else if (k === 'color' || k === 'startGcode' || k === 'endGcode' || k === 'shapeType' || k === 'textureType' || k === 'scaleType' || k === 'stripeProfile' || k === 'ribProfile') {
              typedData[k] = cleanStr;
            } else if (k === 'stlQuality') {
              const num = Number(cleanStr);
              typedData[k] = !isNaN(num) ? num : cleanStr;
            } else {
              const num = Number(cleanStr);
              typedData[k] = (!isNaN(num) && cleanStr !== '') ? num : cleanStr;
            }
          }
        }

        const newParams: ModelParams = { ...DEFAULT_MODEL_PARAMS, ...params };
        const currentSettings = showSettings ? localSettings : settings;
        const newSettings: PrinterSettings = { ...DEFAULT_PRINTER_SETTINGS, ...currentSettings };

        const modelParamKeys = new Set([
          'shapeType', 'sides', 'radius', 'height', 'rotation', 'draftAngle',
          'cornerRadius', 'taperSplitPoint', 'twistSplitPoint', 'bulgeSplitPoint',
          'color', 'bulge', 'neckSize', 'textureType', 'reverseTexture',
          'fadeTexture', 'textureWaviness', 'textureDensity', 'textureFluting',
          'textureDiamond', 'scaleType', 'scaleSize', 'pixelSize', 'bubbleSize',
          'starInnerRadiusRatio', 'flowerPetalDepth', 'gearToothDepth',
          'swooshCurvature', 'reverseSwoosh', 'flatSegments', 'stlQuality',
          'ribsEnabled', 'ribCount', 'ribDepth', 'ribWidth', 'ribInverse', 'ribProfile',
          'stripeCount', 'stripeProfile', 'cubeMode', 'cubeX', 'cubeY', 'cubeZ',
          'gcodeTextureEnabled', 'gcodeTextureDepth', 'gcodeTextureDivergence', 'gcodeTextureFrequency',
          'gcodeTextureLayerInterval', 'gcodeTextureWidth', 'gcodeTextureAngleOffset'
        ]);

        const printerSettingKeys = new Set([
          'pistonDiameter', 'depositionWidth', 'nozzleDiameter', 'layerHeight', 'extrusionWidth', 'speed',
          'extrusionMultiplier', 'flow', 'separateFlow', 'wallFlow', 'baseFlow',
          'enableSkirt', 'skirtDistance', 'continuousExtrusion', 'compensateWallShrinkage', 'wallShrinkageDraft', 'scale', 'enableTexture', 'enableGcodeTexture', 'restrictSettingsAccess', 'testFlowBaseGapMultiplier', 'testFlowWallGapMultiplier',
          'testFlowBaseLineDistance', 'testFlowWallLineDistance', 'testFlowLineDistance',
          'autoNameModel', 'eConstant', 'retractionDistance',
          'lockRibDepth', 'lockRibWidth',
          'baseLayers', 'wallCount', 'vaseMode', 'startGcode', 'endGcode', 'allowCustomSize',
          'defaultWidth', 'defaultHeight', 'maxWidth', 'maxHeight',
          'limitToBuildVolume', 'cubeMode'
        ]);

        for (const [key, value] of Object.entries(typedData)) {
          if (value === undefined || value === null) continue;
          if (modelParamKeys.has(key) || key in DEFAULT_MODEL_PARAMS) {
            (newParams as any)[key] = value;
          }
          if (printerSettingKeys.has(key) || key in DEFAULT_PRINTER_SETTINGS) {
            (newSettings as any)[key] = value;
          }
        }

        // Synchronize depositionWidth, nozzleDiameter and extrusionWidth
        const importedDepWidth = typedData.depositionWidth ?? typedData.nozzleDiameter ?? typedData.extrusionWidth ?? newSettings.depositionWidth ?? newSettings.nozzleDiameter;
        if (importedDepWidth !== undefined) {
          newSettings.depositionWidth = importedDepWidth;
          newSettings.nozzleDiameter = importedDepWidth;
          newSettings.extrusionWidth = importedDepWidth;
        }

        // Synchronize cubeMode
        if (typedData.cubeMode !== undefined || newSettings.cubeMode || newParams.cubeMode) {
          const isCube = Boolean(typedData.cubeMode ?? newSettings.cubeMode ?? newParams.cubeMode);
          newSettings.cubeMode = isCube;
          newParams.cubeMode = isCube;
          if (isCube) {
            if (newParams.cubeX === undefined) newParams.cubeX = 30;
            if (newParams.cubeY === undefined) newParams.cubeY = 30;
            if (newParams.cubeZ === undefined) newParams.cubeZ = 30;
          }
        }

        // Synchronize custom size bounds and locked dimensions
        newSettings.maxWidth = newSettings.allowCustomSize ? 250 : 100;
        newSettings.maxHeight = newSettings.allowCustomSize ? 260 : 150;

        if (!newSettings.allowCustomSize) {
          if (typedData.defaultWidth !== undefined || typedData.radius === undefined) {
            newParams.radius = (newSettings.defaultWidth ?? 30) / 2;
          }
          if (typedData.defaultHeight !== undefined || typedData.height === undefined) {
            newParams.height = newSettings.defaultHeight ?? 30;
          }
        }

        // Validate build volume if enabled
        if (newSettings.limitToBuildVolume && checkExceedsBuildVolume(newParams)) {
          let attempts = 0;
          while (checkExceedsBuildVolume(newParams) && attempts < 100) {
            if (newParams.cubeMode) {
              if (newParams.cubeX && newParams.cubeX > 5) newParams.cubeX -= 0.5;
              if (newParams.cubeY && newParams.cubeY > 5) newParams.cubeY -= 0.5;
              if (newParams.cubeZ && newParams.cubeZ > 5) newParams.cubeZ -= 0.5;
            } else {
              if (newParams.radius > 5) newParams.radius -= 0.5;
              if (newParams.height > 5) newParams.height -= 0.5;
            }
            attempts++;
          }
        }

        setParams(newParams);
        setSettings(newSettings);
        setLocalSettings(newSettings);
      } catch (err) {
        console.error("Failed to parse configuration file", err);
        alert("Failed to parse configuration file");
      }
    };
    reader.readAsText(file);
    // Reset file input so selecting the same file triggers onChange
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FAF8F5] text-stone-900">
      {/* Top Nav */}
      <nav 
        className="h-[80px] bg-[#FAF8F5] flex items-center px-4 z-50 shrink-0 border-b border-stone-200 gap-2 md:gap-4 select-none overflow-visible"
      >
        <div className="flex items-center gap-2 shrink-0 h-full relative overflow-visible">
          <div className="flex items-center justify-center p-0 h-full relative w-[80px] overflow-visible shrink-0">
            <ProjectLogoAnimated size={80} />
          </div>
          <div className="flex flex-col justify-center select-none z-10 pr-2">
            <h1 className="text-[11.5px] font-black uppercase tracking-wider text-stone-900 leading-none">{t('appTitle')}</h1>
            <p className="text-[7px] font-black text-emerald-700 tracking-widest uppercase mt-1.5 whitespace-nowrap font-mono">{t('appSubTitle')}</p>
          </div>
        </div>

        {/* Workflow Progress Path Wrapper (Step design/calculate/print + save actions + dynamic utilities all slide seamlessly together!) */}
        <div 
          ref={navScrollRef}
          onMouseDown={handleNavMouseDown}
          onMouseLeave={handleNavMouseLeaveOrUp}
          onMouseUp={handleNavMouseLeaveOrUp}
          onMouseMove={handleNavMouseMove}
          onWheel={(e) => {
            if (navScrollRef.current) {
              navScrollRef.current.scrollLeft += e.deltaY;
            }
          }}
          className={`flex-1 h-full flex items-center justify-between gap-4 overflow-x-auto scrollbar-none select-none ${isNavDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          <div className="flex items-center gap-1 shrink-0">
            {[
              { 
                id: 'model', 
                label: t('stepDesign'), 
                active: activeTab === 'model', 
                stepNum: 1,
                tourId: 'step-1',
                color: '#15803D', // Forest eco-green
                inactiveColor: '#78716C', // Slate/stone gray
                glowClass: 'border-emerald-700/30 bg-emerald-50 text-emerald-800'
              },
              { 
                id: 'gcode', 
                label: t('stepCalculate'), 
                active: activeTab === 'gcode', 
                stepNum: 2,
                tourId: 'step-2',
                color: '#854D0E', // Warm earth amber/brown
                inactiveColor: '#78716C',
                glowClass: 'border-amber-700/30 bg-[#FEF3C7] text-amber-900'
              },
              { 
                id: 'save', 
                label: t('step3DPrint'), 
                active: activeTab === 'save', 
                stepNum: 3,
                tourId: 'step-3',
                color: '#EA580C', // Custom orange
                inactiveColor: '#78716C',
                glowClass: 'border-orange-600/30 bg-orange-50 text-orange-950 font-bold'
              }
            ].map((step, idx, arr) => {
              const isHovered = hoveredStepId === step.id;
              const isStepHighlighted = (step.id === 'model' && highlightedSection === 'design') ||
                                        (step.id === 'gcode' && highlightedSection === 'gcode') ||
                                        (step.id === 'save' && highlightedSection === 'save');
              const isExpanded = step.active || isHovered || isStepHighlighted;
              return (
                <React.Fragment key={step.id}>
                  <motion.div 
                    id={step.tourId}
                    role="button"
                    tabIndex={0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={() => setHoveredStepId(step.id)}
                    onMouseLeave={() => setHoveredStepId(null)}
                    onClick={() => {
                      setShowSettings(false);
                      setIsSidebarCollapsed(false);
                      setActiveTab(step.id as 'model' | 'gcode' | 'save');
                    }}
                    className={`flex items-center gap-1.5 h-9 transition-all duration-300 rounded-xl cursor-pointer outline-hidden group ${
                      isStepHighlighted
                        ? `ring-4 ring-${step.id === 'model' ? 'emerald' : step.id === 'gcode' ? 'amber' : 'orange'}-600/50 bg-${step.id === 'model' ? 'emerald' : step.id === 'gcode' ? 'amber' : 'orange'}-100 border-${step.id === 'model' ? 'emerald' : step.id === 'gcode' ? 'amber' : 'orange'}-600 scale-105`
                        : step.active 
                          ? step.glowClass + ' border shadow-xs text-stone-900 font-bold' 
                          : 'hover:bg-stone-200/50 border border-transparent text-stone-500'
                    } ${
                      isExpanded ? 'px-2.5 w-auto' : 'px-1.5 w-9 md:w-auto md:px-2.5'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                      isStepHighlighted
                        ? 'text-white'
                        : step.active 
                          ? 'text-white' 
                          : 'bg-stone-200 text-stone-600 border border-stone-300 group-hover:text-stone-800'
                    }`}
                    style={{ 
                      backgroundColor: isStepHighlighted ? step.color : (step.active ? step.color : undefined), 
                      borderColor: isStepHighlighted ? step.color : undefined 
                    }}
                    >
                      {step.id === 'gcode' && isCalculating ? (
                        <Loader2 className="w-3 h-3 animate-spin text-stone-600" />
                      ) : step.stepNum}
                    </div>
                    <div className={`flex flex-col items-start translate-y-[2px] transition-all duration-300 ${
                      isExpanded ? 'flex opacity-100 max-w-[100px]' : 'hidden md:flex md:opacity-100 md:max-w-[100px] overflow-hidden'
                    }`}>
                      <span 
                        className="text-[8.5px] font-black uppercase tracking-widest transition-all duration-300 leading-none whitespace-nowrap"
                        style={{ color: step.active ? '#1c1917' : step.inactiveColor }}
                      >
                        {step.label}
                      </span>
                      {step.id === 'gcode' && isCalculating && (
                        <div className="flex items-center gap-1 mt-0.5 w-[60px]">
                          <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-emerald-600 to-amber-600"
                              initial={{ width: 0 }}
                              animate={{ width: `${calcProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                  {idx < arr.length - 1 && (
                    <div className="flex items-center gap-0 mx-1">
                      {[0, 1, 2].map((i) => {
                        const chevronColor = idx === 0 
                          ? (i === 0 ? '#15803D' : (i === 1 ? '#0EA5E9' : '#8B5CF6'))
                          : (i === 0 ? '#854D0E' : (i === 1 ? '#D97706' : '#059669'));
                        return (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 0.8, 0.3] }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 1.2, 
                              delay: i * 0.15,
                              ease: "easeInOut" 
                            }}
                            className="-ml-1 first:ml-0"
                            style={{ color: chevronColor }}
                          >
                            <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={3} />
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
  
          <div id="import-container" className="flex items-center justify-center pl-2 shrink-0">
            <label
              className={`flex items-center justify-center gap-2 h-9 border text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer px-3.5 shrink-0 ${
                highlightedSection === 'subsec_import_hover' || highlightedSection === 'subsec-import'
                  ? 'ring-4 ring-neutral-900/40 bg-zinc-600 border-[#1a1a1a] scale-105 shadow-[0_0_25px_rgba(0,0,0,0.3)]'
                  : 'bg-[#7F7F7F] border-[#404040] hover:bg-[#7F7F7F]/90 hover:border-[#404040]/80 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] active:scale-95'
              }`}
              title={language === 'cy' ? "Mewnforio ffeil paramedrau model (.cup)" : "Import model parameter file (.cup)"}
            >
              <Upload className="w-3.5 h-3.5 text-white" />
              <span>{language === 'cy' ? 'Mewnforio Model' : 'Import Model'}</span>
              <input type="file" accept=".txt,.cup,.cfg,.json,*" onChange={importConfig} className="hidden" />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0 pr-1 select-none">
            {/* Cauldron Recipe Link - Spirulina 3D Printing Paste Recipe */}
            <a
              id="recipe-cauldron-link"
              href={PASTE_RECIPE_PDF_URL}
              onPointerDown={(e) => {
                const fresh = getPdfUrl(PASTE_RECIPE_PDF_FILE_NAME);
                e.currentTarget.href = fresh;
              }}
              onClick={(e) => {
                const fresh = getPdfUrl(PASTE_RECIPE_PDF_FILE_NAME);
                e.currentTarget.href = fresh;
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center w-9 h-9 border rounded-xl transition-all cursor-pointer shrink-0 bg-[#7F7F7F] border-[#404040] hover:border-[#404040]/80 hover:bg-[#7F7F7F]/90 text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] active:scale-95"
              title={language === 'cy' ? "Rysáit Past Argraffu 3D Spirulina (PDF)" : "Spirulina 3D Printing Paste Recipe (PDF)"}
              aria-label="Spirulina 3D Printing Paste Recipe PDF"
            >
              <CauldronIcon className="w-4 h-4 shrink-0 text-white group-hover:text-emerald-300 transition-colors" />
            </a>

            {/* YouTube Channel Link */}
            <a
              id="youtube-channel-link"
              href={YOUTUBE_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center w-9 h-9 border rounded-xl transition-all cursor-pointer shrink-0 bg-[#7F7F7F] border-[#404040] hover:border-[#404040]/80 hover:bg-[#7F7F7F]/90 text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] active:scale-95"
              title={language === 'cy' ? "Sianel YouTube" : "YouTube Channel"}
              aria-label="YouTube Channel"
            >
              <Youtube className="w-4 h-4 shrink-0 text-white group-hover:text-red-400 transition-colors" />
            </a>

            {/* Welsh / British Toggle button */}
            <button
              id="language-toggle-container"
              onClick={() => setLanguage(language === 'en' ? 'cy' : 'en')}
              className={`group flex p-1 border rounded-xl transition-all cursor-pointer items-center gap-1.5 h-9 shrink-0 ${
                highlightedSection === 'subsec_language_hover' || highlightedSection === 'subsec-language'
                  ? 'ring-4 ring-neutral-900/40 bg-zinc-600 border-[#1a1a1a] scale-105 shadow-[0_0_25px_rgba(0,0,0,0.3)] text-white'
                  : 'bg-[#7F7F7F] border-[#404040] hover:border-[#404040]/80 hover:bg-[#7F7F7F]/90 text-white'
              }`}
              title={language === 'en' ? "Newid i'r Gymraeg" : "Switch to English"}
            >
              <div className={`p-0.5 rounded-full ${language === 'cy' ? 'bg-white/20 ring-1 ring-white/30' : 'opacity-45'} shrink-0`}>
                <WelshFlagSVG />
              </div>
              <div className={`p-0.5 rounded-full ${language === 'en' ? 'bg-white/20 ring-1 ring-white/30' : 'opacity-45'} shrink-0`}>
                <UKFlagSVG />
              </div>
            </button>

            <button 
              id="smiley-toggle-container"
              onClick={() => setIsSmileyActive(!isSmileyActive)}
              className={`group flex items-center justify-center w-9 h-9 border rounded-xl transition-all cursor-pointer shrink-0 ${
                highlightedSection === 'subsec_smiley_hover' || highlightedSection === 'subsec-smiley'
                  ? 'ring-4 ring-neutral-900/40 bg-zinc-600 border-[#1a1a1a] scale-105 shadow-[0_0_25px_rgba(0,0,0,0.3)] text-white'
                  : isSmileyActive 
                    ? 'bg-[#7F7F7F] border-[#404040] text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] hover:bg-[#7F7F7F]/90' 
                    : 'bg-[#7F7F7F] border-[#404040] text-white/70 hover:text-white hover:border-[#404040]/80'
              }`}
              title={isSmileyActive ? t('deactivateAssistant') : t('reactivateAssistant')}
            >
              <Smile className="w-4 h-4 shrink-0 text-white" />
            </button>
            <button 
              id="settings-button"
              onClick={() => {
                if (showSettings) {
                  setShowSettings(false);
                } else {
                  const isRestricted = RESTRICT_SETTINGS_ACCESS;
                  if (isRestricted) {
                    setIsSettingsAuthModalOpen(true);
                  } else {
                    setShowSettings(true);
                    setIsSidebarCollapsed(false);
                  }
                }
              }}
              className={`group flex items-center justify-center w-9 h-9 border rounded-xl hover:text-white hover:border-[#404040]/80 transition-all hover:bg-[#7F7F7F]/90 hover:shadow-[0_0_12px_rgba(255,255,255,0.1)] cursor-pointer shrink-0 ${
                highlightedSection === 'settings'
                  ? 'ring-4 ring-neutral-900/40 bg-[#7F7F7F] border-[#404040] text-white scale-105 shadow-[0_0_25px_rgba(0,0,0,0.3)]'
                  : 'bg-[#7F7F7F] border-[#404040] text-white'
              }`}
              title={t('settingsTitle')}
            >
              <Settings className="w-4 h-4 shrink-0 text-white" />
            </button>

            {/* Info / About App button */}
            <button 
              id="info-button"
              onClick={() => setShowAboutModal(true)}
              className="group flex items-center justify-center w-9 h-9 border rounded-xl hover:text-white hover:border-[#404040]/80 transition-all hover:bg-[#7F7F7F]/90 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] cursor-pointer shrink-0 bg-[#7F7F7F] border-[#404040] text-white active:scale-95"
              title={t('aboutAppTitle')}
              aria-label="About this app"
            >
              <Info className="w-4 h-4 shrink-0 text-white group-hover:text-emerald-300 transition-colors" />
            </button>
          </div>
        </div>
      </nav>


      {/* Main Layout */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Collapse Handle when collapsed */}
        {isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-[100] bg-[#7F7F7F] border border-[#404040] border-l-0 rounded-r-xl p-2 shadow-2xl hover:bg-[#7F7F7F]/90 text-white transition-all cursor-pointer"
            title="Show Parameters"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {!isSidebarCollapsed && (
            <motion.aside 
              id="params-sidebar"
              initial={{ width: 0, opacity: 0, x: -340 }}
              animate={{ width: 340, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: -340 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`flex flex-col gap-0 z-50 shrink-0 relative transition-colors duration-300 ${sidebarBg}`}
              style={{ borderRight: '1px solid #FAF8F5', marginRight: '-1px', boxShadow: 'none' }}
            >
              {/* Close Handle on sidebar */}
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-[100] bg-white border border-stone-300 rounded-full p-1.5 shadow-md hover:bg-stone-50 text-stone-500 hover:text-stone-900 transition-all cursor-pointer"
                title="Hide Parameters"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className={`w-[340px] p-0 flex flex-col gap-0 h-full overflow-hidden transition-all duration-300 border-none ${sidebarBg}`}>
                {showSettings ? (
                  <div 
                    id="settings-section-container"
                    className={`flex flex-col h-full overflow-hidden transition-all duration-300 bg-[#404040] border-none ${
                      highlightedSection === 'settings' 
                        ? 'ring-4 ring-stone-500/60 shadow-[0_0_30px_rgba(46,46,53,0.2)] scale-[1.01]' 
                        : ''
                    }`}
                  >
                    <div id="settings-title-container" className="flex-none h-[68px] px-4 py-2 bg-[#2E2E35] flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold uppercase tracking-wider text-[11px] text-white flex items-center gap-1.5 font-sans">
                            <Settings className="w-4 h-4 text-white" />
                            {language === 'cy' ? 'Gosodiadau' : 'Settings'}
                          </h3>
                        </div>
                        <button 
                          onClick={() => setShowSettings(false)} 
                          className="px-2 py-0.5 hover:bg-white/10 border border-stone-400 rounded-lg text-stone-300 hover:text-white font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                        >
                          {language === 'cy' ? 'CAU X' : 'CLOSE X'}
                        </button>
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-stone-300 font-sans">
                        {language === 'cy' ? 'Newid gosodiadau diofyn yr ap' : 'Change the app default settings'}
                      </div>
                    </div>

                    {/* Fixed Action Button bar - doesn't scroll */}
                    <div className="flex-none px-4 py-3 bg-[#4D4D4D] border-b border-[#323232]/60 space-y-2">
                        <button 
                          onClick={() => {
                            const depWidth = localSettings.depositionWidth ?? localSettings.nozzleDiameter ?? localSettings.extrusionWidth ?? DEFAULT_PRINTER_SETTINGS.nozzleDiameter;
                            const updated = {
                              ...localSettings,
                              depositionWidth: depWidth,
                              nozzleDiameter: depWidth,
                              extrusionWidth: depWidth,
                              maxWidth: localSettings.allowCustomSize ? 250 : 100,
                              maxHeight: localSettings.allowCustomSize ? 260 : 150
                            };
                            setSettings(updated);
                            
                            let nextParams = { ...params };
                            if (updated.cubeMode) {
                              nextParams.cubeMode = true;
                              if (nextParams.cubeX === undefined) nextParams.cubeX = 30;
                              if (nextParams.cubeY === undefined) nextParams.cubeY = 30;
                              if (nextParams.cubeZ === undefined) nextParams.cubeZ = 30;
                            } else {
                              nextParams.cubeMode = false;
                            }
                            if (!updated.allowCustomSize) {
                              nextParams.radius = updated.defaultWidth / 2;
                              nextParams.height = updated.defaultHeight;
                            }
                            if (!updated.enableTexture) {
                              nextParams.textureType = TextureType.NONE;
                            }
                            if (!updated.enableGcodeTexture) {
                              nextParams.gcodeTextureEnabled = false;
                            }
                            if (updated.lockRibDepth) {
                              nextParams.ribDepth = 2.0;
                            }
                            if (updated.lockRibWidth) {
                              nextParams.ribWidth = 3.0;
                            }
                            
                            if (updated.limitToBuildVolume) {
                              // If current model exceeds model volume, reduce dimensions until it fits
                              let attempts = 0;
                              while (checkExceedsBuildVolume(nextParams) && attempts < 100) {
                                  if (nextParams.cubeMode) {
                                    if (nextParams.cubeX && nextParams.cubeX > 5) nextParams.cubeX -= 0.5;
                                    if (nextParams.cubeY && nextParams.cubeY > 5) nextParams.cubeY -= 0.5;
                                    if (nextParams.cubeZ && nextParams.cubeZ > 5) nextParams.cubeZ -= 0.5;
                                  } else {
                                    if (nextParams.radius > 5) nextParams.radius -= 0.5;
                                    if (nextParams.height > 5) nextParams.height -= 0.5;
                                  }
                                  attempts++;
                              }
                            }
                            setParams(nextParams);
                            setShowSettings(false);
                          }}
                          className="w-full h-8 bg-amber-600 hover:bg-amber-500 text-white border border-amber-700 font-extrabold rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 uppercase tracking-widest text-[9px] active:scale-98 cursor-pointer text-center"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {language === 'cy' ? 'Gweithredu Gosodiadau Newydd' : 'Apply New Settings'}
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => exportParams('config.txt')}
                            className="flex items-center justify-center gap-1.5 h-7.5 bg-zinc-600 hover:bg-zinc-500 border border-zinc-700 rounded-lg text-[8.5px] font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-sm"
                          >
                            <FileDown className="w-3 h-3 text-white" />
                            {language === 'cy' ? 'Allforio' : 'Export'}
                          </button>
                          <label className="flex items-center justify-center gap-1.5 h-7.5 bg-zinc-600 hover:bg-zinc-500 border border-zinc-700 rounded-lg text-[8.5px] font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-sm">
                            <Upload className="w-3 h-3 text-white" />
                            {language === 'cy' ? 'Mewnforio' : 'Import'}
                            <input type="file" accept=".txt,.cup,.cfg,.json,*" onChange={importConfig} className="hidden" />
                          </label>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1 py-4 space-y-4 bg-[#404040]">
                      {/* Section 1: 3D Printer Settings */}
                      <section id="subsec-printer-settings-container" className={`rounded-3xl p-5 border-[3px] transition-all duration-300 relative ${
                        highlightedSection === 'subsec-printer-settings'
                          ? 'ring-4 ring-[#EA580C]/50 bg-[#FAF8F5] border-[#EA580C] scale-[1.01] shadow-[0_0_20px_rgba(234,88,12,0.25)]'
                          : 'bg-[#FAF8F5] border-[#EA580C]'
                      }`}>
                        <div className="flex justify-between items-center mb-3 border-b border-stone-200/55 pb-1.5">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 text-[#EA580C]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0 inline-block" />
                            <Settings className="w-3 h-3 text-[#EA580C]" />
                            {language === 'cy' ? 'Gosodiadau Argraffydd 3D' : '3D Printer Settings'}
                          </h4>
                          <button 
                            type="button"
                            onClick={() => {
                              setLocalSettings({
                                ...localSettings,
                                speed: DEFAULT_PRINTER_SETTINGS.speed,
                                layerHeight: DEFAULT_PRINTER_SETTINGS.layerHeight,
                                pistonDiameter: DEFAULT_PRINTER_SETTINGS.pistonDiameter,
                                nozzleDiameter: DEFAULT_PRINTER_SETTINGS.nozzleDiameter,
                                depositionWidth: DEFAULT_PRINTER_SETTINGS.nozzleDiameter,
                                extrusionWidth: DEFAULT_PRINTER_SETTINGS.nozzleDiameter,
                                extrusionMultiplier: DEFAULT_PRINTER_SETTINGS.extrusionMultiplier,
                                flow: DEFAULT_PRINTER_SETTINGS.flow,
                                separateFlow: DEFAULT_PRINTER_SETTINGS.separateFlow,
                                wallFlow: DEFAULT_PRINTER_SETTINGS.wallFlow,
                                baseFlow: DEFAULT_PRINTER_SETTINGS.baseFlow,
                                enableSkirt: DEFAULT_PRINTER_SETTINGS.enableSkirt,
                                skirtDistance: DEFAULT_PRINTER_SETTINGS.skirtDistance,
                                continuousExtrusion: DEFAULT_PRINTER_SETTINGS.continuousExtrusion,
                                compensateWallShrinkage: DEFAULT_PRINTER_SETTINGS.compensateWallShrinkage,
                                wallShrinkageDraft: DEFAULT_PRINTER_SETTINGS.wallShrinkageDraft,
                                scale: DEFAULT_PRINTER_SETTINGS.scale,
                                eConstant: DEFAULT_PRINTER_SETTINGS.eConstant,
                                retractionDistance: DEFAULT_PRINTER_SETTINGS.retractionDistance,
                                baseLayers: DEFAULT_PRINTER_SETTINGS.baseLayers,
                                wallCount: DEFAULT_PRINTER_SETTINGS.wallCount,
                                startGcode: DEFAULT_PRINTER_SETTINGS.startGcode,
                                endGcode: DEFAULT_PRINTER_SETTINGS.endGcode,
                                approachSpeed: DEFAULT_PRINTER_SETTINGS.approachSpeed,
                                exitSpeed: DEFAULT_PRINTER_SETTINGS.exitSpeed,
                              });
                            }}
                            className="p-1 hover:bg-[#EA580C]/10 rounded-md text-[#EA580C] transition-all cursor-pointer flex items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-wider h-6 border border-[#EA580C]/20 px-1.5 shrink-0"
                            title="Reset 3D Printer Settings"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>{language === 'cy' ? 'Ailosod' : 'Reset'}</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="group space-y-1">
                            <label className="text-[8px] font-black uppercase text-stone-500 tracking-wider h-4 block">{language === 'cy' ? 'Cyflymder (mm/e)' : 'Speed (mm/s)'}</label>
                            <input 
                              type="number" 
                              value={localSettings.speed} 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) setLocalSettings({...localSettings, speed: val});
                              }}
                              className="w-full bg-white border border-stone-300 rounded-xl py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono"
                            />
                          </div>
                          <div className="group space-y-1">
                            <label className="text-[8px] font-black uppercase text-stone-500 tracking-wider h-4 block">{language === 'cy' ? 'Haen (mm)' : 'Layer (mm)'}</label>
                            <input 
                              type="number" 
                              step="0.1"
                              value={localSettings.layerHeight} 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) setLocalSettings({...localSettings, layerHeight: val});
                              }}
                              className="w-full bg-white border border-stone-300 rounded-xl py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono"
                            />
                          </div>
                          <div className="group space-y-1">
                            <label className="text-[8px] font-black uppercase text-stone-500 tracking-wider h-4 block">{language === 'cy' ? 'Lled dyddodi (mm)' : 'Deposition width (mm)'}</label>
                            <input 
                              type="number" 
                              step="0.1"
                              value={localSettings.depositionWidth !== undefined ? localSettings.depositionWidth : (localSettings.nozzleDiameter !== undefined ? localSettings.nozzleDiameter : DEFAULT_PRINTER_SETTINGS.nozzleDiameter)} 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) {
                                  const p = localSettings.pistonDiameter !== undefined ? localSettings.pistonDiameter : 45;
                                  const calculatedE = p > 0 ? Number(((val * val) / (p * p)).toFixed(6)) : (localSettings.eConstant ?? DEFAULT_PRINTER_SETTINGS.eConstant);
                                  setLocalSettings({
                                    ...localSettings, 
                                    depositionWidth: val,
                                    nozzleDiameter: val,
                                    extrusionWidth: val,
                                    eConstant: calculatedE
                                  });
                                }
                              }}
                              className="w-full bg-white border border-stone-300 rounded-xl py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono"
                            />
                          </div>
                          <div className="group space-y-1">
                            <label className="text-[8px] font-black uppercase text-stone-500 tracking-wider h-4 block">{language === 'cy' ? 'Piston (mm)' : 'Piston diameter (mm)'}</label>
                            <input 
                              type="number" 
                              step="0.5"
                              value={localSettings.pistonDiameter !== undefined ? localSettings.pistonDiameter : 45} 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) {
                                  const n = localSettings.depositionWidth !== undefined ? localSettings.depositionWidth : (localSettings.nozzleDiameter !== undefined ? localSettings.nozzleDiameter : DEFAULT_PRINTER_SETTINGS.nozzleDiameter);
                                  const calculatedE = val > 0 ? Number(((n * n) / (val * val)).toFixed(6)) : (localSettings.eConstant ?? DEFAULT_PRINTER_SETTINGS.eConstant);
                                  setLocalSettings({...localSettings, pistonDiameter: val, eConstant: calculatedE});
                                }
                              }}
                              className="w-full bg-white border border-stone-300 rounded-xl py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono"
                            />
                          </div>
                          <div className="col-span-2 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2 group space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[8px] font-black uppercase text-amber-800 tracking-wider h-4 flex items-center gap-1">
                                <span>{language === 'cy' ? 'Cysonyn E' : 'E Constant'}</span>
                                <span className="text-[7px] text-amber-600 font-mono font-bold lowercase">(E = Width² / Piston²)</span>
                              </label>
                              <span className="text-[7.5px] font-mono font-bold text-amber-700 bg-white/80 px-1.5 py-0.5 rounded border border-amber-200">
                                {localSettings.depositionWidth ?? localSettings.nozzleDiameter ?? DEFAULT_PRINTER_SETTINGS.nozzleDiameter}² / {localSettings.pistonDiameter ?? 45}²
                              </span>
                            </div>
                            <input 
                              type="number" 
                              step="0.000001"
                              value={localSettings.eConstant !== undefined ? localSettings.eConstant : DEFAULT_PRINTER_SETTINGS.eConstant} 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) setLocalSettings({...localSettings, eConstant: val});
                              }}
                              className="w-full bg-white border border-amber-300 rounded-lg py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono"
                            />
                          </div>
                          <div className="group space-y-1">
                            <label className="text-[8px] font-black uppercase text-stone-500 tracking-wider h-4 block">{language === 'cy' ? 'Haenau Sylfaen' : 'Base Layers'}</label>
                            <input 
                              type="number" 
                              value={localSettings.baseLayers} 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) setLocalSettings({...localSettings, baseLayers: val});
                              }}
                              className="w-full bg-white border border-stone-300 rounded-xl py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono"
                            />
                          </div>
                          <div className="group space-y-1">
                            <label className="text-[8px] font-black uppercase text-stone-500 tracking-wider h-4 block">{language === 'cy' ? 'Cyfrif Waliau' : 'Wall Count'}</label>
                            <input 
                              type="number" 
                              value={localSettings.wallCount !== undefined ? localSettings.wallCount : 2} 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) {
                                  setLocalSettings({
                                    ...localSettings,
                                    wallCount: val,
                                    vaseMode: val === 1 ? (localSettings.vaseMode !== false) : localSettings.vaseMode,
                                  });
                                }
                              }}
                              className="w-full bg-white border border-stone-300 rounded-xl py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono"
                            />
                          </div>
                          <div className="col-span-2 group space-y-1">
                            <div className="flex justify-between items-center h-4">
                              <label className="text-[8px] font-black uppercase text-stone-500 tracking-wider block">{language === 'cy' ? 'Graddfa' : 'Scale'}</label>
                              <span className="text-[7.5px] font-mono font-bold text-[#EA580C]">×{localSettings.scale !== undefined ? localSettings.scale : 1}</span>
                            </div>
                            <input 
                              type="number" 
                              step="0.05"
                              min="0.1"
                              max="10"
                              value={localSettings.scale !== undefined ? localSettings.scale : 1} 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) setLocalSettings({...localSettings, scale: val});
                              }}
                              className="w-full bg-white border border-stone-300 rounded-xl py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono"
                            />
                          </div>

                          {/* Flow & Separate Flow Controls */}
                          {(() => {
                            const isSeparateFlow = localSettings.separateFlow !== undefined ? !!localSettings.separateFlow : !!DEFAULT_PRINTER_SETTINGS.separateFlow;
                            return (
                              <div className="col-span-2 bg-stone-50 border border-stone-200/90 rounded-2xl p-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSeparateFlow ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                                    <span className="text-[8.5px] font-black uppercase text-stone-700 tracking-wider">
                                      {language === 'cy' ? 'Llif ar Wahân (Waliau / Sylfaen)' : 'Separate Wall & Base Flow'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setLocalSettings({
                                      ...localSettings,
                                      separateFlow: !isSeparateFlow,
                                      baseFlow: localSettings.baseFlow !== undefined ? localSettings.baseFlow : DEFAULT_PRINTER_SETTINGS.baseFlow,
                                      wallFlow: localSettings.wallFlow !== undefined ? localSettings.wallFlow : DEFAULT_PRINTER_SETTINGS.wallFlow,
                                    })}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      isSeparateFlow ? 'bg-emerald-600' : 'bg-rose-500'
                                    }`}
                                    title={language === 'cy' ? 'Toglo llif ar wahân ar gyfer waliau a sylfaen' : 'Toggle separate flow for walls and base'}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        isSeparateFlow ? 'translate-x-4' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </div>

                                {!isSeparateFlow ? (
                                  <div className="group space-y-1">
                                    <label className="text-[8px] font-black uppercase text-stone-500 tracking-wider h-4 block">
                                      {language === 'cy' ? 'Llif (%)' : 'Flow (%)'}
                                    </label>
                                    <input 
                                      type="number" 
                                      min="0"
                                      max="200"
                                      step="1"
                                      value={localSettings.flow !== undefined ? localSettings.flow : DEFAULT_PRINTER_SETTINGS.flow} 
                                      onChange={(e) => {
                                        const val = Math.max(0, Math.min(200, Number(e.target.value)));
                                        if (!isNaN(val)) setLocalSettings({...localSettings, flow: val});
                                      }}
                                      className="w-full bg-white border border-stone-300 rounded-xl py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono"
                                    />
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="group space-y-1">
                                      <label className="text-[8px] font-black uppercase text-stone-600 tracking-wider h-4 block">
                                        {language === 'cy' ? 'Llif Sylfaen (%)' : 'Base Flow (%)'}
                                      </label>
                                      <input 
                                        type="number" 
                                        min="0"
                                        max="200"
                                        step="1"
                                        value={localSettings.baseFlow !== undefined ? localSettings.baseFlow : DEFAULT_PRINTER_SETTINGS.baseFlow} 
                                        onChange={(e) => {
                                          const val = Math.max(0, Math.min(200, Number(e.target.value)));
                                          if (!isNaN(val)) setLocalSettings({...localSettings, baseFlow: val});
                                        }}
                                        className="w-full bg-white border border-stone-300 rounded-xl py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono"
                                      />
                                    </div>
                                    <div className="group space-y-1">
                                      <label className="text-[8px] font-black uppercase text-stone-600 tracking-wider h-4 block">
                                        {language === 'cy' ? 'Llif Waliau (%)' : 'Walls Flow (%)'}
                                      </label>
                                      <input 
                                        type="number" 
                                        min="0"
                                        max="200"
                                        step="1"
                                        value={localSettings.wallFlow !== undefined ? localSettings.wallFlow : DEFAULT_PRINTER_SETTINGS.wallFlow} 
                                        onChange={(e) => {
                                          const val = Math.max(0, Math.min(200, Number(e.target.value)));
                                          if (!isNaN(val)) setLocalSettings({...localSettings, wallFlow: val});
                                        }}
                                        className="w-full bg-white border border-stone-300 rounded-xl py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Vase Mode (Continuous Spiral) Option */}
                          {(() => {
                            const isWallCountOne = (localSettings.wallCount ?? 1) === 1;
                            const isVaseMode = isWallCountOne && (localSettings.vaseMode !== false);
                            return (
                              <div className="col-span-2 bg-stone-50 border border-stone-200/90 rounded-2xl p-2.5 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isVaseMode ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                                    <div>
                                      <span className="text-[8.5px] font-black uppercase text-stone-700 tracking-wider block">
                                        {language === 'cy' ? 'Modd Fâs (Troell Barhaus)' : 'Vase Mode (Continuous Spiral)'}
                                      </span>
                                      <span className="text-[7.5px] font-medium text-stone-500 block leading-tight">
                                        {isWallCountOne
                                          ? (language === 'cy' ? 'Troell barhaus i osgoi gwythiennau ar 1 wal (ymlaen yn ddiofyn)' : 'Continuous spiral for 1 wall to eliminate seams (on by default)')
                                          : (language === 'cy' ? 'Yn weithredol dim ond pan fo Cyfrif Waliau yn 1' : 'Only active when Wall Count is 1')}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={!isWallCountOne}
                                    onClick={() => setLocalSettings({
                                      ...localSettings,
                                      vaseMode: !(localSettings.vaseMode !== false),
                                    })}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      isVaseMode ? 'bg-emerald-600' : 'bg-rose-500'
                                    } ${!isWallCountOne ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    title={language === 'cy' ? 'Toglo modd fâs (troell barhaus)' : 'Toggle vase mode (continuous spiral)'}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        isVaseMode ? 'translate-x-4' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Skirt Option (1 line) */}
                          {(() => {
                            const isSkirtEnabled = localSettings.enableSkirt !== undefined ? localSettings.enableSkirt : true;
                            return (
                              <div className="col-span-2 bg-stone-50 border border-stone-200/90 rounded-2xl p-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSkirtEnabled ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                                    <div>
                                      <span className="text-[8.5px] font-black uppercase text-stone-700 tracking-wider block">
                                        {language === 'cy' ? 'Sgert (1 Llinell)' : 'Skirt (1 Line)'}
                                      </span>
                                      <span className="text-[7.5px] font-medium text-stone-500 block leading-tight">
                                        {language === 'cy' ? 'Preimio\'r ffroenell o amgylch y model yn lle carthu' : 'Prime nozzle around model instead of purging'}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setLocalSettings({
                                      ...localSettings,
                                      enableSkirt: !isSkirtEnabled,
                                      skirtDistance: localSettings.skirtDistance !== undefined ? localSettings.skirtDistance : 10,
                                    })}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      isSkirtEnabled ? 'bg-emerald-600' : 'bg-rose-500'
                                    }`}
                                    title={language === 'cy' ? 'Toglo sgert cyn argraffu' : 'Toggle skirt before printing'}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        isSkirtEnabled ? 'translate-x-4' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </div>

                                {isSkirtEnabled && (
                                  <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/70 text-[8px]">
                                    <span className="font-bold text-stone-600 uppercase tracking-wider">
                                      {language === 'cy' ? 'Pellter oddi wrth y model (mm)' : 'Distance from model (mm)'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <input 
                                        type="number" 
                                        min="1"
                                        max="15"
                                        step="0.5"
                                        value={localSettings.skirtDistance !== undefined ? localSettings.skirtDistance : 5} 
                                        onChange={(e) => {
                                          const val = Math.max(0.5, Number(e.target.value));
                                          if (!isNaN(val)) setLocalSettings({...localSettings, skirtDistance: val});
                                        }}
                                        className="w-16 bg-white border border-stone-300 rounded-xl py-0.5 px-2 text-[10px] font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono text-right"
                                      />
                                      <span className="font-bold text-stone-500 text-[8px]">mm</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Continuous Extrusion Option */}
                          {(() => {
                            const isContinuous = localSettings.continuousExtrusion !== undefined ? localSettings.continuousExtrusion : true;
                            return (
                              <div className="col-span-2 bg-stone-50 border border-stone-200/90 rounded-2xl p-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isContinuous ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                                    <div>
                                      <span className="text-[8.5px] font-black uppercase text-stone-700 tracking-wider block">
                                        {language === 'cy' ? 'Allwthio Parhaus' : 'Continuous Extrusion'}
                                      </span>
                                      <span className="text-[7.5px] font-medium text-stone-500 block leading-tight">
                                        {language === 'cy' 
                                          ? 'Peidio â stopio allwthio (E) wrth symud rhwng troellau gwaelod neu waliau' 
                                          : 'Do not stop extrusion (E) between spiral base loops or walls'}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setLocalSettings({
                                      ...localSettings,
                                      continuousExtrusion: !isContinuous,
                                    })}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      isContinuous ? 'bg-emerald-600' : 'bg-rose-500'
                                    }`}
                                    title={language === 'cy' ? 'Toglo allwthio parhaus' : 'Toggle continuous extrusion'}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        isContinuous ? 'translate-x-4' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Compensate Wall Shrinkage Option */}
                          {(() => {
                            const isShrinkageEnabled = localSettings.compensateWallShrinkage !== undefined ? localSettings.compensateWallShrinkage : true;
                            const shrinkageValue = localSettings.wallShrinkageDraft !== undefined ? localSettings.wallShrinkageDraft : 5;
                            return (
                              <div className="col-span-2 bg-stone-50 border border-stone-200/90 rounded-2xl p-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isShrinkageEnabled ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                                    <div>
                                      <span className="text-[8.5px] font-black uppercase text-stone-700 tracking-wider block">
                                        {language === 'cy' ? 'Digolledu Crebachu Waliau' : 'Compensate Wall Shrinkage'}
                                      </span>
                                      <span className="text-[7.5px] font-medium text-stone-500 block leading-tight">
                                        {language === 'cy' 
                                          ? 'Ychwanegu ongl ddrafft i waliau ochr y cwpan mewn G-code (model 3D heb ei newid)' 
                                          : 'Adds draft to cup side walls in G-code to make top bigger (3D model stays unchanged)'}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setLocalSettings({
                                      ...localSettings,
                                      compensateWallShrinkage: !isShrinkageEnabled,
                                      wallShrinkageDraft: shrinkageValue,
                                    })}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      isShrinkageEnabled ? 'bg-emerald-600' : 'bg-rose-500'
                                    }`}
                                    title={language === 'cy' ? 'Toglo digolledu crebachu waliau' : 'Toggle wall shrinkage compensation'}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        isShrinkageEnabled ? 'translate-x-4' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </div>

                                {isShrinkageEnabled && (
                                  <div className="pt-2 border-t border-stone-200/70 space-y-2">
                                    <div className="flex items-center justify-between text-[8px]">
                                      <div>
                                        <span className="font-bold text-stone-600 uppercase tracking-wider block">
                                          {language === 'cy' ? 'Ongl Ddrafft (1° – 10°)' : 'Draft Angle (1° – 10°)'}
                                        </span>
                                        <span className="text-[7px] text-stone-500">
                                          {language === 'cy' ? 'Pen yn ehangu yn ôl yr ongl ddrafft' : 'Top widens by draft angle in G-code'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <input 
                                          type="number" 
                                          min="1"
                                          max="10"
                                          step="0.5"
                                          value={shrinkageValue} 
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val)) {
                                              const clamped = Math.max(1, Math.min(10, val));
                                              setLocalSettings({...localSettings, wallShrinkageDraft: clamped});
                                            }
                                          }}
                                          className="w-16 bg-white border border-stone-300 rounded-xl py-0.5 px-2 text-[10px] font-bold text-stone-900 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none transition-all font-mono text-right"
                                        />
                                        <span className="font-bold text-stone-500 text-[8px]">°</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 pt-0.5">
                                      {[1, 2, 3, 5, 7.5, 10].map((preset) => (
                                        <button
                                          key={preset}
                                          type="button"
                                          onClick={() => setLocalSettings({ ...localSettings, wallShrinkageDraft: preset })}
                                          className={`flex-1 py-0.5 text-[8px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                                            shrinkageValue === preset
                                              ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-sm'
                                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                                          }`}
                                        >
                                          {preset}°
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        {/* Beautiful Extrusion Formula Display */}
                        <div className="mt-3.5 p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-[9px] text-amber-900 space-y-1.5 shadow-sm">
                          <div className="font-extrabold flex items-center justify-between text-amber-800 uppercase tracking-wider">
                            <div className="flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              {language === 'cy' ? 'Fformiwla Cyfrif E:' : 'E-Value Extrusion Formula:'}
                            </div>
                            <span className="text-[8px] font-mono text-amber-700 font-bold lowercase">
                              E = Width² / Piston² = {localSettings.depositionWidth ?? localSettings.nozzleDiameter ?? DEFAULT_PRINTER_SETTINGS.nozzleDiameter}² / {localSettings.pistonDiameter ?? 45}²
                            </span>
                          </div>
                          {!(localSettings.separateFlow !== undefined ? !!localSettings.separateFlow : !!DEFAULT_PRINTER_SETTINGS.separateFlow) ? (
                            <div className="font-mono bg-white px-2 py-1.5 rounded-xl border border-amber-200 text-center font-bold text-[11px] text-stone-800">
                              E/mm = {localSettings.eConstant ?? DEFAULT_PRINTER_SETTINGS.eConstant} × Flow({localSettings.flow ?? DEFAULT_PRINTER_SETTINGS.flow}%) = {((localSettings.eConstant ?? DEFAULT_PRINTER_SETTINGS.eConstant) * (localSettings.flow ?? DEFAULT_PRINTER_SETTINGS.flow)).toFixed(6)}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="font-mono bg-white px-2 py-1 rounded-xl border border-amber-200 text-center font-bold text-[10px] text-stone-800">
                                Base E/mm = {localSettings.eConstant ?? DEFAULT_PRINTER_SETTINGS.eConstant} × Base({localSettings.baseFlow ?? DEFAULT_PRINTER_SETTINGS.baseFlow}%) = {((localSettings.eConstant ?? DEFAULT_PRINTER_SETTINGS.eConstant) * (localSettings.baseFlow ?? DEFAULT_PRINTER_SETTINGS.baseFlow)).toFixed(6)}
                              </div>
                              <div className="font-mono bg-white px-2 py-1 rounded-xl border border-amber-200 text-center font-bold text-[10px] text-stone-800">
                                Wall E/mm = {localSettings.eConstant ?? DEFAULT_PRINTER_SETTINGS.eConstant} × Walls({localSettings.wallFlow ?? DEFAULT_PRINTER_SETTINGS.wallFlow}%) = {((localSettings.eConstant ?? DEFAULT_PRINTER_SETTINGS.eConstant) * (localSettings.wallFlow ?? DEFAULT_PRINTER_SETTINGS.wallFlow)).toFixed(6)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Start G-code and End G-code Sections */}
                        <div className="mt-4 border-t border-stone-200/60 pt-3.5 space-y-3">
                          {/* Start G-code */}
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => setStartGcodeCollapsed(!startGcodeCollapsed)}
                              className="w-full flex items-center justify-between py-2 px-3 bg-stone-100 hover:bg-stone-200/80 border border-stone-300/80 rounded-xl transition-all cursor-pointer select-none text-[9px] font-black uppercase tracking-wider text-stone-700"
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                {language === 'cy' ? 'Dechrau G-code (Start)' : 'Start G-code'}
                              </span>
                              {startGcodeCollapsed ? (
                                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                              ) : (
                                <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
                              )}
                            </button>
                            
                            {!startGcodeCollapsed && (
                              <textarea
                                value={localSettings.startGcode}
                                onChange={(e) => setLocalSettings({ ...localSettings, startGcode: e.target.value })}
                                className="w-full bg-stone-900 text-emerald-400 border border-stone-800 rounded-xl p-3 text-xs font-mono focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all h-44 resize-y leading-relaxed"
                                placeholder={language === 'cy' ? 'Rhowch gôd cychwyn yma...' : 'Enter starting G-code here...'}
                              />
                            )}
                          </div>

                          {/* End G-code */}
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => setEndGcodeCollapsed(!endGcodeCollapsed)}
                              className="w-full flex items-center justify-between py-2 px-3 bg-stone-100 hover:bg-stone-200/80 border border-stone-300/80 rounded-xl transition-all cursor-pointer select-none text-[9px] font-black uppercase tracking-wider text-stone-700"
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                {language === 'cy' ? 'Diwedd G-code (End)' : 'End G-code'}
                              </span>
                              {endGcodeCollapsed ? (
                                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                              ) : (
                                <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
                              )}
                            </button>
                            
                            {!endGcodeCollapsed && (
                              <textarea
                                value={localSettings.endGcode}
                                onChange={(e) => setLocalSettings({ ...localSettings, endGcode: e.target.value })}
                                className="w-full bg-stone-900 text-[#F43F5E] border border-stone-800 rounded-xl p-3 text-xs font-mono focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all h-44 resize-y leading-relaxed"
                                placeholder={language === 'cy' ? 'Rhowch gôd gorffen yma...' : 'Enter ending G-code here...'}
                              />
                            )}
                          </div>
                        </div>
                      </section>

                      {/* Section 2: Model Default Sizes */}
                      <section id="subsec-model-sizes-container" className={`rounded-3xl p-5 border-[3px] transition-all duration-300 relative ${
                        highlightedSection === 'subsec-model-sizes'
                          ? 'ring-4 ring-[#2563EB]/50 bg-[#FAF8F5] border-[#2563EB] scale-[1.01] shadow-[0_0_20px_rgba(37,99,235,0.25)]'
                          : 'bg-[#FAF8F5] border-[#2563EB]'
                      }`}>
                        <div className="flex flex-col gap-2 mb-3">
                          <div className="flex items-center justify-between border-b border-stone-200/55 pb-1.5">
                            <div className="flex flex-col gap-0.5">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 mb-0 text-[#2563EB]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0 inline-block" />
                                <Box className="w-3 h-3 text-[#2563EB]" />
                                {language === 'cy' ? 'Gosodiadau Model' : 'Model Settings'}
                              </h4>
                              <h5 className="text-[8px] font-bold uppercase tracking-wider text-stone-500 mt-1 mb-0 font-sans">
                                {language === 'cy' ? 'Meintiau diofyn y model' : 'Model defaults'}
                              </h5>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                setLocalSettings({
                                  ...localSettings,
                                  allowCustomSize: DEFAULT_PRINTER_SETTINGS.allowCustomSize,
                                  defaultWidth: DEFAULT_PRINTER_SETTINGS.defaultWidth,
                                  defaultHeight: DEFAULT_PRINTER_SETTINGS.defaultHeight,
                                  limitToBuildVolume: DEFAULT_PRINTER_SETTINGS.limitToBuildVolume,
                                  cubeMode: DEFAULT_PRINTER_SETTINGS.cubeMode,
                                  enableTexture: DEFAULT_PRINTER_SETTINGS.enableTexture,
                                  enableGcodeTexture: DEFAULT_PRINTER_SETTINGS.enableGcodeTexture,
                                  restrictSettingsAccess: RESTRICT_SETTINGS_ACCESS,
                                  testFlowBaseGapMultiplier: DEFAULT_PRINTER_SETTINGS.testFlowBaseGapMultiplier,
                                  testFlowWallGapMultiplier: DEFAULT_PRINTER_SETTINGS.testFlowWallGapMultiplier,
                                  autoNameModel: DEFAULT_PRINTER_SETTINGS.autoNameModel,
                                  lockRibDepth: DEFAULT_PRINTER_SETTINGS.lockRibDepth,
                                  lockRibWidth: DEFAULT_PRINTER_SETTINGS.lockRibWidth,
                                  maxWidth: DEFAULT_PRINTER_SETTINGS.allowCustomSize ? 250 : DEFAULT_PRINTER_SETTINGS.maxWidth,
                                  maxHeight: DEFAULT_PRINTER_SETTINGS.allowCustomSize ? 260 : DEFAULT_PRINTER_SETTINGS.maxHeight
                                });
                                const r = DEFAULT_PRINTER_SETTINGS.defaultWidth / 2;
                                const h = DEFAULT_PRINTER_SETTINGS.defaultHeight;
                                const da = Math.atan2(0.10 * r, Math.max(1, h)) * 180 / Math.PI;
                                setParams({
                                  ...params,
                                  radius: r,
                                  height: h,
                                  draftAngle: Math.round(da * 10000) / 10000,
                                  textureType: TextureType.NONE,
                                  gcodeTextureEnabled: false,
                                  ribDepth: 2.0,
                                  ribWidth: 3.0,
                                });
                              }}
                              className="p-1 hover:bg-[#2563EB]/10 rounded-md text-[#2563EB] transition-all cursor-pointer flex items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-wider h-6 border border-[#2563EB]/20 px-1.5 shrink-0"
                              title="Reset Model Settings"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>{language === 'cy' ? 'Ailosod' : 'Reset'}</span>
                            </button>
                          </div>

                          {/* New Size line with the locked button */}
                          <div className="flex items-center justify-between py-1.5 border-y border-stone-200 mt-1">
                            <span className="text-[10px] font-black uppercase text-stone-700 tracking-wider font-sans">
                              {language === 'cy' ? 'Maint' : 'Size'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextCustomSize = !localSettings.allowCustomSize;
                                setLocalSettings({
                                  ...localSettings,
                                  allowCustomSize: nextCustomSize,
                                  maxWidth: nextCustomSize ? 250 : 100,
                                  maxHeight: nextCustomSize ? 260 : 150
                                });
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                !localSettings.allowCustomSize
                                  ? 'bg-[#7F7F7F]/40 hover:bg-[#7F7F7F]/55 border-[#404040]/30 text-stone-600 font-extrabold'
                                  : 'bg-[#7F7F7F] hover:bg-[#7F7F7F]/90 border-[#404040] text-white font-extrabold shadow-sm'
                              }`}
                              title={
                                !localSettings.allowCustomSize
                                  ? (language === 'cy' ? "Wedi'i gloi (maint personol wedi'i analluogi)" : "Locked (custom size disabled)")
                                  : (language === 'cy' ? "Wedi'i ddatgloi (maint personol wedi'i alluogi)" : "Unlocked (custom size enabled)")
                              }
                            >
                              {!localSettings.allowCustomSize ? (
                                <>
                                  <Lock className="w-3 h-3 text-stone-500" />
                                  <span>{language === 'cy' ? 'Ar Clo' : 'Locked'}</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3 h-3 text-white" />
                                  <span>{language === 'cy' ? 'Rhydd' : 'Unlocked'}</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Rib Depth Lock */}
                          <div className="flex items-center justify-between py-1.5 border-b border-stone-200">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-stone-700 tracking-wider font-sans">
                                {language === 'cy' ? 'Dyfnder yr Asen (2mm)' : 'Rib Depth (2mm)'}
                              </span>
                              <span className="text-[7.5px] font-medium text-stone-500">
                                {language === 'cy' ? 'Cloi ar 2.0 mm neu ddatgloi ar gyfer gwerth personol' : 'Lock at 2.0 mm or unlock for custom depth'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nextLock = localSettings.lockRibDepth === undefined ? false : !localSettings.lockRibDepth;
                                setLocalSettings({
                                  ...localSettings,
                                  lockRibDepth: nextLock,
                                });
                                if (nextLock) {
                                  setParams({ ...params, ribDepth: 2.0 });
                                }
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                (localSettings.lockRibDepth ?? true)
                                  ? 'bg-[#7F7F7F]/40 hover:bg-[#7F7F7F]/55 border-[#404040]/30 text-stone-600 font-extrabold'
                                  : 'bg-[#7F7F7F] hover:bg-[#7F7F7F]/90 border-[#404040] text-white font-extrabold shadow-sm'
                              }`}
                              title={
                                (localSettings.lockRibDepth ?? true)
                                  ? (language === 'cy' ? "Wedi'i gloi (dyfnder 2.0mm sefydlog)" : "Locked (fixed 2.0mm depth)")
                                  : (language === 'cy' ? "Wedi'i ddatgloi (dyfnder y gellir ei newid)" : "Unlocked (custom depth enabled)")
                              }
                            >
                              {(localSettings.lockRibDepth ?? true) ? (
                                <>
                                  <Lock className="w-3 h-3 text-stone-500" />
                                  <span>{language === 'cy' ? 'Ar Clo' : 'Locked'}</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3 h-3 text-white" />
                                  <span>{language === 'cy' ? 'Rhydd' : 'Unlocked'}</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Rib Width Lock */}
                          <div className="flex items-center justify-between py-1.5 border-b border-stone-200">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-stone-700 tracking-wider font-sans">
                                {language === 'cy' ? 'Lled yr Asen (3mm)' : 'Rib Width (3mm)'}
                              </span>
                              <span className="text-[7.5px] font-medium text-stone-500">
                                {language === 'cy' ? 'Cloi ar 3.0 mm neu ddatgloi ar gyfer gwerth personol' : 'Lock at 3.0 mm or unlock for custom width'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nextLock = localSettings.lockRibWidth === undefined ? false : !localSettings.lockRibWidth;
                                setLocalSettings({
                                  ...localSettings,
                                  lockRibWidth: nextLock,
                                });
                                if (nextLock) {
                                  setParams({ ...params, ribWidth: 3.0 });
                                }
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                (localSettings.lockRibWidth ?? true)
                                  ? 'bg-[#7F7F7F]/40 hover:bg-[#7F7F7F]/55 border-[#404040]/30 text-stone-600 font-extrabold'
                                  : 'bg-[#7F7F7F] hover:bg-[#7F7F7F]/90 border-[#404040] text-white font-extrabold shadow-sm'
                              }`}
                              title={
                                (localSettings.lockRibWidth ?? true)
                                  ? (language === 'cy' ? "Wedi'i gloi (lled 3.0mm sefydlog)" : "Locked (fixed 3.0mm width)")
                                  : (language === 'cy' ? "Wedi'i ddatgloi (lled y gellir ei newid)" : "Unlocked (custom width enabled)")
                              }
                            >
                              {(localSettings.lockRibWidth ?? true) ? (
                                <>
                                  <Lock className="w-3 h-3 text-stone-500" />
                                  <span>{language === 'cy' ? 'Ar Clo' : 'Locked'}</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3 h-3 text-white" />
                                  <span>{language === 'cy' ? 'Rhydd' : 'Unlocked'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="group space-y-1">
                            <label className="text-[8px] font-black uppercase text-stone-500 tracking-wider font-sans h-4 block">{language === 'cy' ? 'Lled Diofyn (mm)' : 'Default Width (mm)'}</label>
                            <input 
                              type="number" 
                              value={localSettings.defaultWidth} 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) {
                                  setLocalSettings({
                                    ...localSettings, 
                                    defaultWidth: val,
                                    maxWidth: localSettings.allowCustomSize ? 250 : 100,
                                    maxHeight: localSettings.allowCustomSize ? 260 : 150
                                  });
                                  if (!localSettings.allowCustomSize) setParams({...params, radius: val / 2});
                                }
                              }}
                              className="w-full bg-white border border-stone-300 rounded-xl py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all font-mono"
                            />
                          </div>
                          <div className="group space-y-1">
                            <label className="text-[8px] font-black uppercase text-stone-500 tracking-wider font-sans h-4 block">{language === 'cy' ? 'Uchder Diofyn (mm)' : 'Default Height (mm)'}</label>
                            <input 
                              type="number" 
                              value={localSettings.defaultHeight} 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) {
                                  setLocalSettings({
                                    ...localSettings, 
                                    defaultHeight: val,
                                    maxWidth: localSettings.allowCustomSize ? 250 : 100,
                                    maxHeight: localSettings.allowCustomSize ? 260 : 150
                                  });
                                  if (!localSettings.allowCustomSize) setParams({...params, height: val});
                                }
                              }}
                              className="w-full bg-white border border-stone-300 rounded-xl py-1 px-2.5 text-xs font-bold text-stone-900 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all font-mono"
                            />
                          </div>
                        </div>

                        {/* Option to Limit model size to build volume */}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-200">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${localSettings.limitToBuildVolume !== false ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-black uppercase text-stone-700 tracking-wider font-sans">
                                {language === 'cy' ? 'Cyfyngu i Chyfaint Argraffu' : 'Limit to Build Volume'}
                              </span>
                              <span className="text-[7.5px] font-bold uppercase text-stone-400 tracking-wide">
                                {language === 'cy' ? 'Atal dyluniadau rhy fawr' : 'Prevent oversized models'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = localSettings.limitToBuildVolume === false;
                              setLocalSettings({
                                ...localSettings,
                                limitToBuildVolume: nextVal
                              });
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              localSettings.limitToBuildVolume !== false ? 'bg-emerald-600' : 'bg-rose-500'
                            }`}
                            title={
                              localSettings.limitToBuildVolume !== false
                                ? (language === 'cy' ? "Cyfyngiad ar waith (Ymlaen)" : "Limiting active (On)")
                                : (language === 'cy' ? "Cyfyngiad wedi'i ddiffodd (Diffodd)" : "Limiting inactive (Off)")
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                localSettings.limitToBuildVolume !== false ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Texture Option Toggle (default: off) */}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-200">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${localSettings.enableTexture ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-black uppercase text-stone-700 tracking-wider font-sans">
                                {language === 'cy' ? 'Opsiwn Gwead' : 'Texture Option'}
                              </span>
                              <span className="text-[7.5px] font-bold uppercase text-stone-400 tracking-wide">
                                {language === 'cy' ? 'Dangos tab gwead yn y paramedrau dylunio' : 'Show texture tab in design parameters'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !localSettings.enableTexture;
                              setLocalSettings({
                                ...localSettings,
                                enableTexture: nextVal
                              });
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              localSettings.enableTexture ? 'bg-emerald-600' : 'bg-rose-500'
                            }`}
                            title={
                              localSettings.enableTexture
                                ? (language === 'cy' ? "Gwead wedi'i alluogi (Ymlaen)" : "Texture enabled (On)")
                                : (language === 'cy' ? "Gwead wedi'i analluogi (Diffodd)" : "Texture disabled (Off)")
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                localSettings.enableTexture ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* G-code Texture Option Toggle (default: off) */}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-200">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${localSettings.enableGcodeTexture ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-black uppercase text-stone-700 tracking-wider font-sans">
                                {language === 'cy' ? 'Opsiwn Gwead G-god' : 'G-code Texture Option'}
                              </span>
                              <span className="text-[7.5px] font-bold uppercase text-stone-400 tracking-wide">
                                {language === 'cy' ? 'Dangos tab gwead G-god yn y ddewislen gyfrifo' : 'Show G-code texture tab in the calculate menu'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !localSettings.enableGcodeTexture;
                              setLocalSettings({
                                ...localSettings,
                                enableGcodeTexture: nextVal
                              });
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              localSettings.enableGcodeTexture ? 'bg-emerald-600' : 'bg-rose-500'
                            }`}
                            title={
                              localSettings.enableGcodeTexture
                                ? (language === 'cy' ? "Gwead G-god wedi'i alluogi (Ymlaen)" : "G-code texture enabled (On)")
                                : (language === 'cy' ? "Gwead G-god wedi'i analluogi (Diffodd)" : "G-code texture disabled (Off)")
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                localSettings.enableGcodeTexture ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>


                      </section>
                    </div>
                  </div>                ) : activeTab === 'model' ? (
                  <div 
                    id="design-section-container"
                    className={`flex flex-col h-full overflow-hidden transition-all duration-300 bg-[#F0FDF4] border-none ${
                      highlightedSection === 'design' 
                        ? 'ring-4 ring-emerald-500/50 shadow-[0_0_30px_rgba(21,128,61,0.2)] scale-[1.01]' 
                        : ''
                    }`}
                  >
                    <div id="design-title-container" className="flex-none h-[68px] px-4 py-2 bg-[#15803D] font-sans flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-0.5">
                        <h2 className="text-[12px] font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full bg-white text-[#15803D] text-[12px] leading-none font-sans font-black">1</span>
                          <span>{language === 'cy' ? 'Paramedrau Dylunio' : 'Design Parameters'}</span>
                        </h2>
                        <button 
                          onClick={() => {
                            const defaultRadius = settings.defaultWidth / 2;
                            const defaultHeight = settings.defaultHeight;
                            const deltaR = 0.10 * defaultRadius;
                            const draftAngle = Math.atan2(deltaR, Math.max(1, defaultHeight)) * 180 / Math.PI;
                            setParams({
                              ...DEFAULT_MODEL_PARAMS,
                              radius: defaultRadius,
                              height: defaultHeight,
                              draftAngle: Math.round(draftAngle * 10000) / 10000,
                            });
                          }}
                          className="flex items-center gap-1.5 justify-center h-8 px-2.5 text-[9px] font-black uppercase tracking-wider text-white hover:text-emerald-100 hover:bg-white/10 border border-white/20 rounded-xl transition-all cursor-pointer"
                          title={language === 'cy' ? 'Ailosod i ragosodiadau' : 'Reset to Defaults'}
                        >
                          <span>{language === 'cy' ? 'Ailosod' : 'Reset'}</span>
                          <RotateCcw className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-100/80 leading-none">
                        {language === 'cy' ? 'Dyluniwch eich model eich hun trwy newid y paramedrau isod' : 'Design your own model by changing the parameters below'}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-[#F0FDF4]">
                      <ParameterControls 
                        params={params} 
                        onChange={handleParamsChange} 
                        showSizeControls={settings.allowCustomSize}
                        showTexture={settings.enableTexture ?? false}
                        maxWidth={settings.maxWidth}
                        maxHeight={settings.maxHeight}
                        defaultWidth={settings.defaultWidth}
                        defaultHeight={settings.defaultHeight}
                        language={language}
                        exceedsBuildVolume={exceedsBuildVolume}
                        highlightedSection={highlightedSection}
                        limitToBuildVolume={settings.limitToBuildVolume}
                        sizeRestrictionWarning={sizeRestrictionWarning}
                        lockRibDepth={settings.lockRibDepth ?? true}
                        lockRibWidth={settings.lockRibWidth ?? true}
                        modelName={exportFileName}
                        onModelNameChange={handleFileNameChange}
                      />
                    </div>
                  </div>
                ) : activeTab === 'gcode' ? (
                  <div 
                    id="gcode-section-container"
                    className={`flex flex-col h-full overflow-hidden transition-all duration-300 bg-[#FFFBEB] border-none ${
                      highlightedSection === 'gcode' 
                        ? 'ring-4 ring-amber-700/55 shadow-[0_0_30px_rgba(133,77,14,0.2)] scale-[1.01]' 
                        : ''
                    }`}
                  >
                    <div id="gcode-title-container" className="flex-none h-[68px] px-4 py-2 bg-[#854D0E] font-sans flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-0.5">
                        <h2 className="text-[12px] font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full bg-white text-[#854D0E] text-[12px] leading-none font-sans font-black">2</span>
                          <span>{language === 'cy' ? 'Rhagolwg G-god' : 'G-code preview'}</span>
                        </h2>
                        <button 
                          onClick={handleRecalculateGCode}
                          className="flex items-center gap-1.5 justify-center h-8 px-2.5 text-[9px] font-black uppercase tracking-wider text-white hover:text-amber-100 hover:bg-white/10 border border-white/20 rounded-xl transition-all cursor-pointer"
                          title={language === 'cy' ? 'Ailgyfrifo llwybr offer G-god' : 'Recalculate G-code toolpath'}
                        >
                          <span>{language === 'cy' ? 'Ailgyfrifo' : 'Recalculate'}</span>
                          <RefreshCw className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-amber-100/80 leading-none">
                        {language === 'cy' ? "Rhagolwg o'r ffeil G-God a ddefnyddir gan yr argraffydd 3D i argraffu eich model" : 'Preview the G-Code file used by the 3D printer to print your model'}
                      </div>
                    </div>

                    {/* MODEL NAME SECTION (At the top of Calculate menu) */}
                    <div className="flex-none p-2 bg-[#FFFBEB]">
                      <ModelNameInput
                        modelName={exportFileName}
                        onChange={handleFileNameChange}
                        language={language}
                        highlightedSection={highlightedSection}
                        theme="amber"
                      />
                    </div>

                    {/* Merged G-code Player Controls (Moved below the G-code preview header) */}
                    <div id="gcode-player-tour-target" className={`flex-none py-2 px-3 bg-[#FAF8F5] ${
                      highlightedSection === 'subsec-gcode-playback'
                        ? 'border-2 ring-4 ring-red-500/55 bg-[#FAF8F5] border-red-500 rounded-xl scale-[1.01] shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                        : 'border-b border-stone-200'
                    }`}>
                       <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-stone-200 flex items-center gap-1.5 mb-1.5 text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        G-CODE PLAYER
                      </div>
                      <GCodePlayerControls 
                        currentLineIndex={currentLineIndex}
                        playhead={playhead}
                        isPlaying={isPlaying}
                        playbackSpeed={playbackSpeed}
                        totalDistance={gcodeData.totalDistance}
                        currentBuildTimeSeconds={currentBuildTimeSeconds}
                        totalBuildTimeSeconds={totalBuildTimeSeconds}
                        gcodeLines={gcodeData.gcodeLines}
                        lastLayerComment={lastLayerComment}
                        viewMode={viewMode}
                        setIsPlaying={setIsPlaying}
                        setPlaybackSpeed={setPlaybackSpeed}
                        setPlayhead={setPlayhead}
                        setViewMode={setViewMode}
                        goToLine={goToLine}
                        jumpToLayer={jumpToLayer}
                        getGCodeExplanation={getGCodeExplanation}
                        formatTime={formatTime}
                      />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FFFBEB] p-0.5 py-2 space-y-2">
                      {/* G-code Texture Option with Apply Texture button (only visible when activated in settings) */}
                      {(settings.enableGcodeTexture ?? false) && (
                        <GCodeTextureControls
                          params={params}
                          onApply={(textureParams) => {
                            setParams((prev) => ({
                              ...prev,
                              ...textureParams,
                            }));
                            handleRecalculateGCode();
                          }}
                          isCalculating={isCalculating}
                          language={language}
                          highlightedSection={highlightedSection}
                        />
                      )}

                      {/* G-code progress bars added above active command */}
                      <div id="subsec-playback-stats-container" className={`rounded-xl p-2.5 pb-2 border-2 relative ${
                        highlightedSection === 'subsec-gcode-stats'
                          ? 'ring-4 ring-[#0D9488]/50 bg-[#FAF8F5] border-[#0D9488] scale-[1.01] shadow-[0_0_20px_rgba(13,148,136,0.25)]'
                          : 'bg-[#FAF8F5] border-[#0D9488]'
                      }`}>
                        <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-stone-200 flex items-center gap-1.5 text-[#0D9488]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                          {language === 'cy' ? 'Cynnydd Chwarae' : 'Playback progress'}
                        </div>
                        {/* Line of Code Number progress bar */}
                        <div className="space-y-0.5 mt-2">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase text-stone-500 font-mono tracking-wider">
                            <span>{language === 'cy' ? 'Llinell o God' : 'Line of Code'}</span>
                            <span className={`transition-colors ${highlightedSection === 'subsec-gcode-stats' ? 'text-amber-600' : 'text-stone-500'}`}>{currentLineIndex + 1} / {gcodeData.gcodeLines.length}</span>
                          </div>
                          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden border border-stone-300 p-[1px]">
                            <div 
                              className="bg-gradient-to-r from-amber-600 to-amber-500 h-full rounded-full transition-all duration-75"
                              style={{ width: `${Math.max(0, Math.min(100, (gcodeData.gcodeLines.length ? ((currentLineIndex + 1) / gcodeData.gcodeLines.length) * 100 : 0)))}%` }}
                            />
                          </div>
                        </div>

                        {/* Build Time progress bar */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase text-stone-500 font-mono tracking-wider">
                            <span>{language === 'cy' ? 'Amser Adeiladu' : 'Build Time'}</span>
                            <span className={`transition-colors ${highlightedSection === 'subsec-gcode-stats' ? 'text-emerald-600' : 'text-stone-500'}`}>{formatTime(currentBuildTimeSeconds)} / {formatTime(totalBuildTimeSeconds)}</span>
                          </div>
                          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden border border-stone-300 p-[1px]">
                            <div 
                              className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-full rounded-full transition-all duration-75"
                              style={{ width: `${Math.max(0, Math.min(100, (totalBuildTimeSeconds ? (currentBuildTimeSeconds / totalBuildTimeSeconds) * 100 : 0)))}%` }}
                            />
                          </div>
                        </div>

                        {/* Layers progress bar */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase text-stone-500 font-mono tracking-wider">
                            <span>{language === 'cy' ? 'Haenau' : 'Layers'}</span>
                            <span className={`transition-colors ${highlightedSection === 'subsec-gcode-stats' ? 'text-emerald-600' : 'text-stone-500'}`}>{currentLayerNumber} / {totalLayersInfo}</span>
                          </div>
                          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden border border-stone-300 p-[1px]">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-75"
                              style={{ width: `${Math.max(0, Math.min(100, (totalLayersInfo ? (currentLayerNumber / totalLayersInfo) * 100 : 0)))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Active Command (Amber Orange themed highlight) */}
                      <div id="subsec-gcode-command-container" className={`rounded-xl p-2.5 pb-2 border-2 relative ${
                        highlightedSection === 'subsec-gcode-command'
                          ? 'ring-4 ring-[#D97706]/50 bg-[#FAF8F5] border-[#D97706] scale-[1.01] shadow-[0_0_20px_rgba(217,119,6,0.25)]'
                          : 'bg-[#FAF8F5] border-[#D97706]'
                      }`}>
                        <div className="space-y-1">
                          <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-stone-200 flex items-center gap-1.5 text-[#D97706]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                            {language === 'cy' ? 'Gorchymyn G-god' : 'G-code Command'}
                          </div>
                          <div className={`font-mono font-black text-[10px] bg-white px-2 rounded-lg border border-stone-300 break-all shadow-inner h-8 flex items-center w-full transition-colors ${
                            highlightedSection === 'subsec-gcode-command' ? 'text-[#D97706]' : 'text-stone-700'
                          }`}>
                            {gcodeData.gcodeLines[currentLineIndex] || '---'}
                          </div>
                        </div>
                      </div>

                      {/* Command Description (Purple themed highlight) */}
                      <div id="subsec-gcode-description-container" className={`rounded-xl p-2.5 pb-2 border-2 relative ${
                        highlightedSection === 'subsec-gcode-description'
                          ? 'ring-4 ring-[#8E44AD]/50 bg-[#FAF8F5] border-[#8E44AD] scale-[1.01] shadow-[0_0_20px_rgba(142,68,173,0.25)]'
                          : 'bg-[#FAF8F5] border-[#8E44AD]'
                      }`}>
                        <div className="space-y-1">
                          <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-stone-200 flex items-center gap-1.5 text-[#8E44AD]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8E44AD]" />
                            {language === 'cy' ? 'Disgrifiad Gorchymyn G-god' : 'G-code Command Description'}
                          </div>
                          <div className="px-3 bg-white rounded-lg border border-stone-300 min-h-[44px] flex items-center w-full">
                            <p className="text-[10px] text-stone-700 leading-normal font-bold italic whitespace-pre-line text-left py-1.5 w-full">
                              {getGCodeExplanation(gcodeData.gcodeLines[currentLineIndex] || '', language) || (language === 'cy' ? 'Yn aros am gyfeiriad y llwybr offer...' : 'Awaiting toolpath instruction...')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    id="save-section-container"
                    className={`flex flex-col h-full overflow-hidden transition-all duration-300 bg-[#FFF7ED] border-none ${
                      highlightedSection === 'save' 
                        ? 'ring-4 ring-orange-600/50 shadow-[0_0_30px_rgba(234,88,12,0.2)] scale-[1.01]' 
                        : ''
                    }`}
                  >
                    <div id="save-title-container" className="flex-none h-[68px] px-4 py-2 bg-[#EA580C] font-sans flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-0.5">
                        <h2 className="text-[12px] font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full bg-white text-[#EA580C] text-[12px] leading-none font-sans font-black">3</span>
                          <span>{language === 'cy' ? 'Cadw ac Allforio' : 'Save and Export'}</span>
                        </h2>
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-orange-100/80 leading-none">
                        {language === 'cy' ? "Allforio'r ffeil G-god ar gyfer eich Argraffydd 3D a rhannu eich model" : 'Export the G-code file for your 3D Printer and share your model'}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FFF7ED] p-0.5 py-2 space-y-2">
                      {/* MODEL NAME SECTION (At the top of Save menu) */}
                      <div className="px-1.5 pt-0.5">
                        <ModelNameInput
                          modelName={exportFileName}
                          onChange={handleFileNameChange}
                          language={language}
                          highlightedSection={highlightedSection}
                          theme="orange"
                        />
                      </div>
                      {/* Guide Subsection (G-code File scrollable preview & Save Guide button) */}
                      <div 
                        id="subsec-save-guide-container" 
                        className={`rounded-xl p-2.5 pb-2 border-2 transition-all duration-300 relative ${
                          highlightedSection === 'subsec-save-guide'
                            ? 'ring-4 ring-orange-500/50 bg-[#FAF8F5] border-orange-600 scale-[1.01] shadow-[0_0_20px_rgba(234,88,12,0.25)]'
                            : 'bg-[#FAF8F5] border-orange-600'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-stone-200 flex items-center gap-1.5 text-orange-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                          {language === 'cy' ? 'Ffeil G-CODE ar gyfer argraffu 3D' : 'G-CODE file for 3D printing'}
                        </div>
                        <div className="mt-1.5">
                          <textarea
                            readOnly
                            value={(!isGcodeStale && gcode) ? gcode : (language === 'cy' 
                              ? '; Ffeil G-Cod heb ei chyfrifo eto. Ewch i tab "Cyfrifo" i greu ffeil argraffu.' 
                              : '; G-code file not calculated yet. Please switch to "Calculate" tab first.')}
                            className="bg-white rounded-lg border border-stone-200 shadow-xs p-2 h-20 w-full overflow-y-auto font-mono text-[9px] uppercase leading-tight custom-scrollbar text-stone-800 shadow-inner resize-none focus:outline-none"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            deactivateGridAndOthers();
                            if (!gcode || isGcodeStale) {
                              window.dispatchEvent(new CustomEvent('smiley-save-gcode-error'));
                            } else {
                              downloadGCode(gcode, getGCodeDownloadFileName(exportFileName));
                              window.dispatchEvent(new CustomEvent('smiley-gcode-saved'));
                            }
                          }}
                          disabled={!gcode || isGcodeStale}
                          className={`w-full mt-2 h-8 bg-[#EA580C] text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                            (!gcode || isGcodeStale)
                              ? 'opacity-40 cursor-not-allowed shadow-none'
                              : 'hover:bg-[#EA580C]/90 shadow-md active:scale-95 cursor-pointer'
                          }`}
                        >
                          <Save className="w-3.5 h-3.5 text-white" />
                          {language === 'cy' ? 'Cadw G-Cod' : 'Save G-Code'}
                        </button>
                      </div>

                      {/* Picture Subsection (Save Model Picture) */}
                      <div 
                        id="subsec-save-picture-container" 
                        className={`rounded-xl p-2.5 pb-2.5 border-2 transition-all duration-300 relative ${
                          highlightedSection === 'subsec-save-picture'
                            ? 'ring-4 ring-purple-500/50 bg-[#FAF8F5] border-purple-500 scale-[1.01] shadow-[0_0_20px_rgba(147,51,234,0.25)]'
                            : 'bg-[#FAF8F5] border-purple-500'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-stone-200 flex items-center gap-1.5 text-purple-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                          {language === 'cy' ? 'Llum o\'r Model' : 'Model Picture'}
                        </div>
                        
                        <div className="mt-2.5 space-y-2">
                          {/* File Format Selection */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest">
                              {language === 'cy' ? 'Fformat Allforio' : 'Export Format'}
                            </span>
                            <select
                              value={modelPicFormat}
                              onChange={(e) => setModelPicFormat(e.target.value as 'jpeg' | 'png' | 'pdf')}
                              className="w-full text-[9px] h-7 bg-white border border-stone-300 rounded px-1.5 font-bold text-stone-700 focus:ring-purple-500 focus:border-purple-500 cursor-pointer"
                            >
                              <option value="jpeg">JPEG (.jpg)</option>
                              <option value="png">PNG (.png)</option>
                              <option value="pdf">PDF (.pdf)</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <button 
                              id="btn-preview-picture-3d-a4"
                              onClick={() => {
                                setShowA4SheetIn3D(!showA4SheetIn3D);
                                setIsTechDrawingActive(false); // only one preview active at a time
                              }}
                              className={`h-8 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                showA4SheetIn3D 
                                  ? 'bg-purple-50 border-purple-600 text-purple-700 font-extrabold shadow-inner' 
                                  : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-600'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {showA4SheetIn3D 
                                ? (language === 'cy' ? 'CUDDIO' : 'HIDE A4')
                                : (language === 'cy' ? 'RHAGOLWG' : 'PREVIEW')}
                            </button>

                            <button 
                              id="btn-save-picture-export"
                              onClick={handleModelPictureExport}
                              className="h-8 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1 font-bold"
                            >
                              <Save className="w-3.5 h-3.5 text-white" />
                              {language === 'cy' ? 'CADW' : 'EXPORT'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Model Subsection 1 (.CUP Parametric) */}
                      <div 
                        id="subsec-save-model-cup-container" 
                        className={`rounded-xl p-2.5 pb-2 border-2 transition-all duration-300 relative ${
                          highlightedSection === 'subsec-save-model-cup'
                            ? 'ring-4 ring-indigo-500/50 bg-[#FAF8F5] border-indigo-600 scale-[1.01] shadow-[0_0_20px_rgba(79,70,229,0.25)]'
                            : 'bg-[#FAF8F5] border-indigo-600'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-stone-200 flex items-center gap-1.5 text-indigo-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          {language === 'cy' ? 'Model 3D (Parametrig ffeil .cup)' : '3D model (Parametric .cup file)'}
                        </div>
                        <div className="mt-2">
                          <button 
                            onClick={() => {
                              const name = exportFileName.endsWith('.cup') ? exportFileName : `${exportFileName}.cup`;
                              exportParams(name);
                            }}
                            className="w-full h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 font-semibold"
                          >
                            <Save className="w-3.5 h-3.5 text-white" />
                            {language === 'cy' ? 'Cadw fel ffeil .CUP' : 'Save as .CUP File'}
                          </button>
                        </div>
                      </div>

                      {/* Model Subsection 2 (.STL for 3D Printing) */}
                      <div 
                        id="subsec-save-model-stl-container" 
                        className={`rounded-xl p-2.5 pb-2 border-2 transition-all duration-300 relative ${
                          highlightedSection === 'subsec-save-model-stl'
                            ? 'ring-4 ring-emerald-500/50 bg-[#FAF8F5] border-emerald-500 scale-[1.01] shadow-[0_0_20px_rgba(21,128,61,0.25)]'
                            : 'bg-[#FAF8F5] border-emerald-500'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-stone-200 flex items-center gap-1.5 text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          {language === 'cy' ? 'Model 3D (Argraffu 3D ffeil .stl/.3mf)' : '3D model (3D printing .stl/.3mf File)'}
                        </div>
                        
                         <div className="space-y-2 mt-2">
                          <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">{language === 'cy' ? 'Trwch' : 'thickness'}</span>
                              <button 
                                type="button" 
                                onClick={() => setStlThickness(1.2)}
                                title={language === 'cy' ? 'Ailosod Trwch' : 'Reset Thickness'}
                                className="p-0.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-all cursor-pointer inline-flex items-center justify-center"
                              >
                                <RotateCcw className="w-3 h-3 text-stone-500" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <input 
                                type="number"
                                min="0.1"
                                max="10.0"
                                step="0.1"
                                value={stlThickness} 
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val)) {
                                    setStlThickness(val);
                                  }
                                }}
                                className="w-14 text-right font-mono font-bold text-stone-950 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-md text-[10px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <span className="text-[9px] font-bold text-stone-500 font-mono">mm</span>
                            </div>
                          </div>
                          <input 
                            type="range" 
                            min="0.4" 
                            max="5" 
                            step="0.05" 
                            value={stlThickness} 
                            onChange={(e) => setStlThickness(parseFloat(e.target.value))}
                            className="w-full h-1 bg-stone-200 rounded-lg cursor-pointer accent-emerald-600 animate-none mt-0.5"
                          />

                          {/* STL File Quality Slider */}
                          <div className="space-y-0.5 pt-1 border-t border-stone-100 mt-1.5">
                            <div className="flex justify-between items-center px-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">
                                  {language === 'cy' ? 'Ansawdd (Ffasedu)' : 'Quality (Faceting)'}
                                </span>
                                <button 
                                  type="button" 
                                  onClick={() => setParams({ ...params, stlQuality: 1.0 })}
                                  title={language === 'cy' ? 'Ailosod Ansawdd' : 'Reset Quality'}
                                  className="p-0.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-all cursor-pointer inline-flex items-center justify-center animate-none"
                                >
                                  <RotateCcw className="w-3 h-3 text-stone-500" />
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-mono font-bold text-stone-400 uppercase">
                                  {getStlQualityLabel(params.stlQuality)}
                                </span>
                                <div className="flex items-center gap-0.5">
                                  <input 
                                    type="number"
                                    min="0.1"
                                    max="5.0"
                                    step="0.05"
                                    value={typeof params.stlQuality === 'number' ? parseFloat(params.stlQuality.toFixed(2)) : 1.0}
                                    onChange={(e) => {
                                      const parsed = parseFloat(e.target.value);
                                      if (!isNaN(parsed)) {
                                        setParams({ ...params, stlQuality: parsed });
                                      }
                                    }}
                                    className="w-12 text-right font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md text-[10px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                  <span className="text-[9px] font-bold text-emerald-500 font-mono">x</span>
                                </div>
                              </div>
                            </div>
                            <input 
                              type="range" 
                              min="0.3" 
                              max="3.0" 
                              step="0.01" 
                              value={typeof params.stlQuality === 'number' ? params.stlQuality : params.stlQuality === 'low' ? 0.5 : params.stlQuality === 'high' ? 2.0 : 1.0} 
                              onChange={(e) => {
                                setParams({ ...params, stlQuality: parseFloat(e.target.value) });
                              }}
                              className="w-full h-1 bg-stone-200 rounded-lg cursor-pointer accent-emerald-600 animate-none mt-0.5"
                            />
                            <div className="flex justify-between px-1 text-[8px] font-black uppercase text-stone-400 font-sans mt-0.5 select-none">
                              <span>{language === 'cy' ? 'Isel (0.3x)' : 'low (0.3x)'}</span>
                              <span>{language === 'cy' ? 'Diofyn (1.0x)' : 'default (1.0x)'}</span>
                              <span>{language === 'cy' ? 'Uchel (3.0x)' : 'high (3.0x)'}</span>
                            </div>
                          </div>

                          {/* Preview Buttons Grid */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1 mt-1">
                            <button 
                              type="button"
                              onClick={() => {
                                const nextVal = !isStlPreviewOn;
                                setIsStlPreviewOn(nextVal);
                                if (nextVal) setIs3mfPreviewOn(false);
                              }}
                              className={`h-7 border rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                isStlPreviewOn 
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-extrabold shadow-inner' 
                                  : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-600'
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              {isStlPreviewOn 
                                ? (language === 'cy' ? 'Rhagolwg STL: AR' : 'STL Prev: ON')
                                : (language === 'cy' ? 'Rhagolwg STL' : 'STL Prevw')}
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                const nextVal = !is3mfPreviewOn;
                                setIs3mfPreviewOn(nextVal);
                                if (nextVal) setIsStlPreviewOn(false);
                              }}
                              className={`h-7 border rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                is3mfPreviewOn 
                                  ? 'bg-cyan-50 border-cyan-500 text-cyan-700 font-extrabold shadow-inner' 
                                  : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-600'
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              {is3mfPreviewOn 
                                ? (language === 'cy' ? 'Rhagolwg 3MF: AR' : '3MF Prev: ON')
                                : (language === 'cy' ? 'Rhagolwg 3MF' : '3MF Prevw')}
                            </button>
                          </div>

                          <div className="flex flex-col gap-1.5 mt-1.5 w-full pt-1 border-t border-stone-100">
                            <div className="grid grid-cols-2 gap-1.5">
                              <button 
                                onClick={() => confirmSTLExport(stlThickness)}
                                className="h-8 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all font-semibold cursor-pointer shadow-md flex items-center justify-center gap-1 font-bold"
                              >
                                <Save className="w-3 h-3 text-white" />
                                {language === 'cy' ? 'STL' : 'STL'}
                              </button>
                              <button 
                                onClick={() => confirm3MFExport(stlThickness)}
                                className="h-8 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all font-semibold cursor-pointer shadow-md flex items-center justify-center gap-1 font-bold"
                              >
                                <Save className="w-3 h-3 text-white" />
                                {language === 'cy' ? '3MF' : '3MF'}
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button 
                                onClick={() => confirmSTLExport(null)}
                                className="h-8 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#2E2E35] transition-all font-semibold cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Save className="w-3 h-3 text-stone-600" />
                                {language === 'cy' ? 'Arwyneb STL' : 'Surface STL'}
                              </button>
                              <button 
                                onClick={() => confirm3MFExport(null)}
                                className="h-8 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#2E2E35] transition-all font-semibold cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Save className="w-3 h-3 text-stone-600" />
                                {language === 'cy' ? 'Arwyneb 3MF' : 'Surface 3MF'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Technical Drawing Box Subsection */}
                      <div 
                        id="subsec-technical-drawing-container" 
                        className="rounded-xl p-2.5 pb-2.5 border-2 bg-[#FAF8F5] border-blue-600 transition-all duration-300 relative mt-2.5"
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-stone-200 flex items-center gap-1.5 text-blue-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          {language === 'cy' ? 'Dyluniad Technegol' : 'Technical Drawing'}
                        </div>

                        <div className="mt-2.5 space-y-2">
                          {/* Designer Text Input */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest">
                              {language === 'cy' ? 'Cynllunydd' : 'Designer Name'}
                            </span>
                            <input
                              type="text"
                              value={techDrawingDesigner}
                              onChange={(e) => setTechDrawingDesigner(e.target.value)}
                              placeholder={language === 'cy' ? 'e.g. John Doe' : 'e.g. John Doe'}
                              className="w-full text-[9px] h-7 bg-white border border-stone-300 rounded px-1.5 font-bold text-stone-700 focus:ring-blue-500 focus:border-blue-500 animate-none"
                            />
                          </div>

                          {/* Export Format Selection */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest">
                              {language === 'cy' ? 'Fformat Allforio' : 'Export Format'}
                            </span>
                            <select
                              value={techDrawingFormat}
                              onChange={(e) => setTechDrawingFormat(e.target.value as 'jpeg' | 'png' | 'pdf' | 'svg')}
                              className="w-full text-[9px] h-7 bg-white border border-stone-300 rounded px-1.5 font-bold text-stone-700 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                            >
                              <option value="jpeg">JPEG (.jpg)</option>
                              <option value="png">PNG (.png)</option>
                              <option value="pdf">PDF (.pdf)</option>
                              <option value="svg">SVG (.svg)</option>
                            </select>
                          </div>

                          {/* Preview & Export Grid */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <button 
                              id="btn-preview-tech-drawing"
                              onClick={() => {
                                const nextVal = !isTechDrawingActive;
                                setIsTechDrawingActive(nextVal);
                                setShowA4SheetIn3D(false); // Mutually exclusive
                              }}
                              className={`h-8 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                isTechDrawingActive 
                                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-extrabold shadow-inner' 
                                  : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-600'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {isTechDrawingActive 
                                ? (language === 'cy' ? 'CUDDIO' : 'HIDE DRAWING')
                                : (language === 'cy' ? 'RHAGOLWG' : 'PREVIEW')}
                            </button>

                            <button 
                              id="btn-save-tech-drawing"
                              onClick={() => {
                                deactivateGridAndOthers();
                                window.dispatchEvent(new CustomEvent('export-picture', { 
                                  detail: { 
                                    fileName: exportFileName,
                                    a4: true,
                                    frame: true,
                                    titleBox: true,
                                    date: true,
                                    views2D: true, // Forces composite drawing
                                    grid: false,
                                    basePlate: false,
                                    axis: false,
                                    buildVolume: false,
                                    designer: techDrawingDesigner,
                                    scale: 'Auto',
                                    format: techDrawingFormat,
                                    isPreview: false
                                  } 
                                }));
                              }}
                              className="h-8 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1 font-bold"
                            >
                              <Save className="w-3.5 h-3.5 text-white" />
                              {language === 'cy' ? 'CADW' : 'EXPORT'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Test Flow Calibration File Subsection */}
                      <PrintFlowTestSection
                        settings={settings}
                        language={language}
                        highlightedSection={highlightedSection}
                        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* View Area */}
        <section id="three-view-window" className="flex-1 overflow-hidden relative group">
          <Card className="h-full w-full bg-transparent rounded-none border-none shadow-none overflow-hidden flex flex-col p-0">
            <div className="flex-1 relative overflow-hidden bg-transparent">
              <ModelViewer 
                params={deferredParams} 
                settings={settings} 
                gcode={isVisualLoading ? '' : gcode} 
                mode={(activeTab === 'gcode' && !isVisualLoading) ? 'gcode' : 'model'} 
                activeTab={activeTab}
                isCalculating={isCalculating}
                isGcodeStale={isGcodeStale}
                calcProgress={calcProgress}
                onExportGCode={() => downloadGCode(gcode, getGCodeDownloadFileName(exportFileName))}
                playhead={playhead}
                viewMode={viewMode}
                language={language}
                highlightedSection={highlightedSection}
                isStlPreviewOn={(activeTab === 'save' || showSTLDialog) && isStlPreviewOn}
                is3mfPreviewOn={(activeTab === 'save' || showSTLDialog) && is3mfPreviewOn}
                stlThickness={stlThickness}
                showA4Sheet={showA4SheetIn3D || isTechDrawingActive}
                isTechDrawingActive={isTechDrawingActive}
                techDrawingPreviewUrl={techDrawingPreviewUrl}
                initialGrid={selectedControls.grid}
                initialBasePlate={selectedControls.basePlate}
                initialAxis={selectedControls.axis}
                initialBuildVolume={selectedControls.buildVolume}
              />

              {/* Floating warning banner for exceeding build volume */}
              <AnimatePresence>
                {exceedsBuildVolume && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-4 left-4 right-4 z-40 bg-rose-500/15 border border-rose-500/30 rounded-xl p-3.5 backdrop-blur-md shadow-xl flex items-start gap-3 select-none"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                    <div className="space-y-0.5">
                      <p className="text-[12px] font-black text-rose-500 uppercase tracking-widest">{language === 'cy' ? 'GWALL MAINT' : 'SIZE EXCEEDED'}</p>
                      <p className="text-[11px] font-bold text-slate-100 leading-relaxed font-sans">
                        {t('errorExceedsVolume')}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating warning banner for model size restriction */}
              <AnimatePresence>
                {sizeRestrictionWarning && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-4 left-4 right-4 z-40 bg-amber-500/15 border border-amber-500/30 rounded-xl p-3.5 backdrop-blur-md shadow-xl flex items-start gap-3 select-none"
                  >
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                    <div className="space-y-0.5">
                      <p className="text-[12px] font-black text-amber-500 uppercase tracking-widest">{language === 'cy' ? 'MAINT WEDI\'I GYFYNGU' : 'SIZE RESTRICTED'}</p>
                      <p className="text-[11px] font-bold text-slate-100 leading-relaxed font-sans">
                        {language === 'cy'
                          ? "Mae addasiadau paramedrau wedi'u rhwystro dros dro oherwydd byddai'r dyluniad yn caniatáu i'r model fod yn fwy na chyfaint adeiladu'r argraffydd 3D. Gallwch ddadgloi'r cyfyngiad hwn yn y gosodiadau."
                          : "Parameter adjustments are restricted because the model would exceed the 3D printer's physical build volume limit. You can unlock this restriction in the printer settings."}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Centered G-code Generation Status Overlay */}
              <AnimatePresence>
                {isVisualLoading && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-[#0F172A]/50 flex items-center justify-center z-50 pointer-events-auto"
                  >
                    <div className="w-[340px] flex flex-col gap-3 font-sans select-none">
                      <div className="flex justify-between items-center px-0.5">
                        <div className="flex items-center gap-2">
                          <div className="relative w-2.5 h-2.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#EF4444] text-glow-red">
                            {language === 'cy' ? 'Statws G-god' : 'G-code status'}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold tracking-widest font-mono text-[#7CFF6B] text-glow-success animate-pulse">
                          {isVisualLoading ? (language === 'cy' ? 'LLWYTHO' : 'LOADING') : (language === 'cy' ? 'PAROD' : 'READY')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 h-3 w-full px-0.5">
                        {Array.from({ length: 20 }).map((_, idx) => {
                          const segmentValue = (idx + 1) * 5;
                          const isActive = visualProgress >= segmentValue;
                          
                          let segmentColorClass = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
                          if (segmentValue > 40 && segmentValue <= 70) {
                            segmentColorClass = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]';
                          } else if (segmentValue > 70) {
                            segmentColorClass = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]';
                          }

                          return (
                            <div 
                              key={idx}
                              className={`flex-1 h-full rounded-[1.5px] transition-all duration-150 ${
                                isActive ? segmentColorClass : 'bg-white/10'
                              }`}
                            />
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center px-1 text-[8.5px] font-black uppercase tracking-widest text-[#E2E8F0]">
                        <span className="opacity-70">{language === 'cy' ? 'Paratoi llwybr offer...' : 'Preparing toolpath...'}</span>
                        <span className="font-mono text-[#8B5CF6] text-glow-purple">{visualProgress}%</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </section>
      </main>

      <AnimatePresence>
        {showNamePrompt && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#7F7F7F] border border-[#404040] shadow-[0_0_50px_rgba(0,0,0,0.4)] rounded-2xl relative max-w-sm w-full p-6 text-white"
            >
              <button 
                onClick={() => setShowNamePrompt(false)} 
                className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all font-bold text-base leading-none"
              >
                ×
              </button>
              
              <div className="w-12 h-12 bg-white/15 border border-white/25 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <FileDown className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2 text-center">{t('namePromptTitle')}</h3>
              <p className="text-[10px] text-white/85 font-semibold uppercase tracking-widest mb-6 text-center">{t('namePromptSub')}</p>
              
              <div className="space-y-4">
                <input 
                  type="text"
                  placeholder={language === 'cy' ? 'Rhowch eich enw...' : 'Enter your name...'}
                  value={exportFileName}
                  onChange={(e) => setExportFileName(e.target.value)}
                  className="w-full bg-white/15 border border-white/20 rounded-xl p-3 text-xs font-bold text-white placeholder-white/45 focus:border-white focus:ring-1 focus:ring-white outline-none transition-all font-mono"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      deactivateGridAndOthers();
                      setShowNamePrompt(false);
                      downloadGCode(gcode, getGCodeDownloadFileName(exportFileName));
                    }
                  }}
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <button 
                    onClick={() => setShowNamePrompt(false)}
                    className="py-2.5 bg-[#7F7F7F] hover:bg-[#7F7F7F]/90 border border-[#404040] rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all cursor-pointer"
                  >
                    {t('btnCancel')}
                  </button>
                  <button 
                    onClick={() => {
                      deactivateGridAndOthers();
                      setShowNamePrompt(false);
                      downloadGCode(gcode, getGCodeDownloadFileName(exportFileName));
                    }}
                    className="py-2.5 bg-white hover:bg-white/90 text-[#7F7F7F] rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer font-extrabold"
                  >
                    {language === 'cy' ? 'Llwytho i lawr' : 'Download'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSTLDialog && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#7F7F7F] border border-[#404040] shadow-[0_0_50px_rgba(0,0,0,0.4)] rounded-2xl relative max-w-sm w-full p-6 text-white"
            >
              <button 
                onClick={() => setShowSTLDialog(false)} 
                className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all font-bold text-base leading-none"
              >
                ×
              </button>

              <div className="w-12 h-12 bg-white/15 border border-white/25 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <FileJson className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2 text-center">
                {language === 'cy' ? 'Arbed Model 3D (STL / 3MF)' : 'Save 3D Model (STL / 3MF)'}
              </h3>
              <p className="text-[10px] text-white/85 font-semibold uppercase tracking-widest mb-6 text-center">{t('stlThicknessPrompt')}</p>
              
              <div className="space-y-4">
                <div className="bg-white/10 border border-white/10 p-4 rounded-xl space-y-3">
                  {/* Filename Input */}
                  <div className="flex flex-col gap-1.5 pb-2 border-b border-white/10">
                    <label className="text-[9px] font-black uppercase tracking-wider text-white/90">{language === 'cy' ? 'Enw Ffeil Allbwn' : 'Output Filename'}</label>
                    <input 
                      type="text" 
                      value={stlFileName} 
                      onChange={(e) => setStlFileName(e.target.value)}
                      className="w-full bg-white/15 border border-white/15 rounded-xl p-2.5 text-xs font-bold text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all font-mono"
                      placeholder={language === 'cy' ? 'Rhowch enw ffeil...' : 'Enter filename...'}
                    />
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-white/90">{language === 'cy' ? 'Trwch' : 'Thickness'}</label>
                      <button 
                        type="button" 
                        onClick={() => setStlThickness(1.2)}
                        title={language === 'cy' ? 'Ailosod Trwch' : 'Reset Thickness'}
                        className="p-0.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-all cursor-pointer inline-flex items-center justify-center"
                      >
                        <RotateCcw className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <input 
                        type="number"
                        min="0.1"
                        max="10.0"
                        step="0.1"
                        value={stlThickness} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            setStlThickness(val);
                          }
                        }}
                        className="w-14 text-right font-mono font-bold text-white bg-white/15 border border-white/15 px-1.5 py-0.5 rounded-md text-[10px] focus:bg-white/25 focus:outline-none focus:ring-1 focus:ring-white"
                      />
                      <span className="text-[9px] font-bold text-white/75 font-mono">mm</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0.4" 
                    max="5" 
                    step="0.05" 
                    value={stlThickness} 
                    onChange={(e) => setStlThickness(parseFloat(e.target.value))}
                    className="w-full accent-white h-1 bg-white/20 rounded-lg cursor-pointer animate-none"
                  />
                </div>

                 <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => confirmSTLExport(stlThickness)}
                      className="py-2.5 bg-white hover:bg-white/95 text-stone-950 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 font-bold"
                    >
                      <Save className="w-3 h-3 text-stone-950" />
                      {language === 'cy' ? `STL` : `STL`}
                    </button>
                    <button 
                      onClick={() => confirm3MFExport(stlThickness)}
                      className="py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 font-bold"
                    >
                      <Save className="w-3 h-3 text-white" />
                      {language === 'cy' ? `3MF` : `3MF`}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => confirmSTLExport(null)}
                      className="py-2.5 bg-transparent hover:bg-white/10 border border-white/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Save className="w-3 h-3 text-white" />
                      {language === 'cy' ? 'Arwyneb STL' : 'Surface STL'}
                    </button>
                    <button 
                      onClick={() => confirm3MFExport(null)}
                      className="py-2.5 bg-transparent hover:bg-white/10 border border-white/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Save className="w-3 h-3 text-white" />
                      {language === 'cy' ? 'Arwyneb 3MF' : 'Surface 3MF'}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSTLDialog(false)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/95 hover:text-white transition-all cursor-pointer"
                >
                  {t('btnCancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSaveModelDialog && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#7F7F7F] border border-[#404040] shadow-[0_0_50px_rgba(0,0,0,0.4)] rounded-2xl relative max-w-sm w-full p-6 text-white"
            >
              <button 
                onClick={() => setShowSaveModelDialog(false)} 
                className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all font-bold text-base leading-none"
              >
                ×
              </button>

              <div className="w-12 h-12 bg-white/15 border border-white/25 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <FileJson className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2 text-center">{language === 'cy' ? "Cadw'r Model" : "Save Model"}</h3>
              <p className="text-[10px] text-white/85 font-semibold uppercase tracking-widest mb-6 text-center">{language === 'cy' ? "Enw ffeil paramedrau'r model (.cup)" : "Name of the model parameter file (.cup)"}</p>
              
              <div className="space-y-4">
                <div className="bg-white/10 border border-white/10 p-4 rounded-xl space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-wider text-white/90">{language === 'cy' ? 'Enw Ffeil' : 'Filename'}</label>
                  <input 
                    type="text" 
                    value={saveModelName} 
                    onChange={(e) => setSaveModelName(e.target.value)}
                    className="w-full bg-white/15 border border-white/15 rounded-xl p-2.5 text-xs font-bold text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all font-mono"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setShowSaveModelDialog(false);
                        exportParams(saveModelName.endsWith('.cup') ? saveModelName : `${saveModelName}.cup`);
                      }
                    }}
                    placeholder={language === 'cy' ? "Rhowch enw'r model..." : "Enter model name..."}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button 
                    onClick={() => setShowSaveModelDialog(false)}
                    className="py-2.5 bg-[#7F7F7F] hover:bg-[#7F7F7F]/90 border border-[#404040] rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all cursor-pointer"
                  >
                    {t('btnCancel')}
                  </button>
                  <button 
                    onClick={() => {
                      setShowSaveModelDialog(false);
                      exportParams(saveModelName.endsWith('.cup') ? saveModelName : `${saveModelName}.cup`);
                    }}
                    className="py-2.5 bg-white hover:bg-white/90 text-[#7F7F7F] rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer font-extrabold"
                  >
                    {language === 'cy' ? "Cadw'r Model" : "Save Model"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPreviewModal && previewDataUrl && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-stone-200"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
                  {language === 'cy' ? "Rhagolwg o'r Llun" : "Picture Preview"}
                </h3>
                <button 
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewDataUrl(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-200/60 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer text-lg font-black"
                >
                  ×
                </button>
              </div>

              {/* Modal Content - Two Column Split Panel */}
              <div className="flex flex-1 min-h-0 overflow-hidden bg-stone-100/40">
                {/* Left Column: Interactive Zoom & Pan Picture Preview Canvas */}
                <div className="flex-1 bg-stone-100 flex flex-col min-h-0 relative select-none overflow-hidden">
                  <div 
                    className={`flex-1 flex items-center justify-center p-4 relative overflow-hidden ${zoomScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                    onMouseDown={handlePreviewMouseDown}
                    onMouseMove={handlePreviewMouseMove}
                    onMouseUp={handlePreviewMouseUpOrLeave}
                    onMouseLeave={handlePreviewMouseUpOrLeave}
                    onWheel={handlePreviewWheel}
                  >
                    <div 
                      style={{
                        transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${zoomScale})`,
                        transformOrigin: 'center center',
                        transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                      }}
                      className="relative shadow-lg border border-stone-300 rounded bg-white overflow-hidden"
                    >
                      <img 
                        src={previewDataUrl} 
                        alt="Technical drawing sheet preview" 
                        className="h-auto max-h-[50vh] object-contain pointer-events-none select-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    {zoomScale > 1 && (
                      <div className="absolute top-3 left-3 bg-black/60 text-white text-[8px] font-black tracking-wider uppercase px-2 py-1 rounded">
                        {language === 'cy' ? 'Llusgwch i badellu • Sgroliwch i chwyddo' : 'Drag to pan • Scroll to zoom'}
                      </div>
                    )}
                  </div>

                  {/* Zoom Control Toolbar */}
                  <div className="px-4 py-2.5 bg-stone-200/50 border-t border-stone-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => {
                          const nextZoom = Math.max(zoomScale - 0.25, 1);
                          setZoomScale(nextZoom);
                          if (nextZoom === 1) setPanPos({ x: 0, y: 0 });
                        }}
                        disabled={zoomScale <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded bg-white hover:bg-stone-50 border border-stone-300 disabled:opacity-50 text-stone-600 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-black text-stone-700 min-w-[50px] text-center uppercase tracking-wider">
                        {Math.round(zoomScale * 100)}%
                      </span>
                      <button 
                        onClick={() => {
                          const nextZoom = Math.min(zoomScale + 0.25, 6);
                          setZoomScale(nextZoom);
                        }}
                        disabled={zoomScale >= 6}
                        className="w-8 h-8 flex items-center justify-center rounded bg-white hover:bg-stone-50 border border-stone-300 disabled:opacity-50 text-stone-600 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setZoomScale(1);
                          setPanPos({ x: 0, y: 0 });
                        }}
                        disabled={zoomScale === 1 && panPos.x === 0 && panPos.y === 0}
                        className="px-2.5 h-8 flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider font-extrabold rounded bg-white hover:bg-stone-50 border border-stone-300 disabled:opacity-50 text-stone-600 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        {language === 'cy' ? 'Ailosod' : 'Reset'}
                      </button>
                    </div>
                    <div className="text-[8px] font-bold text-stone-500 uppercase tracking-widest hidden sm:block">
                      {language === 'cy' ? 'Defnyddiwch olwyn llygoden neu binsiwch i chwyddo' : 'Use mouse wheel or pinch to zoom'}
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Interactive Option Checklist Controls */}
                <div className="w-[201px] bg-stone-50 border-l border-stone-200 flex flex-col overflow-auto p-4 select-none">
                  <div className="text-[10px] font-black uppercase tracking-wider text-purple-600 pb-1.5 border-b border-stone-300/80 flex items-center gap-1.5 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    {language === 'cy' ? 'Opsiynau Llun' : 'Drawing Options'}
                  </div>

                  <div className="space-y-4 flex-1">
                    {/* Group 1: Technical Drawing Layout Options */}
                    <div className="p-2.5 border border-stone-200 rounded-lg bg-stone-50/50 space-y-3">
                      <div className="text-[8px] font-black uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-200/55">
                        {language === 'cy' ? 'Lluniadu Technegol' : 'Technical Drawing'}
                      </div>

                      {/* Technical Drawing Toggle */}
                      <label className="flex items-start gap-2 cursor-pointer p-1 rounded hover:bg-white transition-colors">
                        <input 
                          type="checkbox"
                          checked={savePic2DViews}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSavePic2DViews(val);
                            setSavePicFrame(val);
                            setSavePicTitleBox(val);
                            setSavePicDate(val);
                          }}
                          className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 border-stone-300 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-stone-800 uppercase tracking-wider">
                            {language === 'cy' ? 'Lluniadu Technegol' : 'Technical Drawing'}
                          </span>
                          <span className="text-[8px] text-stone-500">
                            {language === 'cy' ? 'Galluogi gweddau orthograffig 2D a dimensiynau' : 'Enable 2D orthographic views and dimensioning'}
                          </span>
                        </div>
                      </label>

                      {/* Designer Name Text Input */}
                      <div className="pt-2.5 border-t border-stone-200/60 flex flex-col gap-1">
                        <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest">
                          {language === 'cy' ? 'Cynllunydd (Designed By)' : 'Designer (Designed By)'}
                        </span>
                        <input
                          type="text"
                          value={savePicDesigner}
                          onChange={(e) => setSavePicDesigner(e.target.value)}
                          placeholder={language === 'cy' ? 'Enw dylunydd' : 'Designer name'}
                          className="w-full text-[9px] h-7 bg-white border border-stone-300 rounded px-1.5 font-bold text-stone-700 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Group 2: Printer Environment Elements Options */}
                    <div className="p-2.5 border border-stone-200 rounded-lg bg-stone-50/50 space-y-2.5">
                      <div className="text-[8px] font-black uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-200/55">
                        {language === 'cy' ? 'Amgylchedd yr Argraffydd' : 'Printer Environment Elements'}
                      </div>

                      {/* Grid Checkbox */}
                      <label className="flex items-start gap-2 cursor-pointer p-1 rounded hover:bg-white transition-colors">
                        <input 
                          type="checkbox"
                          checked={savePicGrid}
                          onChange={(e) => setSavePicGrid(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 border-stone-300 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-stone-800 uppercase tracking-wider">
                            {language === 'cy' ? 'Grid' : 'Grid'}
                          </span>
                          <span className="text-[8px] text-stone-500">
                            {language === 'cy' ? 'Arddangos grid y canfas' : 'Render printbed grid guide'}
                          </span>
                        </div>
                      </label>

                      {/* Baseplate Checkbox */}
                      <label className="flex items-start gap-2 cursor-pointer p-1 rounded hover:bg-white transition-colors">
                        <input 
                          type="checkbox"
                          checked={savePicBasePlate}
                          onChange={(e) => setSavePicBasePlate(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 border-stone-300 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-stone-800 uppercase tracking-wider">
                            {language === 'cy' ? 'Plât Sylfaen Gwely' : 'Printer Baseplate'}
                          </span>
                          <span className="text-[8px] text-stone-500">
                            {language === 'cy' ? 'Plât gwely argraffu crwn' : 'Render rounded printbed sheet'}
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Picture Format Dropdown */}
                    <div className="pt-2.5 border-t border-stone-200 flex flex-col gap-1">
                      <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest">
                        {language === 'cy' ? 'Fformat Allforio' : 'Picture Format'}
                      </span>
                      <select
                        value={savePicFormat}
                        onChange={(e) => setSavePicFormat(e.target.value as 'jpeg' | 'pdf' | 'svg')}
                        className="w-full text-[9px] h-7 bg-white border border-stone-300 rounded px-1.5 font-bold text-stone-700 focus:ring-purple-500 focus:border-purple-500 cursor-pointer text-ellipsis"
                      >
                        <option value="jpeg">JPEG (.jpg)</option>
                        <option value="pdf">PDF (.pdf)</option>
                        <option value="svg">SVG (.svg)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 bg-[#FAF8F5] border border-stone-200 rounded-lg p-2.5 text-[8px] text-stone-500 font-medium leading-relaxed">
                    {language === 'cy' 
                      ? 'Bydd unrhyw fotwm togl neu werth cynllunydd yma yn diweddaru canfas y rhagolwg yn fyw.' 
                      : 'Any adjustment here will trigger an instant WYSIWYG re-render of the picture preview.'
                    }
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-4 border-t border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="text-[9px] text-stone-500 font-black uppercase tracking-wider">
                  {language === 'cy' ? "Ardal weithio A4 rhanbarthol" : "A4 technical sheet grid"}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPreviewModal(false);
                      setPreviewDataUrl(null);
                    }}
                    className="px-4 py-2 border border-stone-300 rounded-lg text-[9px] font-black uppercase tracking-wider text-stone-600 hover:bg-stone-100 transition-all cursor-pointer font-bold"
                  >
                    {language === 'cy' ? 'Canslo' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('export-picture', { 
                        detail: { 
                          fileName: exportFileName,
                          a4: savePicA4,
                          frame: savePicFrame,
                          titleBox: savePicTitleBox,
                          date: savePicDate,
                          views2D: savePic2DViews,
                          grid: savePicGrid,
                          basePlate: savePicBasePlate,
                          axis: savePicAxis,
                          buildVolume: savePicBuildVolume,
                          designer: savePicDesigner,
                          scale: savePicScale,
                          format: savePicFormat,
                          isPreview: false
                        } 
                      }));
                      setShowPreviewModal(false);
                      setPreviewDataUrl(null);
                    }}
                    className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5 font-bold"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {language === 'cy' ? 'Lawrlwytho' : 'Download'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isSmileyActive && (
        <CursorSmiley 
          key="smiley-assistant"
          activeTab={activeTab} 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          showSettings={showSettings}
          language={language}
          setLanguage={setLanguage}
          params={params}
          highlightedSection={highlightedSection}
          setHighlightedSection={setHighlightedSection}
          setActiveTab={setActiveTab}
          setShowSettings={(show: boolean) => {
            if (!show) {
              setShowSettings(false);
            } else {
              const isRestricted = RESTRICT_SETTINGS_ACCESS;
              if (isRestricted) {
                setIsSettingsAuthModalOpen(true);
              } else {
                setShowSettings(true);
                setIsSidebarCollapsed(false);
              }
            }
          }}
        />
      )}

      <SettingsAccessModal
        isOpen={isSettingsAuthModalOpen}
        onClose={() => setIsSettingsAuthModalOpen(false)}
        onSuccess={() => {
          setIsSettingsAuthModalOpen(false);
          setShowSettings(true);
          setIsSidebarCollapsed(false);
        }}
        language={language}
      />

      <AboutAppModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        language={language}
      />
    </div>
  );
}


