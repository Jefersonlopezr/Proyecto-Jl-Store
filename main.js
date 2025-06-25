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
        if (
            cartPanel.style.display === 'block' &&
            !cartPanel.contains(e.target) &&
            !openCartBtn.contains(e.target)
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

// ========== CARRITO ==========
function saveCartToLocalStorage(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

function addToCart(productId) {
    let cart = loadCartFromLocalStorage();
    cart.push(productId);
    saveCartToLocalStorage(cart);
    updateCartCount();
}

function removeFromCart(productId) {
    let cart = loadCartFromLocalStorage();
    cart = cart.filter(id => id !== productId);
    saveCartToLocalStorage(cart);
    updateCartCount();
    renderCart();
}

function updateCartCount() {
    const cart = loadCartFromLocalStorage();
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

async function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cart = loadCartFromLocalStorage();

    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        let totalItems = 0;
        let totalPrice = 0;

        for (const productId of cart) {
            try {
                const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
                const product = await response.json();

                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <img src="${product.image}" alt="${product.title}">
                    <div class="cart-item-info">
                        <h3>${product.title}</h3>
                        <p class="price">$${product.price}</p>
                    </div>
                    <div class="cart-item-actions">
                        <button onclick="removeFromCart(${product.id})">QUITAR</button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItem);

                totalItems++;
                totalPrice += product.price;
            } catch (error) {
                console.error('Error fetching product details:', error);
            }
        }

        document.getElementById('total-items').textContent = totalItems;
        document.getElementById('total-price').textContent = totalPrice.toFixed(2);
    }
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
    document.querySelector('.filters').style.display = 'block';
    document.querySelector('.products').style.display = 'grid';
    document.querySelectorAll('.categorias-destacadas').forEach(el => el.style.display = 'none');
}

function showHomeView() {
    currentFilteredCategory = null;
    document.querySelector('.filters').style.display = 'none';
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

//  BOTÓN PAGAR
document.getElementById('checkout-button').addEventListener('click', () => {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];

    if (cartItems.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }

    const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);

    alert(`¡Gracias por tu compra! TE ESPERAMOS PRONTO!!`);

    localStorage.removeItem('cart');

    actualizarCarrito();
});

// ACTUALIZAR EL CARRITO
function actualizarCarrito() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartContainer = document.getElementById('cart-items');
    const totalItems = document.getElementById('total-items');
    const totalPrice = document.getElementById('total-price');
    const cartCount = document.getElementById('cart-count');

    cartContainer.innerHTML = '';

    let total = 0;
    let quantity = 0;

    cartItems.forEach(item => {
        total += item.price * item.quantity;
        quantity += item.quantity;

        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p>$${item.price} x ${item.quantity}</p>
            </div>
        `;
        cartContainer.appendChild(itemElement);
    });

    totalItems.textContent = quantity;
    totalPrice.textContent = total.toFixed(2);
    cartCount.textContent = quantity;
}

// Mostrar el formulario al hacer click en el icono de login
document.querySelector('img[alt="login"]').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('signup-modal').style.display = 'flex';
});

// Cerrar el formulario al hacer click en "Cancelar"
document.getElementById('close-signup').addEventListener('click', function () {
    document.getElementById('signup-modal').style.display = 'none';
});


// Cerra el formulario con la X
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

    // Agregar el nuevo usuario
    usuarios.push({ nombre, email, password });

    // Guardar el array actualizado en localStorage
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    alert('¡Inscripción exitosa!');
    document.getElementById('signup-modal').style.display = 'none';
    this.reset();
});