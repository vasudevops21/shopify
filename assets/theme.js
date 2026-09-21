/* Vasthi Couture — core theme interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initAnnouncementBar();
    initQuantityInputs();
    initVariantPickers();
    initWishlist();
    initSizeGuide();
    initSearchToggle();
    initFacetsDrawer();
    initSortSelect();
    initProductGallery();
  });

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* Money formatting — mirrors Shopify's money_format setting so amounts
     rendered client-side (variant switch, wishlist) match server-rendered
     `| money` output rather than a hard-coded currency symbol. */
  function formatMoney(cents) {
    var format = (window.theme && window.theme.moneyFormat) || '₹{{amount}}';
    var value = (cents / 100).toFixed(2);
    var placeholder = /\{\{\s*(\w+)\s*\}\}/;
    var match = format.match(placeholder);
    if (!match) return format;
    var amount;
    switch (match[1]) {
      case 'amount_no_decimals':
        amount = Math.round(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        break;
      case 'amount_with_comma_separator':
        amount = value.replace('.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        amount = Math.round(cents / 100).toString();
        break;
      default:
        amount = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return format.replace(placeholder, amount);
  }

  /* Mobile nav
     ---------------------------------------------------------------- */
  function initMobileNav() {
    var openBtn = qs('[data-open-mobile-nav]');
    var closeBtn = qs('[data-close-mobile-nav]');
    var nav = qs('[data-mobile-nav]');
    if (!openBtn || !nav) return;
    openBtn.addEventListener('click', function () {
      nav.hidden = false;
      document.body.style.overflow = 'hidden';
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        nav.hidden = true;
        document.body.style.overflow = '';
      });
    }
  }

  /* Announcement bar rotation
     ---------------------------------------------------------------- */
  function initAnnouncementBar() {
    var bar = qs('.announcement-bar');
    if (!bar) return;
    var items = qsa('.announcement-bar__item', bar);
    if (items.length < 2) return;
    var speed = parseInt(bar.getAttribute('data-autoplay'), 10);
    if (!speed) return;
    var index = 0;
    setInterval(function () {
      items[index].style.display = 'none';
      index = (index + 1) % items.length;
      items[index].style.display = 'flex';
    }, speed * 1000);
  }

  /* Quantity inputs (product page)
     ---------------------------------------------------------------- */
  function initQuantityInputs() {
    qsa('.quantity-input').forEach(function (wrapper) {
      var field = qs('[data-quantity-field]', wrapper);
      if (!field) return;
      var dec = qs('[data-quantity-decrease]', wrapper);
      var inc = qs('[data-quantity-increase]', wrapper);
      dec && dec.addEventListener('click', function () {
        var val = Math.max(parseInt(field.min || 1, 10), (parseInt(field.value, 10) || 1) - 1);
        field.value = val;
        field.dispatchEvent(new Event('change'));
      });
      inc && inc.addEventListener('click', function () {
        field.value = (parseInt(field.value, 10) || 1) + 1;
        field.dispatchEvent(new Event('change'));
      });
    });
  }

  /* Variant picker
     ---------------------------------------------------------------- */
  function initVariantPickers() {
    qsa('variant-picker').forEach(function (picker) {
      var variantsJson = qs('[data-variant-json]', picker);
      if (!variantsJson) return;
      var variants;
      try { variants = JSON.parse(variantsJson.textContent); } catch (e) { return; }

      var form = picker.closest('form');
      var idInput = form ? qs('[data-product-variant-id]', form) : null;
      var priceWrapper = qs('[data-product-price]');
      var addBtn = form ? qs('[data-add-to-cart]', form) : null;
      var addBtnText = addBtn ? qs('[data-add-to-cart-text]', addBtn) : null;

      function getSelectedOptions() {
        var groups = qsa('.variant-picker__option', picker);
        return groups.map(function (group) {
          var checked = qs('.variant-picker__radio:checked', group);
          return checked ? checked.value : null;
        });
      }

      function findMatchingVariant() {
        var selected = getSelectedOptions();
        return variants.find(function (v) {
          var opts = [v.option1, v.option2, v.option3].filter(function (o) { return o !== null && o !== undefined; });
          return selected.every(function (val, i) { return val === null || opts[i] === val; });
        });
      }

      function updateAvailability() {
        var groups = qsa('.variant-picker__option', picker);
        groups.forEach(function (group, groupIndex) {
          qsa('.variant-picker__pill', group).forEach(function (label) {
            var input = qs('#' + label.getAttribute('for'));
            var value = input.value;
            var otherSelections = getSelectedOptions();
            otherSelections[groupIndex] = value;
            var hasAvailable = variants.some(function (v) {
              var opts = [v.option1, v.option2, v.option3].filter(function (o) { return o !== null && o !== undefined; });
              return otherSelections.every(function (val, i) { return val === null || opts[i] === val; }) && v.available;
            });
            label.classList.toggle('is-disabled', !hasAvailable);
          });
        });
      }

      function onChange() {
        var match = findMatchingVariant();
        updateAvailability();
        if (!match) return;
        if (idInput) idInput.value = match.id;
        if (priceWrapper) {
          renderPrice(priceWrapper, match);
        }
        if (addBtn) {
          addBtn.disabled = !match.available;
          if (addBtnText) addBtnText.textContent = match.available ? addBtnText.getAttribute('data-add-label') || 'Add to Cart' : 'Sold Out';
        }
      }

      qsa('.variant-picker__radio', picker).forEach(function (radio) {
        radio.addEventListener('change', onChange);
      });

      updateAvailability();
    });
  }

  function renderPrice(wrapper, variant) {
    var onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
    var money = formatMoney;
    if (onSale) {
      var percent = Math.round(((variant.compare_at_price - variant.price) / variant.compare_at_price) * 100);
      wrapper.innerHTML =
        '<div class="price price--on-sale">' +
        '<span class="price__mrp"><s class="price__compare-at">' + money(variant.compare_at_price) + '</s></span>' +
        '<span class="price__sale">' + money(variant.price) + '</span>' +
        (percent > 0 ? '<span class="price__discount-badge">' + percent + '% OFF</span>' : '') +
        '</div>';
    } else {
      wrapper.innerHTML = '<div class="price"><span class="price__sale price__sale--only">' + money(variant.price) + '</span></div>';
    }
  }

  /* Wishlist (localStorage, keyed by product handle) — Shopify has no
     native wishlist primitive, so this uses the browser's storage and
     the storefront's own AJAX product endpoints (no external service). */
  var WISHLIST_KEY = 'vasthi_wishlist';

  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; } catch (e) { return []; }
  }
  function saveWishlist(list) {
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function updateWishlistBadge() {
    var badge = qs('[data-wishlist-badge]');
    if (!badge) return;
    var count = getWishlist().length;
    badge.textContent = count;
    badge.hidden = count === 0;
  }

  function initWishlist() {
    updateWishlistBadge();
    qsa('[data-wishlist-toggle]').forEach(function (btn) {
      var card = btn.closest('[data-product-card]') || btn.closest('.product-page__info');
      var link = card ? qs('a[href*="/products/"]', card) : null;
      var handle = link ? link.getAttribute('href').split('/products/')[1].split('?')[0].split('#')[0] : null;
      if (!handle) return;
      var list = getWishlist();
      var isActive = list.indexOf(handle) > -1;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive);

      btn.addEventListener('click', function () {
        var current = getWishlist();
        var idx = current.indexOf(handle);
        if (idx > -1) {
          current.splice(idx, 1);
          btn.classList.remove('is-active');
          btn.setAttribute('aria-pressed', 'false');
        } else {
          current.push(handle);
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');
        }
        saveWishlist(current);
        updateWishlistBadge();
      });
    });

    renderWishlistPage();
  }

  function renderWishlistPage() {
    var grid = qs('[data-wishlist-grid]');
    if (!grid) return;
    var emptyMsg = qs('[data-wishlist-empty]');
    var handles = getWishlist();
    if (handles.length === 0) {
      if (emptyMsg) emptyMsg.hidden = false;
      return;
    }
    handles.forEach(function (handle) {
      fetch('/products/' + handle + '.js')
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (product) {
          if (!product) return;
          grid.appendChild(buildWishlistCard(product, handle));
        })
        .catch(function () {});
    });
  }

  function buildWishlistCard(product, handle) {
    var money = formatMoney;
    var wrapper = document.createElement('div');
    wrapper.className = 'product-card';
    var img = product.featured_image || (product.images && product.images[0]) || '';
    var onSale = product.compare_at_price && product.compare_at_price > product.price;
    wrapper.innerHTML =
      '<a href="/products/' + handle + '" class="product-card__media-link">' +
      '<div class="product-card__media"><img src="' + img + '" alt="' + (product.title || '') + '" class="product-card__image product-card__image--main" loading="lazy"></div>' +
      '</a>' +
      '<button type="button" class="product-card__wishlist is-active" data-wishlist-remove="' + handle + '">&times;</button>' +
      '<div class="product-card__info">' +
      '<h3 class="product-card__title"><a href="/products/' + handle + '">' + product.title + '</a></h3>' +
      '<div class="price">' +
      (onSale ? '<s class="price__compare-at">' + money(product.compare_at_price) + '</s>' : '') +
      '<span class="price__sale">' + money(product.price) + '</span>' +
      '</div></div>';
    var removeBtn = qs('[data-wishlist-remove]', wrapper);
    removeBtn.addEventListener('click', function () {
      var current = getWishlist().filter(function (h) { return h !== handle; });
      saveWishlist(current);
      updateWishlistBadge();
      wrapper.remove();
    });
    return wrapper;
  }

  /* Size guide modal
     ---------------------------------------------------------------- */
  function initSizeGuide() {
    var modal = qs('[data-size-guide-modal]');
    if (!modal) return;
    qsa('[data-open-size-guide]').forEach(function (btn) {
      btn.addEventListener('click', function () { modal.hidden = false; document.body.style.overflow = 'hidden'; });
    });
    qsa('[data-close-size-guide]', modal).forEach(function (btn) {
      btn.addEventListener('click', function () { modal.hidden = true; document.body.style.overflow = ''; });
    });
  }

  /* Search drawer toggle
     ---------------------------------------------------------------- */
  function initSearchToggle() {
    var drawer = qs('#quick-search-drawer');
    if (!drawer) return;
    qsa('[data-open-search]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        drawer.hidden = false;
        document.body.style.overflow = 'hidden';
        var input = qs('[data-predictive-search-input]', drawer);
        if (input) input.focus();
      });
    });
    qsa('[data-close-search]', drawer).forEach(function (btn) {
      btn.addEventListener('click', function () { drawer.hidden = true; document.body.style.overflow = ''; });
    });
  }

  /* Facets drawer (mobile filters)
     ---------------------------------------------------------------- */
  function initFacetsDrawer() {
    var panel = qs('[data-filters-panel]');
    if (!panel) return;
    qsa('[data-open-filters]').forEach(function (btn) {
      btn.addEventListener('click', function () { panel.classList.add('is-open'); });
    });
    qsa('[data-close-filters]', panel).forEach(function (btn) {
      btn.addEventListener('click', function () { panel.classList.remove('is-open'); });
    });
    qsa('[data-facet-checkbox]', panel).forEach(function (box) {
      box.addEventListener('change', function () { qs('#FacetFiltersForm').submit(); });
    });
  }

  function initSortSelect() {
    var select = qs('[data-sort-select]');
    if (!select) return;
    select.addEventListener('change', function () { qs('#FacetFiltersForm').submit(); });
  }

  /* Product page gallery thumbnails
     ---------------------------------------------------------------- */
  function initProductGallery() {
    var gallery = qs('[data-product-gallery]');
    if (!gallery) return;
    qsa('[data-thumb]', gallery).forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var id = thumb.getAttribute('data-media-id');
        qsa('[data-thumb]', gallery).forEach(function (t) { t.classList.toggle('is-active', t === thumb); });
        qsa('.product-page__slide', gallery).forEach(function (slide) {
          slide.classList.toggle('is-active', slide.getAttribute('data-media-id') === id);
        });
      });
    });
  }
})();
