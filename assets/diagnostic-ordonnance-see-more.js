/**
 * Classe pour gérer la liste des produits d'ordonnance et leurs interactions
 */
class OrdonnanceProductList extends HTMLElement {
  // Sélecteurs CSS constants
  static selectors = {
    addToCartButton: 'button[type="submit"].ordonnance__submit',
    selectedProductsContainers: '[data-added-products-result]',
    addedProductContainers: '[data-added-products]',
    totalContainers: '[data-bundle-total]',
    countContainers: '[data-bundle-count]',
    addButton: '[data-add-product]',
    addAllButton: '[data-add-all-products]',
    productInfo: '[data-product-info]',
    removeProduct: '[data-remove-product]',
    productTemplate: 'template',
    errorMessageWrapper: '.product-form__error-message-wrapper',
    errorMessage: '.product-form__error-message',
  };

  // Clé de stockage local
  static STORAGE_KEY = 'selectedProducts';

  constructor() {
    super();
    this.selectedProducts = this.loadSelectedProducts();
    this.initializeElements();
    this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
    this.hideErrors = this.dataset.hideErrors === 'true';
    this.error = false;
  }

  /**
   * Charge les produits sélectionnés depuis le stockage local
   */
  loadSelectedProducts() {
    try {
      return JSON.parse(localStorage.getItem(OrdonnanceProductList.STORAGE_KEY)) || [];
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      return [];
    }
  }

  /**
   * Initialise les éléments DOM nécessaires
   */
  initializeElements() {
    const { selectors } = OrdonnanceProductList;
    this.addToCartButtons = this.querySelectorAll(selectors.addToCartButton);
    this.selectedProductsContainers = this.querySelectorAll(selectors.selectedProductsContainers);
    this.addedProductContainers = this.querySelectorAll(selectors.addedProductContainers);
    this.totalContainers = this.querySelectorAll(selectors.totalContainers);
    this.countContainers = this.querySelectorAll(selectors.countContainers);
    this.addProductButtons = this.querySelectorAll(selectors.addButton);
    this.addAllButtons = this.querySelectorAll(selectors.addAllButton);
    this.errorMessageWrapper = this.querySelector(selectors.errorMessageWrapper);
    this.errorMessage = this.querySelector(selectors.errorMessage);
  }

  /**
   * Callback appelé lorsque l'élément est connecté au DOM
   */
  connectedCallback() {
    if (!this.selectedProductsContainers) {
      console.error('Containers des produits sélectionnés non trouvé');
      return;
    }

    this.renderSelectedProducts();
    this.updateTotalPrice();
    this.setupEventListeners();
  }

