document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    mostrarProductosPorCategoria();
    initNavFilters();

    const openCartBtn = document.getElementById('open-cart');
    const cartPanel = document.getElementById('cart-panel');

    openCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isVisible = cartPanel.style.display === 'block';
        cartPanel.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) renderCart();
    });

    window.addEventListener('click', (e) => {
        const isClickInsideCart = e.target.closest('#cart-panel');
        const isCartButton = e.target.closest('#open-cart');
        const isActionButton =
            e.target.closest('.quantity-btn') ||
            e.target.closest('.remove-btn') ||
            e.target.closest('#close-cart'); // 

        if (
            cartPanel.style.display === 'block' &&
            !isClickInsideCart &&
            !isCartButton &&
            !isActionButton
        ) {
            cartPanel.style.display = 'none';
        }
    });



    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cartPanel.style.display = 'none';
        }
    });

    document.getElementById('search-button').addEventListener('click', function () {
        const query = document.getElementById('search-input').value;
        searchProducts(query);
    });

    document.getElementById('price-filter').addEventListener('input', function () {
        const price = this.value;
        document.getElementById('price-value').textContent = `$${price}`;
        aplicarFiltrosCombinados();
    });

    document.getElementById('rating-filter').addEventListener('change', function () {
        aplicarFiltrosCombinados();
    });
});

// ========== VARIABLES ==========
let currentFilteredCategory = null;

// ========== CARRITO MEJORADO ==========
function saveCartToLocalStorage(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

async function addToCart(productId) {
    try {
        // Obtener información del producto desde la API
        const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
        const product = await response.json();

        let cart = loadCartFromLocalStorage();

        // Buscar si el producto ya existe en el carrito
        const existingItemIndex = cart.findIndex(item => item.id === productId);

        if (existingItemIndex !== -1) {
            // Si existe, aumentar la cantidad
            cart[existingItemIndex].quantity += 1;
        } else {
            // Si no existe, agregarlo con cantidad 1
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                category: product.category,
                quantity: 1
            });
        }

        saveCartToLocalStorage(cart);
        updateCartCount();

        // Mostrar mensaje de confirmación
        showNotification(`${product.title} agregado al carrito`);

    } catch (error) {
        console.error('Error adding product to cart:', error);
        showNotification('Error al agregar producto al carrito', 'error');
    }
}

async function addToCartFromFavorites(productId) {
    try {
        // Obtener información del producto desde la API
        const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
        const product = await response.json();
        
        let cart = loadCartFromLocalStorage();
        // Buscar si el producto ya existe en el carrito
        const existingItemIndex = cart.findIndex(item => item.id === productId);

        if (existingItemIndex !== -1) {
            // Si existe, aumentar la cantidad
            cart[existingItemIndex].quantity += 1;
        } else {
            // Si no existe, agregarlo con cantidad 1
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                category: product.category,
                quantity: 1
            });
        }

        saveCartToLocalStorage(cart);
        updateCartCount();
        showNotification(`${product.title} agregado al carrito`);
        
    } catch (error) {
        console.error('Error adding product to cart from favorites:', error);
        showNotification('Error al agregar producto al carrito', 'error');
    }
}

function updateQuantity(productId, change) {
    let cart = loadCartFromLocalStorage();
    const itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex !== -1) {
        cart[itemIndex].quantity += change;

        // Si la cantidad llega a 0 o menos, eliminar el producto
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }

        saveCartToLocalStorage(cart);
        updateCartCount();
        renderCart();
    }
}

function removeFromCart(productId) {
    let cart = loadCartFromLocalStorage();
    cart = cart.filter(item => item.id !== productId);
    saveCartToLocalStorage(cart);
    updateCartCount();
    renderCart();
    showNotification('Producto eliminado del carrito');
}

function clearCart() {
    localStorage.removeItem('cart');
    updateCartCount();
    renderCart();
}

function updateCartCount() {
    const cart = loadCartFromLocalStorage();
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}



