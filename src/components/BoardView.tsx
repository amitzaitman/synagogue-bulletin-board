import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { EventItem, BoardSettings, Column, ZmanimData } from '../types';
import Clock from './Clock';
import ColumnView from './ColumnView';
import EditPanel from './EditPanel';
import ZmanimInfo from './ZmanimInfo';
import AddColumnDialog from './dialogs/AddColumnDialog';
import FloatingPanel from './FloatingPanel';
import EditModePanel from './EditModePanel';
import { useColumnEditor } from '../hooks/useColumnEditor';
import { useInactivity } from '../hooks/useInactivity';
import { calculateAllEventTimes } from '../utils/timeCalculations';
import { saveWithBackup, createRecoveryPoint } from '../utils/dataBackup';

const SettingsIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const HomeIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

interface BoardViewProps {
  events: EventItem[];
  columns: Column[];
  settings: BoardSettings;
  saveEvents: (events: EventItem[]) => void;
  saveColumns: (columns: Column[]) => void;
  saveSettings: (settings: BoardSettings) => void;
  onSwitchToAdmin: () => void;
  onSaveChanges: () => void;
  onBackToHome: () => void;
  isEditMode: boolean;
  zmanimData: ZmanimData | null;
  zmanimLoading: boolean;
  zmanimError: string | null;
  lastRefresh: Date;
  lastSyncTime: Date;
  isOnline: boolean;
}

