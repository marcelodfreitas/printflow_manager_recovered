export interface PrinterModel {
  id: string;
  manufacturer: string;
  model: string;
  type: "FDM" | "SLA" | "SLS" | "DLP";
  imageUrl: string;
  buildVolume: string;
  nozzleSize?: number;
  powerConsumption?: number;
}

export const printerModels: PrinterModel[] = [
  {
    id: "anycubic-kobra-2",
    manufacturer: "Anycubic",
    model: "Kobra 2",
    type: "FDM",
    imageUrl: "/printers/anycubic-kobra-2.webp",
    buildVolume: "250 x 220 x 220 mm",
    nozzleSize: 0.4,
    powerConsumption: 400,
  },
  {
    id: "bambu-a1-mini",
    manufacturer: "Bambu Lab",
    model: "A1 Mini",
    type: "FDM",
    imageUrl: "/printers/bambu-a1-mini.webp",
    buildVolume: "180 x 180 x 180 mm",
    nozzleSize: 0.4,
    powerConsumption: 150,
  },
  {
    id: "bambu-a1",
    manufacturer: "Bambu Lab",
    model: "A1",
    type: "FDM",
    imageUrl: "/printers/bambu-a1.webp",
    buildVolume: "256 x 256 x 256 mm",
    nozzleSize: 0.4,
    powerConsumption: 350,
  },
  {
    id: "bambu-p1s",
    manufacturer: "Bambu Lab",
    model: "P1S",
    type: "FDM",
    imageUrl: "/printers/bambu-p1s.webp",
    buildVolume: "256 x 256 x 256 mm",
    nozzleSize: 0.4,
    powerConsumption: 500,
  },
  {
    id: "bambu-x1c",
    manufacturer: "Bambu Lab",
    model: "X1 Carbon",
    type: "FDM",
    imageUrl: "/printers/bambu-x1c.webp",
    buildVolume: "256 x 256 x 256 mm",
    nozzleSize: 0.4,
    powerConsumption: 500,
  },
  {
    id: "creality-ender-3-v3",
    manufacturer: "Creality",
    model: "Ender-3 V3",
    type: "FDM",
    imageUrl: "/printers/creality-ender-3-V3.webp",
    buildVolume: "220 x 220 x 250 mm",
    nozzleSize: 0.4,
    powerConsumption: 350,
  },
  {
    id: "creality-k1c",
    manufacturer: "Creality",
    model: "K1C",
    type: "FDM",
    imageUrl: "/printers/creality-k1c.webp",
    buildVolume: "220 x 220 x 250 mm",
    nozzleSize: 0.4,
    powerConsumption: 350,
  },
  {
    id: "elegoo-neptune-4",
    manufacturer: "Elegoo",
    model: "Neptune 4",
    type: "FDM",
    imageUrl: "/printers/elegoo-neptune-4.webp",
    buildVolume: "225 x 225 x 265 mm",
    nozzleSize: 0.4,
    powerConsumption: 350,
  },
];

export const printerManufacturers = Array.from(
  new Set(
    printerModels.map((printer) => printer.manufacturer)
  )
);

export function getPrinterModel(id: string) {
  return printerModels.find((printer) => printer.id === id);
}

export function getPrinterModelsByManufacturer(manufacturer: string) {
  return printerModels.filter(
    (printer) => printer.manufacturer === manufacturer,
  );
}