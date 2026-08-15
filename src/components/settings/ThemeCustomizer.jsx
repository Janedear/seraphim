import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { logger } from '@/lib/monitoring';

export default function ThemeCustomizer({ customization, onUpdate, isLoading }) {
  const [previewColors, setPreviewColors] = useState({
    primary: customization?.primary_accent_color || '#00baff',
    secondary: customization?.secondary_accent_color || '#ff0080',
  });

  const handleColorChange = (type, value) => {
    setPreviewColors((prev) => ({ ...prev, [type]: value }));
  };

  const applySave = async () => {
    try {
      await onUpdate({
        primary_accent_color: previewColors.primary,
        secondary_accent_color: previewColors.secondary,
        card_opacity: customization?.card_opacity || 0.2,
        text_contrast: customization?.text_contrast || 'normal',
      });
    } catch (error) {
      logger.error('Failed to save theme:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Palette className="w-5 h-5" />
            Color Theme
          </CardTitle>
          <CardDescription className="text-slate-400">
            Customize primary and secondary accent colors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-slate-200">Primary Accent Color</Label>
              <div className="flex gap-3">
                <Input
                  type="color"
                  value={previewColors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-16 h-10 bg-slate-800 border-slate-700 cursor-pointer"
                />
                <Input
                  type="text"
                  value={previewColors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="flex-1 bg-slate-800 border-slate-700 text-white text-sm font-mono"
                  placeholder="#00baff"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-slate-200">Secondary Accent Color</Label>
              <div className="flex gap-3">
                <Input
                  type="color"
                  value={previewColors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-16 h-10 bg-slate-800 border-slate-700 cursor-pointer"
                />
                <Input
                  type="text"
                  value={previewColors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="flex-1 bg-slate-800 border-slate-700 text-white text-sm font-mono"
                  placeholder="#ff0080"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-3">Color Preview</p>
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <div
                  className="h-16 rounded-lg border border-slate-600 transition-colors"
                  style={{ backgroundColor: previewColors.primary }}
                />
                <p className="text-xs text-slate-400">Primary</p>
              </div>
              <div className="space-y-2 flex-1">
                <div
                  className="h-16 rounded-lg border border-slate-600 transition-colors"
                  style={{ backgroundColor: previewColors.secondary }}
                />
                <p className="text-xs text-slate-400">Secondary</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Card Opacity</CardTitle>
          <CardDescription className="text-slate-400">
            Adjust transparency of cards to show background
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-200">Opacity</Label>
              <span className="text-slate-400 text-sm">{Math.round((customization?.card_opacity || 0.2) * 100)}%</span>
            </div>
            <Slider
              value={[(customization?.card_opacity || 0.2) * 100]}
              onValueChange={(values) => {
                onUpdate({ card_opacity: values[0] / 100 });
              }}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Text Contrast</CardTitle>
          <CardDescription className="text-slate-400">
            Choose text contrast level for readability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={customization?.text_contrast || 'normal'}
            onValueChange={(value) => onUpdate({ text_contrast: value })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="maximum">Maximum</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Button
        onClick={applySave}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        Save Theme Settings
      </Button>
    </div>
  );
}