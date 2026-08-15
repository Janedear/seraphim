import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Consistent page header component
 */
export const PageHeader = ({
  title,
  description,
  actions,
  breadcrumbs,
  isLoading = false,
  className
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-slate-600">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-white transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className={index === breadcrumbs.length - 1 ? "text-white font-medium" : ""}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title and Actions */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          {isLoading ? (
            <>
              <Skeleton className="h-8 sm:h-10 w-full max-w-md bg-slate-800" />
              {description && <Skeleton className="h-4 sm:h-5 w-full max-w-lg mt-2 bg-slate-800" />}
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tighter drop-shadow-lg font-display break-words">
                {title}
              </h1>
              {description && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium tracking-wide mt-1">{description}</p>
              )}
            </>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;