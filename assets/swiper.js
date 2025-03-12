customElements.define(
  'swiper-slider',
  class SwiperSlider extends HTMLElement {
    constructor() {
      super();
      this.swiper = null;
      this.config = null;
      this.thumbsSwiper = null;
    }

    debounce(fn, delay = 100) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
    }

    connectedCallback() {
      this.loadConfig();
      this.initSwiper();

      this.debouncedResizeHandler = this.debounce(this.handleResize.bind(this), 100);

      window.addEventListener('resize', this.debouncedResizeHandler);
    }

    disconnectedCallback() {
      this.destroySwiper();
      window.removeEventListener('resize', this.debouncedResizeHandler);
    }

    loadConfig() {
      const script = this.querySelector('script[type="application/json"]');
      if (script) {
        try {
          this.config = JSON.parse(script.textContent);
        } catch (e) {
          console.error('Invalid JSON configuration in <swiper-slider>: ', e);
        }
      } else {
        this.config = {};
      }
    }

    initSwiper() {
      const defaultConfig = {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: false,
        draggable: true,
        allowTouchMove: true,
        grabCursor: true,
        mousewheel: {
          forceToAxis: true,
          releaseOnEdges: true,
        },
        keyboard: {
          enabled: true,
        },
      };

      const swiperConfig = {
        ...defaultConfig,
        ...this.config,
      };

      // Check if this swiper should be disabled on desktop
      if (this.dataset.disableBreakpoints && window.innerWidth >= parseInt(this.dataset.disableBreakpoints)) {
        return;
      }

      // Initialize thumbs swiper if thumbs config exists
      if (this.config.thumbs) {
        const thumbsElement = document.querySelector(this.config.thumbs.el);

        if (thumbsElement) {
          const thumbsConfig = {
            watchSlidesProgress: true,
            slideToClickedSlide: true,
            ...(this.config.thumbs.config || {}),
          };

          this.thumbsSwiper = new Swiper(thumbsElement, thumbsConfig);

          swiperConfig.thumbs = {
            swiper: this.thumbsSwiper,
          };
        }
      }

      const containerWidth = this.clientWidth;
      const slidesWidth = this.querySelector('.swiper-wrapper').scrollWidth;

      if (slidesWidth <= containerWidth) {
        //Tous les slides sont visibles, Swiper n'est pas initialisé. On ne lance pas Swiper
        return;
      }

      // Initialize main Swiper
      this.swiper = new Swiper(this, swiperConfig);

      const fractionEl = this.querySelector('.swiper-pagination-fraction');
      if (fractionEl) {
        const updateFraction = () => {
          // Si en mode loop, le nombre total est recalculé en excluant les slides dupliquées
          const current = this.swiper.realIndex + 1;
          fractionEl.textContent = current + ' / ' + this.swiper.slides.length;
        };

        // MàJ dès l'initialisation et à chaque changement de slide
        this.swiper.on('init', updateFraction);
        this.swiper.on('slideChange', updateFraction);
        // Pour forcer la première mise à jour
        updateFraction();
      }
    }

    destroySwiper() {
      if (this.thumbsSwiper) {
        this.thumbsSwiper.destroy(true, true);
        this.thumbsSwiper = null;
      }
      if (this.swiper) {
        this.swiper.destroy(true, true);
        this.swiper = null;
      }
    }

    handleResize() {
      const prevConfig = this.config;
      this.loadConfig();

      // Reinitialize swiper if configuration has changed
      if (
        (this.dataset.disableBreakpoints && window.innerWidth < parseInt(this.dataset.disableBreakpoints)) ||
        this.config.watchOverflow ||
        JSON.stringify(prevConfig) !== JSON.stringify(this.config)
      ) {
        this.destroySwiper();
        this.initSwiper();
      }
    }
  },
);
