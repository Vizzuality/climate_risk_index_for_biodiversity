import Main from "@/containers/main";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className=" flex flex-col h-full gap-4">
      <Suspense fallback={null}>
        <Main />
      </Suspense>
    </div>
  );
}
