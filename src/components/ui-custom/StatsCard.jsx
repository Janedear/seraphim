import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Stats card for dashboard KPIs
 */
export const StatsCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  isLoading = false,
  variant = 'default',
  className
}) => {
  const variants = {
    default: {
      bg: 'bg-white',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600'
    },
    primary: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    success: {
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    warning: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    danger: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    }
  };

  const v = variants[variant];

  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null;
    if (trend > 0) return <TrendingUp className="w-3.5 h-3.5" />;
    if (trend < 0) return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === null) return 'text-slate-500';
    if (trend > 0) return 'text-emerald-600';
    if (trend < 0) return 'text-red-600';
    return 'text-slate-500';
  };

  if (isLoading) {
    return (
      <Card className={cn("p-5", className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </Card>);

  }

  return (
    <Card className="bg-slate-900 text-card-foreground p-5 opacity-0 rounded-xl border-0 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          
          <div className="flex items-center gap-2 pt-1">
            {trend !== undefined && trend !== null &&
            <span className={cn("flex items-center gap-0.5 text-xs font-medium", getTrendColor())}>
                {getTrendIcon()}
                {Math.abs(trend)}%
              </span>
            }
            {(description || trendLabel) &&
            <span className="text-xs text-slate-500">
                {trendLabel || description}
              </span>
            }
          </div>
        </div>
        
        {Icon &&
        <div className={cn("p-2.5 rounded-lg", v.iconBg)}>
            <Icon className={cn("w-5 h-5", v.iconColor)} />
          </div>
        }
      </div>
    </Card>);

};

export default StatsCard;