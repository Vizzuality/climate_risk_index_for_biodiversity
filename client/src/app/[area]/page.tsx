import Detail from "@/containers/detail";
import { Suspense } from "react";

export default function Area() {
  return (
    <div className=" flex flex-col h-full gap-4">
      <Suspense fallback={null}>
        <Detail />
      </Suspense>
    </div>
  );
}
