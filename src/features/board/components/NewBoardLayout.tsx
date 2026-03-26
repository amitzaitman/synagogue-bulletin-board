import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { EventItem, BoardSettings, Column as IColumn, ZmanimData } from '../../../shared/types/types';
import { calculateAllEventTimes } from '../../../shared/utils/timeCalculations';
import Header from './Header';
import Column from './Column';
import { useResponsiveScaling as useScaling } from '../../../shared/hooks/useResponsiveScaling';
import { LAYOUT_CONSTANTS } from '../../../shared/constants/layout';
import EditPanel from '../../editor/components/BoardSettingsForm';
import ColumnSettingsForm from '../../editor/components/ColumnSettingsForm';
import EventForm from '../../editor/components/EventForm';
import EventItemComponent from './EventItem';
import ZmanimFooter from './ZmanimFooter';
import BoardMessagesBox from './BoardMessagesBox';
import LandscapeEnforcer from '../../../shared/components/LandscapeEnforcer';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    SortableContext,
} from '@dnd-kit/sortable';

interface NewBoardLayoutProps {
    events: EventItem[];
    columns: IColumn[];
    settings: BoardSettings;
    zmanimData: ZmanimData | null;
    saveEvents: (events: EventItem[]) => void;
    saveColumns: (columns: IColumn[]) => void;
    saveSettings: (settings: BoardSettings) => void;
    onEnterEditMode: () => void;
    onSaveChanges: () => void;
    onBackToHome: () => void;
    isEditMode: boolean;
    zmanimLoading: boolean;
    zmanimError: string | null;
    lastRefresh: Date;
    lastSyncTime: Date;
    isOnline: boolean;
    onOpenDebug: () => void;
}

