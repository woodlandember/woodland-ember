
document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    // =====================================
    // ELEMENTS
    // =====================================

    const cart = new Map();

    const orderItems = document.getElementById("order-items");
    const orderTotal = document.getElementById("order-total");
    const orderForm = document.getElementById("order-form");
    const clearButton = document.getElementById("clear-order");
    const formMessage = document.getElementById("form-message");
    const submitButton = document.getElementById("submit-button");
    const yearElement = document.getElementById("year");

    if (
        !orderItems ||
        !orderTotal ||
        !orderForm ||
        !clearButton ||
        !formMessage ||
        !submitButton
    ) {
        console.error("Woodland Ember: Required page elements are missing.");
        return;
    }

    // =====================================
    // SETTINGS
    // =====================================

    const FORMSPREE_ENDPOINT = "https://formspree.io/f/xkjjezwy";

    const currencyFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    });

    function money(amount) {
        return currencyFormatter.format(amount);
    }

    // =====================================
    // STATUS MESSAGES
    // =====================================

    function showMessage(message, type = "") {

        formMessage.textContent = message;

        formMessage.className = "form-message";

        if (type === "success") {
            formMessage.classList.add("message-success");
        }

        if (type === "error") {
            formMessage.classList.add("message-error");
        }
    }

    // =====================================
    // CREATE ELEMENT HELPER
    // =====================================

    function createElement(tag, className, text = "") {

        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== "") {
            element.textContent = text;
        }

        return element;
    }

    // =====================================
    // RENDER SHOPPING CART
    // =====================================

    function renderCart() {

        orderItems.replaceChildren();

        let total = 0;

        if (cart.size === 0) {

            const emptyMessage = createElement(
                "p",
                "empty-cart",
                "No products added yet. Choose Add to order on a product above."
            );

            orderItems.appendChild(emptyMessage);

        }

        cart.forEach((item, productId) => {

            const lineTotal = item.price * item.quantity;

            total += lineTotal;

            const row = createElement("div", "cart-row");

            // Product name

            const title = createElement(
                "span",
                "",
                item.name
            );

            // Quantity controls

            const controls = createElement(
                "div",
                "qty-control"
            );

            const minus = createElement(
                "button",
                "",
                "−"
            );

            minus.type = "button";

            minus.setAttribute(
                "aria-label",
                `Decrease ${item.name}`
            );

            minus.addEventListener("click", () => {
                changeQuantity(productId, -1);
            });

            const quantity = createElement(
                "span",
                "",
                String(item.quantity)
            );

            const plus = createElement(
                "button",
                "",
                "+"
            );

            plus.type = "button";

            plus.setAttribute(
                "aria-label",
                `Increase ${item.name}`
            );

            plus.addEventListener("click", () => {
                changeQuantity(productId, 1);
            });

            controls.append(minus, quantity, plus);

            // Line price

            const price = createElement(
                "strong",
                "",
                money(lineTotal)
            );

            // Remove button

            const remove = createElement(
                "button",
                "remove-item",
                "×"
            );

            remove.type = "button";

            remove.title = `Remove ${item.name}`;

            remove.setAttribute(
                "aria-label",
                `Remove ${item.name}`
            );

            remove.addEventListener("click", () => {
                removeProduct(productId);
            });

            row.append(
                title,
                controls,
                price,
                remove
            );

            orderItems.appendChild(row);

        });

        orderTotal.textContent = money(total);
    }

    // =====================================
    // CHANGE QUANTITY
    // =====================================

    function changeQuantity(productId, amount) {

        const item = cart.get(productId);

        if (!item) return;

        const newQuantity = item.quantity + amount;

        if (newQuantity <= 0) {

            cart.delete(productId);

        } else if (newQuantity <= 1000) {

            item.quantity = newQuantity;

        } else {

            showMessage(
                "Maximum quantity is 1000 per product.",
                "error"
            );

            return;
        }

        renderCart();

    }

    // =====================================
    // REMOVE PRODUCT
    // =====================================

    function removeProduct(productId) {

        const item = cart.get(productId);

        if (!item) return;

        cart.delete(productId);

        renderCart();

        showMessage(
            `${item.name} removed from your order.`
        );

    }

    // =====================================
    // ADD PRODUCTS
    // =====================================

    document.querySelectorAll(".add-button").forEach(button => {

        button.addEventListener("click", () => {

            const productId = Number(button.dataset.productId);

            const name = button.dataset.product;

            const price = Number(button.dataset.price);

            if (
                !Number.isSafeInteger(productId) ||
                productId < 1 ||
                !name ||
                !Number.isFinite(price) ||
                price < 0
            ) {

                showMessage(
                    "This product has invalid information.",
                    "error"
                );

                return;
            }

            if (!cart.has(productId)) {

                cart.set(productId, {
                    name: name,
                    price: price,
                    quantity: 0
                });

            }

            const item = cart.get(productId);

            if (item.quantity >= 1000) {

                showMessage(
                    "Maximum quantity is 1000 per product.",
                    "error"
                );

                return;
            }

            item.quantity++;

            renderCart();

            showMessage(
                `${name} added to your order.`,
                "success"
            );

        });

    });

    // =====================================
    // CLEAR CART
    // =====================================

    clearButton.addEventListener("click", () => {

        cart.clear();

        renderCart();

        showMessage(
            "Your order list has been cleared."
        );

    });

    // =====================================
// FORM SUBMISSION - FORMSPREE
// =====================================

orderForm.addEventListener("submit", async event => {

    event.preventDefault();

    if (!orderForm.reportValidity()) return;

    if (cart.size === 0) {
        showMessage(
            "Please add at least one product before submitting.",
            "error"
        );
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    showMessage("Sending your order request...");

    try {

        // Collect customer information
        const formData = new FormData(orderForm);

      // Collect selected products
const items = Array.from(cart.values()).map(item => {

    return (
        item.name +
        " | Quantity: " + item.quantity +
        " | Unit price: " + money(item.price) +
        " | Subtotal: " + money(item.price * item.quantity)
    );

});

        // Calculate estimated total
        const total = Array.from(cart.values()).reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // Add order information to the submission
        formData.set("selected_products", items.join("\n"));
        formData.set("estimated_total", money(total));
        formData.set("_subject", "New Woodland Ember Order");
        formData.set("_replyto", formData.get("email"));

        // Send everything to Formspree
        const response = await fetch(FORMSPREE_ENDPOINT, {

            method: "POST",

            body: formData,

            headers: {
                "Accept": "application/json"
            }

        });

        const result = await response.json();

        if (!response.ok) {

            const errorMessage = result.errors
                ? result.errors.map(error => error.message).join(", ")
                : "Unable to submit your order.";

            throw new Error(errorMessage);

        }

        // Successful submission
        showMessage(
            "Your order request has been sent successfully. We will contact you shortly.",
            "success"
        );

        // Reset everything
        orderForm.reset();

        cart.clear();

        renderCart();

        formMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    } catch (error) {

        console.error("Order submission error:", error);

        showMessage(
            error.message || "Something went wrong. Please try again.",
            "error"
        );

    } finally {

        submitButton.disabled = false;

        submitButton.innerHTML =
            'Submit order request <span>↗</span>';

    }

});

    // =====================================
    // FOOTER YEAR
    // =====================================

    if (yearElement) {

        yearElement.textContent = new Date().getFullYear();

    }

    // =====================================
    // INITIALIZE
    // =====================================

    renderCart();

});
