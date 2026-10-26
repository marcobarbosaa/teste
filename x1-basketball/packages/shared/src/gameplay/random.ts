/** PRNG explícito e serializável: cliente e futuro servidor reproduzem a mesma sequência. */
export function nextRandom(seed:number) {let value=seed>>>0;value^=value<<13;value^=value>>>17;value^=value<<5;return {seed:value>>>0,value:(value>>>0)/4294967296};}
