/** biome-ignore-all lint/suspicious/noArrayIndexKey: Ok to use index for key for skeleton component */

import AnimatedOpacity from "../animations/AnimatedOpacity";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

export default function MemberPageSkeleton() {
  return (
    <AnimatedOpacity duration={0.3} className="p-6 space-y-6 animate-pulse">
      
      {/* Repository Header Skeleton */}
      <div className="flex flex-col md:flex-row items-start justify-between space-y-8 mb-2">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-4">
            <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>

        <div className="flex gap-3 mt-4 md:mt-0">
          <div className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Members List Skeleton */}
      <Card className="bg-white/70 dark:bg-gray-800/25 border backdrop-blur-sm border-gray-200 dark:border-gray-800 shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle>
            <div className="h-5 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </CardTitle>
          <div>
            <div className="h-3 w-48 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-zinc-950/90"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="h-5 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AnimatedOpacity>
  );
}
