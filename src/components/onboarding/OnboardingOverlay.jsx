import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const OnboardingOverlay = ({
  steps,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  teamColor = 'blue'
}) => {
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  if (!step) return null;

  const borderColor = teamColor === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50';
  const bgColor = teamColor === 'blue' ? 'from-cyan-500/10' : 'from-red-500/10';
  const buttonColor = teamColor === 'blue' 
    ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/50'
    : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/50';
  const accentColor = teamColor === 'blue' ? 'text-cyan-400' : 'text-red-400';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={onSkip}
      />

      {/* Spotlight */}
      {step.targetSelector && (
        <div
          className="absolute pointer-events-auto"
          style={{
            ...step.spotlightPosition,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
          }}
        />
      )}

      {/* Guide Card */}
      <div className="absolute pointer-events-auto" style={step.cardPosition}>
        <Card className={cn(
          "w-96 bg-gradient-to-br bg-black/80 backdrop-blur-xl border-2 shadow-2xl",
          borderColor
        )}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className={cn("text-lg font-bold", accentColor)}>
                Step {currentStep + 1} of {steps.length}
              </h3>
              <p className="text-sm text-slate-300 mt-1">{step.title}</p>
            </div>
            <button
              onClick={onSkip}
              className="p-1 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-3">
            <p className="text-sm text-slate-200 leading-relaxed">
              {step.description}
            </p>

            {step.tips && (
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <p className={cn("text-xs font-semibold mb-2", accentColor)}>💡 Pro Tip</p>
                <p className="text-xs text-slate-300">{step.tips}</p>
              </div>
            )}

            {step.highlights && (
              <div className="space-y-2 pt-2">
                {step.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", accentColor === 'text-cyan-400' ? 'bg-cyan-400' : 'bg-red-400')} />
                    <p className="text-xs text-slate-300">{highlight}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3 border-t border-slate-700">
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  teamColor === 'blue' ? 'bg-cyan-500' : 'bg-red-500'
                )}
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 flex items-center gap-3 justify-between">
            <Button
              onClick={onSkip}
              variant="outline"
              size="sm"
              className="text-slate-400 border-slate-600 hover:border-slate-500"
            >
              Skip Tour
            </Button>

            <div className="flex items-center gap-2">
              <Button
                onClick={onPrev}
                disabled={isFirstStep}
                size="sm"
                variant="outline"
                className={cn(
                  "border-slate-600",
                  isFirstStep ? "opacity-50 cursor-not-allowed" : "hover:border-slate-500"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {isLastStep ? (
                <Button
                  onClick={onComplete}
                  size="sm"
                  className={cn("shadow-lg", buttonColor)}
                >
                  Complete
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  size="sm"
                  className={cn("shadow-lg", buttonColor)}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingOverlay;