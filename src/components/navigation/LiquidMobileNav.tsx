import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, FileText, FolderOpen, UserCog } from 'lucide-react';

const TABS = [
  { id: '/admin', label: 'Dashboard', icon: LayoutDashboard, isExact: true },
  { id: '/admin/tenants', label: 'Tenants', icon: Users },
  { id: '/admin/invoices', label: 'Invoice', icon: FileText, special: true },
  { id: '/admin/documents', label: 'Documents', icon: FolderOpen },
  { id: '/admin/settings', label: 'Profile', icon: UserCog },
];

export default function LiquidMobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);
  const [previewTab, setPreviewTab] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync active tab with location changes
  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    
    // Only process if it's a primary touch/pointer
    if (e.buttons !== 1 && e.pointerType !== 'touch') return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const tabWidth = width / TABS.length;
    let index = Math.floor(x / tabWidth);
    
    if (index < 0) index = 0;
    if (index >= TABS.length) index = TABS.length - 1;
    
    const targetTab = TABS[index].id;
    if (previewTab !== targetTab) {
      // Small haptic feedback if supported when sliding to a new tab
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(10);
      }
      setPreviewTab(targetTab);
    }
  };

  const handlePointerUp = () => {
    if (previewTab && previewTab !== activeTab) {
      navigate(previewTab);
    }
    setPreviewTab(null);
  };

  const handlePointerLeave = () => {
    setPreviewTab(null);
  };

  const currentActive = previewTab || activeTab;

  return (
    <div className="lg:hidden fixed inset-x-0 bottom-6 z-[100] flex justify-center pointer-events-none px-4">
      {/* 
        The navigation bar uses pointer events to allow swipe-to-select interaction,
        but the bar itself is no longer draggable to prevent shaking/jittering.
      */}
      <motion.div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerDown={(e) => {
          // Immediately set preview on touch down
          handlePointerMove(e);
        }}
        className="pointer-events-auto flex items-center justify-between w-full max-w-[400px] h-[76px] px-2 rounded-[2.5rem] bg-white/60 backdrop-blur-[32px] border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] relative touch-none will-change-transform"
        style={{ touchAction: 'none' }}
      >
        {TABS.map((tab) => {
          const isActive = currentActive === tab.id || (!tab.isExact && currentActive.startsWith(tab.id));
          
          return (
            <div
              key={tab.id}
              className="relative flex flex-col items-center justify-center w-[70px] h-[64px] z-10 cursor-pointer select-none"
              onClick={() => {
                setPreviewTab(null);
                navigate(tab.id);
              }}
            >
              {/* Animated Glass Capsule Background */}
              {isActive && !tab.special && (
                <motion.div
                  layoutId="active-capsule"
                  className="absolute inset-0 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] border border-gray-100 rounded-[1.75rem]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 1 }}
                />
              )}

              {/* Icon and Text Content */}
              <div className="relative z-20 flex flex-col items-center justify-center gap-1.5 pt-1">
                {tab.special ? (
                  <>
                    <motion.div
                      animate={{ 
                        scale: isActive ? 1.05 : 1,
                        y: isActive ? -6 : -4
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={`w-[56px] h-[56px] rounded-full flex items-center justify-center transition-colors duration-300 border-2 ${
                        isActive ? 'bg-[#cba557] border-[#eedba3] shadow-[0_8px_20px_rgba(212,178,106,0.5)]' : 'bg-[#d4b26a] border-[#f3e5c0] shadow-[0_4px_12px_rgba(212,178,106,0.3)]'
                      }`}
                    >
                      <tab.icon className="w-6 h-6 text-white stroke-[2.5px]" />
                    </motion.div>
                    <span className={`text-[11px] font-bold tracking-wide -mt-1 transition-colors duration-300 ${
                      isActive ? 'text-[#b68c3e]' : 'text-[#d4b26a]'
                    }`}>
                      {tab.label}
                    </span>
                  </>
                ) : (
                  <>
                    <tab.icon 
                      className={`w-6 h-6 transition-all duration-300 ${
                        isActive ? 'text-[#0f172a] stroke-[2.5px] scale-110' : 'text-[#8e8e93] stroke-[2px]'
                      }`} 
                    />
                    <span className={`text-[10px] font-semibold tracking-wide transition-all duration-300 ${
                      isActive ? 'text-[#0f172a]' : 'text-[#8e8e93]'
                    }`}>
                      {tab.label}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