const NewBoardLayout: React.FC<NewBoardLayoutProps> = (props) => {
    const { events, columns, settings, zmanimData } = props;
    const containerRef = useRef<HTMLDivElement>(null);

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Event Editing State
    const [editingEventState, setEditingEventState] = useState<{
        isOpen: boolean;
        columnId: string;
        event?: EventItem;
        initialOrder?: number;
    }>({ isOpen: false, columnId: '' });

    // Column Editing State
    const [editingColumnSettings, setEditingColumnSettings] = useState<{
        isOpen: boolean;
        columnId: string;
    }>({ isOpen: false, columnId: '' });

    // Settings Section State
    const [activeSettingsSection, setActiveSettingsSection] = useState<string>('general');

    // Drag and Drop State
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        if (active.id !== over.id) {
            // Check if we are dragging a column
            const activeColumn = columns.find(c => c.id === active.id);
            const overColumn = columns.find(c => c.id === over.id);

            if (activeColumn && overColumn) {
                const oldIndex = columns.findIndex(c => c.id === active.id);
                const newIndex = columns.findIndex(c => c.id === over.id);

                // Reorder columns
                const newColumns = arrayMove(columns, oldIndex, newIndex);
                // Update order property
                const updatedColumns = newColumns.map((c, index) => ({ ...c, order: index }));
                props.saveColumns(updatedColumns);
            }
            // Check if we are dragging an event
            else {
                const activeEvent = events.find(e => e.id === active.id);
                const overEvent = events.find(e => e.id === over.id);

                if (activeEvent && overEvent && activeEvent.columnId === overEvent.columnId) {
                    const columnEvents = events
                        .filter(e => e.columnId === activeEvent.columnId)
                        .sort((a, b) => a.order - b.order);

                    const oldIndex = columnEvents.findIndex(e => e.id === active.id);
                    const newIndex = columnEvents.findIndex(e => e.id === over.id);

                    const newColumnEvents = arrayMove(columnEvents, oldIndex, newIndex);

                    const updatedEvents = events.map(e => {
                        if (e.columnId === activeEvent.columnId) {
                            const newOrderIndex = newColumnEvents.findIndex(ne => ne.id === e.id);
                            return { ...e, order: newOrderIndex };
                        }
                        return e;
                    });

                    props.saveEvents(updatedEvents);
                }
            }
        }

        setActiveId(null);
    };

    const activeEvent = activeId ? events.find(e => e.id === activeId) : null;
    const activeColumn = activeId ? columns.find(c => c.id === activeId) : null;

    const headerRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [footerHeight, setFooterHeight] = useState(0);

    // Measure dimensions
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.clientHeight);
            }
            if (footerRef.current) {
                setFooterHeight(footerRef.current.clientHeight);
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        // Use ResizeObserver for more robust header measurement
        const resizeObserver = new ResizeObserver(() => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.clientHeight);
            }
            if (footerRef.current) {
                setFooterHeight(footerRef.current.clientHeight);
            }
        });

        if (headerRef.current) {
            resizeObserver.observe(headerRef.current);
        }
        if (footerRef.current) {
            resizeObserver.observe(footerRef.current);
        }

        // Also measure after a short delay to ensure layout is stable
        setTimeout(updateDimensions, 100);

        return () => {
            window.removeEventListener('resize', updateDimensions);
            resizeObserver.disconnect();
        };
    }, []);

    // Activity tracking
    const [controlsVisible, setControlsVisible] = useState(false);
    const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const showControls = () => {
            setControlsVisible(true);
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            inactivityTimer.current = setTimeout(() => {
                setControlsVisible(false);
            }, 3000);
        };

        window.addEventListener('mousemove', showControls);
        window.addEventListener('touchstart', showControls);
        window.addEventListener('click', showControls);
        window.addEventListener('keydown', showControls);

        showControls(); // Initial show

        return () => {
            window.removeEventListener('mousemove', showControls);
            window.removeEventListener('touchstart', showControls);
            window.removeEventListener('click', showControls);
            window.removeEventListener('keydown', showControls);
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, []);

    // Calculate scaling
    const { contentScale } = useScaling({
        containerWidth: dimensions.width,
        containerHeight: dimensions.height,
        headerHeight,
        footerHeight,
        columns,
        events,
        settings
    });

    // Calculate times for all events
    const calculatedTimes = useMemo(() =>
        calculateAllEventTimes(events, columns, zmanimData, settings),
        [events, columns, zmanimData, settings]
    );

    // Sort columns by order
    const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

    const handleEditColumnSettings = (columnId: string) => {
        setEditingColumnSettings({
            isOpen: true,
            columnId
        });
    };

    const handleSaveColumnSettings = (updatedColumn: IColumn) => {
        const newColumns = columns.map(c => c.id === updatedColumn.id ? updatedColumn : c);
        props.saveColumns(newColumns);
        setEditingColumnSettings({ isOpen: false, columnId: '' });
    };

    const handleDeleteColumn = (columnId: string) => {
        const newColumns = columns.filter(c => c.id !== columnId);
        // Also delete events associated with this column
        const newEvents = events.filter(e => e.columnId !== columnId);

        props.saveColumns(newColumns);
        props.saveEvents(newEvents);
        setEditingColumnSettings({ isOpen: false, columnId: '' });
    };

    const handleAddColumn = () => {
        const maxOrder = columns.reduce((max, c) => Math.max(max, c.order), -1);
        const newColumn: IColumn = {
            id: crypto.randomUUID(),
            title: 'עמודה חדשה',
            columnType: 'weekdays',
            order: maxOrder + 1
        };
        props.saveColumns([...columns, newColumn]);
        // Optionally open settings for the new column immediately
        setEditingColumnSettings({ isOpen: true, columnId: newColumn.id });
    };

    const handleColumnClick = (columnId: string) => {
        setEditingEventState({
            isOpen: true,
            columnId,
            event: undefined
        });
    };

    const handleEventClick = (event: EventItem) => {
        setEditingEventState({
            isOpen: true,
            columnId: event.columnId,
            event
        });
    };

    const handleAddEventBetween = (columnId: string, order: number) => {
        setEditingEventState({
            isOpen: true,
            columnId,
            event: undefined,
            initialOrder: order
        });
    };

    const handleSaveEvent = (savedEvent: EventItem) => {
        let newEvents = [...events];
        const index = newEvents.findIndex(e => e.id === savedEvent.id);

        if (index >= 0) {
            // Updating existing event
            newEvents[index] = savedEvent;
        } else {
            // Adding new event
            // If we have a specific order (inserted between events), we need to shift others
            const isInsert = editingEventState.initialOrder !== undefined;

            if (isInsert) {
                // Shift all events in this column that have order >= savedEvent.order
                newEvents = newEvents.map(e => {
                    if (e.columnId === savedEvent.columnId && e.order >= savedEvent.order) {
                        return { ...e, order: e.order + 1 };
                    }
                    return e;
                });
            }

            newEvents.push(savedEvent);
        }

        props.saveEvents(newEvents);
        setEditingEventState({ isOpen: false, columnId: '' });
    };

    const handleDeleteEvent = (eventId: string) => {
        const newEvents = events.filter(e => e.id !== eventId);
        props.saveEvents(newEvents);
        setEditingEventState({ isOpen: false, columnId: '' });
    };

    // Screenshot state
    const [isCapturing, setIsCapturing] = useState(false);
    const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);

    const handleScreenshot = useCallback(async () => {
        if (!containerRef.current || isCapturing) return;
        setIsCapturing(true);

        // Elements to hide during capture
        const clockEl = containerRef.current.querySelector('[data-board-clock]') as HTMLElement | null;
        const controlsEl = containerRef.current.querySelector('[data-board-controls]') as HTMLElement | null;
        const fixedEls = document.querySelectorAll('.fixed.top-0') as NodeListOf<HTMLElement>;

        try {
            // Hide the clock, controls, and version/sync indicators during capture
            if (clockEl) clockEl.style.visibility = 'hidden';
            if (controlsEl) controlsEl.style.display = 'none';
            fixedEls.forEach(el => el.style.visibility = 'hidden');

            const dataUrl = await toPng(containerRef.current, {
                pixelRatio: 2,
                backgroundColor: settings.mainBackgroundColor,
            });

            const response = await fetch(dataUrl);
            const blob = await response.blob();
            setScreenshotBlob(blob);
            setShowShareDialog(true);
        } catch (err) {
            console.error('Screenshot failed:', err);
        } finally {
            // Always restore hidden elements
            if (clockEl) clockEl.style.visibility = '';
            if (controlsEl) controlsEl.style.display = '';
            fixedEls.forEach(el => el.style.visibility = '');
            setIsCapturing(false);
        }
    }, [isCapturing, settings.mainBackgroundColor]);

    const handleShare = useCallback(async () => {
        if (!screenshotBlob) return;

        const file = new File([screenshotBlob], `${settings.boardTitle || 'לוח-מודעות'}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: settings.boardTitle || 'לוח בית כנסת',
                    files: [file],
                });
                setShowShareDialog(false);
                setScreenshotBlob(null);
                return;
            } catch (err) {
                // User cancelled or share failed - fall through to download
                if ((err as Error).name === 'AbortError') {
                    return; // User cancelled, keep dialog open
                }
            }
        }

        // Fallback: download
        handleDownload();
    }, [screenshotBlob, settings.boardTitle]);

    const handleDownload = useCallback(() => {
        if (!screenshotBlob) return;

        const url = URL.createObjectURL(screenshotBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${settings.boardTitle || 'לוח-מודעות'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowShareDialog(false);
        setScreenshotBlob(null);
    }, [screenshotBlob, settings.boardTitle]);

    return (
        <LandscapeEnforcer allowPortrait={props.isEditMode || editingEventState.isOpen || editingColumnSettings.isOpen}>
            <div ref={containerRef} className="h-full w-full flex flex-col overflow-hidden font-sans relative" style={{ backgroundColor: settings.mainBackgroundColor }}>
                {/* Header */}
                <div ref={headerRef}>
                    <Header settings={settings} zmanimData={zmanimData} />
                </div>

                {/* Fixed Metadata (Top Corners) */}
                <div className="fixed top-0 left-0 p-1 text-[10px] opacity-20 hover:opacity-100 select-none z-50 text-stone-500 pointer-events-auto leading-none" title="Build Version">
                    v{import.meta.env.APP_VERSION}
                </div>
                {props.lastSyncTime && (
                    <div className="fixed top-0 right-0 p-1 flex items-center gap-1 opacity-30 hover:opacity-100 transition-opacity duration-300 select-none z-50 text-stone-500 pointer-events-auto leading-none" title={`סונכרן לאחרונה: ${props.lastSyncTime.toLocaleString('he-IL')}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse"></span>
                        <span className="text-[10px] font-mono">{props.lastSyncTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                )}

                {/* Main Grid */}
                <main
                    className="flex-1 overflow-hidden"
                    style={{
                        padding: `${LAYOUT_CONSTANTS.GRID.PADDING_PX * contentScale}px`,
                        backgroundColor: settings.boardBackgroundColor
                    }}
                >
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={sortedColumns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                            <div className="h-full flex flex-col w-full">
                                <BoardMessagesBox
                                    settings={settings}
                                    scale={contentScale}
                                    onClick={() => {
                                        setActiveSettingsSection('messages');
                                        props.onEnterEditMode();
                                    }}
                                />

                                {/* Invisible spacer for adding messages if none exist */}
                                {(!settings.boardMessages || settings.boardMessages.trim() === '') && (
                                    <div
                                        className="w-full relative group cursor-pointer z-10 flex items-center justify-center"
                                        style={{
                                            height: '0px',
                                            // No margin to avoid taking up space
                                        }}
                                        onClick={() => {
                                            setActiveSettingsSection('messages');
                                            props.onEnterEditMode();
                                        }}
                                        title="לחץ להוספת הודעות"
                                    >
                                        {/* Hit area */}
                                        <div
                                            className="absolute inset-x-0 -top-3 -bottom-3 bg-transparent"
                                            style={{ top: `-${LAYOUT_CONSTANTS.GRID.GAP_PX * contentScale}px`, bottom: `-${LAYOUT_CONSTANTS.GRID.GAP_PX * contentScale}px` }}
                                        />

                                        {/* Visible line on hover */}
                                        <div className="w-full h-0.5 bg-brand-accent/0 group-hover:bg-brand-accent/50 transition-colors duration-200 rounded-full absolute" />

                                        {/* Plus icon on hover */}
                                        <div className="absolute bg-white text-brand-accent border border-brand-accent/0 group-hover:border-brand-accent/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-0 group-hover:scale-100 shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                )}

                                <div
                                    className="flex-1 flex min-h-0 w-full"
                                    style={{ gap: `${LAYOUT_CONSTANTS.GRID.GAP_PX * contentScale}px` }}
                                >
                                    {sortedColumns.map(column => (
                                        <Column
                                            key={column.id}
                                            column={column}
                                            events={events.filter(e => e.columnId === column.id).sort((a, b) => a.order - b.order)}
                                            settings={settings}
                                            calculatedTimes={calculatedTimes as Map<string, string>}
                                            contentScale={contentScale}
                                            onColumnClick={() => handleColumnClick(column.id)}
                                            onEventClick={handleEventClick}
                                            onAddEvent={handleAddEventBetween}
                                            onEditColumnSettings={() => handleEditColumnSettings(column.id)}
                                            className="flex-1 h-full min-w-0"
                                        />
                                    ))}

                                    {/* Fallback if no columns */}
                                    {sortedColumns.length === 0 && (
                                        <div className="w-full flex items-center justify-center text-gray-500 text-xl">
                                            לא נמצאו עמודות להצגה. אנא הוסף עמודות במצב עריכה.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </SortableContext>
                        <DragOverlay>
                            {activeEvent ? (
                                <EventItemComponent
                                    event={activeEvent}
                                    time={calculatedTimes.get(activeEvent.id) ?? null}
                                    settings={settings}
                                    isStriped={false}
                                    scale={contentScale}
                                />
                            ) : activeColumn ? (
                                <div className="h-full opacity-80">
                                    <Column
                                        column={activeColumn}
                                        events={events.filter(e => e.columnId === activeColumn.id).sort((a, b) => a.order - b.order)}
                                        settings={settings}
                                        calculatedTimes={calculatedTimes as Map<string, string>}
                                        contentScale={contentScale}
                                        className="h-full bg-white shadow-2xl"
                                    />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </main>

                {/* Zmanim Footer */}
                < div ref={footerRef} >
                    <ZmanimFooter zmanim={zmanimData} settings={settings} />
                </div >

                {/* Controls (Bottom Left) */}
                < div
                    data-board-controls
                    className={`fixed bottom-4 left-4 flex gap-2 transition-opacity duration-300 ${props.isEditMode ? 'opacity-0 pointer-events-none' :
                        controlsVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                    onMouseEnter={() => {
                        setControlsVisible(true);
                        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={props.onBackToHome}
                        className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700"
                        title="חזרה למסך הראשי"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </button>
                    <button
                        onClick={() => {
                            setActiveSettingsSection('general');
                            props.onEnterEditMode();
                        }}
                        className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700"
                        title="עריכה והגדרות"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <button
                        onClick={handleScreenshot}
                        disabled={isCapturing}
                        className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 disabled:opacity-50"
                        title="צילום מסך לשיתוף"
                    >
                        {isCapturing ? (
                            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    </button>
                    <button
                        onClick={props.onOpenDebug}
                        className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700"
                        title="לוגים"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                </div >

                {/* Settings Modal */}
                {
                    props.isEditMode && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in">
                                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-800">הגדרות לוח</h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAddColumn}
                                            className="bg-brand-accent text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors font-medium flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            הוסף עמודה
                                        </button>
                                        <button
                                            onClick={props.onSaveChanges}
                                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                        >
                                            סגור ושמור
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    <EditPanel
                                        settings={settings}
                                        onSave={props.saveSettings}
                                        zmanimData={zmanimData}
                                        zmanimLoading={props.zmanimLoading}
                                        zmanimError={props.zmanimError}
                                        activeSection={activeSettingsSection}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Event Edit/Add Modal */}
                {
                    editingEventState.isOpen && (
                        <EventForm
                            columnId={editingEventState.columnId}
                            columnEvents={events.filter(e => e.columnId === editingEventState.columnId)}
                            event={editingEventState.event}
                            initialOrder={editingEventState.initialOrder}
                            onSave={handleSaveEvent}
                            onCancel={() => setEditingEventState({ isOpen: false, columnId: '' })}
                            onDelete={handleDeleteEvent}
                        />
                    )
                }

                {/* Column Settings Modal */}
                {
                    editingColumnSettings.isOpen && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-md overflow-hidden animate-fade-in">
                                <ColumnSettingsForm
                                    column={columns.find(c => c.id === editingColumnSettings.columnId)!}
                                    onSave={handleSaveColumnSettings}
                                    onCancel={() => setEditingColumnSettings({ isOpen: false, columnId: '' })}
                                    onDelete={handleDeleteColumn}
                                />
                            </div>
                        </div>
                    )
                }

                {/* Screenshot Share Dialog */}
                {showShareDialog && screenshotBlob && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-lg overflow-hidden animate-fade-in" dir="rtl">
                            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">שיתוף צילום מסך</h2>
                                <button
                                    onClick={() => { setShowShareDialog(false); setScreenshotBlob(null); }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="mb-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                    <img
                                        src={URL.createObjectURL(screenshotBlob)}
                                        alt="צילום מסך של הלוח"
                                        className="w-full h-auto"
                                    />
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        שתף
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        הורד תמונה
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div >
        </LandscapeEnforcer>
    );
};

export default NewBoardLayout;
