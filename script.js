/**
 * Истина Зёрен — скрипты сайта
 */

(function () {
  "use strict";

  /* --- Липкая шапка при прокрутке --- */
  var headerWrap = document.getElementById("header-wrap");
  if (headerWrap) {
    var placeholder = document.createElement("div");
    placeholder.className = "header-placeholder";
    headerWrap.parentNode.insertBefore(placeholder, headerWrap.nextSibling);

    var SCROLL_THRESHOLD = 80;

    function updatePlaceholderHeight() {
      placeholder.style.height = headerWrap.offsetHeight + "px";
    }

    function handleScroll() {
      var scrolled = window.scrollY > SCROLL_THRESHOLD;
      headerWrap.classList.toggle("header-wrap--scrolled", scrolled);
      placeholder.classList.toggle("header-placeholder--visible", scrolled);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updatePlaceholderHeight);
    updatePlaceholderHeight();
    handleScroll();
  }

  /* --- Кастомный выбор даты и времени (молочный фон + оранжевый акцент) --- */
  var MONTHS = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  var WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  var HOURS = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
    "20:00", "21:00", "22:00"
  ];

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatDisplay(date, time) {
    if (!date) return "Выберите дату и время";
    var parts = date.split("-");
    var text = parts[2] + "." + parts[1] + "." + parts[0];
    if (time) text += ", " + time;
    return text;
  }

  function initDatetimeField(root) {
    var trigger = root.querySelector(".datetime-field__trigger");
    var popup = root.querySelector(".datetime-field__popup");
    var hidden = root.querySelector(".datetime-field__hidden");
    var valueEl = root.querySelector(".datetime-field__value");
    var monthYearEl = root.querySelector(".datetime-field__month-year");
    var daysEl = root.querySelector(".datetime-field__days");
    var hoursEl = root.querySelector(".datetime-field__hours");
    var prevBtn = root.querySelector(".datetime-field__prev-month");
    var nextBtn = root.querySelector(".datetime-field__next-month");

    var now = new Date();
    var viewYear = now.getFullYear();
    var viewMonth = now.getMonth();
    var selectedDate = "";
    var selectedTime = "";

    function updateHidden() {
      hidden.value = (selectedDate && selectedTime)
        ? selectedDate + "T" + selectedTime
        : "";
      valueEl.textContent = formatDisplay(selectedDate, selectedTime);
    }

    function renderHours() {
      hoursEl.innerHTML = "";
      HOURS.forEach(function (hour) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "datetime-field__hour";
        btn.textContent = hour;
        if (hour === selectedTime) {
          btn.classList.add("datetime-field__hour--selected");
        }
        btn.addEventListener("click", function () {
          selectedTime = hour;
          renderHours();
          updateHidden();
        });
        hoursEl.appendChild(btn);
      });
    }

    function renderCalendar() {
      monthYearEl.textContent = MONTHS[viewMonth] + " " + viewYear;
      daysEl.innerHTML = "";

      var firstDay = new Date(viewYear, viewMonth, 1);
      var startOffset = (firstDay.getDay() + 6) % 7;
      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      var today = new Date();
      today.setHours(0, 0, 0, 0);

      for (var i = 0; i < startOffset; i++) {
        var empty = document.createElement("span");
        empty.className = "datetime-field__day datetime-field__day--empty";
        daysEl.appendChild(empty);
      }

      for (var day = 1; day <= daysInMonth; day++) {
        var cellDate = new Date(viewYear, viewMonth, day);
        var iso = viewYear + "-" + pad(viewMonth + 1) + "-" + pad(day);
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "datetime-field__day";
        btn.textContent = day;

        if (cellDate < today) {
          btn.classList.add("datetime-field__day--disabled");
          btn.disabled = true;
        }
        if (iso === selectedDate) {
          btn.classList.add("datetime-field__day--selected");
        }

        btn.addEventListener("click", function (d, isoDate) {
          return function () {
            selectedDate = isoDate;
            renderCalendar();
            updateHidden();
          };
        }(day, iso));

        daysEl.appendChild(btn);
      }
    }

    prevBtn.addEventListener("click", function () {
      viewMonth -= 1;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      }
      renderCalendar();
    });

    nextBtn.addEventListener("click", function () {
      viewMonth += 1;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      renderCalendar();
    });

    trigger.addEventListener("click", function () {
      var isOpen = root.classList.toggle("datetime-field--open");
      popup.hidden = !isOpen;
    });

    document.addEventListener("click", function (e) {
      if (!root.contains(e.target)) {
        root.classList.remove("datetime-field--open");
        popup.hidden = true;
      }
    });

    renderCalendar();
    renderHours();
    updateHidden();
  }

  document.querySelectorAll("[data-datetime-field]").forEach(initDatetimeField);

  /* --- Корзина --- */
  var CART_KEY = "istina-zern-cart";
  var cartBtn = document.getElementById("cart-btn");
  var cartPanel = document.getElementById("cart-panel");
  var cartList = document.getElementById("cart-list");
  var cartCount = document.getElementById("cart-count");
  var cartEmpty = document.getElementById("cart-empty");
  var cartDivider = document.getElementById("cart-divider");
  var cartTotalRow = document.getElementById("cart-total-row");
  var cartTotal = document.getElementById("cart-total");
  var cartOrderBtn = document.getElementById("cart-order-btn");
  var orderSummaryList = document.getElementById("order-summary-list");
  var orderSummaryEmpty = document.getElementById("order-summary-empty");
  var orderSummaryDivider = document.getElementById("order-summary-divider");
  var orderSummaryTotalRow = document.getElementById("order-summary-total-row");
  var orderSummaryTotal = document.getElementById("order-summary-total");

  function loadCart() {
    try {
      var saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  var cartItems = normalizeCart(loadCart());

  function normalizeCart(raw) {
    if (!raw || !raw.length) return [];
    if (raw[0].qty !== undefined) return raw;

    var grouped = {};
    raw.forEach(function (item) {
      var key = item.name + "|" + item.price;
      if (!grouped[key]) {
        grouped[key] = { name: item.name, price: Number(item.price), qty: 0 };
      }
      grouped[key].qty += 1;
    });
    return Object.keys(grouped).map(function (key) {
      return grouped[key];
    });
  }

  function getTotalCount() {
    return cartItems.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function getTotalSum() {
    return cartItems.reduce(function (sum, item) {
      return sum + item.price * item.qty;
    }, 0);
  }

  function formatPrice(value) {
    return value + " \u20BD";
  }

  function buildItemRowHtml(item, withRemove) {
    var qtyHtml = item.qty > 1
      ? '<span class="cart-panel__multiply">\u00D7</span>' +
        '<span class="cart-panel__qty">' + item.qty + "</span>"
      : "";

    var removeHtml = withRemove
      ? '<button type="button" class="cart-panel__remove" aria-label="Удалить ' + item.name + '">\u2212</button>'
      : "";

    return (
      '<div class="cart-panel__left">' +
        '<span class="cart-panel__name">' + item.name + "</span>" +
        qtyHtml +
      "</div>" +
      '<div class="cart-panel__right">' +
        '<span class="cart-panel__price">' + formatPrice(item.price) + "</span>" +
        removeHtml +
      "</div>"
    );
  }

  function renderCart() {
    if (!cartList) return;

    cartList.innerHTML = "";

    cartItems.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "cart-panel__item";
      li.setAttribute("data-name", item.name);
      li.setAttribute("data-price", item.price);
      li.innerHTML = buildItemRowHtml(item, true);
      cartList.appendChild(li);
    });

    var hasItems = cartItems.length > 0;
    var totalCount = getTotalCount();

    if (cartCount) {
      cartCount.textContent = totalCount;
      cartCount.hidden = !hasItems;
    }
    if (cartEmpty) cartEmpty.hidden = hasItems;
    if (cartDivider) cartDivider.hidden = !hasItems;
    if (cartTotalRow) cartTotalRow.hidden = !hasItems;
    if (cartTotal) cartTotal.textContent = formatPrice(getTotalSum());
    if (cartOrderBtn) cartOrderBtn.hidden = !hasItems;

    renderOrderSummary();
  }

  function renderOrderSummary() {
    if (!orderSummaryList) return;

    orderSummaryList.innerHTML = "";

    cartItems.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "order-summary__item";
      li.innerHTML = buildItemRowHtml(item, false);
      orderSummaryList.appendChild(li);
    });

    var hasItems = cartItems.length > 0;

    if (orderSummaryEmpty) orderSummaryEmpty.hidden = hasItems;
    if (orderSummaryDivider) orderSummaryDivider.hidden = !hasItems;
    if (orderSummaryTotalRow) orderSummaryTotalRow.hidden = !hasItems;
    if (orderSummaryTotal) orderSummaryTotal.textContent = formatPrice(getTotalSum());
  }

  function addToCart(name, price) {
    var numPrice = Number(price);
    var existing = cartItems.find(function (item) {
      return item.name === name && item.price === numPrice;
    });

    if (existing) {
      existing.qty += 1;
    } else {
      cartItems.push({ name: name, price: numPrice, qty: 1 });
    }

    saveCart(cartItems);
    renderCart();
  }

  function removeOneFromCart(name, price) {
    var numPrice = Number(price);

    for (var i = 0; i < cartItems.length; i++) {
      if (cartItems[i].name === name && cartItems[i].price === numPrice) {
        cartItems[i].qty -= 1;
        if (cartItems[i].qty <= 0) {
          cartItems.splice(i, 1);
        }
        break;
      }
    }

    saveCart(cartItems);
    renderCart();
  }

  function toggleCartPanel(forceOpen) {
    if (!cartPanel || !cartBtn) return;
    var open = typeof forceOpen === "boolean"
      ? forceOpen
      : cartPanel.hidden;
    cartPanel.hidden = !open;
    cartBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (cartBtn) {
    cartBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleCartPanel(cartPanel.hidden);
    });
  }

  document.addEventListener("click", function (e) {
    var wrap = document.querySelector(".cart-wrap");
    if (wrap && !wrap.contains(e.target)) {
      toggleCartPanel(false);
    }
  });

  if (cartList) {
    cartList.addEventListener("click", function (e) {
      var removeBtn = e.target.closest(".cart-panel__remove");
      if (!removeBtn) return;

      e.stopPropagation();
      var row = removeBtn.closest(".cart-panel__item");
      if (row) {
        removeOneFromCart(row.getAttribute("data-name"), row.getAttribute("data-price"));
      }
    });
  }

  document.querySelectorAll("[data-cart-item]").forEach(function (card) {
    function handleAdd() {
      var name = card.getAttribute("data-name");
      var price = card.getAttribute("data-price");
      if (name && price) {
        addToCart(name, price);
        card.classList.add("menu-card--added");
        setTimeout(function () {
          card.classList.remove("menu-card--added");
        }, 400);
      }
    }

    card.addEventListener("click", handleAdd);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleAdd();
      }
    });
  });

  renderCart();

  var orderForm = document.querySelector(".order-form");
  if (orderForm) {
    orderForm.addEventListener("submit", function (e) {
      if (!cartItems.length) {
        e.preventDefault();
        if (orderSummaryEmpty) {
          orderSummaryEmpty.hidden = false;
          orderSummaryEmpty.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  }
})();
