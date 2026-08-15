import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, X, AlertTriangle, Shield, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function notificationList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function AlertNotificationCenter({ team }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['alert-notifications'],
    queryFn: async () => {
      const { data: payload } = await api.functions.invoke('getAlertNotifications', {});
      return notificationList(payload);
    },
    refetchInterval: 30000,
  });

  const notifications = notificationList(data);

  const dismissNotification = useMutation({
    mutationFn: async (notificationId) => {
      const { data } = await api.functions.invoke('dismissNotification', { notificationId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alert-notifications']);
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'security': return Shield;
      default: return Activity;
    }
  };

  const getColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'red';
      case 'medium': return 'yellow';
      default: return team === 'blue' ? 'cyan' : 'red';
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn(
          "relative",
          team === 'blue' 
            ? "hover:bg-cyan-950/50 hover:text-cyan-300" 
            : "hover:bg-red-950/50 hover:text-red-300"
        )}>
          <Bell className="w-5 h-5 text-slate-400" />
          {unreadCount > 0 && (
            <>
              <span className={cn(
                "absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse",
                team === 'blue' ? "bg-cyan-500" : "bg-red-500"
              )} />
              <Badge className={cn(
                "absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]",
                team === 'blue' 
                  ? "bg-cyan-500 text-white" 
                  : "bg-red-500 text-white"
              )}>
                {unreadCount}
              </Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-black border-slate-700 max-h-[500px] overflow-y-auto">
        <div className="p-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">Notifications</h3>
          <p className="text-xs text-slate-400">{unreadCount} unread alerts</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No new notifications
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const color = getColor(notification.severity);
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 border-b border-slate-800 hover:bg-slate-900/50 transition-colors",
                    !notification.read && "bg-slate-900/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      color === 'cyan' && "bg-cyan-500/20 border border-cyan-500/50",
                      color === 'red' && "bg-red-500/20 border border-red-500/50",
                      color === 'yellow' && "bg-yellow-500/20 border border-yellow-500/50"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        color === 'cyan' && "text-cyan-400",
                        color === 'red' && "text-red-400",
                        color === 'yellow' && "text-yellow-400"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{notification.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{notification.timestamp}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification.mutate(notification.id);
                      }}
                      className="h-6 w-6 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}