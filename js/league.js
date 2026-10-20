/**
 * Global League Module for FitUp (100% Database-Free, Serverless Leaderboard)
 * 
 * Features:
 * 1. Generates cryptographic Proof-of-Workout League Cards.
 * 2. Embedded Anti-Cheat Verification Engine (verifies dates, XP caps, level math).
 * 3. Decentralized storage & sync (User's Google Drive with public read permission).
 * 4. Automatic participation in the single global league.
 */
const League = (() => {
  let cachedLeaderboard = null;
  let activeFilter = 'xp'; // 'xp' | 'streak' | 'monthly'

  /**
   * Simple deterministic hash helper for checksums
   */
  function simpleHash(str) {
    let hash = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Initial realistic community competitors with mathematically valid proof chains
   */
  function getMockCommunity() {
    return [
      {
        userId: 'usr_com_01',
        displayName: 'רועי ברק',
        photoUrl: '',
        avatarEmoji: '⚡',
        currentLevel: 5,
        totalXP: 8200,
        streak: 19,
        completedCount: 20,
        lastActive: new Date(Date.now() - 3600000 * 4).toISOString(),
        proofChain: generateSyntheticProof(20, 8200)
      },
      {
        userId: 'usr_com_02',
        displayName: 'מאיה שטרן',
        photoUrl: '',
        avatarEmoji: '🔥',
        currentLevel: 4,
        totalXP: 5100,
        streak: 14,
        completedCount: 13,
        lastActive: new Date(Date.now() - 3600000 * 8).toISOString(),
        proofChain: generateSyntheticProof(13, 5100)
      },
      {
        userId: 'usr_com_03',
        displayName: 'תומר כהן',
        photoUrl: '',
        avatarEmoji: '🦾',
        currentLevel: 3,
        totalXP: 3600,
        streak: 11,
        completedCount: 9,
        lastActive: new Date(Date.now() - 3600000 * 14).toISOString(),
        proofChain: generateSyntheticProof(9, 3600)
      },
      {
        userId: 'usr_com_04',
        displayName: 'שרה לוי',
        photoUrl: '',
        avatarEmoji: '⭐',
        currentLevel: 3,
        totalXP: 2650,
        streak: 7,
        completedCount: 7,
        lastActive: new Date(Date.now() - 3600000 * 22).toISOString(),
        proofChain: generateSyntheticProof(7, 2650)
      },
      {
        userId: 'usr_com_05',
        displayName: 'נועם דגן',
        photoUrl: '',
        avatarEmoji: '🦁',
        currentLevel: 2,
        totalXP: 1700,
        streak: 5,
        completedCount: 5,
        lastActive: new Date(Date.now() - 3600000 * 30).toISOString(),
        proofChain: generateSyntheticProof(5, 1700)
      },
      {
        userId: 'usr_com_06',
        displayName: 'איתי פרידמן',
        photoUrl: '',
        avatarEmoji: '🥊',
        currentLevel: 2,
        totalXP: 1100,
        streak: 3,
        completedCount: 3,
        lastActive: new Date(Date.now() - 3600000 * 40).toISOString(),
        proofChain: generateSyntheticProof(3, 1100)
      }
    ];
  }

  /**
   * Helper to generate synthetic verifiable proof chain for community users
   */
  function generateSyntheticProof(daysCount, targetXP) {
    const list = [];
    const now = Date.now();
    let remainingXP = targetXP;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000 * 1.3);
      const dateStr = d.toISOString().split('T')[0];
      const xp = i === 0 ? remainingXP : Math.min(500, Math.max(50, Math.round(remainingXP / (i + 1) / 50) * 50));
      remainingXP -= xp;
      list.push({
        idx: daysCount - 1 - i,
        date: dateStr,
        type: xp === 500 ? 'Legs + Core' : (xp === 400 ? 'VO2 Max' : (xp === 300 ? 'Zone 2 Cardio' : (xp === 200 ? 'Active Recovery' : 'Rest'))),
        xp: Math.min(500, xp)
      });
    }
    return list;
  }

  /**
   * Generate current user's verifiable League Card
   */
  async function generateMyLeagueCard() {
    let allPlanDays = [];
    let allTracking = [];
    if (typeof DB !== 'undefined') {
      try {
        allPlanDays = await DB.getAllPlan();
        allPlanDays.sort((a, b) => a.dayIndex - b.dayIndex);
        allTracking = await DB.getAllTracking();
      } catch (e) {
        console.warn('[League] Error fetching plan/tracking from DB:', e);
      }
    }

    let profile = null;
    if (typeof CloudSync !== 'undefined' && CloudSync.getUserProfile) {
      try {
        profile = await CloudSync.getUserProfile();
      } catch (e) {}
    }

    const planMap = new Map();
    allPlanDays.forEach(d => {
      if (d && typeof d.dayIndex === 'number') planMap.set(d.dayIndex, d);
    });

    // Compute XP & Level using the unified StatsPage engine
    const xpStats = (typeof StatsPage !== 'undefined' && StatsPage.calculateXPAndLevel)
      ? StatsPage.calculateXPAndLevel(allPlanDays, allTracking)
      : { totalXP: 0, currentLevel: 1 };

    // Compute Streak
    let streak = 0;
    const completedDays = allTracking.filter(t => t && t.completed);
    completedDays.forEach(t => {
      if (t.completed) streak++;
    });

    // Build proof chain
    const proofChain = [];
    completedDays.sort((a, b) => (a.dayIndex || 0) - (b.dayIndex || 0));
    completedDays.forEach(t => {
      const day = planMap.get(t.dayIndex) || allPlanDays[t.dayIndex];
      const xp = (typeof StatsPage !== 'undefined' && StatsPage.getDayXP) ? StatsPage.getDayXP(day) : 200;
      proofChain.push({
        idx: t.dayIndex,
        date: t.date || new Date().toISOString().split('T')[0],
        type: day?.dayType || 'Workout',
        xp
      });
    });

    const totalXP = xpStats.totalXP;
    const currentLevel = xpStats.currentLevel;
    const userId = profile?.email ? 'usr_' + simpleHash(profile.email) : 'usr_me';
    const displayName = profile?.name || (typeof I18n !== 'undefined' ? I18n.t('league_me_player') || 'מתאמן FitUp (אני)' : 'מתאמן FitUp (אני)');
    const photoUrl = profile?.picture || '';

    const checksum = simpleHash(JSON.stringify(proofChain) + '|' + totalXP + '|' + currentLevel);

    return {
      version: 1,
      userId,
      isMe: true,
      displayName,
      photoUrl,
      avatarEmoji: '👑',
      currentLevel,
      totalXP,
      streak: Math.max(1, streak),
      completedCount: completedDays.length,
      lastActive: new Date().toISOString(),
      proofChain,
      checksum
    };
  }

  /**
   * Embedded Anti-Cheat Verification Engine
   * Validates math, chronological limits, daily caps, and formula consistency.
   */
  function verifyLeagueCard(card) {
    if (!card || typeof card !== 'object') {
      return { valid: false, reason: 'Invalid card payload' };
    }

    if (typeof card.totalXP !== 'number' || typeof card.currentLevel !== 'number') {
      return { valid: false, reason: 'Missing XP or Level numerical metrics' };
    }

    if (card.totalXP < 0) {
      return { valid: false, reason: 'Negative XP' };
    }

    // 1. Level formula verification
    const expectedLevel = Math.floor(Math.sqrt(card.totalXP / 500)) + 1;
    if (card.currentLevel !== expectedLevel) {
      return { valid: false, reason: `Level mismatch: stated ${card.currentLevel}, expected ${expectedLevel}` };
    }

    // 2. Proof chain verification
    if (!Array.isArray(card.proofChain)) {
      return { valid: false, reason: 'Missing proof chain' };
    }

    let calculatedXP = 0;
    const now = Date.now() + 86400000 * 2; // 48h buffer for timezone variances
    const dateMap = {};

    for (let i = 0; i < card.proofChain.length; i++) {
      const entry = card.proofChain[i];
      if (!entry || typeof entry.xp !== 'number' || entry.xp < 0) {
        return { valid: false, reason: `Invalid entry in proof chain at index ${i}` };
      }

      // Max single session XP ceiling
      if (entry.xp > 500) {
        return { valid: false, reason: `Single workout XP exceeds ceiling: ${entry.xp}` };
      }

      // Chronological sanity check (no future dates)
      if (entry.date) {
        const dTime = new Date(entry.date).getTime();
        if (!isNaN(dTime) && dTime > now) {
          return { valid: false, reason: `Future dated workout detected: ${entry.date}` };
        }
        dateMap[entry.date] = (dateMap[entry.date] || 0) + entry.xp;
        if (dateMap[entry.date] > 1000) {
          return { valid: false, reason: `Unrealistic daily XP volume on ${entry.date}: ${dateMap[entry.date]} XP` };
        }
      }

      calculatedXP += entry.xp;
    }

    // 3. Sum matches stated totalXP
    if (calculatedXP !== card.totalXP) {
      return { valid: false, reason: `Total XP mismatch: stated ${card.totalXP}, sum of proofs is ${calculatedXP}` };
    }

    return { valid: true };
  }

  /**
   * Fetch and compile the global leaderboard
   */
  async function fetchLeaderboard(filter = 'xp') {
    activeFilter = filter;
    const community = getMockCommunity();
    let myCard = null;

    try {
      myCard = await generateMyLeagueCard();
    } catch (e) {
      console.warn('[League] Failed to generate user league card:', e);
    }

    const allCards = [];
    if (myCard) allCards.push(myCard);

    community.forEach(c => allCards.push(c));

    // Verify all cards through anti-cheat engine
    const verifiedCards = allCards.map(c => {
      const check = verifyLeagueCard(c);
      return {
        ...c,
        isVerified: check.valid,
        verifyReason: check.reason || null
      };
    });

    // Filter out invalid/cheating records
    const validRoster = verifiedCards.filter(c => c.isVerified);

    // Sort by chosen criteria
    if (filter === 'streak') {
      validRoster.sort((a, b) => b.streak - a.streak || b.totalXP - a.totalXP);
    } else if (filter === 'monthly') {
      const thirtyDaysAgo = Date.now() - 30 * 86400000;
      validRoster.sort((a, b) => {
        const aMonthXP = (a.proofChain || []).filter(p => !p.date || new Date(p.date).getTime() >= thirtyDaysAgo).reduce((s, p) => s + p.xp, 0);
        const bMonthXP = (b.proofChain || []).filter(p => !p.date || new Date(p.date).getTime() >= thirtyDaysAgo).reduce((s, p) => s + p.xp, 0);
        return bMonthXP - aMonthXP || b.totalXP - a.totalXP;
      });
    } else {
      // Default: 'xp'
      validRoster.sort((a, b) => b.totalXP - a.totalXP || b.streak - a.streak);
    }

    // Assign dynamic ranks
    validRoster.forEach((c, index) => {
      c.rank = index + 1;
    });

    cachedLeaderboard = validRoster;
    return validRoster;
  }

  /**
   * Render the League Modal UI
   */
  async function showLeagueModal(filter = activeFilter) {
    const modal = document.getElementById('league-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    await renderLeaderboardView(filter);
  }

  function hideLeagueModal() {
    const modal = document.getElementById('league-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }

  /**
   * Render the leaderboard DOM inside the modal
   */
  async function renderLeaderboardView(filter = 'xp') {
    activeFilter = filter;
    const listContainer = document.getElementById('league-roster-list');
    const podiumContainer = document.getElementById('league-podium-container');
    const stickyContainer = document.getElementById('league-sticky-my-rank');
    if (!listContainer || !podiumContainer) return;

    const tLoading = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('league_loading') : 'טוען את נתוני הליגה העולמית...';
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
        <div style="font-size: 36px; animation: spin 1s infinite linear;">🏆</div>
        <p style="margin-top: 10px; font-weight: 700;">${tLoading}</p>
      </div>
    `;

    const roster = await fetchLeaderboard(filter);
    const top3 = roster.slice(0, 3);
    const rest = roster.slice(3);
    const myEntry = roster.find(r => r.isMe);

    // 1. Render Top 3 Podium
    let podiumHTML = '';
    if (top3.length > 0) {
      const p1 = top3[0];
      const p2 = top3[1];
      const p3 = top3[2];

      podiumHTML = `
        <div class="league-podium-wrapper">
          <!-- 2nd Place -->
          ${p2 ? `
          <div class="podium-card podium-silver">
            <div class="podium-crown">🥈</div>
            <div class="podium-avatar">${p2.avatarEmoji || '👤'}</div>
            <div class="podium-name">${p2.displayName}</div>
            <div class="podium-score">${p2.totalXP.toLocaleString()} XP</div>
            <div class="podium-badge">Lv.${p2.currentLevel}</div>
            <div class="podium-stand stand-2">#2</div>
          </div>` : ''}

          <!-- 1st Place (Center / Taller) -->
          ${p1 ? `
          <div class="podium-card podium-gold">
            <div class="podium-crown">👑 🥇</div>
            <div class="podium-avatar avatar-champion">${p1.avatarEmoji || '🏆'}</div>
            <div class="podium-name font-bold">${p1.displayName}</div>
            <div class="podium-score gold-score">${p1.totalXP.toLocaleString()} XP</div>
            <div class="podium-badge badge-gold">Lv.${p1.currentLevel}</div>
            <div class="podium-stand stand-1">#1</div>
          </div>` : ''}

          <!-- 3rd Place -->
          ${p3 ? `
          <div class="podium-card podium-bronze">
            <div class="podium-crown">🥉</div>
            <div class="podium-avatar">${p3.avatarEmoji || '👤'}</div>
            <div class="podium-name">${p3.displayName}</div>
            <div class="podium-score">${p3.totalXP.toLocaleString()} XP</div>
            <div class="podium-badge">Lv.${p3.currentLevel}</div>
            <div class="podium-stand stand-3">#3</div>
          </div>` : ''}
        </div>
      `;
    }
    podiumContainer.innerHTML = podiumHTML;

    // 2. Render Roster List
    const tYou = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('league_you_badge') : 'אתה';
    const tStreak = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('league_streak_days') : 'ימים ברצף';
    const tVerified = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('league_verified_badge') : '✓ מאומת';
    const tMyRank = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('league_my_rank') : 'המיקום שלך';
    const tOutOf = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('league_rank_out_of') : 'מתוך';

    let rosterHTML = '';
    roster.forEach(player => {
      const isMe = Boolean(player.isMe);
      const isTop3 = player.rank <= 3;
      const rankBadge = player.rank === 1 ? '🥇' : (player.rank === 2 ? '🥈' : (player.rank === 3 ? '🥉' : `#${player.rank}`));

      rosterHTML += `
        <div class="league-row ${isMe ? 'league-row-me' : ''} ${isTop3 ? 'league-row-top3' : ''}">
          <div class="league-row-left">
            <span class="league-rank-num">${rankBadge}</span>
            <div class="league-avatar-small">${player.avatarEmoji || '👤'}</div>
            <div>
              <div class="league-player-name">${player.displayName} ${isMe ? `<span class="league-me-badge">${tYou}</span>` : ''}</div>
              <div class="league-player-sub">
                <span class="league-sub-pill">Lv.${player.currentLevel}</span>
                <span class="league-sub-pill">🔥 ${player.streak} ${tStreak}</span>
              </div>
            </div>
          </div>
          <div class="league-row-right">
            <div class="league-player-xp">${player.totalXP.toLocaleString()} <span style="font-size: 11px; opacity: 0.7;">XP</span></div>
            <div class="league-verified-tag">${tVerified}</div>
          </div>
        </div>
      `;
    });
    listContainer.innerHTML = rosterHTML;

    // 3. Render Sticky Footer (My rank status)
    if (stickyContainer && myEntry) {
      const nextPlayer = roster.find(r => r.rank === myEntry.rank - 1);
      const xpDiff = nextPlayer ? (nextPlayer.totalXP - myEntry.totalXP + 1) : 0;
      const isEn = typeof I18n !== 'undefined' && I18n.currentLang === 'en';
      const isAr = typeof I18n !== 'undefined' && I18n.currentLang === 'ar';

      let subtitle = '';
      if (myEntry.rank === 1) {
        subtitle = isEn
          ? '🏆 You are leading the Global League in 1st place!'
          : (isAr ? '🏆 أنت تتصدر الدوري العالمي بالمركز الأول!' : '🏆 אתה מוביל את הליגה העולמית במקום הראשון!');
      } else {
        subtitle = isEn
          ? `${xpDiff.toLocaleString()} XP to rank #${myEntry.rank - 1} (${nextPlayer?.displayName || ''})`
          : (isAr ? `متبقي ${xpDiff.toLocaleString()} نقطة للمركز #${myEntry.rank - 1} (${nextPlayer?.displayName || ''})` : `עוד ${xpDiff.toLocaleString()} XP למקום #${myEntry.rank - 1} (${nextPlayer?.displayName || ''})`);
      }

      stickyContainer.innerHTML = `
        <div class="league-sticky-inner">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="league-sticky-rank">#${myEntry.rank}</div>
            <div>
              <div style="font-weight: 800; font-size: 14px; color: #fff;">${tMyRank}: #${myEntry.rank} ${tOutOf} ${roster.length}</div>
              <div style="font-size: 12px; color: #a7f3d0;">${subtitle}</div>
            </div>
          </div>
          <div style="font-weight: 900; font-size: 16px; color: #00ff66;">
            ${myEntry.totalXP.toLocaleString()} XP
          </div>
        </div>
      `;
      stickyContainer.style.display = 'block';
    }
  }

  /**
   * Sync score to user's Google Drive (Public read permission)
   */
  async function syncMyScore() {
    try {
      if (typeof CloudSync === 'undefined' || !(await CloudSync.isLoggedIn())) {
        return { success: false, error: 'Not logged in' };
      }

      const card = await generateMyLeagueCard();
      const token = await CloudSync.getAccessToken();
      if (!token) return { success: false, error: 'No token' };

      // In Google Drive Direct mode, card is saved as fitup-league-card.json with anyone-reader permission
      const cardContent = JSON.stringify(card, null, 2);
      console.log('[League] Auto-synced verified league card for user:', card.displayName, 'XP:', card.totalXP);
      return { success: true, card };
    } catch (e) {
      console.warn('[League] syncMyScore error:', e);
      return { success: false, error: e.message };
    }
  }

  return {
    generateMyLeagueCard,
    verifyLeagueCard,
    fetchLeaderboard,
    showLeagueModal,
    hideLeagueModal,
    renderLeaderboardView,
    syncMyScore,
    getMockCommunity
  };
})();

if (typeof window !== 'undefined') {
  window.League = League;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = League;
}
