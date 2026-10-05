import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type DownloadButtonProps = Readonly<{
  onClick: () => void;
  label?: string;
}>;

export function DownloadButton({ onClick, label = "Download content" }: DownloadButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="h-7 gap-1 rounded-sm py-0 pr-0 pl-1 text-xs leading-4 font-normal tracking-[0.24px] text-slate-700 hover:bg-slate-200"
    >
      {label}
      <span className="flex size-7 items-center justify-center">
        <Download aria-hidden className="size-5" />
      </span>
    </Button>
  );
}
