import { Loader2 } from "lucide-react";

export const Loading = () => (
  <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="text-sm">加载中...</span>
    </div>
  </div>
);

export default Loading;