async function renderCart() {
    document.getElementById('cart-panel').style.display = 'block';

    const cartItemsContainer = document.getElementById('cart-items');
    const cart = loadCartFromLocalStorage();

    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Tu carrito está vacío</p>';
            document.getElementById('total-items').textContent = '0';
            document.getElementById('total-price').textContent = '0.00';
            return;
        }

        let totalItems = 0;
        let totalPrice = 0;

        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.title}">
                <div class="cart-item-info">
                    <h3>${item.title}</h3>
                    <p class="price">$${item.price}</p>
                    <p class="category">${item.category}</p>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button onclick="updateQuantity(${item.id}, -1)" class="quantity-btn">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)" class="quantity-btn">+</button>
                    </div>
                    <p class="item-total">$${(item.price * item.quantity).toFixed(2)}</p>
                    <button onclick="removeFromCart(${item.id})" class="remove-btn">🗑️</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);

            totalItems += item.quantity;
            totalPrice += item.price * item.quantity;
        });

        document.getElementById('total-items').textContent = totalItems;
        document.getElementById('total-price').textContent = totalPrice.toFixed(2);
    }
}

function viewfavorites() {
    const cartPanel = document.getElementById('cart-panel');
    cartPanel.style.display = 'block';
    const cartItemsContainer = document.getElementById('cart-items');
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';

        if (favorites.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No tienes favoritos</p>';
            return;
        }

        favorites.forEach(productId => {
            fetch(`https://fakestoreapi.com/products/${productId}`)
                .then(res => res.json())
                .then(product => {
                    const cartItem = document.createElement('div');
                    cartItem.className = 'cart-item';
                    cartItem.innerHTML = `
                        <img src="${product.image}" alt="${product.title}">
                        <div class="cart-item-info">
                            <h3>${product.title}</h3>
                            <p class="price">$${product.price}</p>
                            <p class="category">${product.category}</p>
                        </div>
                        <div class="cart-item-actions">
                            <div class="quantity-controls">
                                <button onclick="addToCartFromFavorites(${product.id})" class="quantity-btn">Agregar al carrito</button>
                                <button onclick="toggleFavorite(${product.id})" class="favorite-btn">Eliminar de favoritos</button>
                            </div>
                        </div>
                    `;
                    cartItemsContainer.appendChild(cartItem);
                })
                .catch(error => {
                    console.error('Error fetching favorite product:', error);
                });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const favoriteButton = document.getElementById('view-favorites');
    if (favoriteButton) {
        favoriteButton.addEventListener('click', (e) => {
            e.preventDefault();
            viewfavorites();
        });
    }
});



// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff4444' : '#1ea919'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    // Agregar estilos de animación si no existen
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ========== FILTROS Y BÚSQUEDA ==========
async function filterProducts(category) {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        const products = await response.json();

        currentFilteredCategory = category;

        let filteredProducts;
        if (category === 'clothing') {
            filteredProducts = products.filter(product =>
                product.category === "men's clothing" || product.category === "women's clothing"
            );
        } else {
            filteredProducts = products.filter(product => product.category === category);
        }

        showFiltersView();
        renderProducts(filteredProducts);
    } catch (error) {
        console.error('Error filtering products:', error);
    }
}

async function aplicarFiltrosCombinados() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        let products = await response.json();

        const maxPrice = document.getElementById('price-filter').value;
        const minRating = document.getElementById('rating-filter').value;

        if (currentFilteredCategory === 'clothing') {
            products = products.filter(product =>
                product.category === "men's clothing" || product.category === "women's clothing"
            );
        } else if (currentFilteredCategory) {
            products = products.filter(product => product.category === currentFilteredCategory);
        }

        products = products.filter(product => product.price <= maxPrice);

        if (minRating) {
            products = products.filter(product => product.rating.rate >= minRating);
        }

        renderProducts(products);
    } catch (error) {
        console.error('Error aplicando filtros combinados:', error);
    }
}

async function searchProducts(query) {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        const products = await response.json();
        const filteredProducts = query
            ? products.filter(product =>
                product.title.toLowerCase().includes(query.toLowerCase())
            )
            : products;

        currentFilteredCategory = null;
        showFiltersView();
        renderProducts(filteredProducts);
    } catch (error) {
        console.error('Error searching products:', error);
    }
}

function showFiltersView() {
    document.getElementById('filters').style.display = 'flex'; 
    document.querySelector('.products').style.display = 'grid';
    document.querySelectorAll('.categorias-destacadas').forEach(el => el.style.display = 'none');
}

function showHomeView() {
    currentFilteredCategory = null;
    document.getElementById('filters').style.display = 'none'; // ✅ Corrección aquí
    document.querySelector('.products').innerHTML = '';
    document.querySelectorAll('.categorias-destacadas').forEach(el => el.style.display = 'flex');
}


