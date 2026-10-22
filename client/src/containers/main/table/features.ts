import {
  createSortedRowModel,
  metaHelper,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnMeta: metaHelper<{ className?: string }>(),
});

export type DataTableFeatures = typeof dataTableFeatures;
