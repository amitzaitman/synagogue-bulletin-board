import React from 'react';
import { BoardSettings, Column, EventItem } from '../../../shared/types/types';
import ColumnView from './ColumnView';

interface BoardGridProps {
    columns: Column[];
    events: EventItem[];
    settings: BoardSettings;
    isEditMode: boolean;
    headerScale: number;
    contentScale: number;
    mainContentRef?: React.RefObject<HTMLElement>;

    // Edit state
    editingItemId: string | null;
    inlineAddEvent: { columnId: string } | null;
    draggingItemId: string | null;
    draggingColumnId: string | null;
    editingColumn: string | null;

    // Actions
    setEditingItemId: (id: string | null) => void;
    setInlineAddEvent: (val: { columnId: string } | null) => void;
    handleSaveEvent: (event: EventItem) => void;
    handleDeleteEvent: (id: string) => void;
    handleToggleHighlight: (id: string) => void;

    // Drag and Drop Events
    handleEventDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
    handleEventDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    handleEventDrop: (e: React.DragEvent<HTMLDivElement>, event: EventItem) => void;

    // Column Actions
    setEditTitle: (val: string) => void;
    setEditColumnType: (val: 'shabbat' | 'weekdays' | 'moed') => void;
    setEditSpecificDate: (val: string) => void;
    saveEdit: () => void;
    startEditing: (column: Column) => void;
    handleDeleteColumn: (id: string) => void;

    // Column Drag and Drop
    handleColumnDragStart: (e: React.DragEvent, id: string) => void;
    handleColumnDragEnd: () => void;
    handleColumnDrop: (e: React.DragEvent, column: Column) => void;

    calculatedTimes: Map<string, string>;
}

const BoardGrid: React.FC<BoardGridProps> = ({
    columns,
    events,
    settings,
    isEditMode,
    headerScale,
    contentScale,
    mainContentRef,
    editingItemId,
    inlineAddEvent,
    draggingItemId,
    draggingColumnId,
    editingColumn,
    setEditingItemId,
    setInlineAddEvent,
    handleSaveEvent,
    handleDeleteEvent,
    handleToggleHighlight,
    handleEventDragStart,
    handleEventDragOver,
    handleEventDrop,
    setEditTitle,
    setEditColumnType,
    setEditSpecificDate,
    saveEdit,
    startEditing,
    handleDeleteColumn,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnDrop,
    calculatedTimes
}) => {
    return (
        <main
            ref={mainContentRef}
            className="flex-grow flex items-stretch overflow-x-auto"
            style={{
                fontSize: `${contentScale * 16}px`,
                gap: `${headerScale * 32}px`,
                padding: `${headerScale * 24}px ${headerScale * 32}px ${headerScale * 32}px ${headerScale * 32}px`
            }}
        >
            {columns.sort((a, b) => a.order - b.order).map(column => (
                <div
                    key={column.id}
                    className={`transition-all duration-300 flex-shrink-0 flex-grow basis-0 rounded-lg shadow ${draggingColumnId === column.id ? 'opacity-30' : ''}`}
                    style={{
                        backgroundColor: settings.columnBackgroundColor,
                        padding: `${contentScale * 8}px ${contentScale * 32}px ${contentScale * 8}px ${contentScale * 32}px`
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDrop={(e) => handleColumnDrop(e, column)}
                >
                    <ColumnView
                        column={column}
                        events={events.filter(e => e.columnId === column.id).sort((a, b) => a.order - b.order)}
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
                        editingColumn={editingColumn || null}
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
    );
};

export default BoardGrid;
