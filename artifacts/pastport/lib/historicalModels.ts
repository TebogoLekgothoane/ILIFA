export type HistoricalModelConfig = {
  model: number;
  title: string;
  year: 1950;
  type: 'historical-reconstruction';
};

export const historicalModels: Record<string, Partial<Record<number, HistoricalModelConfig>>> = {
  'east-london-railway-station': {
    1950: {
      model: require('../assets/models/east-london-railway-station-1950-pastport.glb'),
      title: 'East London Railway Station',
      year: 1950,
      type: 'historical-reconstruction',
    },
  },
};

export const station1950Model = historicalModels['east-london-railway-station'][1950]!;
