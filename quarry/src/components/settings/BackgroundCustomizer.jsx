import React, { useState } from 'react';
import { api } from '@/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Trash2, Image } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/monitoring';

export default function BackgroundCustomizer({ customization, onUpdate, isLoading }) {
  const [uploading, setUploading] = useState(false);
  const [overlayColor, setOverlayColor] = useState(customization?.background_overlay_color || '#000000');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: PNG, JPG, SVG, WEBP, MP4, WebM');
      return;
    }

    try {
      setUploading(true);
      const response = await api.integrations.Core.UploadFile({ file });
      const backgroundType = file.type.startsWith('video/') ? 'custom_video' : 'custom_image';
      
      await onUpdate({
        background_type: backgroundType,
        background_file_url: response.file_url,
      });
      toast.success('Background uploaded successfully');
    } catch (error) {
      logger.error('Upload failed:', error);
      toast.error('Failed to upload background');
    } finally {
      setUploading(false);
    }
  };

  const handleClearBackground = async () => {
    try {
      await onUpdate({
        background_type: 'default',
        background_file_url: undefined,
      });
      toast.success('Background cleared');
    } catch (error) {
      toast.error('Failed to clear background');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Image className="w-5 h-5" />
            Background
          </CardTitle>
          <CardDescription className="text-slate-400">
            Upload custom background image or video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Background Type</Label>
            <Select
              value={customization?.background_type || 'default'}
              onValueChange={(value) => {
                if (value === 'default') {
                  handleClearBackground();
                } else {
                  onUpdate({ background_type: value });
                }
              }}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="custom_image">Custom Image</SelectItem>
                <SelectItem value="custom_video">Custom Video (optional)</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {customization?.background_type !== 'default' && customization?.background_type !== 'none' && (
            <>
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <Label className="text-slate-200">Upload File</Label>
                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp,video/mp4,video/webm"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="bg-slate-800 border-slate-700 text-white cursor-pointer"
                    />
                  </label>
                  {customization?.background_file_url && (
                    <Button
                      onClick={handleClearBackground}
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {uploading && <p className="text-sm text-slate-400">Uploading...</p>}
              </div>

              {customization?.background_file_url && (
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
                  <p className="text-sm text-slate-400">Current Background</p>
                  {customization.background_type === 'custom_image' ? (
                    <img
                      src={customization.background_file_url}
                      alt="Background preview"
                      className="h-32 w-full object-cover rounded"
                    />
                  ) : (
                    <video
                      src={customization.background_file_url}
                      className="h-32 w-full object-cover rounded"
                      autoPlay
                      muted
                      loop
                    />
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {customization?.background_type !== 'default' && customization?.background_type !== 'none' && (
        <>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Background Opacity</CardTitle>
              <CardDescription className="text-slate-400">
                Adjust transparency of background
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-200">Opacity</Label>
                  <span className="text-slate-400 text-sm">{Math.round((customization?.background_opacity || 0.2) * 100)}%</span>
                </div>
                <Slider
                  value={[(customization?.background_opacity || 0.2) * 100]}
                  onValueChange={(values) => {
                    onUpdate({ background_opacity: values[0] / 100 });
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
              <CardTitle className="text-white">Background Blur</CardTitle>
              <CardDescription className="text-slate-400">
                Add blur effect to background
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-200">Blur Amount</Label>
                  <span className="text-slate-400 text-sm">{customization?.background_blur || 0}px</span>
                </div>
                <Slider
                  value={[customization?.background_blur || 0]}
                  onValueChange={(values) => {
                    onUpdate({ background_blur: values[0] });
                  }}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Overlay Color</CardTitle>
              <CardDescription className="text-slate-400">
                Add color overlay on top of background
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  type="color"
                  value={overlayColor}
                  onChange={(e) => setOverlayColor(e.target.value)}
                  className="w-16 h-10 bg-slate-800 border-slate-700 cursor-pointer"
                />
                <Input
                  type="text"
                  value={overlayColor}
                  onChange={(e) => setOverlayColor(e.target.value)}
                  className="flex-1 bg-slate-800 border-slate-700 text-white text-sm font-mono"
                  placeholder="#000000"
                />
                <Button
                  onClick={() => onUpdate({ background_overlay_color: overlayColor })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}