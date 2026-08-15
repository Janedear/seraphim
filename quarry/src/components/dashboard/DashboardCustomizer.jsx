import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardCustomizer({ availableWidgets, activeWidgets, onToggleWidget, team }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn(
            "border backdrop-blur-md",
            team === 'blue' 
              ? "border-cyan-500/50 bg-black/40 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300" 
              : "border-red-500/50 bg-black/40 text-red-400 hover:bg-red-500/20 hover:text-red-300"
          )}
        >
          <Settings className="w-4 h-4 mr-2" />
          Customize Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className={cn(
            "text-lg font-bold tracking-[0.15em] uppercase",
            team === 'blue' ? "text-cyan-300" : "text-red-300"
          )}>
            Customize Dashboard Widgets
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-slate-400">
            Toggle widgets to show or hide them on your dashboard. Drag widgets to reorder them.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {availableWidgets.map((widget) => {
              const isActive = activeWidgets.includes(widget.id);
              return (
                <div
                  key={widget.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border backdrop-blur-md transition-all",
                    isActive
                      ? team === 'blue'
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-red-500/50 bg-red-500/10"
                      : "border-slate-700 bg-slate-900/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <widget.icon className={cn(
                      "w-5 h-5",
                      isActive
                        ? team === 'blue' ? "text-cyan-400" : "text-red-400"
                        : "text-slate-500"
                    )} />
                    <div>
                      <p className={cn(
                        "font-semibold text-sm",
                        isActive ? "text-white" : "text-slate-400"
                      )}>
                        {widget.name}
                      </p>
                      <p className="text-xs text-slate-500">{widget.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onToggleWidget(widget.id)}
                    className={cn(
                      isActive
                        ? team === 'blue'
                          ? "text-cyan-400 hover:text-cyan-300"
                          : "text-red-400 hover:text-red-300"
                        : "text-slate-500 hover:text-white"
                    )}
                  >
                    {isActive ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}