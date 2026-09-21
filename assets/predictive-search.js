/* Vasthi Couture — predictive search (Shopify native /search/suggest.json) */
(function () {
  'use strict';

  var debounceTimer;

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.querySelector('[data-predictive-search-input]');
    var resultsEl = document.querySelector('[data-predictive-search-results]');
    if (!input || !resultsEl) return;

    input.addEventListener('input', function () {
      var query = input.value.trim();
      clearTimeout(debounceTimer);
      if (query.length < 2) {
        resultsEl.innerHTML = '';
        return;
      }
      debounceTimer = setTimeout(function () { performSearch(query, resultsEl); }, 250);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        window.location.href = '/search?q=' + encodeURIComponent(input.value.trim()) + '&type=product';
      }
    });
  });

  function performSearch(query, resultsEl) {
    var url = '/search/suggest.json?q=' + encodeURIComponent(query) +
      '&resources[type]=product,query' +
      '&resources[limit]=8' +
      '&resources[options][fields]=title,product_type,variants.title,vendor,tag';

    fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (res) { return res.json(); })
      .then(function (data) { renderResults(data, query, resultsEl); })
      .catch(function () { resultsEl.innerHTML = ''; });
  }

  function renderResults(data, query, resultsEl) {
    var products = (data.resources && data.resources.results && data.resources.results.products) || [];
    var queries = (data.resources && data.resources.results && data.resources.results.queries) || [];

    if (products.length === 0 && queries.length === 0) {
      resultsEl.innerHTML = '<p class="predictive-search__no-results">No results for "' + escapeHtml(query) + '"</p>';
      return;
    }

    var html = '';

    if (queries.length > 0) {
      html += '<div class="predictive-search__suggestions">';
      queries.slice(0, 5).forEach(function (q) {
        html += '<a class="predictive-search__suggestion" href="/search?q=' + encodeURIComponent(q.text) + '&type=product">' + q.text + '</a>';
      });
      html += '</div>';
    }

    if (products.length > 0) {
      html += '<div class="predictive-search-result-grid">';
      products.forEach(function (product) {
        var onSale = product.compare_at_price_max && product.compare_at_price_max > product.price_max;
        html +=
          '<a href="' + product.url + '" class="product-card predictive-search__product">' +
          '<div class="product-card__media">' +
          (product.featured_image ? '<img src="' + product.featured_image.url + '" alt="' + escapeHtml(product.title) + '" class="product-card__image product-card__image--main" loading="lazy">' : '') +
          '</div>' +
          '<div class="product-card__info">' +
          '<h3 class="product-card__title">' + escapeHtml(product.title) + '</h3>' +
          '<div class="price">' +
          (onSale ? '<s class="price__compare-at">' + product.compare_at_price_max + '</s>' : '') +
          '<span class="price__sale">' + product.price_max + '</span>' +
          '</div></div></a>';
      });
      html += '</div>';
    }

    resultsEl.innerHTML = html;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
