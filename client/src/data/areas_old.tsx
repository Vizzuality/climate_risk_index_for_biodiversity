import { Area } from "@/containers/main/table/columns";

const data: Area[] = Array.from({ length: 100 }, (_, i) => ({
  name_en: `Area ${i + 1}`,
  region: `Region ${Math.floor(i / 10) + 1}`,
  description: `Description for Area ${i + 1}`,
  type: "Protected Area",
  website_url: `https://example.com/area${i + 1}`,
  area_ha: Math.random() * 10000 + 1000, // Random area between 1000 and 11000 ha
  bbox: [
    Math.random() * 180 - 90, // Random latitude between -90 and 90
    Math.random() * 360 - 180, // Random longitude between -180 and 180
    Math.random() * 180 - 90, // Random latitude between -90 and 90
    Math.random() * 360 - 180, // Random longitude between -180 and 180
  ],
  iucn_category: (Math.random() * 4 + 1) as Area["iucn_category"],
  indicator: [
    {
      name: "ClimVuln",
      type: "numerical",
      scenario: {
        high: {
          min: 0.4072669744491577,
          max: 0.4072669744491577,
          mean: 0.4072669744491577,
        },
        low: {
          min: 0.38243913650512695,
          max: 0.38243913650512695,
          mean: 0.38243913650512695,
        },
      },
    },
    {
      name: `Indicator ${i + 1}`,
      type: "numerical",
      scenario: {
        low: {
          max: Math.random(),
          min: Math.random(),
          mean: Math.random(),
        },
        high: {
          max: Math.random(),
          min: Math.random(),
          mean: Math.random(),
        },
      },
    },
  ],
}));

export default data;
