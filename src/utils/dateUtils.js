export class DateUtils {
  /**
   * Ottiene l'inizio del giorno corrente (00:00:00)
   */
  static getStartOfDay(date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Ottiene la fine del giorno corrente (23:59:59.999)
   */
  static getEndOfDay(date = new Date()) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Controlla se due date sono nello stesso giorno
   */
  static isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
  }

  /**
   * Calcola la prossima data di reset basata su resetTime (es: "00:00")
   */
  static getNextResetTime(resetTime = "00:00") {
    const [hours, minutes] = resetTime.split(':').map(Number);
    const now = new Date();
    const nextReset = new Date();
    
    nextReset.setHours(hours, minutes, 0, 0);
    
    // Se l'ora di reset è già passata oggi, prendi domani
    if (nextReset <= now) {
      nextReset.setDate(nextReset.getDate() + 1);
    }
    
    return nextReset;
  }

  /**
   * Ottiene il range di tempo per oggi (da resetTime a resetTime+24h)
   */
  static getTodayRange(resetTime = "00:00") {
    const [hours, minutes] = resetTime.split(':').map(Number);
    const now = new Date();
    
    const todayStart = new Date(now);
    todayStart.setHours(hours, minutes, 0, 0);
    
    // Se siamo prima dell'ora di reset, il "today" è ieri
    if (now.getHours() < hours || (now.getHours() === hours && now.getMinutes() < minutes)) {
      todayStart.setDate(todayStart.getDate() - 1);
    }
    
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    todayEnd.setMilliseconds(-1); // 23:59:59.999
    
    return { start: todayStart, end: todayEnd };
  }
}