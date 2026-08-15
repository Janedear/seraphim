import { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

export function useWidgetManager(storageKey, defaultWidgets) {
  const [activeWidgets, setActiveWidgets] = useState(() => {
    if (typeof window === 'undefined') return defaultWidgets;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : defaultWidgets;
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(activeWidgets));
  }, [activeWidgets, storageKey]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(activeWidgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setActiveWidgets(items);
  };

  const toggleWidget = (widgetId) => {
    setActiveWidgets((prev) => {
      if (prev.includes(widgetId)) {
        return prev.filter((id) => id !== widgetId);
      } else {
        return [...prev, widgetId];
      }
    });
  };

  const removeWidget = (widgetId) => {
    setActiveWidgets((prev) => prev.filter((id) => id !== widgetId));
  };

  const DroppableWrapper = ({ children }) => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="dashboard-widgets">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-6"
          >
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );

  return {
    activeWidgets,
    isCustomizing,
    setIsCustomizing,
    handleDragEnd,
    toggleWidget,
    removeWidget,
    DroppableWrapper,
  };
}