import { Area } from "@/containers/main/table/columns";

const data: Area[] = Array.from({ length: 100 }, (_, i) => ({
  id: `${i + 1}`,
  name: `Very loooooooooooooooooong area ${i + 1}`,
  species: Math.floor(Math.random() * 20) + 1,
  index: Math.floor(Math.random() * 100) + 1,
}));

export default data;
