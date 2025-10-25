import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EventItem, BoardSettings, Column, ZmanimData } from '../types';
import Clock from './Clock';
import ColumnView from './ColumnView';
import EditPanel from './EditPanel';
import ZmanimInfo from './ZmanimInfo';
import AddColumnDialog from './dialogs/AddColumnDialog';
import { useColumnEditor } from '../hooks/useColumnEditor';
import { calculateAllEventTimes } from '../utils/timeCalculations';
import { saveWithBackup, loadFromBackup, createRecoveryPoint } from '../utils/dataBackup';


// --- Helper Components & Icons ---
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;



// Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;

// Main Board View
interface BoardViewProps {
  events: EventItem[];
  columns: Column[];
  settings: BoardSettings;
  saveEvents: (events: EventItem[]) => void;
  saveColumns: (columns: Column[]) => void;
  saveSettings: (settings: BoardSettings) => void;
  onSwitchToAdmin: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  onBackToHome: () => void;
  isEditMode: boolean;
  zmanimData: ZmanimData | null;
  zmanimLoading: boolean;
  zmanimError: string | null;
  lastRefresh: Date;
  lastSyncTime: Date;
  isOnline: boolean;
  canEdit: boolean;
}

const BoardView: React.FC<BoardViewProps> = (props) => {
    const {
        events, columns, settings,
        saveEvents, saveColumns, saveSettings,
        onSwitchToAdmin, onSaveChanges, onCancelChanges, onBackToHome, isEditMode,
        zmanimData, zmanimLoading, zmanimError,
        lastRefresh, lastSyncTime, isOnline, canEdit
    } = props;

    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [inlineAddEvent, setInlineAddEvent] = useState<{ columnId: string } | null>(null);
    const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
    const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
    const [showSettingsButton, setShowSettingsButton] = useState(true);
    const [showAddColumnDialog, setShowAddColumnDialog] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [newColumnType, setNewColumnType] = useState<'shabbat' | 'weekdays' | 'moed'>('shabbat');
    const [newColumnDate, setNewColumnDate] = useState('');
    const timeoutRef = useRef<number | null>(null);


    // --- Hooks ---
    const { editingColumn, startEditing, cancelEdit, setEditTitle, setEditColumnType, setEditSpecificDate, saveEdit } = useColumnEditor(columns, saveColumns);
    const containerRef = useRef<HTMLDivElement>(null);
    const [autoScale, setAutoScale] = useState(1);
    const DESIGN_WIDTH = 1536;

    const handleMouseMove = () => {
        if (isEditMode) return;
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setShowSettingsButton(true);
        timeoutRef.current = window.setTimeout(() => {
            setShowSettingsButton(false);
        }, 2000);
    };

    useEffect(() => {
        // Hide the button after a few seconds on initial load
        const initialTimeout = window.setTimeout(() => {
            setShowSettingsButton(false);
        }, 3000); // Hide after 3 seconds

        // Refresh every 4 hours
        const refreshInterval = setInterval(() => {
            window.location.reload();
        }, 4 * 60 * 60 * 1000);

        // Check memory usage every 30 minutes
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
            clearTimeout(initialTimeout);
            clearInterval(refreshInterval);
            clearInterval(memoryCheck);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);



    // Resize observer
    useEffect(() => {
        const currentContainer = containerRef.current;
        if (!currentContainer) return;

        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width } = entries[0].contentRect;
                if (width > 0) {
                    const newScale = Math.min(1, width / DESIGN_WIDTH);
                    setAutoScale(newScale);
                }
            }
        });

        observer.observe(currentContainer);

        return () => {
            if (currentContainer) {
              observer.unobserve(currentContainer);
            }
        };
    }, []);

    const calculatedTimes = useMemo(() => calculateAllEventTimes(events, columns, zmanimData, settings), [events, columns, zmanimData, settings]);

    useEffect(() => {
        if (!isEditMode) {
            setEditingItemId(null);
            setInlineAddEvent(null);
            setDraggingItemId(null);
            setDraggingColumnId(null);
            cancelEdit(); // From our new hook
        }
    }, [isEditMode, cancelEdit]);

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

        const newId = `col-${Date.now()}`;
        const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order)) : -1;
        const newColumn: Column = {
            id: newId,
            title: newColumnTitle.trim(),
            order: maxOrder + 1,
            columnType: newColumnType,
            ...(newColumnType === 'moed' && newColumnDate ? { specificDate: newColumnDate } : {})
        };
        saveColumns([...columns, newColumn]);

        // Reset dialog state
        setShowAddColumnDialog(false);
        setNewColumnTitle('');
        setNewColumnType('shabbat');
        setNewColumnDate('');
    };

    const handleCancelNewColumn = () => {
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
            // Delete the events associated with the column
            const remainingEvents = events.filter(event => event.columnId !== id);
            saveEvents(remainingEvents);

            // Delete the column itself
            const remainingColumns = columns.filter(c => c.id !== id);
            saveColumns(remainingColumns);
        }
    };

    const handleSaveEvent = (eventData: EventItem) => {
        try {
            // Create recovery point before changes
            createRecoveryPoint(events, columns, settings);

            const exists = events.some(ev => ev.id === eventData.id);
            const newEvents = exists
                ? events.map(ev => ev.id === eventData.id ? eventData : ev)
                : [...events, eventData];

            let finalEvents = newEvents;

            // Only auto-sort if manual ordering is disabled
            if (!settings.manualEventOrdering) {
                // After creating/updating the event, sort all events by their calculated time
                // so the board displays events in chronological order. Use calculateAllEventTimes
                // which returns times as "HH:MM" strings or null.
                const timesMap = calculateAllEventTimes(newEvents, columns, zmanimData, settings);

                const timeToMinutes = (t: string | null, fallbackIndex: number) => {
                    if (!t) return 24 * 60 + fallbackIndex; // put nulls at the end, stable by index
                    const [h, m] = t.split(':').map(Number);
                    return h * 60 + m;
                };

                finalEvents = [...newEvents].sort((a, b) => {
                    const ta = timesMap.get(a.id) ?? null;
                    const tb = timesMap.get(b.id) ?? null;
                    const ma = timeToMinutes(ta, a.order ?? 0);
                    const mb = timeToMinutes(tb, b.order ?? 0);
                    if (ma !== mb) return ma - mb;
                    // tie-break: keep previous relative ordering by id or name
                    return (a.name || '').localeCompare(b.name || '') || a.id.localeCompare(b.id);
                }).map((ev, idx) => ({ ...ev, order: idx }));
            } else {
                // For manual ordering, if it's a new event, add it at the end of its column
                if (!exists) {
                    const columnEvents = newEvents.filter(ev => ev.columnId === eventData.columnId);
                    const maxOrder = columnEvents.length > 0 ? Math.max(...columnEvents.map(ev => ev.order ?? 0)) : -1;
                    finalEvents = newEvents.map(ev =>
                        ev.id === eventData.id ? { ...ev, order: maxOrder + 1 } : ev
                    );
                }
            }

            // Save changes and create a backup
            saveEvents(finalEvents);

            saveWithBackup({
                timestamp: new Date().toISOString(),
                events: finalEvents,
                columns,
                settings
            });

            // Clear recovery point after successful save
            localStorage.removeItem('lastRecoveryPoint');

            setEditingItemId(null);
            setInlineAddEvent(null);
        } catch (error) {
            console.error('Failed to save event:', error);
            // Try to recover from last recovery point
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
      setEditingItemId(null); // Close form if deleting from it
    };

    const handleToggleHighlight = (id: string) => {
        saveEvents(events.map(ev => ev.id === id ? { ...ev, isHighlighted: !ev.isHighlighted } : ev));
    };
    
    // --- Event Drag and Drop Logic ---
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
        .sort((a,b) => a.order - b.order);
      
      const otherColumnEvents = events.filter(ev => ev.columnId !== draggedEvent.columnId);
      
      const itemsWithoutDragged = columnEvents.filter(ev => ev.id !== draggedEventId);
      const targetIndex = itemsWithoutDragged.findIndex(ev => ev.id === targetEvent.id);
      
      itemsWithoutDragged.splice(targetIndex, 0, draggedEvent);
      
      const reorderedEvents = itemsWithoutDragged.map((ev, index) => ({...ev, order: index }));
      
      saveEvents([...otherColumnEvents, ...reorderedEvents]);
    };

    // --- Column Drag and Drop Logic ---
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


    const finalScale = settings.scale * autoScale;
    
    return (
        <div ref={containerRef} onMouseMove={handleMouseMove} className="relative h-full flex flex-col overflow-hidden" style={{ fontSize: `${finalScale * 16}px` }}>
            <header className="flex-shrink-0 flex justify-between items-start p-4 md:p-6 pb-2">
                <div className="flex-1 text-right">
                    <ZmanimInfo zmanimData={zmanimData} loading={zmanimLoading} error={zmanimError} settings={settings} />
                </div>
                <div className="flex-1 text-center">
                    <h1 className="font-title text-[5.5em] leading-tight whitespace-nowrap drop-shadow-md" style={{ color: settings.mainTitleColor, fontSize: `${5.5 * (settings.mainTitleSize / 100)}em`}}>
                        {settings.boardTitle || 'בית הכנסת - גבעת החי״ש'}
                    </h1>
                </div>
                <div className="flex-1 text-left">
                    <Clock settings={settings} />
                </div>
            </header>

            <main className="flex-grow flex items-stretch gap-4 md:gap-6 px-4 md:px-6 pb-4 md:pb-6 overflow-x-auto">
                {columns.sort((a, b) => a.order - b.order).map(column => (
                    <div
                        key={column.id}
                        className={`transition-all duration-300 flex-shrink-0 flex-grow basis-0 rounded-lg px-3 pb-3 pt-1 md:px-4 md:pb-4 md:pt-1 shadow ${draggingColumnId === column.id ? 'opacity-30' : ''}`}
                        style={{ backgroundColor: settings.columnBackgroundColor }}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDrop={(e) => handleColumnDrop(e, column)}
                    >
                        <ColumnView
                            column={column}
                            events={events.filter(e => e.columnId === column.id).sort((a,b) => a.order - b.order)}
                            settings={settings}
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

            {/* Home and Settings buttons */}
            {!isEditMode && (
                <div className={`absolute bottom-4 left-4 z-20 flex items-center gap-2 transition-opacity duration-300 ${showSettingsButton ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button
                        onClick={onBackToHome}
                        className="p-3 bg-white/50 rounded-full shadow-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                        aria-label="Back to Home"
                        title="חזרה לדף הבית"
                    >
                        <HomeIcon />
                    </button>
                    <button
                        onClick={onSwitchToAdmin}
                        className="p-3 bg-white/50 rounded-full shadow-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                        aria-label="Enter Edit Mode"
                        title="כניסה למצב ניהול"
                    >
                        <SettingsIcon />
                    </button>
                </div>
            )}

            {/* Exit edit mode button */}
            {isEditMode && (
                <button
                    onClick={onSwitchToAdmin}
                    className="absolute bottom-4 left-4 p-3 bg-red-500/80 rounded-lg shadow-md hover:bg-red-600 transition z-20 flex items-center gap-2 text-white font-semibold"
                    aria-label="Exit Edit Mode"
                    title="יציאה ממצב ניהול"
                >
                    <span>יציאה ממצב ניהול</span>
                </button>
            )}

            {isEditMode && (
                <EditPanel
                    settings={settings}
                    onSave={saveSettings}
                    onAddColumn={handleAddNewColumn}
                    onSaveChanges={onSaveChanges}
                    onCancelChanges={onCancelChanges}
                    lastSyncTime={lastSyncTime}
                    isOnline={isOnline}
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
                    onCancel={handleCancelNewColumn}
                />
            )}
        </div>
    );
};

export default BoardView;