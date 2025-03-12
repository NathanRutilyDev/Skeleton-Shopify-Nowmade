class ArticleSummary extends HTMLElement {
  constructor() {
    super();
    this.content = null;
    this.summaryElement = null;
    this.maxHeaderLevel = 0;
    this.minTitlesRequired = 0;
  }

  connectedCallback() {
    this.initialize();
    if (!this.shouldCreateSummary()) return;

    this.createSummary();
    this.setupScrollBehavior();
  }

  initialize() {
    this.maxHeaderLevel = parseInt(this.dataset.hn.replace('h', '')) || 6;
    this.minTitlesRequired = parseInt(this.dataset.limit) || 1;
    this.content = this.closest('article')?.querySelector('.main-article');
    this.summaryElement = this.querySelector('.main-article__summary--title');
  }

  shouldCreateSummary() {
    if (!this.content || !this.summaryElement) return false;

    const totalHeaders = this.countHeaders();
    if (totalHeaders < this.minTitlesRequired) {
      this.summaryElement.classList.add('hide');
      return false;
    }

    return true;
  }

  countHeaders() {
    let count = 0;
    for (let i = 2; i <= this.maxHeaderLevel; i++) {
      count += this.content.querySelectorAll(`h${i}`).length;
    }
    return count;
  }

  createSummary() {
    const ul = document.createElement('ul');
    ul.classList.add('main-article__summary--list');
    const toc = this.generateTableOfContents();

    ul.innerHTML = toc;
    this.appendChild(ul);
  }

  findAllHeaders() {
    const headers = [];
    for (let i = 2; i <= this.maxHeaderLevel; i++) {
      const elements = this.content.querySelectorAll(`h${i}`);
      elements.forEach((header) => {
        headers.push({
          element: header,
          level: parseInt(header.tagName.substring(1)),
          text: header.textContent.trim(),
        });
      });
    }
    return headers.sort((a, b) => {
      return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }

  generateTableOfContents() {
    const headers = this.findAllHeaders();
    if (headers.length === 0) return '';

    let toc = '';
    let currentLevel = 2;
    let isFirstItem = true;

    headers.forEach((header, index) => {
      const headerText = header.text;
      if (!headerText) return;

      const anchor = `toc-${index}`;

      // Add unique ID to the header
      header.element.id = anchor;

      // Handle list structure
      if (!isFirstItem) {
        if (header.level > currentLevel) {
          toc += '<ul>'.repeat(header.level - currentLevel);
        } else if (header.level < currentLevel) {
          toc += '</li></ul>'.repeat(currentLevel - header.level) + '</li>';
        } else {
          toc += '</li>';
        }
      }

      // Add the new item
      toc += `<li><a href="#${anchor}">${headerText}</a>`;

      currentLevel = header.level;
      isFirstItem = false;
    });

    // Close any remaining lists
    if (!isFirstItem && currentLevel >= 2) {
      toc += '</li>' + '</ul>'.repeat(currentLevel - 2) + '</li>';
    }

    return toc;
  }

  setupScrollBehavior() {
    const headerHeight = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '0',
    );

    this.summaryElement.querySelectorAll("a[href*='#']:not([href='#'])").forEach((link) => {
      link.addEventListener('click', (event) => this.handleAnchorClick(event, headerHeight));
    });
  }

  handleAnchorClick(event, headerHeight) {
    event.preventDefault();

    const link = event.currentTarget;
    if (!this.isSamePageLink(link)) return;

    const targetElement = document.querySelector(link.hash);
    if (!targetElement) return;

    this.scrollToElement(targetElement, headerHeight);
  }

  isSamePageLink(link) {
    return (
      location.hostname === link.hostname && link.pathname.replace(/^\//, '') === location.pathname.replace(/^\//, '')
    );
  }

  scrollToElement(element, headerHeight) {
    const rect = element.getBoundingClientRect();
    const offsetTop = rect.top + window.pageYOffset - headerHeight;

    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth',
    });
  }
}

customElements.define('article-summary', ArticleSummary);
