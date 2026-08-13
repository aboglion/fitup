/**
 * Google Fit Integration Module
 * Fetches daily steps, expended calories, and heart rate data using Google Fit REST API.
 */
const GoogleFitService = (() => {

  /**
   * Fetch daily metrics (steps, calories, avg/max heart rate) for a given date or today
   */
  async function fetchDailyFitData(dateStr = null) {
    const token = await CloudSync.getAccessToken();
    if (!token) return null;

    let targetDate = new Date();
    if (dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }

    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const requestBody = {
      aggregateBy: [
        { dataTypeName: "com.google.step_count.delta" },
        { dataTypeName: "com.google.calories.expended" },
        { dataTypeName: "com.google.heart_rate.bpm" }
      ],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: startOfDay.getTime(),
      endTimeMillis: endOfDay.getTime()
    };

    try {
      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Google Fit API token expired or scope missing.');
        }
        return null;
      }

      const data = await response.json();
      return parseFitResponse(data);
    } catch (err) {
      console.error('Google Fit API error:', err);
      return null;
    }
  }

  /**
   * Parse Google Fit aggregate JSON response into simple metrics object
   */
  function parseFitResponse(data) {
    let steps = 0;
    let calories = 0;
    let avgHeartRate = 0;
    let maxHeartRate = 0;
    let hrCount = 0;
    let hrSum = 0;

    if (data && data.bucket && data.bucket.length > 0) {
      const dataset = data.bucket[0].dataset || [];
      dataset.forEach(ds => {
        const streamId = ds.dataSourceId || '';
        const point = ds.point || [];

        point.forEach(pt => {
          const value = pt.value || [];
          value.forEach(val => {
            if (streamId.includes('step_count') && val.intVal) {
              steps += val.intVal;
            } else if (streamId.includes('calories') && val.fpVal) {
              calories += Math.round(val.fpVal);
            } else if (streamId.includes('heart_rate') && val.fpVal) {
              const hr = Math.round(val.fpVal);
              hrSum += hr;
              hrCount++;
              if (hr > maxHeartRate) maxHeartRate = hr;
            }
          });
        });
      });
    }

    if (hrCount > 0) {
      avgHeartRate = Math.round(hrSum / hrCount);
    }

    return {
      steps,
      calories,
      avgHeartRate,
      maxHeartRate
    };
  }

  /**
   * Render Google Fit metrics widget into a container element
   */
  async function renderWidget(containerId, dateStr = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isLoggedIn = await CloudSync.isLoggedIn();
    if (!isLoggedIn) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(66, 133, 244, 0.1), rgba(52, 168, 83, 0.1)); border: 1px solid rgba(66, 133, 244, 0.3); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
            <span>⌚</span> <span>Google Fit Sync</span>
          </span>
          <span id="fit-refresh-btn" style="font-size: 12px; cursor: pointer; color: var(--accent-primary);">🔄</span>
        </div>
        <div id="fit-metrics-loading" style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 8px;">
          טוען נתונים מ-Google Fit...
        </div>
        <div id="fit-metrics-content" style="display: none; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center;">
          <div style="background: var(--bg-elevated); padding: 8px; border-radius: 8px; border: 1px solid var(--border-light);">
            <div style="font-size: 16px;">👟</div>
            <div id="fit-steps" style="font-size: 15px; font-weight: 900; color: var(--text-primary);">0</div>
            <div style="font-size: 10px; color: var(--text-muted);" data-i18n="steps">צעדים</div>
          </div>
          <div style="background: var(--bg-elevated); padding: 8px; border-radius: 8px; border: 1px solid var(--border-light);">
            <div style="font-size: 16px;">🔥</div>
            <div id="fit-cals" style="font-size: 15px; font-weight: 900; color: var(--warning);">0</div>
            <div style="font-size: 10px; color: var(--text-muted);" data-i18n="burned_cals">נשרפו (kcal)</div>
          </div>
          <div style="background: var(--bg-elevated); padding: 8px; border-radius: 8px; border: 1px solid var(--border-light);">
            <div style="font-size: 16px;">❤️</div>
            <div id="fit-hr" style="font-size: 15px; font-weight: 900; color: var(--danger);">0</div>
            <div style="font-size: 10px; color: var(--text-muted);" data-i18n="avg_hr">דופק ממוצע</div>
          </div>
        </div>
      </div>
    `;

    const refreshBtn = document.getElementById('fit-refresh-btn');
    if (refreshBtn) {
      refreshBtn.onclick = () => loadFitMetrics(dateStr);
    }

    await loadFitMetrics(dateStr);
  }

  async function loadFitMetrics(dateStr) {
    const loading = document.getElementById('fit-metrics-loading');
    const content = document.getElementById('fit-metrics-content');
    if (!loading || !content) return;

    loading.style.display = 'block';
    content.style.display = 'none';

    const fitData = await fetchDailyFitData(dateStr);

    if (fitData) {
      loading.style.display = 'none';
      content.style.display = 'grid';

      const stepsEl = document.getElementById('fit-steps');
      const calsEl = document.getElementById('fit-cals');
      const hrEl = document.getElementById('fit-hr');

      if (stepsEl) stepsEl.textContent = fitData.steps.toLocaleString();
      if (calsEl) calsEl.textContent = fitData.calories.toLocaleString();
      if (hrEl) hrEl.textContent = fitData.avgHeartRate > 0 ? `${fitData.avgHeartRate} bpm` : '—';
    } else {
      loading.textContent = 'לא התקבלו נתונים מ-Google Fit (ודא שהתחברת והענקת הרשאות)';
    }
  }

  return {
    fetchDailyFitData,
    renderWidget
  };
})();

window.GoogleFitService = GoogleFitService;
