
export const generateECG = (t: number, leadOffset: number = 0): number => {
  const phase = (t + leadOffset) % 100;
  let val = 50; 
  if (phase > 10 && phase < 20) val += 10 * Math.sin((phase - 10) * Math.PI / 10);
  else if (phase > 23 && phase < 25) val -= 10;
  else if (phase >= 25 && phase <= 27) val += 80;
  else if (phase > 27 && phase < 30) val -= 15;
  else if (phase > 50 && phase < 65) val += 15 * Math.sin((phase - 50) * Math.PI / 15);
  return val + (Math.random() - 0.5) * 2;
};

export const generatePleth = (t: number): number => 50 + 40 * Math.sin(t * 0.063) + 10 * Math.sin((t * 0.063 * 2) + 1);
export const generateResp = (t: number): number => 50 + 45 * Math.sin((t * 0.2) % 100 * 0.063);

export const generateCO2 = (t: number): number => {
  const phase = (t * 0.25) % 100; 
  if (phase < 10) return 10; 
  if (phase >= 10 && phase < 15) return 10 + ((phase-10)/5) * 80;
  if (phase >= 15 && phase < 45) return 90 + (Math.random() * 2);
  if (phase >= 45 && phase < 50) return 90 - ((phase-45)/5) * 80;
  return 10; 
};

export const generatePaw = (t: number): number => {
  const phase = (t * 0.25) % 100; 
  if (phase < 30) return 20 + (phase / 30) * 70;
  if (phase >= 30 && phase < 40) return 90;
  if (phase >= 40 && phase < 60) return 90 - ((phase - 40) / 20) * 70;
  return 20; 
};

export const generateFlow = (t: number): number => {
  const phase = (t * 0.25) % 100;
  if (phase < 40) return 50 + 40 * Math.sin((phase / 40) * Math.PI); 
  return 50 - 30 * Math.sin(((phase - 40) / 60) * Math.PI);
};

export const generateART = (t: number): number => {
    const phase = t % 100;
    if (phase < 15) return 20 + (phase/15) * 80;
    if (phase >= 15 && phase < 40) return 100 - ((phase-15)/25) * 40 + 5 * Math.sin((phase-15)*0.5);
    return 60 - ((phase-40)/60) * 40;
};

export const generateCVP = (t: number): number => 50 + 15 * Math.sin(t * 0.15) + 5 * Math.cos(t * 0.45) + (Math.random() * 2);

export const generateAgent = (t: number): number => {
    const phase = (t * 0.1) % 100;
    if (phase < 50) return 30; 
    return 25; 
};

export const generateGeneric = (t: number, seed: number): number => {
    const f1 = 0.05 + (seed % 10) * 0.01;
    return 50 + 30 * Math.sin(t * f1) + (Math.random() * 4 - 2);
};
