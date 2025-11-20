import { useState } from 'react';
import { Column, ColumnType } from '../../../shared/types/types';

interface EditingColumnState {
    id: string;
    title: string;
    columnType: ColumnType;
    specificDate?: string;
}

export const useColumnEditor = (
    columns: Column[],
    saveColumns: (columns: Column[]) => void
) => {
    // State to hold the data of the column being edited
    const [editingColumn, setEditingColumn] = useState<EditingColumnState | null>(null);

    // Function to initiate editing for a specific column
    const startEditing = (column: Column) => {
        setEditingColumn({
            id: column.id,
            title: column.title,
            columnType: column.columnType,
            specificDate: column.specificDate
        });
    };

    // Function to cancel the editing process
    const cancelEdit = () => {
        setEditingColumn(null);
    };

    // Function to update the title as the user types in the input
    const setEditTitle = (title: string) => {
        if (editingColumn) {
            setEditingColumn({ ...editingColumn, title });
        }
    };

    // Function to update the column type
    const setEditColumnType = (columnType: ColumnType) => {
        if (editingColumn) {
            setEditingColumn({ ...editingColumn, columnType });
        }
    };

    // Function to update the specific date
    const setEditSpecificDate = (specificDate: string) => {
        if (editingColumn) {
            setEditingColumn({ ...editingColumn, specificDate });
        }
    };

    // Function to save the changes
    const saveEdit = () => {
        if (!editingColumn) return;

        // Validate that if columnType is 'moed', specificDate must be set
        if (editingColumn.columnType === 'moed' && !editingColumn.specificDate) {
            alert('נא לבחור תאריך למועד');
            return;
        }

        saveColumns(columns.map(c => {
            if (c.id === editingColumn.id) {
                const updatedColumn: Column = {
                    ...c,
                    title: editingColumn.title,
                    columnType: editingColumn.columnType,
                };
                // Only include specificDate if columnType is 'moed' and date is set
                if (editingColumn.columnType === 'moed' && editingColumn.specificDate) {
                    updatedColumn.specificDate = editingColumn.specificDate;
                } else {
                    // Remove specificDate if columnType is not 'moed'
                    delete updatedColumn.specificDate;
                }
                return updatedColumn;
            }
            return c;
        }));
        setEditingColumn(null);
    };

    return {
        editingColumn,
        startEditing,
        cancelEdit,
        setEditTitle,
        setEditColumnType,
        setEditSpecificDate,
        saveEdit,
    };
};