import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_WIDGETS = [
  { widget_id: 'overview', name: 'Overview', position: 0, visible: true },
  { widget_id: 'metrics', name: 'Key Metrics', position: 1, visible: true },
  { widget_id: 'alerts', name: 'Recent Alerts', position: 2, visible: true },
  { widget_id: 'incidents', name: 'Open Incidents', position: 3, visible: true },
  { widget_id: 'threats', name: 'Threat Activity', position: 4, visible: true },
  { widget_id: 'quick_actions', name: 'Quick Actions', position: 5, visible: true },
];

export default function DashboardLayoutCustomizer({ customization, onUpdate, isLoading }) {
  const [widgets, setWidgets] = useState(
    customization?.dashboard_layout?.length > 0 
      ? customization.dashboard_layout 
      : DEFAULT_WIDGETS
  );
  const [draggedId, setDraggedId] = useState(null);

  const toggleVisibility = (widgetId) => {
    const updated = widgets.map((w) =>
      w.widget_id === widgetId ? { ...w, visible: !w.visible } : w
    );
    setWidgets(updated);
  };

  const moveWidget = (fromIndex, toIndex) => {
    const updated = [...widgets];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    updated.forEach((w, idx) => (w.position = idx));
    setWidgets(updated);
  };

  const handleSave = async () => {
    try {
      await onUpdate({ dashboard_layout: widgets });
      toast.success('Dashboard layout saved');
    } catch (error) {
      toast.error('Failed to save layout');
    }
  };

  const handleReset = () => {
    setWidgets(DEFAULT_WIDGETS);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Dashboard Widgets</CardTitle>
          <CardDescription className="text-slate-400">
            Customize which widgets appear on your dashboard and their order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {widgets.map((widget, index) => (
              <div
                key={widget.widget_id}
                draggable
                onDragStart={() => setDraggedId(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedId !== null && draggedId !== index) {
                    moveWidget(draggedId, index);
                    setDraggedId(null);
                  }
                }}
                className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-move"
              >
                <GripVertical className="w-4 h-4 text-slate-500 flex-shrink-0" />
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{widget.name}</p>
                </div>

                <button
                  onClick={() => toggleVisibility(widget.widget_id)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  {widget.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>

                <div className="text-xs text-slate-500 font-mono">#{index + 1}</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400">
              Drag widgets to reorder. Click the eye icon to show/hide widgets.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Save Layout
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-slate-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}