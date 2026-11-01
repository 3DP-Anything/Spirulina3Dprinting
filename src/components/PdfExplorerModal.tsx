import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Folder, FolderOpen, ExternalLink, Download, RefreshCw, 
  ChevronRight, ChevronDown, Search, FolderTree, ChevronsUpDown,
  ChevronsDownUp
} from 'lucide-react';
import { PdfIcon } from './PdfIcon';
import { getPdfUrl } from '../parameters/index';

export interface PdfItem {
  name: string;
  path: string; // relative to pdf/
  type: 'folder' | 'file';
  size?: number;
  updatedAt?: string;
  children?: PdfItem[];
}

interface PdfExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'cy';
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// Tree Node Item Component
interface TreeNodeProps {
  item: PdfItem;
  level: number;
  expandedMap: Record<string, boolean>;
  onToggleExpand: (path: string) => void;
  language: 'en' | 'cy';
  searchQuery: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  item,
  level,
  expandedMap,
  onToggleExpand,
  language,
  searchQuery,
}) => {
  const isFolder = item.type === 'folder';
  const isExpanded = Boolean(expandedMap[item.path]);
  const fileUrl = !isFolder ? getPdfUrl(item.path) : '#';

  // Count files inside folder recursively
  const fileCount = useMemo(() => {
    if (!isFolder) return 0;
    let count = 0;
    function countItems(node: PdfItem) {
      if (node.type === 'file') count++;
      if (node.children) node.children.forEach(countItems);
    }
    countItems(item);
    return count;
  }, [item, isFolder]);

  // Check if item or its children match search query
  const matchesSearch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    if (item.name.toLowerCase().includes(q)) return true;
    if (isFolder && item.children) {
      function checkChildren(nodes: PdfItem[]): boolean {
        return nodes.some(n => 
          n.name.toLowerCase().includes(q) || 
          (n.children && checkChildren(n.children))
        );
      }
      return checkChildren(item.children);
    }
    return false;
  }, [item, isFolder, searchQuery]);

  if (!matchesSearch) return null;

  return (
    <div className="select-none font-sans">
      {/* Node Row */}
      <div
        className={`group flex items-center justify-between py-2 px-2.5 rounded-xl transition-all ${
          isFolder
            ? 'hover:bg-stone-100/80 cursor-pointer text-stone-800 font-medium'
            : 'hover:bg-red-50/60 text-stone-700'
        }`}
        style={{ paddingLeft: `${Math.max(10, level * 20 + 10)}px` }}
        onClick={() => {
          if (isFolder) {
            onToggleExpand(item.path);
          }
        }}
      >
        {/* Left: Expander + Icon + Name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isFolder ? (
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center text-stone-400 group-hover:text-stone-700 transition-colors shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(item.path);
              }}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-stone-600 transition-transform" />
              ) : (
                <ChevronRight className="w-4 h-4 text-stone-500 transition-transform" />
              )}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          {/* Icon */}
          <div className="w-7 h-7 rounded-lg bg-stone-100 group-hover:bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs transition-colors">
            {isFolder ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-500" />
              ) : (
                <Folder className="w-4 h-4 text-amber-500" />
              )
            ) : (
              <PdfIcon className="w-4 h-4 text-red-600" />
            )}
          </div>

          {/* Name & Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[13.5px] truncate font-sans ${
                  isFolder
                    ? 'font-semibold text-stone-900 group-hover:text-red-700'
                    : 'font-normal text-stone-800 group-hover:text-red-700'
                }`}
              >
                {item.name}
              </span>
            </div>
            <div className="text-[11.5px] text-stone-400 flex items-center gap-1.5 font-sans">
              {isFolder ? (
                <span>
                  {fileCount} {language === 'cy' ? (fileCount === 1 ? 'ffeil' : 'ffeiliau') : (fileCount === 1 ? 'file' : 'files')}
                </span>
              ) : (
                <>
                  <span>{formatBytes(item.size)}</span>
                  {item.updatedAt && (
                    <>
                      <span>·</span>
                      <span>{formatDate(item.updatedAt)}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions for files (Open & Download) */}
        {!isFolder && (
          <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
            {/* View / Open button */}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 text-[12px] font-medium transition-all shadow-2xs"
              title={language === 'cy' ? 'Agor ffeil PDF mewn tab newydd' : 'Open PDF file in a new tab'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{language === 'cy' ? 'Agor' : 'Open'}</span>
            </a>

            {/* Download button */}
            <a
              href={fileUrl}
              download={item.name}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200 border border-transparent hover:border-stone-300 transition-all"
              title={language === 'cy' ? 'Lawrlwytho ffeil PDF' : 'Download PDF file'}
              aria-label="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Children for folder (Expandable) */}
      {isFolder && isExpanded && item.children && item.children.length > 0 && (
        <div className="relative border-l border-stone-200 ml-5 my-0.5">
          {item.children.map((child) => (
            <TreeNode
              key={child.path}
              item={child}
              level={level + 1}
              expandedMap={expandedMap}
              onToggleExpand={onToggleExpand}
              language={language}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
      {isFolder && isExpanded && (!item.children || item.children.length === 0) && (
        <div className="relative border-l border-stone-200 ml-5 my-0.5 py-1.5 pl-5 text-[12px] text-stone-400 italic">
          {language === 'cy' ? '(Ffolder wag)' : '(Empty folder)'}
        </div>
      )}
    </div>
  );
};

export const PdfExplorerModal: React.FC<PdfExplorerModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [rootItem, setRootItem] = useState<PdfItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({ '': true });

  // Fetch the current PDF directory tree
  const fetchTree = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      // 1. Try dev/Node API
      const res = await fetch('/api/pdf-explorer/tree', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.root) {
          setRootItem(data.root);
          return;
        }
      }
      // 2. Fallback to static manifest.json
      const manifestUrl = getPdfUrl('manifest.json');
      const staticRes = await fetch(manifestUrl, { cache: 'no-store' });
      if (staticRes.ok) {
        const manifestData = await staticRes.json();
        setRootItem(manifestData);
      }
    } catch (err) {
      console.warn('PDF Explorer fetch fallback:', err);
      try {
        const staticRes = await fetch('./pdf/manifest.json', { cache: 'no-store' });
        if (staticRes.ok) {
          const manifestData = await staticRes.json();
          setRootItem(manifestData);
        }
      } catch {
        // Ignore
      }
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, []);

  // Initial load and periodic refresh while modal is open; reset folders to collapsed on open
  useEffect(() => {
    if (isOpen) {
      setExpandedMap({ '': true });
      setSearchQuery('');
      fetchTree();
      const interval = setInterval(() => {
        fetchTree(true);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchTree]);

  // Auto-expand all folders when user searches
  useEffect(() => {
    if (searchQuery.trim() && rootItem) {
      const allOpen: Record<string, boolean> = { '': true };
      function openAll(node: PdfItem) {
        if (node.type === 'folder') {
          allOpen[node.path] = true;
          if (node.children) node.children.forEach(openAll);
        }
      }
      openAll(rootItem);
      setExpandedMap(allOpen);
    }
  }, [searchQuery, rootItem]);

  // Toggle expand for a specific folder
  const handleToggleExpand = (path: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Expand All
  const handleExpandAll = () => {
    if (!rootItem) return;
    const allOpen: Record<string, boolean> = { '': true };
    function openAll(node: PdfItem) {
      if (node.type === 'folder') {
        allOpen[node.path] = true;
        if (node.children) node.children.forEach(openAll);
      }
    }
    openAll(rootItem);
    setExpandedMap(allOpen);
  };

  // Collapse All
  const handleCollapseAll = () => {
    setExpandedMap({ '': true });
  };

  // Total files count across the tree
  const totalFiles = useMemo(() => {
    if (!rootItem) return 0;
    let count = 0;
    function countFiles(node: PdfItem) {
      if (node.type === 'file') count++;
      if (node.children) node.children.forEach(countFiles);
    }
    countFiles(rootItem);
    return count;
  }, [rootItem]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-2xl bg-[#FAF8F5] border-2 border-stone-300 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col text-stone-800 my-auto max-h-[90vh] font-sans"
          >
            {/* Header: Classic PDF Red / Crimson theme */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#DC2626] text-white shrink-0 shadow-sm font-sans">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
                  <PdfIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-normal leading-tight text-white font-sans flex items-center gap-2">
                    <span>{language === 'cy' ? 'Porwr Dogfennau PDF' : 'PDF Documents Explorer'}</span>
                  </h2>
                  <p className="text-sm text-red-100 font-normal leading-tight mt-0.5 font-sans">
                    {language === 'cy'
                      ? "Cyfeiriwch at y ddogfennaeth isod am arweiniad ar ddefnyddio'r ap a gweithredu'r argraffydd 3D."
                      : 'Refer to the documentation below for guidance on using the app and running the 3D printer.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/35 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 font-sans"
                title={language === 'cy' ? 'Cau' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body: Uniform font-sans, consistent text-[13.5px] throughout */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-[13.5px] leading-[22px] custom-scrollbar font-sans text-stone-800">
              
              {/* Search & Tree Controls Card */}
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border-2 border-stone-200 shadow-2xs space-y-3 font-sans">
                <div className="flex items-center justify-between gap-2.5">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        language === 'cy'
                          ? 'Chwilio dogfennau PDF yn ôl enw...'
                          : 'Search PDF documents by name...'
                      }
                      className="w-full pl-9 pr-8 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-[13px] text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-sans"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Expand / Collapse All & Refresh Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleExpandAll}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 border border-stone-300 rounded-xl text-stone-700 text-[12px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title={language === 'cy' ? 'Ehangu Pob Un' : 'Expand All'}
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5 text-stone-600" />
                      <span className="hidden sm:inline">{language === 'cy' ? 'Ehangu' : 'Expand All'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCollapseAll}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 border border-stone-300 rounded-xl text-stone-700 text-[12px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title={language === 'cy' ? 'Crebachu Pob Un' : 'Collapse All'}
                    >
                      <ChevronsDownUp className="w-3.5 h-3.5 text-stone-600" />
                      <span className="hidden sm:inline">{language === 'cy' ? 'Crebachu' : 'Collapse All'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fetchTree()}
                      disabled={isLoading}
                      className="p-1.5 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 border border-stone-300 rounded-xl text-stone-600 transition-all cursor-pointer disabled:opacity-50"
                      title={language === 'cy' ? 'Adnewyddu' : 'Refresh'}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-600' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tree View Card */}
              <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-stone-200 shadow-2xs space-y-2 font-sans min-h-[220px]">
                
                {/* Header info */}
                <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 text-[12px] text-stone-500 font-medium font-sans">
                  <div className="flex items-center gap-1.5">
                    <FolderTree className="w-4 h-4 text-red-600" />
                    <span>
                      {language === 'cy' ? 'Coeden Ffolderi a Dogfennau PDF' : 'PDF Folders & Documents Tree'}
                    </span>
                  </div>
                  <span className="text-stone-400">
                    {totalFiles} {language === 'cy' ? (totalFiles === 1 ? 'dogfen' : 'dogfennau') : (totalFiles === 1 ? 'document' : 'documents')}
                  </span>
                </div>

                {/* Tree Structure */}
                <div className="pt-1 space-y-0.5">
                  {rootItem && rootItem.children && rootItem.children.length > 0 ? (
                    rootItem.children.map((child) => (
                      <TreeNode
                        key={child.path}
                        item={child}
                        level={0}
                        expandedMap={expandedMap}
                        onToggleExpand={handleToggleExpand}
                        language={language}
                        searchQuery={searchQuery}
                      />
                    ))
                  ) : (
                    <div className="py-10 text-center text-stone-500 font-sans">
                      <p className="text-[13.5px]">
                        {language === 'cy' ? 'Dim ffeiliau PDF ar gael.' : 'No PDF files available.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer info & Close */}
              <div className="flex items-center justify-between pt-1 font-sans">
                <span className="text-[12px] text-stone-400 font-sans">
                  {language === 'cy'
                    ? 'Cliciwch ar ffolder i ehangu/crebachu, neu "Agor" i weld y PDF.'
                    : 'Click a folder to expand/collapse, or "Open" to view the PDF.'}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white text-[13px] font-bold shadow-md cursor-pointer transition-all active:scale-95 font-sans"
                >
                  {language === 'cy' ? 'Cau' : 'Close'}
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
