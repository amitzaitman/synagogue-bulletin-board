import React, { useMemo, useRef, useState, useEffect } from 'react';
import { EventItem, BoardSettings, Column as IColumn, ZmanimData } from '../../../shared/types/types';
import { calculateAllEventTimes } from '../../../shared/utils/timeCalculations';
import Header from './Header';
import Column from './Column';
import { useResponsiveScaling as useScaling } from '../../../shared/hooks/useResponsiveScaling';
import { LAYOUT_CONSTANTS } from '../../../shared/constants/layout';
import EditPanel from '../../editor/components/BoardSettingsForm';
import EventForm from '../../editor/components/EventForm';
import EventItemComponent from './EventItem';
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
    }>({ isOpen: false, columnId: '' });

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

        if (over && active.id !== over.id) {
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

        setActiveId(null);
    };

    const activeEvent = activeId ? events.find(e => e.id === activeId) : null;

    // Measure dimensions
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        // Also measure after a short delay to ensure layout is stable
        setTimeout(updateDimensions, 100);

        return () => window.removeEventListener('resize', updateDimensions);
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

    const handleSaveEvent = (savedEvent: EventItem) => {
        const newEvents = [...events];
        const index = newEvents.findIndex(e => e.id === savedEvent.id);

        if (index >= 0) {
            newEvents[index] = savedEvent;
        } else {
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

    return (
        <div ref={containerRef} className="h-screen w-screen flex flex-col bg-brand-bg overflow-hidden font-sans relative">
            {/* Header */}
            <div>
                <Header settings={settings} zmanimData={zmanimData} scale={contentScale} />
            </div>

            {/* Main Grid */}
            <main
                className="flex-1 overflow-hidden"
                style={{ padding: `${LAYOUT_CONSTANTS.GRID.PADDING_PX * contentScale}px` }}
            >
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div
                        className="h-full flex"
                        style={{ gap: `${LAYOUT_CONSTANTS.GRID.GAP_PX * contentScale}px` }}
                    >
                        {sortedColumns.map(column => (
                            <div key={column.id} className="flex-1 min-w-0 h-full">
                                <Column
                                    column={column}
                                    events={events.filter(e => e.columnId === column.id).sort((a, b) => a.order - b.order)}
                                    settings={settings}
                                    calculatedTimes={calculatedTimes as Map<string, string>}
                                    contentScale={contentScale}
                                    onColumnClick={() => handleColumnClick(column.id)}
                                    onEventClick={handleEventClick}
                                />
                            </div>
                        ))}

                        {/* Fallback if no columns */}
                        {sortedColumns.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-gray-500 text-xl">
                                לא נמצאו עמודות להצגה. אנא הוסף עמודות במצב עריכה.
                            </div>
                        )}
                    </div>
                    <DragOverlay>
                        {activeEvent ? (
                            <EventItemComponent
                                event={activeEvent}
                                time={calculatedTimes.get(activeEvent.id) ?? null}
                                settings={settings}
                                isStriped={false} // Or preserve striping if possible, but usually overlay is distinct
                                scale={contentScale}
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </main>

            {/* Controls (Bottom Left) */}
            <div
                className={`fixed bottom-4 left-4 flex gap-2 transition-opacity duration-300 ${props.isEditMode ? 'opacity-0 pointer-events-none' :
                    controlsVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                onMouseEnter={() => {
                    // Keep visible while hovering
                    setControlsVisible(true);
                    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
                }}
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
                    onClick={props.onEnterEditMode}
                    className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700"
                    title="עריכה והגדרות"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
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
            </div>

            {/* Settings Modal */}
            {props.isEditMode && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">הגדרות לוח</h2>
                            <button
                                onClick={props.onSaveChanges}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                סגור ושמור
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            <EditPanel
                                settings={settings}
                                onSave={props.saveSettings}
                                zmanimData={zmanimData}
                                zmanimLoading={props.zmanimLoading}
                                zmanimError={props.zmanimError}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Event Edit/Add Modal */}
            {editingEventState.isOpen && (
                <EventForm
                    columnId={editingEventState.columnId}
                    columnEvents={events.filter(e => e.columnId === editingEventState.columnId)}
                    event={editingEventState.event}
                    onSave={handleSaveEvent}
                    onCancel={() => setEditingEventState({ isOpen: false, columnId: '' })}
                    onDelete={handleDeleteEvent}
                />
            )}
        </div>
    );
};

export default NewBoardLayout;
