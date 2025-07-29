// src/utils/serializer.js

/**
 * Converte BigInt e Decimal in numeri normali per la serializzazione JSON
 */
export function serializeData(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'Decimal') {
    return Number(obj.toString());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeData(item));
  }
  
  if (typeof obj === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeData(value);
    }
    return serialized;
  }
  
  return obj;
}

/**
 * Middleware per serializzare automaticamente tutte le risposte
 */
export function serializerMiddleware(req, res, next) {
  const originalJson = res.json;
  
  res.json = function(data) {
    const serializedData = serializeData(data);
    return originalJson.call(this, serializedData);
  };
  
  next();
}