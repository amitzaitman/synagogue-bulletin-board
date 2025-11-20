import React from 'react';
import { EventItem, Column, BoardSettings } from '../../../shared/types/types';
import EventForm from '../../editor/components/EventForm';
import EventRow from './EventRow';
import ColumnHeader from './ColumnHeader';

// --- Helper Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;

// --- Main Column View Component ---

interface ColumnViewProps {
    column: Column;
    events: EventItem[];
    settings: BoardSettings;
    isEditMode: boolean;
    editingItemId: string | null;
    inlineAddEvent: { columnId: string } | null;
    calculatedTimes: Map<string, string | null>;
    draggingItemId: string | null;
    onEditEvent: (id: string) => void;
    onCancelEdit: () => void;
    onSaveEvent: (event: EventItem) => void;
    onDeleteEvent: (id: string) => void;
    onToggleHighlight: (id: string) => void;
    onEventDragStart: (e: React.DragEvent<HTMLDivElement>, eventId: string) => void;
    onEventDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onEventDrop: (e: React.DragEvent<HTMLDivElement>, targetEvent: EventItem) => void;

    editingColumn?: { id: string, title: string, columnType: string, specificDate?: string } | null;
    onEditColumnTitleChange?: (title: string) => void;
    onEditColumnTypeChange?: (columnType: 'shabbat' | 'weekdays' | 'moed') => void;
    onEditSpecificDateChange?: (date: string) => void;
    onSaveColumnTitle?: () => void;
    onSetEditingColumn?: () => void;
    onDeleteColumn?: (id: string) => void;
    canDeleteColumn?: boolean;
    onAddNewEvent: () => void;

    onColumnDragStart?: (e: React.DragEvent, columnId: string) => void;
    onColumnDragEnd?: () => void;
    draggingColumnId?: string | null;
}

const ColumnView: React.FC<ColumnViewProps> = (props) => {
    const {
        column, events, settings, isEditMode, editingItemId, inlineAddEvent, calculatedTimes, draggingItemId,
        onEditEvent, onCancelEdit, onSaveEvent, onDeleteEvent, onToggleHighlight,
        onEventDragStart, onEventDragOver, onEventDrop,
        editingColumn, onEditColumnTitleChange, onEditColumnTypeChange, onEditSpecificDateChange, onSaveColumnTitle, onSetEditingColumn, onDeleteColumn, onAddNewEvent,
        onColumnDragStart, onColumnDragEnd
    } = props;

    return (
        <div className="h-full flex flex-col">
            <ColumnHeader
                column={column}
                settings={settings}
                isEditMode={isEditMode}
                editingColumn={editingColumn}
                onEditColumnTitleChange={onEditColumnTitleChange}
                onEditColumnTypeChange={onEditColumnTypeChange}
                onEditSpecificDateChange={onEditSpecificDateChange}
                onSaveColumnTitle={onSaveColumnTitle}
                onSetEditingColumn={onSetEditingColumn}
                onDeleteColumn={onDeleteColumn}
                onColumnDragStart={onColumnDragStart}
                onColumnDragEnd={onColumnDragEnd}
            />

            <div className={`events-list flex-grow ${isEditMode ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                {events.map((event, index) => (
                    editingItemId === event.id ? (
                        <EventForm
                            key={event.id}
                            columnId={column.id}
                            columnEvents={events}
                            event={event}
                            onSave={onSaveEvent}
                            onCancel={onCancelEdit}
                            onDelete={onDeleteEvent}
                        />
                    ) : (
                        <EventRow
                            key={event.id}
                            event={event}
                            displayTime={calculatedTimes.get(event.id) ?? null}
                            isLast={index === events.length - 1}
                            isEditMode={isEditMode}
                            onEdit={onEditEvent}
                            onToggleHighlight={onToggleHighlight}
                            settings={settings}
                            onDragStart={onEventDragStart}
                            onDragOver={onEventDragOver}
                            onDrop={onEventDrop}
                            isDragging={draggingItemId === event.id}
                        />
                    )
                ))}
                {inlineAddEvent && inlineAddEvent.columnId === column.id && (
                    <EventForm
                        columnId={column.id}
                        columnEvents={events}
                        onSave={onSaveEvent}
                        onCancel={onCancelEdit}
                        onDelete={onDeleteEvent} // Not used for new event
                    />
                )}
            </div>
            {isEditMode && (
                <div className="mt-2 pt-2 border-t border-amber-600/10">
                    <button
                        onClick={onAddNewEvent}
                        className="flex items-center justify-center gap-2 w-full bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-2 px-3 rounded-lg shadow-sm transition"
                    >
                        <PlusIcon />
                        <span>הוסף אירוע</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ColumnView;
