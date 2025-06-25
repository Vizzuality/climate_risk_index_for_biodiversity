"use client";

import * as React from "react";
import { searchAtom } from "@/containers/main/store";
import { useAtom } from "jotai";

import { Input } from "@/components/ui/input";

import { useDebounce } from "rooks";

export default function Search() {
  const [, setSearch] = useAtom(searchAtom);
  const setSearchDebounced = useDebounce(setSearch, 200);

  return (
    <Input
      type="search"
      placeholder="Search area by name or region..."
      onChange={(e) => {
        setSearchDebounced(e.target.value);
      }}
      className="w-full"
    />
  );
}
