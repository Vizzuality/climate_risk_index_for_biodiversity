import {
  createSortedRowModel,
  metaHelper,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

export const areaTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnMeta: metaHelper<{ className?: string }>(),
});

export type AreaTableFeatures = typeof areaTableFeatures;
