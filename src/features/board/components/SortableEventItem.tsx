import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EventItem from './EventItem';
import { EventItem as IEventItem, BoardSettings } from '../../../shared/types/types';

interface SortableEventItemProps {
    event: IEventItem;
    time: string | null;
    settings: BoardSettings;
    isStriped: boolean;
    scale?: number;
    onClick?: () => void;
}

const SortableEventItem: React.FC<SortableEventItemProps> = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.event.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Prevent scrolling while dragging on touch devices
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <EventItem {...props} />
        </div>
    );
};

export default SortableEventItem;
