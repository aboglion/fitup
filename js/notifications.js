/**
 * Smart Notification Service Module
 * Handles local PWA notifications and smart AI-driven reminder scheduling.
 */
const NotificationService = (() => {

  /**
   * Check if notifications are supported
   */
  function isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current permission state
   */
  function getPermissionState() {
    if (!isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  async function requestPermission() {
    if (!isSupported()) return false;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        if (typeof UI !== 'undefined' && UI.toast) {
          UI.toast('התראות חכמות הופעלו בהצלחה! 🔔', 'success');
        }
        await scheduleSmartReminders();
        return true;
      } else {
        if (typeof UI !== 'undefined' && UI.toast) {
          UI.toast('הרשאת התראות נדחתה', 'warning');
        }
        return false;
      }
    } catch (err) {
      console.error('Notification permission error:', err);
      return false;
    }
  }

  /**
   * Trigger an immediate local notification (via SW if active, fallback to Notification API)
   */
  async function showNotification(title, options = {}) {
    if (!isSupported() || Notification.permission !== 'granted') return false;

    const defaultOptions = {
      icon: './images/logo.png',
      badge: './images/logo.png',
      vibrate: [100, 50, 100],
      data: { url: window.location.href },
      ...options
    };

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions);
      } else {
        new Notification(title, defaultOptions);
      }
      return true;
    } catch (err) {
      console.error('Show notification error:', err);
      return false;
    }
  }

  /**
   * Schedule smart reminders based on workout completion & current time
   */
  async function scheduleSmartReminders() {
    if (!isSupported() || Notification.permission !== 'granted') return;

    try {
      const allTracking = await DB.getAllTracking();
      const planDays = await DB.getAllPlan();
      const todayIdx = UI.findTodayIndex(planDays);
      const todayTrack = allTracking.find(t => t.dayIndex === todayIdx);
      const todayPlan = planDays[todayIdx];

      // If today is a workout day and not yet completed
      if (todayPlan && todayPlan.dayType !== 'Rest' && (!todayTrack || !todayTrack.completed)) {
        const now = new Date();
        // Send a smart encouragement notification if it's afternoon/evening (after 17:00)
        if (now.getHours() >= 17) {
          const lastNotifDate = await DB.getSetting('lastNotifWorkoutReminder');
          const todayStr = UI.getLocalDateString();
          if (lastNotifDate !== todayStr) {
            await showNotification(`💪 זמן לאימון ${todayPlan.dayType}!`, {
              body: `האימון של היום ממתין לך: ${todayPlan.title || 'לחץ לפתיחה ולסימון הישגים'}`,
              tag: 'workout-reminder'
            });
            await DB.setSetting('lastNotifWorkoutReminder', todayStr);
          }
        }
      }
    } catch (err) {
      console.warn('Smart reminder schedule check failed:', err);
    }
  }

  /**
   * Initialize notification service
   */
  async function init() {
    if (isSupported() && Notification.permission === 'granted') {
      await scheduleSmartReminders();
    }
  }

  return {
    isSupported,
    getPermissionState,
    requestPermission,
    showNotification,
    scheduleSmartReminders,
    init
  };
})();

window.NotificationService = NotificationService;
