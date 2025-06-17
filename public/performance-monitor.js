// Performance monitoring script to help identify memory issues
(function() {
  let performanceData = {
    navigationStart: Date.now(),
    memoryUsage: [],
    subscriptions: 0,
    timers: 0,
    listeners: 0
  };

  // Monitor memory usage
  function trackMemory() {
    if (performance.memory) {
      const memory = {
        timestamp: Date.now(),
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
      
      performanceData.memoryUsage.push(memory);
      
      // Keep only last 50 measurements
      if (performanceData.memoryUsage.length > 50) {
        performanceData.memoryUsage.shift();
      }
      
      // Log warning if memory usage is high
      if (memory.used > 100) {
        console.warn('🚨 High memory usage detected:', memory.used + 'MB');
      }
    }
  }

  // Track Firebase subscriptions
  const originalOnSnapshot = window.firebase?.firestore?.onSnapshot;
  if (originalOnSnapshot) {
    window.firebase.firestore.onSnapshot = function(...args) {
      performanceData.subscriptions++;
      console.log('📊 Firebase subscription created. Total:', performanceData.subscriptions);
      
      const unsubscribe = originalOnSnapshot.apply(this, args);
      return function() {
        performanceData.subscriptions--;
        console.log('📊 Firebase subscription cleaned up. Total:', performanceData.subscriptions);
        return unsubscribe();
      };
    };
  }

  // Track timers
  const originalSetInterval = window.setInterval;
  const originalSetTimeout = window.setTimeout;
  const originalClearInterval = window.clearInterval;
  const originalClearTimeout = window.clearTimeout;

  window.setInterval = function(...args) {
    performanceData.timers++;
    const id = originalSetInterval.apply(this, args);
    console.log('⏱️ Timer created (interval). Total:', performanceData.timers);
    return id;
  };

  window.setTimeout = function(...args) {
    performanceData.timers++;
    const id = originalSetTimeout.apply(this, args);
    console.log('⏱️ Timer created (timeout). Total:', performanceData.timers);
    return id;
  };

  window.clearInterval = function(id) {
    if (id) {
      performanceData.timers--;
      console.log('⏱️ Timer cleared (interval). Total:', performanceData.timers);
    }
    return originalClearInterval.call(this, id);
  };

  window.clearTimeout = function(id) {
    if (id) {
      performanceData.timers--;
      console.log('⏱️ Timer cleared (timeout). Total:', performanceData.timers);
    }
    return originalClearTimeout.call(this, id);
  };

  // Track event listeners
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

  EventTarget.prototype.addEventListener = function(...args) {
    performanceData.listeners++;
    console.log('👂 Event listener added. Total:', performanceData.listeners);
    return originalAddEventListener.apply(this, args);
  };

  EventTarget.prototype.removeEventListener = function(...args) {
    performanceData.listeners--;
    console.log('👂 Event listener removed. Total:', performanceData.listeners);
    return originalRemoveEventListener.apply(this, args);
  };

  // Performance dashboard
  window.showPerformanceStats = function() {
    console.group('🔍 Performance Stats');
    console.log('Memory Usage (MB):', performanceData.memoryUsage.slice(-1)[0] || 'N/A');
    console.log('Active Firebase Subscriptions:', performanceData.subscriptions);
    console.log('Active Timers:', performanceData.timers);
    console.log('Active Event Listeners:', performanceData.listeners);
    console.log('Session Duration:', Math.round((Date.now() - performanceData.navigationStart) / 1000) + 's');
    
    if (performanceData.memoryUsage.length > 1) {
      const first = performanceData.memoryUsage[0];
      const last = performanceData.memoryUsage[performanceData.memoryUsage.length - 1];
      const growth = last.used - first.used;
      console.log('Memory Growth:', growth + 'MB');
      
      if (growth > 50) {
        console.warn('⚠️ Potential memory leak detected!');
        console.log('Consider checking for:');
        console.log('- Uncleaned Firebase subscriptions');
        console.log('- Uncleaned timers/intervals');
        console.log('- Uncleaned event listeners');
        console.log('- Large objects in memory');
      }
    }
    console.groupEnd();
  };

  // Cleanup function
  window.cleanupPerformanceMonitor = function() {
    console.log('🧹 Cleaning up performance monitor...');
    
    // Clear memory tracking
    if (window.performanceTracker) {
      clearInterval(window.performanceTracker);
    }
    
    // Show final stats
    window.showPerformanceStats();
  };

  // Start monitoring
  console.log('🚀 Performance monitor started');
  trackMemory();
  
  // Track memory every 5 seconds
  window.performanceTracker = setInterval(trackMemory, 5000);
  
  // Show stats every 30 seconds
  setInterval(() => {
    if (performanceData.memoryUsage.length > 0) {
      const current = performanceData.memoryUsage[performanceData.memoryUsage.length - 1];
      if (current.used > 80) {
        console.warn('⚠️ Memory usage above 80MB:', current.used + 'MB');
        window.showPerformanceStats();
      }
    }
  }, 30000);

  // Cleanup on page unload
  window.addEventListener('beforeunload', window.cleanupPerformanceMonitor);
})(); 