  /**
   * Configure les écouteurs d'événements
   */
  setupEventListeners() {
    const { selectors } = OrdonnanceProductList;

    // Gestion des boutons d'ajout individuels
    this.querySelectorAll(selectors.addButton).forEach((button) => {
      button.addEventListener('click', () => this.addProductToSelection(button));
    });

    // Gestion des boutons "Ajouter tout"
    this.addAllButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.dataset.addAllProducts === 'true') {
          // Si tous les produits sont ajoutés, on les retire tous
          this.selectedProducts = [];
          this.saveSelectedProducts();
        } else {
          // Sinon on ajoute tous les produits disponibles
          this.querySelectorAll(selectors.addButton).forEach((addButton) => {
            if (!addButton.hasAttribute('disabled') && !addButton.classList.contains('added')) {
              this.addProductToSelection(addButton);
            }
          });
        }
        this.renderSelectedProducts();
        this.updateTotalPrice();
        this.updateAddAllButtonState();
      });
    });

    this.querySelectorAll(selectors.addToCartButton).forEach((button) => {
      button.addEventListener('click', (evt) => {
        evt.preventDefault();
        if (button.getAttribute('aria-disabled') === 'true') return;
        this.addToCart(button);
      });
    });
  }

  /**
   * Vérifie si tous les produits disponibles sont ajoutés
   */
  areAllAvailableProductsAdded() {
    const availableButtons = Array.from(this.addProductButtons).filter((button) => !button.hasAttribute('disabled'));
    return availableButtons.every((button) => button.classList.contains('added'));
  }

  /**
   * Met à jour l'état du bouton "Ajouter tout"
   */
  updateAddAllButtonState() {
    const allProductsAdded = this.areAllAvailableProductsAdded();
    this.addAllButtons.forEach((button) => {
      button.dataset.addAllProducts = allProductsAdded.toString();

      if (allProductsAdded) {
        button.classList.remove('button--primary');
        button.classList.add('button--secondary');
      } else {
        button.classList.remove('button--secondary');
        button.classList.add('button--primary');
      }
    });
  }

  /**
   * Affiche les produits sélectionnés
   */
  renderSelectedProducts() {
    if (!this.selectedProductsContainers) return;

    this.selectedProductsContainers.forEach((container) => {
      container.innerHTML = '';
    });

    this.selectedProducts.forEach((product) => {
      const productElement = this.querySelector(`.ordonnance__phase__product[data-variant-id="${product.variantId}"]`);
      if (!productElement) return;

      const template = productElement.querySelector(OrdonnanceProductList.selectors.productTemplate);
      if (!template) return;

      // Pour chaque conteneur, on crée un clone distinct
      this.selectedProductsContainers.forEach((container) => {
        const productContentClone = template.content.cloneNode(true);
        const removeButton = productContentClone.querySelector(OrdonnanceProductList.selectors.removeProduct);

        if (removeButton) {
          removeButton.addEventListener('click', () => this.removeProduct(product.variantId));
        }

        container.appendChild(productContentClone);
      });
    });

    this.updateButtonStates();
    this.updateProductsAddedContainers();
    this.updateSelectedProductsTitleVisibility();
    this.updateAddAllButtonState();
  }

  /**
   * Supprime un produit de la sélection
   */
  removeProduct(variantId) {
    this.selectedProducts = this.selectedProducts.filter((p) => p.variantId !== variantId);
    this.saveSelectedProducts();

    this.renderSelectedProducts();
    this.updateTotalPrice();
    this.updateButtonStates();
    this.updateProductsAddedContainers();
    this.updateSelectedProductsTitleVisibility();
    this.updateAddAllButtonState();
  }

  /**
   * Ajoute ou retire un produit de la sélection
   */
  addProductToSelection(element) {
    const variantId = element.dataset.variantId;
    if (!variantId) return;

    // Si le produit est déjà sélectionné, on le retire
    if (element.classList.contains('added')) {
      this.removeProduct(variantId);
      return;
    }

    // Sinon, on l'ajoute
    const productContainer = element.closest('.ordonnance__content');
    if (!productContainer) return;

    const productInfoElement = productContainer.querySelector(OrdonnanceProductList.selectors.productInfo);
    if (!productInfoElement) {
      console.error('Élément productInfo non trouvé');
      return;
    }

    try {
      const productData = JSON.parse(productInfoElement.textContent);
      this.selectedProducts.push(productData);
      this.saveSelectedProducts();

      this.renderSelectedProducts();
      this.updateTotalPrice();
      this.updateButtonStates();
      this.updateProductsAddedContainers();
      this.updateAddAllButtonState();
    } catch (error) {
      console.error("Erreur lors de l'ajout du produit:", error);
      this.handleErrorMessage("Erreur lors de l'ajout du produit");
    }
  }

  /**
   * Sauvegarde les produits sélectionnés dans le stockage local
   */
  saveSelectedProducts() {
    try {
      localStorage.setItem(OrdonnanceProductList.STORAGE_KEY, JSON.stringify(this.selectedProducts));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des produits:', error);
    }
  }

  /**
   * Met à jour l'état des boutons
   */
  updateButtonStates() {
    this.addProductButtons.forEach((button) => {
      const variantId = button.dataset.variantId;

      this.selectedProducts.some((p) => p.variantId === variantId)
        ? button.classList.add('added')
        : button.classList.remove('added');
    });
  }

  /**
   * Met à jour le prix total
   */
  updateTotalPrice() {
    const totalPrice = this.selectedProducts.reduce((sum, product) => {
      const price = parseFloat(product.price.replace(/[^\d.-]/g, '')) || 0;
      return sum + price / 100;
    }, 0);

    const formattedPrice =
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(totalPrice) + '€';

    this.totalContainers.forEach((element) => {
      element.textContent = formattedPrice;
    });

    this.countContainers.forEach((element) => {
      element.textContent = this.selectedProducts.length;
    });
  }

  /**
   * Met à jour la visibilité du titre des produits sélectionnés
   */
  updateSelectedProductsTitleVisibility() {
    this.addedProductContainers.forEach((element) => {
      element.dataset.addedProducts = this.selectedProducts.length ? 'true' : 'false';
    });
  }

  /**
   * Met à jour les conteneurs de produits ajoutés
   */
  updateProductsAddedContainers() {
    this.addedProductContainers.forEach((container) => {
      container.dataset.addedProducts = this.selectedProducts.length > 0 ? 'true' : 'false';
    });

    this.addToCartButtons.forEach((button) => {
      this.selectedProducts.length === 0 ? button.setAttribute('disabled', '') : button.removeAttribute('disabled');
    });
  }

  /**
   * Gère l'affichage des messages d'erreur
   */
  handleErrorMessage(errorMessage = false) {
    if (this.hideErrors) return;
    if (!this.errorMessageWrapper) return;

    this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);
    if (errorMessage && this.errorMessage) {
      this.errorMessage.textContent = errorMessage;
    }
  }

  /**
   * Met à jour l'état du bouton de soumission
   */
  toggleSubmitButton(button, disable = true, text = null) {
    if (disable) {
      button.setAttribute('aria-disabled', 'true');
      button.classList.add('loading');
      button.querySelector('.loading__spinner').classList.remove('hidden');
    } else {
      button.removeAttribute('aria-disabled');
      button.classList.remove('loading');
      button.querySelector('.loading__spinner').classList.add('hidden');
    }
  }

  /**
   * Ajoute les produits sélectionnés au panier
   */
  async addToCart(submitButton) {
    if (this.selectedProducts.length === 0) return;

    this.handleErrorMessage();

    this.addToCartButtons.forEach((button) => {
      this.toggleSubmitButton(button, true);
    });

    const formData = new FormData();

    // Ajout des produits
    this.selectedProducts.forEach((product, index) => {
      formData.append(`items[${index}][id]`, product.variantId);
      formData.append(`items[${index}][quantity]`, '1');
      formData.append(`items[${index}][properties][Ordonnance]`, this.dataset.ordonnanceName);
    });

    // Ajout des sections pour le cart-drawer
    if (this.cart) {
      formData.append(
        'sections',
        this.cart.getSectionsToRender().map((section) => section.id),
      );
      formData.append('sections_url', window.location.pathname);
      this.cart.setActiveElement(document.activeElement);
    }

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.description || "Erreur lors de l'ajout au panier");
      }

      if (!this.cart) {
        window.location = window.routes.cart_url;
        return;
      }

      // Publication de l'événement de mise à jour du panier
      if (!this.error) {
        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'ordonnance-product-list',
          cartData: data,
        });
      }

      this.error = false;
      this.cart.renderContents(data);

      // Réinitialisation
      localStorage.removeItem(OrdonnanceProductList.STORAGE_KEY);
      this.selectedProducts = [];
      this.renderSelectedProducts();
      this.updateTotalPrice();
    } catch (error) {
      console.error("Erreur lors de l'ajout au panier:", error);
      this.error = true;

      this.handleErrorMessage(error.message);

      publish(PUB_SUB_EVENTS.cartError, {
        source: 'ordonnance-product-list',
        errors: error.message,
      });
    } finally {
      this.addToCartButtons.forEach((button) => {
        this.toggleSubmitButton(button, false);
      });

      if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
    }
  }
}

// Enregistrement du composant personnalisé
customElements.define('ordonnance-product-list', OrdonnanceProductList);
