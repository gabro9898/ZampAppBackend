// src/utils/challengeHelpers.js
// Funzioni helper per le challenge - VERSIONE CON PACCHETTI

export const getTypeColor = (challenge) => {
  const gameMode = challenge.gameMode?.toLowerCase();
  
  switch (gameMode) {
    case 'free':
      return '#059669'; // verde
    case 'pro':
      return '#2563eb'; // blu
    case 'premium':
      return '#7c3aed'; // viola
    case 'vip':
      return '#dc2626'; // rosso
    case 'paid':
      return '#f59e0b'; // arancione
    default:
      return '#6b7280'; // grigio
  }
};

export const getTypeIcon = (challenge) => {
  const gameMode = challenge.gameMode?.toLowerCase();
  
  switch (gameMode) {
    case 'free':
      return '🎁';
    case 'pro':
      return '⭐';
    case 'premium':
      return '💎';
    case 'vip':
      return '👑';
    case 'paid':
      return '💰';
    default:
      return '📋';
  }
};

export const getTypeLabel = (challenge) => {
  const gameMode = challenge.gameMode?.toLowerCase();
  
  switch (gameMode) {
    case 'free':
      return 'Gratis';
    case 'pro':
      return 'Pro';
    case 'premium':
      return 'Premium';
    case 'vip':
      return 'VIP';
    case 'paid':
      return 'Shop';
    default:
      return challenge.gameMode;
  }
};

export const formatTimeLeft = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  
  if (isNaN(end.getTime())) {
    return 'Data non valida';
  }
  
  const diff = end - now;
  
  if (diff <= 0) {
    return 'Terminata';
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} giorni`;
  if (hours > 0) return `${hours} ore`;
  return 'Poche ore';
};

export const formatPrize = (prize) => {
  if (typeof prize === 'number') return `€${prize}`;
  return String(prize || 'Da definire');
};

export const formatPrice = (price) => {
  if (typeof price === 'number') return `€${price}`;
  return String(price || '€0');
};

export const getGameIcon = (gameType) => {
  switch (gameType) {
    case 'timer': return '⏱️';
    case 'steps': return '👣';
    case 'photo': return '📸';
    case 'quiz': return '🧠';
    default: return '🎮';
  }
};

export const isUserParticipating = (challenge, userId) => {
  if (!userId) return false;
  
  if (challenge.participants && Array.isArray(challenge.participants)) {
    return challenge.participants.some(p => p.userId === userId);
  }
  
  if (challenge.isParticipating !== undefined) {
    return challenge.isParticipating;
  }
  
  return false;
};

/**
 * Verifica se un utente ha acquistato una challenge
 */
export const hasUserPurchased = (challenge, userId) => {
  if (!userId || !challenge.purchasedBy) return false;
  
  return challenge.purchasedBy.some(p => p.userId === userId);
};

/**
 * Verifica se un pacchetto utente può accedere a una challenge
 */
export const canPackageAccess = (userPackage, challengeMode) => {
  const packageHierarchy = {
    'free': ['free'],
    'pro': ['free', 'pro'],
    'premium': ['free', 'pro', 'premium'],
    'vip': ['free', 'pro', 'premium', 'vip']
  };
  
  const allowedModes = packageHierarchy[userPackage] || [];
  return allowedModes.includes(challengeMode);
};

/**
 * Verifica se un utente può vedere/accedere a una challenge
 */
export const canUserAccessChallenge = (challenge, user) => {
  if (!user) return false;
  
  // Se è una challenge a pagamento, deve averla acquistata
  if (challenge.gameMode === 'paid') {
    return hasUserPurchased(challenge, user.id);
  }
  
  // Altrimenti verifica il pacchetto
  return canPackageAccess(user.packageType, challenge.gameMode);
};

/**
 * Filtra le challenge in base al filtro attivo e all'accesso dell'utente
 */
export const filterChallenges = (challenges, activeFilter, user) => {
  return challenges.filter(challenge => {
    // Prima verifica che l'utente possa accedere alla challenge
    if (!canUserAccessChallenge(challenge, user)) {
      return false;
    }
    
    // Poi applica il filtro per tipo
    if (activeFilter !== 'all') {
      const gameMode = challenge.gameMode?.toLowerCase();
      
      if (activeFilter === 'free' && gameMode !== 'free') return false;
      if (activeFilter === 'premium' && gameMode !== 'premium') return false;
      if (activeFilter === 'vip' && gameMode !== 'vip') return false;
      if (activeFilter === 'pro' && gameMode !== 'pro') return false;
    }
    
    // Mostra solo challenge attive
    const now = new Date();
    const endDate = new Date(challenge.endDate);
    
    return !isNaN(endDate.getTime()) && endDate > now;
  });
};

/**
 * Ottieni il messaggio appropriato per una challenge non accessibile
 */
export const getAccessMessage = (challenge, user) => {
  if (!user) return 'Accedi per partecipare';
  
  if (challenge.gameMode === 'paid' && !hasUserPurchased(challenge, user.id)) {
    return `Acquista per ${formatPrice(challenge.userPrice || challenge.price)}`;
  }
  
  if (!canPackageAccess(user.packageType, challenge.gameMode)) {
    return `Richiede pacchetto ${getTypeLabel(challenge)}`;
  }
  
  return null;
};