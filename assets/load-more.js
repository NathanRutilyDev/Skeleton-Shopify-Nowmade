if (!customElements.get('load-more-button')) {
  customElements.define(
    'load-more-button',
    class LoadMoreButton extends HTMLElement {
      constructor() {
        super();
        this.currentPage = parseInt(this.dataset.currentPage);
        this.totalPages = parseInt(this.dataset.totalPages);
        this.nextUrl = this.dataset.nextUrl;

        this.addEventListener('click', () => this.loadMore());
      }

      async loadMore() {
        if (this.currentPage >= this.totalPages) return;

        this.querySelector('.loading__spinner').classList.remove('hidden');
        this.setAttribute('disabled', 'true');
        this.classList.add('loading');

        try {
          const response = await fetch(this.nextUrl);
          if (!response.ok) throw new Error('Failed to load more products');

          const html = await response.text();
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;

          const newContent = tempDiv.querySelector('#results-grid');

          if (newContent) {
            document.querySelector('#results-grid').append(...newContent.children);
          } else {
            throw new Error('No new content found');
          }

          this.currentPage += 1;
          this.nextUrl = this.nextUrl.replace(/page=\d+/, `page=${this.currentPage + 1}`);

          if (this.currentPage >= this.totalPages) {
            this.remove();
          }
        } catch (error) {
          console.error(error);
        } finally {
          this.querySelector('.loading__spinner').classList.add('hidden');
          this.removeAttribute('disabled');
          this.classList.remove('loading');
        }
      }
    },
  );
}
