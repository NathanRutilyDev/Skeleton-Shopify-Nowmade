class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');
    this.modalContent = this.summaryToggle.nextElementSibling;
    this.shouldCloneToBody = this.hasAttribute('data-clone-to-body');
    this.modalClone = null;

    // Get breakpoint values
    this.breakpointMax = parseInt(this.getAttribute('data-breakpoint-max')) || null;
    this.breakpointMin = parseInt(this.getAttribute('data-breakpoint-min')) || null;

    this.detailsContainer.addEventListener('keyup', (event) => event.code.toUpperCase() === 'ESCAPE' && this.close());
    this.summaryToggle.addEventListener('click', this.onSummaryClick.bind(this));
    this.querySelector('button[type="button"]').addEventListener('click', this.close.bind(this));

    this.summaryToggle.setAttribute('role', 'button');

    // Clean up orphaned modals on page load
    document.addEventListener('shopify:load', this.cleanupOrphanedModals);

    // Handle window resize
    this.boundHandleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.boundHandleResize);
  }

  cleanupOrphanedModals() {
    const orphanedModals = document.querySelectorAll('body > .card__details-modal');
    orphanedModals.forEach((modal) => modal.remove());
  }

  cloneModalToBody() {
    if (!this.shouldCloneToBody || !this.modalContent) return;

    this.modalClone = this.modalContent.cloneNode(true);

    // Add click listener to close button
    this.modalClone.querySelector('button[type="button"]').addEventListener('click', this.close.bind(this));

    // Add change listeners to all inputs in the clone
    this.modalClone.querySelectorAll('input, select, textarea').forEach((clonedInput) => {
      clonedInput.addEventListener('change', () => {
        // Find corresponding input in original modal
        let originalInput;
        if (clonedInput.type === 'radio') {
          // For radio buttons, match both name and value
          originalInput = this.modalContent.querySelector(`[name="${clonedInput.name}"][value="${clonedInput.value}"]`);
        } else {
          // For other inputs, match just the name
          originalInput = this.modalContent.querySelector(`[name="${clonedInput.name}"]`);
        }

        if (originalInput) {
          // Update original input value
          if (clonedInput.type === 'checkbox' || clonedInput.type === 'radio') {
            originalInput.checked = clonedInput.checked;
          } else {
            originalInput.value = clonedInput.value;
          }
          // Trigger change event on original input
          originalInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        // Close the modal after input change
        this.close();
      });
    });

    document.body.appendChild(this.modalClone);

    // Hide original modal
    this.modalContent.style.display = 'none';
  }

  removeCloneFromBody() {
    if (this.modalClone) {
      this.modalClone.remove();
      this.modalClone = null;
      this.modalContent.style.display = '';
    }
  }

  isOpen() {
    return this.detailsContainer.hasAttribute('open');
  }

  shouldUseModal() {
    const windowWidth = window.innerWidth;

    if (this.breakpointMax && windowWidth > this.breakpointMax) return false;
    if (this.breakpointMin && windowWidth < this.breakpointMin) return false;
    return true;
  }

  handleResize() {
    if (this.isOpen()) {
      if (!this.shouldUseModal()) {
        // Remove modal behavior but keep details open
        document.body.classList.remove('overflow-hidden');
        if (this.modalClone) {
          this.removeCloneFromBody();
        }
      } else if (!this.modalClone && this.shouldCloneToBody) {
        // Restore modal behavior
        document.body.classList.add('overflow-hidden');
        this.cloneModalToBody();
      }
    }
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open') ? this.close() : this.open(event);
  }

  onBodyClick(event) {
    if (!this.shouldUseModal()) return;

    if (event.target.classList.contains('modal-overlay') || event.target.getAttribute('aria-modal') === 'true') {
      this.close(false);
      return;
    }

    const clickedInOriginalModal = this.contains(event.target);
    const clickedInClonedModal = this.modalClone && this.modalClone.contains(event.target);

    if (!clickedInOriginalModal && !clickedInClonedModal) {
      this.close(false);
    }
  }

  open(event) {
    event.target.closest('details').setAttribute('open', true);

    if (this.shouldUseModal()) {
      this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);
      document.body.addEventListener('click', this.onBodyClickEvent);
      document.body.classList.add('overflow-hidden');

      if (this.shouldCloneToBody) {
        this.cloneModalToBody();
      }

      if (
        this.detailsContainer.querySelector('[tabindex="-1"]') &&
        this.detailsContainer.querySelector('input:not([type="hidden"]')
      ) {
        trapFocus(
          this.detailsContainer.querySelector('[tabindex="-1"]'),
          this.detailsContainer.querySelector('input:not([type="hidden"])'),
        );
      }
    }
  }

  close(focusToggle = true, scrollToElement = null) {
    if (this.shouldUseModal()) {
      removeTrapFocus(focusToggle ? this.summaryToggle : null);
      document.body.removeEventListener('click', this.onBodyClickEvent);
      document.body.classList.remove('overflow-hidden');

      if (this.shouldCloneToBody) {
        this.removeCloneFromBody();
      }
    }

    this.detailsContainer.removeAttribute('open');

    if (scrollToElement) {
      document.querySelector(scrollToElement).scrollIntoView({ behavior: 'smooth' });
    }
  }

  disconnectedCallback() {
    this.removeCloneFromBody();
    document.removeEventListener('shopify:load', this.cleanupOrphanedModals);
  }
}

customElements.define('details-modal', DetailsModal);
