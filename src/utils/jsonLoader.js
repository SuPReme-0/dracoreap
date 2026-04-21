/**
 * Industry-Grade Data Loader v3.1
 * Fetches, caches, and validates the portfolio_data.json file.
 * * Architectual Upgrades:
 * - Promise Caching: Eliminated brittle subscriber arrays. Concurrent calls share the same fetch Promise.
 * - Persistent Fallback: Network failures now properly populate the main data object to ensure Getters work.
 */
class PortfolioDataManager {
  constructor() {
    this.data = null;
    this.fetchPromise = null; // Caches the active network request
    this.error = null;
  }

  /**
   * Fetches the JSON file and caches it.
   * @param {string} url - Path to the JSON file
   * @returns {Promise<Object>} The parsed portfolio data
   */
  async load(url = '/data/portfolio_data.json') {
    // 1. If we already have the data, return it instantly
    if (this.data) return this.data;
    
    // 2. If a fetch is already in progress, return that exact Promise
    // This perfectly handles 50 components calling load() at the exact same time
    if (this.fetchPromise) return this.fetchPromise;

    console.log(`[DataManager] Fetching portfolio data from ${url}...`);

    // 3. Create the fetch Promise and cache it
    this.fetchPromise = (async () => {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const jsonData = await response.json();
        
        if (!jsonData.profile || !jsonData.projects) {
          throw new Error('JSON missing critical fields (profile, projects)');
        }

        this.data = jsonData;
        console.log('[DataManager] Data successfully loaded and cached.');
        return this.data;

      } catch (error) {
        this.error = error;
        console.error('❌ [DataManager] Failed to load portfolio data:', error);
        
        // FIX: Actually assign the fallback data to this.data so getters continue to work
        this.data = this._getFallbackData();
        return this.data;
        
      } finally {
        // Clean up the promise cache once finished (success or fail)
        this.fetchPromise = null;
      }
    })();

    return this.fetchPromise;
  }

  /**
   * Safe Getters for UI Components
   */
  getConfig() {
    return this.data?.config || {};
  }

  getProfile() {
    return this.data?.profile || {};
  }

  getSkills() {
    return this.data?.skills || [];
  }

  getProjects() {
    return this.data?.projects || [];
  }
  
  getFeaturedProjects() {
    const projects = this.getProjects();
    return projects.filter(p => p.status === 'active' || p.status === 'completed');
  }

  getAbout() {
    return this.data?.about || { short: '', full: '', values: [] };
  }

  getSocialLinks() {
    return this.data?.profile?.socials || {};
  }

  /**
   * Failsafe data structure if the network request blocks
   * @private
   */
  _getFallbackData() {
    return {
      config: { theme: 'dark_fantasy' },
      profile: { name: 'Priyanshu Roy', title: 'AI & ML Security Engineer' },
      skills: [],
      projects: [],
      about: { short: 'System Architect.', full: '', values: [] }
    };
  }
}

// Export a single instance to share across the entire app
export const dataManager = new PortfolioDataManager();