customElements.define(
  'filter-accordion',
  class FilterAccordion extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.details = this.querySelectorAll('details.filter-accordion__item');
      this.filterOptions = this.querySelectorAll('[data-filter]');
      this.applybutton = this.querySelector('button[type="submit"][data-apply]');
      this.clearbutton = this.querySelector('button[data-clear]');
      this.blogGrid = this.closest('section').querySelector('#results-grid');
      this.activeFiltersContainer = this.closest('section').querySelector('[data-filters-active]');
      this.isMobile = window.innerWidth < 768;
      this.filters = [];

      this.setupListeners();
      this.setupActiveFiltersListeners();

      window.addEventListener('resize', this.isMobileCheck.bind(this));
    }

    setupActiveFiltersListeners() {
      if (this.activeFiltersContainer) {
        const removeButtons = this.activeFiltersContainer.querySelectorAll('[data-filter-remove]');
        removeButtons.forEach((button) => {
          const filterItem = button.closest('.active-filters__item');

          if (filterItem) {
            button.addEventListener('click', () => this.removeActiveFilter(filterItem.dataset.value));
          }
        });
      }
    }

    removeActiveFilter(value) {
      this.filters = this.filters.filter((filter) => filter !== value);

      // Update selected state in filter options
      this.filterOptions.forEach((option) => {
        if (option.dataset.value === value) {
          option.classList.remove('selected');
        }
      });

      this.fetchFilteredUrl();
    }

    isMobileCheck() {
      this.isMobile = window.innerWidth < 768;
      this.setupListeners();
    }

    setupListeners() {
      // Gestion des options de filtre
      this.filterOptions.forEach((option) => {
        option.addEventListener('click', this.handleOptionClick.bind(this, option));
      });

      if (!this.isMobile) {
        // Gestion des détails pour l'accessibilité
        this.details.forEach((detail) => {
          detail.addEventListener('toggle', () => {
            detail.setAttribute('aria-expanded', detail.hasAttribute('open') ? 'true' : 'false');
          });

          // Ferme les détails lorsqu'on clique en dehors
          document.addEventListener('click', (event) => {
            if (!event.target.closest('filter-accordion')) {
              detail.removeAttribute('open');
            }
          });

          // Ferme les autres détails lorsqu'un détail est ouvert
          detail.addEventListener('click', () => {
            if (!detail.hasAttribute('open')) {
              this.details.forEach((d) => {
                if (d !== detail) {
                  d.removeAttribute('open');
                }
              });
            }
          });
        });
      } else {
        this.applybutton.addEventListener('click', this.fetchFilteredUrl.bind(this));
        this.clearbutton.addEventListener('click', this.clearFilters.bind(this));
      }
    }

    handleOptionClick(option) {
      option.classList.toggle('selected');

      option.classList.contains('selected')
        ? this.filters.push(option.dataset.value)
        : this.filters.pop(option.dataset.value);

      if (!this.isMobile) {
        this.querySelectorAll('.filter-accordion__content').forEach((loading) => {
          loading.classList.add('loading');
        });
        this.querySelectorAll('.loading-overlay').forEach((loading) => {
          loading.classList.remove('hidden');
        });
        this.fetchFilteredUrl();
      }
    }

    clearFilters() {
      this.filters = [];
      this.filterOptions.forEach((option) => {
        option.classList.remove('selected');
      });

      this.fetchFilteredUrl();
    }

    closeModal() {
      this.querySelector('details-modal').close();
    }

    async fetchFilteredUrl() {
      // Récupération des tags sélectionnés
      const tagString = this.filters.join('+');
      const blogUrl = this.dataset.blogUrl;
      const filteredUrl = tagString ? `${blogUrl}/tagged/${tagString}` : blogUrl;

      // Mise à jour de l'URL sans rechargement
      window.history.replaceState({}, '', filteredUrl);

      this.blogGrid.parentElement.classList.add('loading');

      fetch(filteredUrl)
        .then((response) => response.text())
        .then((responseText) => this.renderHTML(responseText))
        .catch((error) => {
          this.renderNoResults(error);
        })
        .finally(() => {
          this.blogGrid.parentElement.classList.remove('loading');
        });
    }

    renderNoResults(error) {
      console.error('Error fetching filtered results:', error);

      this.blogGrid.innerHTML = `<p>${this.dataset.noResults}</p>`;

      this.scrollToResults();
    }

    renderHTML(responseText) {
      const html = new DOMParser().parseFromString(responseText, 'text/html');
      const results = html.querySelector('#results-grid');
      const activeFilters = html.querySelector('[data-filters-active]');

      if (results) {
        this.blogGrid.innerHTML = results.innerHTML;

        results.classList.contains('no-results')
          ? this.blogGrid.classList.add('no-results')
          : this.blogGrid.classList.remove('no-results');

        results.classList.contains('low-results')
          ? this.blogGrid.classList.add('low-results')
          : this.blogGrid.classList.remove('low-results');
      }

      if (activeFilters && this.activeFiltersContainer) {
        this.activeFiltersContainer.innerHTML = activeFilters.innerHTML;
        this.setupActiveFiltersListeners();
      }

      if (this.isMobile) {
        this.closeModal();
      } else {
        this.scrollToResults();
      }
    }

    scrollToResults() {
      this.querySelectorAll('.filter-accordion__content').forEach((loading) => {
        loading.classList.remove('loading');
      });
      this.querySelectorAll('.loading-overlay').forEach((loading) => {
        loading.classList.add('hidden');
      });

      const resultsTop = this.blogGrid.closest('section').getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: resultsTop, behavior: 'smooth' });
    }
  },
);