function renderProducts(products) {
    const productsContainer = document.querySelector('.products');
    productsContainer.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p class="price">$${product.price}</p>
            <p>${product.category}</p>
            <button onclick="addToCart(${product.id})">Agregar al carrito</button>
        `;
        productsContainer.appendChild(productCard);
    });
}

function favoriteProduct(productId) {
    const cart = loadCartFromLocalStorage();
    const product = cart.find(item => item.id === productId);
    
    if (product) { 
        showNotification(`${product.title} ya está en tu carrito`, 'info');
        return;
    }

    fetch(`https://fakestoreapi.com/products/${productId}`)
        .then(res => res.json())
        .then(product => {
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                category: product.category,
                quantity: 1
            });
            saveCartToLocalStorage(cart);
            updateCartCount();
            showNotification(`${product.title} agregado a favoritos`);
        })
        .catch(error => {
            console.error('Error al agregar producto a favoritos:', error);
            showNotification('Error al agregar producto a favoritos', 'error');
        });
}

function toggleFavorite(productId) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const index = favorites.indexOf(productId);
    if (index === -1) {
        favorites.push(productId);
        showNotification('Producto agregado a favoritos');
    } else {
        favorites.splice(index, 1);
        showNotification('Producto eliminado de favoritos', 'info');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButtons();
}

function isFavorite(productId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    return favorites.includes(productId);
}

function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const productId = parseInt(btn.dataset.productId, 10);
        if (isFavorite(productId)) {
            btn.classList.add('favorited');
            btn.innerHTML = '';
        } else {
            btn.classList.remove('favorited');
            btn.innerHTML = '';
        }
    });
}

//  FAVORITOS 
// Cargar favoritos al inicio
document.addEventListener('DOMContentLoaded', () => {
    updateFavoriteButtons();
});


const originalRenderProducts = renderProducts;
renderProducts = function(products) {
    const productsContainer = document.querySelector('.products');
    productsContainer.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p class="price">$${product.price}</p>
            <p>${product.category}</p>
            <button onclick="addToCart(${product.id})">Agregar al carrito</button>
            <button onclick=·
            <button onclick="favoriteProduct(${product.id})" class="favorite-btn" data-product-id="${product.id}">
        `;
        productsContainer.appendChild(productCard);
    });

    // Asigna eventos a los botones de favorito
    productsContainer.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.dataset.productId, 10);
            toggleFavorite(productId);
        });
    });
    updateFavoriteButtons();
};



// ========== CARRUSEL ==========
const carousel = document.getElementById('carousel');
const progressBar = document.getElementById('progressBar');
let currentIndex = 0;
let intervalId;
let productos = [];

function renderSlide(index) {
    carousel.querySelectorAll('.carousel-slide').forEach(slide => slide.remove());

    const producto = productos[index];
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';

    slide.innerHTML = `
        <div class="carousel-content">
          <h2>${producto.title}</h2>
          <p>${producto.description.substring(0, 120)}...</p>
          <a href="#">Solo por $${producto.price}</a>
        </div>
        <img src="${producto.image}" alt="${producto.title}" />
    `;

    carousel.insertBefore(slide, carousel.querySelector('.carousel-buttons'));
    resetProgressBar();
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % productos.length;
    renderSlide(currentIndex);
}

function prevSlide() {
    currentIndex = (currentIndex - 1 + productos.length) % productos.length;
    renderSlide(currentIndex);
}

function startAutoSlide() {
    intervalId = setInterval(nextSlide, 5000);
    animateProgressBar();
}

function stopAutoSlide() {
    clearInterval(intervalId);
}

function resetProgressBar() {
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    setTimeout(() => {
        progressBar.style.transition = 'width 5s linear';
        progressBar.style.width = '100%';
    }, 50);
}

function animateProgressBar() {
    progressBar.style.transition = 'width 5s linear';
    progressBar.style.width = '100%';
}

document.getElementById('next').addEventListener('click', () => {
    stopAutoSlide();
    nextSlide();
    startAutoSlide();
});

document.getElementById('prev').addEventListener('click', () => {
    stopAutoSlide();
    prevSlide();
    startAutoSlide();
});

fetch('https://fakestoreapi.com/products')
    .then(res => res.json())
    .then(data => {
        productos = data.sort((a, b) => b.rating.rate - a.rating.rate).slice(0, 3);
        renderSlide(currentIndex);
        startAutoSlide();
    });

// ========== CATEGORÍAS DESTACADAS ==========
async function mostrarProductosPorCategoria() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        const products = await response.json();

        const electronics = products.filter(p => p.category === "electronics");
        renderProductosCategoria(electronics, "categoria-electronics");

        const clothing = products.filter(
            p => p.category === "men's clothing" || p.category === "women's clothing"
        );
        renderProductosCategoria(clothing, "categoria-clothing");

        const accessories = products.filter(p => p.category === "jewelery");
        renderProductosCategoria(accessories, "categoria-accessories");

    } catch (error) {
        console.error('Error cargando productos por categoría:', error);
    }
}

function renderProductosCategoria(productos, contenedorId) {
    const wrapper = document.querySelector(`#${contenedorId} .productos-categoria`);
    wrapper.innerHTML = '';
    wrapper._productos = productos;
    mostrarProductosCarrusel(contenedorId);
}

