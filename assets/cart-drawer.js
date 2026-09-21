/* Vasthi Couture — cart drawer & AJAX cart (Shopify native Cart AJAX API) */
(function () {
  'use strict';

  var drawer, cartCountBadges;

  document.addEventListener('DOMContentLoaded', function () {
    drawer = document.querySelector('[data-cart-drawer]');
    cartCountBadges = document.querySelectorAll('[data-cart-count]');

    bindOpenCart();
    bindCloseCart();
    bindAddToCartForms();
    bindCartQuantityControls();
    bindCartRemoveButtons();
  });

  function bindOpenCart() {
    document.querySelectorAll('[data-open-cart]').forEach(function (btn) {
      btn.addEventListener('click', function () { openDrawer(); });
    });
  }

  function bindCloseCart() {
    if (!drawer) return;
    drawer.querySelectorAll('[data-close-cart]').forEach(function (el) {
      el.addEventListener('click', closeDrawer);
    });
  }

  function openDrawer() {
    if (!drawer) return;
    drawer.hidden = false;
    requestAnimationFrame(function () { drawer.setAttribute('data-open', ''); });
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.removeAttribute('data-open');
    document.body.style.overflow = '';
    setTimeout(function () { drawer.hidden = true; }, 300);
  }

  /* Add to cart — intercepts every /cart/add form (product page + product cards) */
  function bindAddToCartForms() {
    document.querySelectorAll('form[action^="/cart/add"], form[action*="/cart/add"]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var submitBtn = form.querySelector('[type="submit"]');
        var isBuyNow = e.submitter && e.submitter.name === 'checkout';
        if (submitBtn) submitBtn.disabled = true;

        var formData = new FormData(form);

        fetch('/cart/add.js', { method: 'POST', body: formData, headers: { Accept: 'application/json' } })
          .then(function (res) { return res.json(); })
          .then(function () {
            if (isBuyNow) {
              window.location.href = '/checkout';
              return;
            }
            refreshCartDrawer();
            openDrawer();
          })
          .catch(function () {
            form.submit();
          })
          .finally(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
      });
    });
  }

  function refreshCartDrawer() {
    fetch('/?section_id=cart-drawer')
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newDrawer = doc.querySelector('[data-cart-drawer]');
        if (newDrawer && drawer) {
          var wasOpen = drawer.hasAttribute('data-open');
          drawer.innerHTML = newDrawer.innerHTML;
          if (wasOpen) drawer.setAttribute('data-open', '');
          bindCloseCart();
          bindCartQuantityControls();
          bindCartRemoveButtons();
        }
        updateCartCount();
      });
  }

  function updateCartCount() {
    fetch('/cart.js')
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        cartCountBadges.forEach(function (badge) {
          badge.textContent = cart.item_count;
          badge.hidden = cart.item_count === 0;
        });
      });
  }

  function bindCartQuantityControls() {
    var root = drawer || document;
    root.querySelectorAll('[data-cart-quantity-wrapper]').forEach(function (wrapper) {
      var line = wrapper.getAttribute('data-line');
      var valueEl = wrapper.querySelector('[data-cart-quantity-value]');
      var dec = wrapper.querySelector('[data-cart-quantity-decrease]');
      var inc = wrapper.querySelector('[data-cart-quantity-increase]');

      dec && dec.addEventListener('click', function () {
        var qty = Math.max(0, parseInt(valueEl.textContent, 10) - 1);
        changeLineQuantity(line, qty);
      });
      inc && inc.addEventListener('click', function () {
        var qty = parseInt(valueEl.textContent, 10) + 1;
        changeLineQuantity(line, qty);
      });
    });

    document.querySelectorAll('[data-cart-form] [data-cart-quantity-wrapper]').forEach(function (wrapper) {
      var line = wrapper.getAttribute('data-line');
      var valueEl = wrapper.querySelector('[data-cart-quantity-value]');
      var dec = wrapper.querySelector('[data-cart-quantity-decrease]');
      var inc = wrapper.querySelector('[data-cart-quantity-increase]');
      dec && dec.addEventListener('click', function () {
        var qty = Math.max(0, parseInt(valueEl.textContent, 10) - 1);
        changeLineQuantity(line, qty, true);
      });
      inc && inc.addEventListener('click', function () {
        var qty = parseInt(valueEl.textContent, 10) + 1;
        changeLineQuantity(line, qty, true);
      });
    });
  }

  function bindCartRemoveButtons() {
    var root = drawer || document;
    root.querySelectorAll('[data-cart-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        changeLineQuantity(btn.getAttribute('data-line'), 0);
      });
    });
  }

  function changeLineQuantity(line, quantity, isCartPage) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line: line, quantity: quantity })
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        if (isCartPage) {
          window.location.reload();
        } else {
          refreshCartDrawer();
        }
      });
  }
})();
