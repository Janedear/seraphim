import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DraggableWidget({ widget, index, children, onRemove, team }) {
  return (
    <Draggable draggableId={widget.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "relative transition-all",
            snapshot.isDragging && "opacity-50 scale-105"
          )}
        >
          {/* Drag Handle & Remove Button */}
          <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1">
            <button
              {...provided.dragHandleProps}
              className={cn(
                "p-1.5 rounded-lg border backdrop-blur-md cursor-grab active:cursor-grabbing",
                team === 'blue'
                  ? "border-cyan-500/50 bg-black/60 text-cyan-400 hover:bg-cyan-500/20"
                  : "border-red-500/50 bg-black/60 text-red-400 hover:bg-red-500/20"
              )}
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(widget.id)}
              className={cn(
                "h-7 w-7 rounded-lg border backdrop-blur-md",
                team === 'blue'
                  ? "border-cyan-500/50 bg-black/60 text-cyan-400 hover:bg-cyan-500/20"
                  : "border-red-500/50 bg-black/60 text-red-400 hover:bg-red-500/20"
              )}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          {children}
        </div>
      )}
    </Draggable>
  );
}