function mostrarProductosCarrusel(contenedorId) {
    const wrapper = document.querySelector(`#${contenedorId} .productos-categoria`);
    const productos = wrapper._productos || [];
    const start = carruselIndices[contenedorId] || 0;
    const end = start + 5;
    wrapper.innerHTML = '';
    productos.slice(start, end).forEach(product => {
        const div = document.createElement('div');
        div.className = 'producto-miniatura';
        div.innerHTML = `
            <img src="${product.image}" alt="${product.title}">
            <h4>${product.title}</h4>
            <p class="price">$${product.price}</p>
            <button onclick="addToCart(${product.id})">Agregar al carrito</button>
        <button onclick="toggleFavorite(${product.id})" class="favorite-btn" data-product-id="${product.id}">
        Agregar a favoritos</button>
        `;
        wrapper.appendChild(div);
    });

    const btnIzq = document.querySelector(`#${contenedorId} .categoria-flecha.izq`);
    const btnDer = document.querySelector(`#${contenedorId} .categoria-flecha.der`);
    btnIzq.disabled = start === 0;
    btnDer.disabled = end >= productos.length;
}


const carruselIndices = {
    "categoria-electronics": 0,
    "categoria-clothing": 0,
    "categoria-accessories": 0
};

function moverCarrusel(contenedorId, dir) {
    const wrapper = document.querySelector(`#${contenedorId} .productos-categoria`);
    const productos = wrapper._productos || [];
    let idx = carruselIndices[contenedorId] || 0;
    idx += dir * 5;
    if (idx < 0) idx = 0;
    if (idx > productos.length - 5) idx = Math.max(productos.length - 5, 0);
    carruselIndices[contenedorId] = idx;
    mostrarProductosCarrusel(contenedorId);
}

// BARRA DE NAVEGACIÓN
function initNavFilters() {
    const electronicsLink = document.querySelector('a[href="#electronics"]');
    const fashionLink = document.querySelector('a[href="#fashion"]');
    const accessoriesLink = document.querySelector('a[href="#accessories"]');
    const homeLink = document.querySelector('a[href="#home"]');

    if (electronicsLink) {
        electronicsLink.addEventListener('click', (e) => {
            e.preventDefault();
            filterProducts('electronics');
        });
    }

    if (fashionLink) {
        fashionLink.addEventListener('click', (e) => {
            e.preventDefault();
            filterProducts('clothing');
        });
    }

    if (accessoriesLink) {
        accessoriesLink.addEventListener('click', (e) => {
            e.preventDefault();
            filterProducts('jewelery');
        });
    }

    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            showHomeView();
        });
    }
}

