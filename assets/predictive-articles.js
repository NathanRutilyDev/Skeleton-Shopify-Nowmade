customElements.define(
  'predictive-articles',
  class PredictiveArticles extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.searchInput = this.querySelector('input');
      this.resultsContainer = this.querySelector('.search-article__results');
      this.searchContainer = this.querySelector('.search-article__container');
      this.abortController = new AbortController();

      if (this.searchInput) {
        this.setupEventListeners();
      }
    }

    setupEventListeners() {
      this.searchInput.addEventListener('input', this.onSearchInput.bind(this));
      this.querySelector('.icon-search').addEventListener('click', this.onSearchInput.bind(this));

      document.addEventListener('click', (event) => {
        if (!event.target.closest('predictive-articles')) {
          this.resultsContainer.classList.remove('active');
          this.searchContainer.classList.remove('has-results');
        }
      });
    }

    onSearchInput() {
      const searchTerm = this.searchInput.value.trim();

      if (searchTerm.length < 1) {
        this.clearResults();
        return;
      }

      this.fetchSearchResults(searchTerm);
    }

    fetchSearchResults(query) {
      // Annule toute requête précédente
      this.abortController.abort();
      this.abortController = new AbortController();

      const url = `/search/suggest?q=${encodeURIComponent(query)}&resources[type]=article&resources[limit]=10&section_id=predictive-articles`;

      fetch(url, {
        signal: this.abortController.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          return response.text();
        })
        .then((html) => {
          if (html.trim() === '') {
            this.clearResults();
            return;
          }

          this.renderResults(html);
        })
        .catch((error) => {
          if (error.name !== 'AbortError') console.error('Search error:', error);
        });
    }

    renderResults(html) {
      this.resultsContainer.innerHTML = html;
      this.resultsContainer.classList.add('active');
      this.searchContainer.classList.add('has-results');
    }

    clearResults() {
      this.resultsContainer.innerHTML = '';
      this.resultsContainer.classList.remove('active');
      this.searchContainer.classList.remove('has-results');
    }
  },
);