const BoardView: React.FC<BoardViewProps> = (props) => {
    const {
        events, columns, settings,
        saveEvents, saveColumns, saveSettings,
        onSwitchToAdmin, onSaveChanges, onBackToHome, isEditMode,
        zmanimData, zmanimLoading, zmanimError,
        lastSyncTime, isOnline
    } = props;

    const [displaySettings, setDisplaySettings] = useState<BoardSettings>(settings);
    
    useEffect(() => {
        if (!isEditMode) {
            setDisplaySettings(settings);
        }
    }, [settings, isEditMode]);

    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [inlineAddEvent, setInlineAddEvent] = useState<{ columnId: string } | null>(null);
    const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
    const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const [activeSection, setActiveSection] = useState<string | undefined>(undefined);
    const [showAddColumnDialog, setShowAddColumnDialog] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [newColumnType, setNewColumnType] = useState<'shabbat' | 'weekdays' | 'moed'>('shabbat');
    const [newColumnDate, setNewColumnDate] = useState('');

    const { editingColumn, startEditing, setEditTitle, setEditColumnType, setEditSpecificDate, saveEdit } = useColumnEditor(columns, saveColumns);
    const containerRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLElement>(null);

    const { isActive } = useInactivity({ timeoutMs: 3000 }); // 3 seconds timeout
    
    const handleOpenSettings = (section: string) => {
        setActiveSection(section);
        setShowSettingsPanel(true);
    };
    
    const handleCloseSettings = () => {
        setShowSettingsPanel(false);
        setActiveSection(undefined);
    };

    const [contentScale, setContentScale] = useState(1);
    const [titleScale, setTitleScale] = useState(1);
    // Fixed design size for consistent scaling across all screens
    const DESIGN_WIDTH = 1920;  // 16:9 design width
    const headerRef = useRef<HTMLElement>(null);

    const calculateScales = useCallback(() => {
        if (!containerRef.current || !mainContentRef.current) {
            return;
        }

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        if (containerWidth <= 0 || containerHeight <= 0) {
            return;
        }
        
        // Calculate scale based on container dimensions relative to design size (1920x1080)
        // Since container maintains 16:9, we can use either dimension - they'll give the same ratio
        // Use width for consistency - this ensures identical appearance across all screens
        let finalScale = containerWidth / DESIGN_WIDTH;
        
        // Verify content fits with this scale and adjust ONLY if absolutely necessary
        // This preserves identical appearance while preventing overflow
        const headerHeight = headerRef.current?.clientHeight || 0;
        const availableHeight = containerHeight - headerHeight;
        
        // Get content metrics
        const maxEventsInColumn = Math.max(...columns.map(col => 
            events.filter(e => e.columnId === col.id).length
        ), 1);
        
        // Base measurements in em units (will be converted to pixels with scale)
        const columnHeaderHeight = 3; // em units for column title
        const columnPadding = 2; // em units for padding
        const estimatedRowHeight = 4; // em units per row
        const mainContentPadding = 2; // em units for main content padding
        
        const baseFontSize = 16; // pixels
        
        // Calculate total content height needed (in em)
        const totalContentHeightEm = columnHeaderHeight + columnPadding + (maxEventsInColumn * estimatedRowHeight) + mainContentPadding;
        
        // Check if content fits with the base scale
        const testContentHeight = totalContentHeightEm * baseFontSize * finalScale;
        if (testContentHeight > availableHeight && availableHeight > 0) {
            // Only adjust if content doesn't fit - calculate minimum scale needed
            const heightBasedScale = availableHeight / (totalContentHeightEm * baseFontSize);
            finalScale = Math.min(finalScale, heightBasedScale);
        }
        
        // Ensure we have a reasonable minimum scale
        finalScale = Math.max(finalScale, 0.1);
        
        // Use the same scale for everything to maintain identical appearance
        setContentScale(finalScale);
        setTitleScale(finalScale);
    }, [columns, events]);

    useEffect(() => {
        // Initial calculation
        calculateScales();
        
        // Recalculate after a short delay to account for header rendering
        const timeoutId = setTimeout(() => {
            calculateScales();
        }, 100);
        
        window.addEventListener('resize', calculateScales);

        // Use ResizeObserver for more accurate container size tracking
        let resizeObserver: ResizeObserver | null = null;
        let headerResizeObserver: ResizeObserver | null = null;
        
        if (containerRef.current && window.ResizeObserver) {
            resizeObserver = new ResizeObserver(() => {
                calculateScales();
            });
            resizeObserver.observe(containerRef.current);
        }
        
        if (headerRef.current && window.ResizeObserver) {
            headerResizeObserver = new ResizeObserver(() => {
                calculateScales();
            });
            headerResizeObserver.observe(headerRef.current);
        }

        const refreshInterval = setInterval(() => {
            window.location.reload();
        }, 4 * 60 * 60 * 1000);

        const memoryCheck = setInterval(() => {
            if (window.performance && (window.performance as any).memory) {
                const memoryInfo = (window.performance as any).memory;
                if (memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.9) {
                    console.warn('High memory usage detected, triggering refresh');
                    window.location.reload();
                }
            }
        }, 30 * 60 * 1000);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', calculateScales);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (headerResizeObserver) {
                headerResizeObserver.disconnect();
            }
            clearInterval(refreshInterval);
            clearInterval(memoryCheck);
        };
    }, [calculateScales]);

    useEffect(() => {
        calculateScales();
    }, [columns, events, calculateScales]);

    const calculatedTimes = useMemo(() => calculateAllEventTimes(events, columns, zmanimData, settings), [events, columns, zmanimData, settings]);
    
    useEffect(() => {
        if (!isEditMode) {
            setEditingItemId(null);
            setInlineAddEvent(null);
            setDraggingItemId(null);
            setDraggingColumnId(null);
        }
    }, [isEditMode]);
    
    const handleAddNewColumn = () => {
        setShowAddColumnDialog(true);
    };
    
    const handleSaveNewColumn = () => {
        if (!newColumnTitle.trim()) {
            alert('נא להזין שם עמודה');
            return;
        }
        if (newColumnType === 'moed' && !newColumnDate) {
            alert('נא לבחור תאריך למועד');
            return;
        }

        const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order)) : -1;
        const newColumn: Column = {
            id: `col-${Date.now()}`,
            title: newColumnTitle.trim(),
            order: maxOrder + 1,
            columnType: newColumnType,
            ...(newColumnType === 'moed' && newColumnDate ? { specificDate: newColumnDate } : {})
        };
        saveColumns([...columns, newColumn]);

        setShowAddColumnDialog(false);
        setNewColumnTitle('');
        setNewColumnType('shabbat');
        setNewColumnDate('');
    };

    const handleDeleteColumn = (id: string) => {
        const associatedEventsCount = events.filter(event => event.columnId === id).length;
        let confirmationMessage = "האם אתה בטוח שברצונך למחוק את העמודה?";
        if (associatedEventsCount > 0) {
            confirmationMessage += `\nפעולה זו תמחק גם ${associatedEventsCount} אירועים הנמצאים בעמודה זו.`;
        }

        if (window.confirm(confirmationMessage)) {
            saveEvents(events.filter(event => event.columnId !== id));
            saveColumns(columns.filter(c => c.id !== id));
        }
    };
    
    const handleSaveEvent = (eventData: EventItem) => {
        try {
            createRecoveryPoint(events, columns, settings);

            const exists = events.some(ev => ev.id === eventData.id);
            const newEvents = exists
                ? events.map(ev => ev.id === eventData.id ? eventData : ev)
                : [...events, eventData];

            let finalEvents = newEvents;

            if (!settings.manualEventOrdering) {
                const timesMap = calculateAllEventTimes(newEvents, columns, zmanimData, settings);

                const timeToMinutes = (t: string | null, fallbackIndex: number) => {
                    if (!t) return 24 * 60 + fallbackIndex;
                    const [h, m] = t.split(':').map(Number);
                    return h * 60 + m;
                };

                finalEvents = [...newEvents].sort((a, b) => {
                    const ta = timesMap.get(a.id) ?? null;
                    const tb = timesMap.get(b.id) ?? null;
                    const ma = timeToMinutes(ta, a.order ?? 0);
                    const mb = timeToMinutes(tb, b.order ?? 0);
                    if (ma !== mb) return ma - mb;
                    return (a.name || '').localeCompare(b.name || '') || a.id.localeCompare(b.id);
                }).map((ev, idx) => ({ ...ev, order: idx }));
            } else if (!exists) {
                const columnEvents = newEvents.filter(ev => ev.columnId === eventData.columnId);
                const maxOrder = columnEvents.length > 0 ? Math.max(...columnEvents.map(ev => ev.order ?? 0)) : -1;
                finalEvents = newEvents.map(ev =>
                    ev.id === eventData.id ? { ...ev, order: maxOrder + 1 } : ev
                );
            }

            saveEvents(finalEvents);
            saveWithBackup({
                timestamp: new Date().toISOString(),
                events: finalEvents,
                columns,
                settings
            });

            localStorage.removeItem('lastRecoveryPoint');
            setEditingItemId(null);
            setInlineAddEvent(null);
        } catch (error) {
            console.error('Failed to save event:', error);
            const recoveryData = localStorage.getItem('lastRecoveryPoint');
            if (recoveryData) {
                const { events: recoveredEvents, columns: recoveredColumns } = JSON.parse(recoveryData);
                saveEvents(recoveredEvents);
                saveColumns(recoveredColumns);
            }
        }
    };

    const handleDeleteEvent = (id: string) => {
        saveEvents(events.filter(ev => ev.id !== id));
        setEditingItemId(null);
    };
    
    const handleToggleHighlight = (id: string) => {
        saveEvents(events.map(ev => ev.id === id ? { ...ev, isHighlighted: !ev.isHighlighted } : ev));
    };

    const handleEventDragStart = (e: React.DragEvent<HTMLDivElement>, eventId: string) => {
        e.dataTransfer.setData("eventId", eventId);
        setDraggingItemId(eventId);
    };

    const handleEventDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleEventDrop = (e: React.DragEvent<HTMLDivElement>, targetEvent: EventItem) => {
        e.preventDefault();
        const draggedEventId = e.dataTransfer.getData("eventId");
        setDraggingItemId(null);

        const draggedEvent = events.find(ev => ev.id === draggedEventId);
        if (!draggedEvent || draggedEvent.id === targetEvent.id || draggedEvent.columnId !== targetEvent.columnId) {
            return;
        }

        const columnEvents = events
            .filter(ev => ev.columnId === draggedEvent.columnId)
            .sort((a, b) => a.order - b.order);

        const otherColumnEvents = events.filter(ev => ev.columnId !== draggedEvent.columnId);

        const itemsWithoutDragged = columnEvents.filter(ev => ev.id !== draggedEventId);
        const targetIndex = itemsWithoutDragged.findIndex(ev => ev.id === targetEvent.id);

        itemsWithoutDragged.splice(targetIndex, 0, draggedEvent);

        const reorderedEvents = itemsWithoutDragged.map((ev, index) => ({ ...ev, order: index }));

        saveEvents([...otherColumnEvents, ...reorderedEvents]);
    };

    const handleColumnDragStart = (e: React.DragEvent, columnId: string) => {
        e.dataTransfer.setData("columnId", columnId);
        setDraggingColumnId(columnId);
    };

    const handleColumnDragEnd = () => {
        setDraggingColumnId(null);
    };

    const handleColumnDrop = (e: React.DragEvent, targetColumn: Column) => {
        e.preventDefault();
        const draggedColumnId = e.dataTransfer.getData("columnId");

        if (!draggedColumnId || draggedColumnId === targetColumn.id) {
            return;
        }

        const draggedColumn = columns.find(c => c.id === draggedColumnId);
        if (!draggedColumn) return;

        const itemsWithoutDragged = columns.filter(c => c.id !== draggedColumnId);
        const targetIndex = itemsWithoutDragged.findIndex(c => c.id === targetColumn.id);

        itemsWithoutDragged.splice(targetIndex, 0, draggedColumn);

        const reorderedColumns = itemsWithoutDragged.map((c, index) => ({ ...c, order: index }));
        saveColumns(reorderedColumns);
    };

    const finalContentScale = contentScale;
        
    return (
        <div ref={containerRef} className="relative h-full flex flex-col overflow-hidden" style={{ backgroundColor: displaySettings.mainBackgroundColor }}>
            <header 
                ref={headerRef} 
                className="flex-shrink-0 flex justify-between items-start" 
                style={{ 
                    fontSize: `${titleScale * 16}px`,
                    padding: `${titleScale * 24}px ${titleScale * 32}px ${titleScale * 8}px ${titleScale * 32}px`
                }}
            >
                <div className="flex-1 text-right flex flex-col items-start" style={{ gap: `${titleScale * 8}px` }}>
                    <ZmanimInfo zmanimData={zmanimData} loading={zmanimLoading} error={zmanimError} settings={displaySettings} scale={titleScale} />
                </div>
                <div className="flex-1 text-center">
                    <h1 className="font-title leading-tight whitespace-nowrap drop-shadow-md" style={{ color: displaySettings.mainTitleColor, fontSize: `${5.5 * titleScale * 16 * (displaySettings.mainTitleSize / 100)}px`}}>
                        {displaySettings.boardTitle}
                    </h1>
                </div>
                <div className="flex-1 text-left flex flex-col items-end" style={{ gap: `${titleScale * 8}px` }}>
                    <Clock settings={displaySettings} scale={titleScale} />
                </div>
            </header>
            
            {/* Floating buttons - hidden when inactive */}
            {!isEditMode && isActive && (
                <div className="fixed z-40 opacity-50 hover:opacity-100 transition-opacity duration-300" style={{ bottom: `${contentScale * 16}px`, left: `${contentScale * 16}px` }}>
                    <div className="flex flex-col" style={{ gap: `${contentScale * 8}px` }}>
                        <button onClick={onBackToHome} className="bg-white/90 rounded-full shadow-lg hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2" style={{ padding: `${contentScale * 12}px` }}>
                            <HomeIcon size={contentScale * 24} />
                        </button>
                        <button onClick={onSwitchToAdmin} className="bg-white/90 rounded-full shadow-lg hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2" style={{ padding: `${contentScale * 12}px` }}>
                            <SettingsIcon size={contentScale * 24} />
                        </button>
                    </div>
                </div>
            )}
            
            <main 
                ref={mainContentRef} 
                className="flex-grow flex items-stretch overflow-x-auto" 
                style={{ 
                    fontSize: `${finalContentScale * 16}px`,
                    gap: `${finalContentScale * 24}px`,
                    padding: `0 ${finalContentScale * 32}px ${finalContentScale * 24}px ${finalContentScale * 32}px`
                }}
            >
                {columns.sort((a, b) => a.order - b.order).map(column => (
                    <div
                        key={column.id}
                        className={`transition-all duration-300 flex-shrink-0 flex-grow basis-0 rounded-lg shadow ${draggingColumnId === column.id ? 'opacity-30' : ''}`}
                        style={{ 
                            backgroundColor: displaySettings.columnBackgroundColor,
                            padding: `${finalContentScale * 8}px ${finalContentScale * 16}px ${finalContentScale * 16}px ${finalContentScale * 16}px`
                        }}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDrop={(e) => handleColumnDrop(e, column)}
                    >
                        <ColumnView
                            column={column}
                            events={events.filter(e => e.columnId === column.id).sort((a,b) => a.order - b.order)}
                            settings={displaySettings}
                            isEditMode={isEditMode}
                            editingItemId={editingItemId}
                            inlineAddEvent={inlineAddEvent}
                            calculatedTimes={calculatedTimes}
                            draggingItemId={draggingItemId}
                            onEditEvent={setEditingItemId}
                            onCancelEdit={() => { setEditingItemId(null); setInlineAddEvent(null); }}
                            onSaveEvent={handleSaveEvent}
                            onDeleteEvent={handleDeleteEvent}
                            onToggleHighlight={handleToggleHighlight}
                            onEventDragStart={handleEventDragStart}
                            onEventDragOver={handleEventDragOver}
                            onEventDrop={handleEventDrop}
                            editingColumn={editingColumn}
                            onEditColumnTitleChange={setEditTitle}
                            onEditColumnTypeChange={setEditColumnType}
                            onEditSpecificDateChange={setEditSpecificDate}
                            onSaveColumnTitle={saveEdit}
                            onSetEditingColumn={() => startEditing(column)}
                            onDeleteColumn={handleDeleteColumn}
                            onAddNewEvent={() => setInlineAddEvent({ columnId: column.id })}
                            onColumnDragStart={handleColumnDragStart}
                            onColumnDragEnd={handleColumnDragEnd}
                            draggingColumnId={draggingColumnId}
                        />
                    </div>
                ))}
            </main>
            
            {isEditMode && (
                <FloatingPanel 
                    isOpen={showSettingsPanel} 
                    onClose={handleCloseSettings} 
                    title="עריכת לוח"
                >
                    <EditPanel
                        settings={settings}
                        onSave={(newSettings) => {
                            setDisplaySettings(newSettings);
                            saveSettings(newSettings);
                        }}
                        zmanimData={zmanimData}
                        zmanimLoading={zmanimLoading}
                        zmanimError={zmanimError}
                        activeSection={activeSection}
                    />
                </FloatingPanel>
            )}
            
            {isEditMode && (
                <EditModePanel
                    isOpen={true}
                    onClose={() => {}}
                    onSave={onSaveChanges}
                    onOpenSettings={(section) => {
                        if (section) {
                            handleOpenSettings(section);
                        }
                    }}
                    onAddColumn={handleAddNewColumn}
                    onExit={onSaveChanges}
                />
            )}
            
            {showAddColumnDialog && (
                <AddColumnDialog
                    newColumnTitle={newColumnTitle}
                    newColumnType={newColumnType}
                    newColumnDate={newColumnDate}
                    setNewColumnTitle={setNewColumnTitle}
                    setNewColumnType={setNewColumnType}
                    setNewColumnDate={setNewColumnDate}
                    onSave={handleSaveNewColumn}
                    onCancel={() => {
                        setShowAddColumnDialog(false);
                        setNewColumnTitle('');
                        setNewColumnType('shabbat');
                        setNewColumnDate('');
                    }}
                />
            )}
        </div>
    );
};

export default BoardView;