// ========== PROCESO DE COMPRA MEJORADO ==========
document.getElementById('checkout-button').addEventListener('click', () => {
    const cart = loadCartFromLocalStorage();

    if (cart.length === 0) {
        showNotification('Tu carrito está vacío', 'error');
        return;
    }

    const modal = document.getElementById('payment-modal');
    const details = document.getElementById('payment-details');
    let html = '';
    let totalPrice = 0;
    let totalItems = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        totalItems += item.quantity;
        html += `
            <div class="payment-item">
                <div class="item-title">${item.title}</div>
                <div class="item-info">
                    <span>Cantidad: ${item.quantity}</span>
                    <span>Precio unitario: $${item.price}</span>
                    <span>Subtotal: $${itemTotal.toFixed(2)}</span>
                </div>
            </div>
        `;
    });

    html += `
        <div class="payment-summary">
            <div><strong>Total de productos:</strong> ${totalItems}</div>
            <div><strong>Total a pagar:</strong> $${totalPrice.toFixed(2)}</div>
        </div>
    `;

    details.innerHTML = html;
    modal.style.display = 'flex';

    // Confirmar pago
    const confirmBtn = document.getElementById('confirm-payment');
    const cancelBtn = document.getElementById('cancel-payment');
    const closeBtn = document.getElementById('close-payment-modal');

    // Primero eliminamos cualquier listener previo (opcional, por seguridad)
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    closeBtn.replaceWith(closeBtn.cloneNode(true));

    // Re-seleccionamos los nuevos botones (ya clonados)
    const newConfirmBtn = document.getElementById('confirm-payment');
    const newCancelBtn = document.getElementById('cancel-payment');
    const newCloseBtn = document.getElementById('close-payment-modal');

    // Evento al confirmar pago
    newConfirmBtn.addEventListener('click', () => {
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
        modal.style.display = 'none';
        clearCart();
        showNotification(`¡Compra realizada con éxito usando ${selectedMethod === 'card' ? 'tarjeta' : selectedMethod}! 🎉`);
        document.getElementById('cart-panel').style.display = 'none';

        saveToOrderHistory({
            date: new Date().toISOString(),
            items: cart,
            total: totalPrice,
            totalItems: totalItems,
            paymentMethod: selectedMethod
        });
    });

    // Cancelar o cerrar
    newCancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    newCloseBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

});



// Función para guardar historial de pedidos
function saveToOrderHistory(order) {
    let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    orderHistory.push(order);
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
}

// ========== FORMULARIO DE REGISTRO ==========
// Mostrar el formulario al hacer click en el icono de login
document.querySelector('img[alt="login"]').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('signup-modal').style.display = 'flex';
});

// Cerrar el formulario al hacer click en "Cancelar"
document.getElementById('close-signup').addEventListener('click', function () {
    document.getElementById('signup-modal').style.display = 'none';
});

// Cerrar el formulario con la X---
document.getElementById('close-signup-x').addEventListener('click', function () {
    document.getElementById('signup-modal').style.display = 'none';
});

// Guardar la información en un JSON en localStorage
document.getElementById('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const nombre = this.nombre.value;
    const email = this.email.value;
    const password = this.password.value;

    // Obtener usuarios existentes o crear un array vacío
    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    // Verificar si el email ya existe
    const existingUser = usuarios.find(user => user.email === email);
    if (existingUser) {
        showNotification('Este email ya está registrado', 'error');
        return;
    }

    // Agregar el nuevo usuario
    usuarios.push({ nombre, email, password, fechaRegistro: new Date().toISOString() });

    // Guardar el array actualizado en localStorage
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    showNotification('¡Inscripción exitosa! 🎉');
    document.getElementById('signup-modal').style.display = 'none';
    this.reset();
});

document.getElementById('close-cart').addEventListener('click', () => {
    document.getElementById('cart-panel').style.display = 'none';
});


document.getElementById('clear-cart').addEventListener('click', () => {
    clearCart();
    showNotification('Carrito vaciado');
});

document.getElementById("confirm-payment").addEventListener("click", () => {
    const name = document.getElementById("full-name")?.value.trim();
    const address = document.getElementById("address")?.value.trim();
    const city = document.getElementById("city")?.value.trim();
    const region = document.getElementById("region")?.value.trim();
    const phone = document.getElementById("phone")?.value.trim();
    const method = document.querySelector('input[name="payment-method"]:checked')?.value;

    if (!name || !address || !city || !region || !phone) {
        alert("Por favor completa todos los campos de información de envío.");
        return;
    }

    alert(`
✅ Compra confirmada
👤 Cliente: ${name}
📍 Envío a: ${address}, ${city}, ${region}
📞 Tel: ${phone}
💳 Método: ${method}

Gracias por tu compra. Pronto recibirás tu pedido.
  `);

    // Cierra el modal de pago
    document.getElementById("payment-modal").style.display = "none";

    // (Opcional) Vaciar carrito si ya tienes esta función
    // clearCart();
});