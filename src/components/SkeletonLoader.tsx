import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonLoaderProps {
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-4 animate-pulse" role="status" aria-label="Ładowanie propozycji fiszek">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="bg-white border border-gray-200 rounded-lg p-4 space-y-4"
        >
          {/* Header skeleton (checkbox + title space) */}
          <div className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 rounded mt-1" />
            <div className="flex-1 space-y-4">
              {/* Front side skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
              
              {/* Back side skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
              
              {/* Actions skeleton */}
              <div className="flex justify-end">
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Trwa generowanie propozycji fiszek...</span>
    </div>
  );
};

