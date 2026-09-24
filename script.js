// 1. Quantity Selector (- and + Buttons)
const qtySelectors = document.querySelectorAll('.qty-selector');

qtySelectors.forEach(selector => {
    const minusBtn = selector.querySelector('button:first-child');
    const plusBtn = selector.querySelector('button:last-child');
    const input = selector.querySelector('input');

    minusBtn.addEventListener('click', () => {
        let currentValue = parseInt(input.value);
        if (currentValue > 1) {
            input.value = currentValue - 1;
        }
    });

    plusBtn.addEventListener('click', () => {
        let currentValue = parseInt(input.value);
        input.value = currentValue + 1;
    });
});

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbzDGCNJdKszQUz5x9g8-aGuznJ2yDvLD9PIVhfCvXMmQG8tdtlH0SEXT_WBBH7uleKs/exec"
// 2. Cart Data & Order Calculation System
let cart = {}; 
const unitPrice = 180; // Single box price

const cartIcon = document.querySelector('.cart-icon');
const cartModal = document.getElementById('cartModal');
const closeCartBtn = document.getElementById('closeCart');
const cartBody = document.getElementById('cartBody');
const cartBadge = document.querySelector('.cart-badge');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartDeliveryCharge = document.getElementById('cartDeliveryCharge');
const cartTotalAmount = document.getElementById('cartTotalAmount');
const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
const checkoutFormContainer = document.getElementById('checkoutFormContainer');
const modalDeliveryArea = document.getElementById('modalDeliveryArea');
const confirmOrderBtn = document.getElementById('confirmOrderBtn');

// Add to Cart Event
addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        const flavourName = card.querySelector('h3').textContent.trim();
        const qtyInput = card.querySelector('.qty-selector input');
        const quantity = parseInt(qtyInput.value);

        if (cart[flavourName]) {
            cart[flavourName] += quantity;
        } else {
            cart[flavourName] = quantity;
        }

        updateCartUI();

        // Button Animation
        const originalText = button.innerHTML;
        button.innerHTML = `<i class="fa-solid fa-check"></i> Added!`;
        button.style.backgroundColor = '#4CAF50';
        button.style.color = '#fff';

        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.backgroundColor = '';
            button.style.color = '';
        }, 1200);
    });
});

// Update Cart Details & Calculate Totals
function updateCartUI() {
    let totalItems = 0;
    let subtotalPrice = 0;
    cartBody.innerHTML = '';

    const keys = Object.keys(cart);

    if (keys.length === 0) {
        cartBody.innerHTML = '<p class="empty-cart-msg">Your cart is empty.</p>';
        checkoutFormContainer.style.display = 'none';
        subtotalPrice = 0;
    } else {
        checkoutFormContainer.style.display = 'block';
        keys.forEach(flavour => {
            const qty = cart[flavour];
            if (qty > 0) {
                totalItems += qty;
                const itemTotal = qty * unitPrice;
                subtotalPrice += itemTotal;

                const itemRow = document.createElement('div');
                itemRow.className = 'cart-item-row';
                itemRow.innerHTML = `
                    <div class="cart-item-info">
                        <strong>ExtraJoss ${flavour}</strong>
                        <span>৳${unitPrice} x ${qty} = ৳${itemTotal}</span>
                    </div>
                    <i class="fa-solid fa-trash remove-item-btn" onclick="removeItem('${flavour}')"></i>
                `;
                cartBody.appendChild(itemRow);
            }
        });
    }

    const deliveryCharge = keys.length > 0 ? parseInt(modalDeliveryArea.value) : 0;
    const finalTotal = subtotalPrice + deliveryCharge;

    if (cartBadge) cartBadge.textContent = totalItems;
    if (cartSubtotal) cartSubtotal.textContent = `৳${subtotalPrice}`;
    if (cartDeliveryCharge) cartDeliveryCharge.textContent = `৳${deliveryCharge}`;
    if (cartTotalAmount) cartTotalAmount.textContent = `৳${finalTotal}`;
}

// Remove item
function removeItem(flavour) {
    delete cart[flavour];
    updateCartUI();
}

// Delivery Area change event
if (modalDeliveryArea) {
    modalDeliveryArea.addEventListener('change', () => {
        updateCartUI();
    });
}

// Open / Close Modal
cartIcon.addEventListener('click', () => {
    cartModal.classList.add('active');
});

closeCartBtn.addEventListener('click', () => {
    cartModal.classList.remove('active');
});

window.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.classList.remove('active');
    }
});

// 3. Confirm Order to Google Sheet
confirmOrderBtn.addEventListener('click', () => {
    const keys = Object.keys(cart);
    if (keys.length === 0) {
        alert("Your cart is empty! Please add products first.");
        return;
    }

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();

    if (!name || !phone || !address) {
        alert("Please fill in your Name, Phone number, and Delivery Address.");
        return;
    }

    let itemsTextList = [];
    let subtotal = 0;
    keys.forEach(flavour => {
        const qty = cart[flavour];
        const total = qty * unitPrice;
        subtotal += total;
        itemsTextList.push(`ExtraJoss ${flavour} (${qty}x)`);
    });

    const deliveryCharge = parseInt(modalDeliveryArea.value);
    const grandTotal = subtotal + deliveryCharge;

    const orderData = {
        name: name,
        phone: phone,
        address: address,
        items: itemsTextList.join(", "),
        subtotal: `৳${subtotal}`,
        delivery: `৳${deliveryCharge}`,
        total: `৳${grandTotal}`
    };

    const originalBtnText = confirmOrderBtn.innerHTML;
    confirmOrderBtn.disabled = true;
    confirmOrderBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting Order...`;

    // Google Sheet-এ ডাটা পাঠানো
    fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(() => {
        alert("🎉 Thank you! Your order has been placed successfully. We will call you soon to confirm.");
        
        cart = {};
        updateCartUI();
        cartModal.classList.remove('active');

        document.getElementById('custName').value = '';
        document.getElementById('custPhone').value = '';
        document.getElementById('custAddress').value = '';

        confirmOrderBtn.disabled = false;
        confirmOrderBtn.innerHTML = originalBtnText;
    })
    .catch(error => {
        console.error('Error!', error.message);
        alert("Something went wrong. Please try again or contact us directly.");
        confirmOrderBtn.disabled = false;
        confirmOrderBtn.innerHTML = originalBtnText;
    });
});