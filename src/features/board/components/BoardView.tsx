import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EventItem, BoardSettings, Column, ZmanimData } from '../../../shared/types/types';
import BoardSettingsForm from '../../editor/components/BoardSettingsForm';
import AddColumnDialog from '../../editor/components/dialogs/AddColumnDialog';
import FloatingPanel from '../../../shared/components/FloatingPanel';
import EditorSidebar from '../../editor/components/EditorSidebar';
import { useColumnEditor } from '../../editor/hooks/useColumnEditor';
import { useInactivity } from '../../../shared/hooks/useInactivity';
import { calculateAllEventTimes } from '../../../shared/utils/timeCalculations';
import { useResponsiveScaling } from '../../../shared/hooks/useResponsiveScaling';

// New Components
import BoardHeader from './BoardHeader';
import BoardGrid from './BoardGrid';
import BoardControls from './BoardControls';

interface BoardViewProps {
    events: EventItem[];
    columns: Column[];
    settings: BoardSettings;
    saveEvents: (events: EventItem[]) => void;
    saveColumns: (columns: Column[]) => void;
    saveSettings: (settings: BoardSettings) => void;
    onEnterEditMode: () => void;
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
        onEnterEditMode, onSaveChanges, onBackToHome, isEditMode,
        zmanimData, zmanimLoading, zmanimError } = props;

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
    const headerRef = useRef<HTMLElement>(null);

    const { isActive } = useInactivity({ timeoutMs: 3000 }); // 3 seconds timeout

    const handleOpenSettings = (section: string) => {
        setActiveSection(section);
        setShowSettingsPanel(true);
    };

    const handleCloseSettings = () => {
        setShowSettingsPanel(false);
        setActiveSection(undefined);
    };

    // Track container and header dimensions for scaling
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(0);

    // Use the new responsive scaling hook
    const { headerScale, contentScale } = useResponsiveScaling({
        containerWidth,
        containerHeight,
        headerHeight,
        columns,
        events,
        zoomLevel: displaySettings.zoomLevel || 1.0,
    });

    // Measure container and header dimensions
    useEffect(() => {
        const measureDimensions = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
                setContainerHeight(containerRef.current.clientHeight);
            }
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.clientHeight);
            }
        };

        // Initial measurement
        measureDimensions();

        // Measure after a short delay for header rendering
        const timeoutId = setTimeout(measureDimensions, 100);

        // Re-measure on window resize
        window.addEventListener('resize', measureDimensions);

        // Use ResizeObserver for accurate tracking
        let containerObserver: ResizeObserver | null = null;
        let headerObserver: ResizeObserver | null = null;

        if (window.ResizeObserver) {
            if (containerRef.current) {
                containerObserver = new ResizeObserver(measureDimensions);
                containerObserver.observe(containerRef.current);
            }
            if (headerRef.current) {
                headerObserver = new ResizeObserver(measureDimensions);
                headerObserver.observe(headerRef.current);
            }
        }

        // Auto-refresh every 4 hours
        const refreshInterval = setInterval(() => {
            window.location.reload();
        }, 4 * 60 * 60 * 1000);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', measureDimensions);
            if (containerObserver) containerObserver.disconnect();
            if (headerObserver) headerObserver.disconnect();
            clearInterval(refreshInterval);
        };
    }, []);

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

    return (
        <div ref={containerRef} className="relative h-full flex flex-col overflow-hidden" style={{ backgroundColor: displaySettings.mainBackgroundColor }}>
            <BoardHeader
                settings={displaySettings}
                zmanimData={zmanimData}
                zmanimLoading={zmanimLoading}
                zmanimError={zmanimError}
                headerScale={headerScale}
                headerRef={headerRef as React.RefObject<HTMLElement>}
            />

            <BoardControls
                isEditMode={isEditMode}
                isActive={isActive}
                contentScale={contentScale}
                settings={displaySettings}
                onBackToHome={onBackToHome}
                onEnterEditMode={onEnterEditMode}
                saveSettings={(newSettings) => {
                    setDisplaySettings(newSettings);
                    saveSettings(newSettings);
                }}
            />

            <BoardGrid
                columns={columns}
                events={events}
                settings={displaySettings}
                isEditMode={isEditMode}
                headerScale={headerScale}
                contentScale={contentScale}
                mainContentRef={mainContentRef as React.RefObject<HTMLElement>}
                editingItemId={editingItemId}
                inlineAddEvent={inlineAddEvent}
                draggingItemId={draggingItemId}
                draggingColumnId={draggingColumnId}
                editingColumn={editingColumn ? editingColumn.id : null}
                setEditingItemId={setEditingItemId}
                setInlineAddEvent={setInlineAddEvent}
                handleSaveEvent={handleSaveEvent}
                handleDeleteEvent={handleDeleteEvent}
                handleToggleHighlight={handleToggleHighlight}
                handleEventDragStart={handleEventDragStart}
                handleEventDragOver={handleEventDragOver}
                handleEventDrop={handleEventDrop}
                setEditTitle={setEditTitle}
                setEditColumnType={setEditColumnType}
                setEditSpecificDate={setEditSpecificDate}
                saveEdit={saveEdit}
                startEditing={startEditing}
                handleDeleteColumn={handleDeleteColumn}
                handleColumnDragStart={handleColumnDragStart}
                handleColumnDragEnd={handleColumnDragEnd}
                handleColumnDrop={handleColumnDrop}
                calculatedTimes={calculatedTimes as Map<string, string>}
            />

            {isEditMode && (
                <FloatingPanel
                    isOpen={showSettingsPanel}
                    onClose={handleCloseSettings}
                    title="עריכת לוח"
                >
                    <BoardSettingsForm
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
                <EditorSidebar
                    isOpen={true}
                    onClose={() => { }}
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