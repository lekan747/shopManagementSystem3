// ===============================
// LOCAL STORAGE HELPER SYSTEM
// ===============================

/*
 * setData(key, value)
 * Saves a JS object/array into localStorage.
 * JSON.stringify converts JS objects into a string because localStorage only stores strings.
 */
function setData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/*
 * getData(key)
 * Retrieves a JS object/array from localStorage.
 * JSON.parse converts the stored string back into a JS object.
 * If no data exists, returns an empty array by default.
 */
function getData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

/*
 * initializeStorage()
 * Ensures all required storage keys exist in localStorage before the app starts.
 * This prevents errors when trying to get or push data into a key that doesn't exist.
 */
function initializeStorage() {
    // List all storage keys we need
    const keys = ['products', 'sales', 'expenses', 'payments'];

    keys.forEach(key => {
        if (!localStorage.getItem(key)) {
            setData(key, []); // initialize with empty array
        }
    });
}

// Run initialization immediately
initializeStorage();



// ===============================
// TAB SWITCHING LOGIC
// ===============================

// Select all navigation buttons
const navButtons = document.querySelectorAll('.nav-btn');

// Select all content sections
const sections = document.querySelectorAll('.content-section');

// Loop through each button
navButtons.forEach(button => {

    button.addEventListener('click', () => {

        const targetSectionId = button.dataset.section;
        const targetSection = document.getElementById(targetSectionId);

        if (!targetSection) {
            console.warn(`Section with ID "${targetSectionId}" not found.`);
            return;
        }

        // 1️⃣ Remove 'active-tab' from all buttons
        navButtons.forEach(btn => btn.classList.remove('active-tab'));

        // 2️⃣ Add 'active-tab' to clicked button
        button.classList.add('active-tab');

        // 3️⃣ Hide all sections
        sections.forEach(section => section.classList.remove('active'));

        // 4️⃣ Show the target section
        targetSection.classList.add('active');
    });

});



// ===============================
// PRODUCTS MODULE
// ===============================

// ----- DOM ELEMENTS -----
const productForm = document.getElementById('productForm');
const productTableBody = document.querySelector('#productTable tbody');

// ----- STATE: in-memory products array -----
let products = getData('products'); // Initialize from LocalStorage

// ----- HELPER: Generate unique ID for each product -----
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// ----- RENDER FUNCTION -----
function renderProducts() {
    // Clear the table before rendering
    productTableBody.innerHTML = '';

    products.forEach((product, index) => {
        const tr = document.createElement('tr');

        // Highlight low stock
        const lowStockClass = product.quantity <= 5 ? 'low-stock' : '';

        tr.innerHTML = `
            <td>${product.name}</td>
            <td class="${lowStockClass}">${product.quantity}</td>
            <td>${product.costPrice}</td>
            <td>${product.sellPrice}</td>
            <td>
                <button class="edit-btn" data-id="${product.id}">Edit</button>
                <button class="delete-btn" data-id="${product.id}">Delete</button>
                <button class="restock-btn" data-id="${product.id}">Restock</button>
            </td>
        `;

        productTableBody.appendChild(tr);
    });
}

// ----- ADD / EDIT PRODUCT -----
let editingProductId = null; // Tracks if we are editing

productForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('productName').value.trim();
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const costPrice = parseFloat(document.getElementById('productCostPrice').value);
    const sellPrice = parseFloat(document.getElementById('productSellPrice').value);

    // Validation: Sell price must be greater than cost
    if (sellPrice <= costPrice) {
        alert("Sell Price must be greater than Cost Price!");
        return;
    }

    if (editingProductId) {
        // Edit existing product
        const productIndex = products.findIndex(p => p.id === editingProductId);
        products[productIndex] = { id: editingProductId, name, quantity, costPrice, sellPrice };
        editingProductId = null; // Reset editing state
    } else {
        // Add new product
        const newProduct = { id: generateId(), name, quantity, costPrice, sellPrice };
        products.push(newProduct);
    }

    setData('products', products); // Save to LocalStorage
    renderProducts();              // Refresh table
    productForm.reset();           // Reset form
});

// ----- TABLE BUTTONS (DELETE, EDIT, RESTOCK) -----
productTableBody.addEventListener('click', function(e) {
    const id = e.target.dataset.id;
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) return; // Safety check

    // DELETE
    if (e.target.classList.contains('delete-btn')) {
        if (confirm("Are you sure you want to delete this product?")) {
            products.splice(productIndex, 1);
            setData('products', products);
            renderProducts();
        }
    }

    // EDIT
    if (e.target.classList.contains('edit-btn')) {
        const product = products[productIndex];
        document.getElementById('productName').value = product.name;
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productCostPrice').value = product.costPrice;
        document.getElementById('productSellPrice').value = product.sellPrice;
        editingProductId = id; // Track editing
    }

    // RESTOCK
    if (e.target.classList.contains('restock-btn')) {
        const amount = parseInt(prompt("Enter quantity to add:"));
        if (!isNaN(amount) && amount > 0) {
            products[productIndex].quantity += amount;
            setData('products', products);
            renderProducts();
        }
    }
});

// ----- INITIAL RENDER -----
renderProducts();


// ===============================
// SALES MODULE
// ===============================

// ----- DOM ELEMENTS -----
const saleForm = document.getElementById('saleForm');
const productSearch = document.getElementById('productSearch');
const selectedProductInfo = document.getElementById('selectedProductInfo');
const searchResults = document.getElementById('searchResults');
const salesTableBody = document.querySelector('#salesTable tbody');

const paymentTypeSelect = document.getElementById('paymentType');
const customerField = document.getElementById('customerField');
const customerNameInput = document.getElementById('customerName');

// ----- STATE -----
let sales = getData('sales');
let selectedProduct = null;
let editingSaleId = null; // track editing state


// ===============================
// PRODUCT SEARCH DROPDOWN
// ===============================

productSearch.addEventListener('input', function () {

    const searchValue = this.value.toLowerCase().trim();
    searchResults.innerHTML = '';

    if (searchValue === '') {
        searchResults.style.display = 'none';
        return;
    }

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchValue)
    );

    if (filteredProducts.length === 0) {
        searchResults.style.display = 'none';
        return;
    }

    filteredProducts.forEach(product => {

        const div = document.createElement('div');
        div.classList.add('search-item');
        div.textContent = product.name;

        div.addEventListener('click', function () {

            selectedProduct = product;
            productSearch.value = product.name;

            selectedProductInfo.innerHTML = `
                <p><strong>Stock:</strong> ${product.quantity}</p>
                <p><strong>Cost Price:</strong> ${product.costPrice}</p>
                <p><strong>Default Sell Price:</strong> ${product.sellPrice}</p>
            `;

            document.getElementById('salePrice').value = product.sellPrice;
            searchResults.style.display = 'none';
        });

        searchResults.appendChild(div);
    });

    searchResults.style.display = 'block';
});


// ===============================
// SALE SUBMISSION (ADD / EDIT)
// ===============================

saleForm.addEventListener('submit', function (e) {

    e.preventDefault();

    if (!selectedProduct) {
        alert("Please select a valid product.");
        return;
    }

    const salePrice = parseFloat(document.getElementById('salePrice').value);
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const paymentType = paymentTypeSelect.value;
    const customerName = customerNameInput.value.trim();

    if (salePrice <= selectedProduct.costPrice) {
        alert("Selling price cannot be less than or equal to cost price.");
        return;
    }

    if (quantity > selectedProduct.quantity) {
        alert("Not enough stock available.");
        return;
    }

    if (paymentType === 'credit' && customerName === '') {
        alert("Customer name is required for credit sales.");
        return;
    }

    // Deduct stock
    selectedProduct.quantity -= quantity;
    setData('products', products);

    const total = salePrice * quantity;

    let paidAmount = paymentType === "credit" ? 0 : total;
    let remainingBalance = paymentType === "credit" ? total : 0;
    let status = paymentType === "credit" ? "Unpaid" : "Paid";

    const sale = {
        id: editingSaleId || '_' + Date.now(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        salePrice,
        total,
        costPrice: selectedProduct.costPrice,
        paymentType,
        customerName: paymentType === "credit" ? customerName : null,
        paidAmount,
        remainingBalance,
        status,
        date: new Date().toLocaleString()
    };

    if (editingSaleId) {
        const index = sales.findIndex(s => s.id === editingSaleId);
        sales[index] = sale;
        editingSaleId = null;
    } else {
        sales.push(sale);
    }

    setData('sales', sales);

    saleForm.reset();
    selectedProductInfo.innerHTML = '';
    selectedProduct = null;
    customerField.style.display = 'none';

    renderProducts();
    renderSales();

    alert("Sale completed successfully!");
});


// ===============================
// DELETE & EDIT SALES
// ===============================

salesTableBody.addEventListener('click', function (e) {

    const id = e.target.dataset.id;
    const saleIndex = sales.findIndex(s => s.id === id);
    if (saleIndex === -1) return;

    const sale = sales[saleIndex];

    // DELETE
    if (e.target.classList.contains('delete-sale-btn')) {

        if (!confirm("Delete this sale? Stock will be restored.")) return;

        // Restore stock
        const product = products.find(p => p.id === sale.productId);
        if (product) {
            product.quantity += sale.quantity;
            setData('products', products);
        }

        sales.splice(saleIndex, 1);
        setData('sales', sales);

        renderProducts();
        renderSales();
    }

    // EDIT
    if (e.target.classList.contains('edit-sale-btn')) {

        // Restore stock first
        const product = products.find(p => p.id === sale.productId);
        if (product) {
            product.quantity += sale.quantity;
        }

        editingSaleId = sale.id;

        productSearch.value = sale.productName;
        selectedProduct = product;

        document.getElementById('saleQuantity').value = sale.quantity;
        document.getElementById('salePrice').value = sale.salePrice;

        if (sale.paymentType === "credit") {
            paymentTypeSelect.value = "credit";
            customerField.style.display = 'block';
            customerNameInput.value = sale.customerName;
        } else {
            paymentTypeSelect.value = sale.paymentType;
        }

        sales.splice(saleIndex, 1);
        setData('sales', sales);

        renderProducts();
        renderSales();
    }
});


// ===============================
// PAYMENT TYPE TOGGLE
// ===============================

paymentTypeSelect.addEventListener('change', function () {
    if (this.value === 'credit') {
        customerField.style.display = 'block';
    } else {
        customerField.style.display = 'none';
        customerNameInput.value = '';
    }
});


// ===============================
// RENDER SALES
// ===============================

function renderSales() {

    salesTableBody.innerHTML = '';

    sales.forEach(sale => {

        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${sale.date}</td>
            <td>${sale.productName}</td>
            <td>${sale.quantity}</td>
            <td>${sale.salePrice}</td>
            <td>${sale.total}</td>
            <td>${sale.paymentType}</td>
            <td>${sale.customerName || '-'}</td>
            <td>
                <button class="edit-sale-btn" data-id="${sale.id}">Edit</button>
                <button class="delete-sale-btn" data-id="${sale.id}">Delete</button>
            </td>
        `;

        salesTableBody.appendChild(tr);
    });
}

renderSales();



// ===============================
// EXPENSES MODULE
// ===============================

// ----- STATE -----
let expenses = getData('expenses'); // Already returns [] if empty
let editingExpenseId = null;        // Track edit state

// ----- DOM ELEMENTS -----
const expenseForm = document.getElementById('expenseForm');
const expensesTableBody = document.querySelector('#expensesTable tbody');


// ===============================
// ADD / EDIT EXPENSE
// ===============================

expenseForm.addEventListener('submit', function (e) {

    e.preventDefault();

    const title = document.getElementById('expenseTitle').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);

    // Basic validation
    if (!title || isNaN(amount) || amount <= 0) {
        alert("Please enter valid expense details.");
        return;
    }

    const expense = {
        id: editingExpenseId || '_' + Date.now(),
        title,
        amount,
        date: new Date().toLocaleString()
    };

    if (editingExpenseId) {
        // EDIT MODE
        const index = expenses.findIndex(exp => exp.id === editingExpenseId);
        expenses[index] = expense;
        editingExpenseId = null;
    } else {
        // ADD MODE
        expenses.push(expense);
    }

    setData('expenses', expenses);

    expenseForm.reset();
    renderExpenses();
    renderReports(); // update reports after expense change
});


// ===============================
// DELETE & EDIT BUTTON HANDLING
// ===============================

expensesTableBody.addEventListener('click', function (e) {

    const id = e.target.dataset.id;
    const index = expenses.findIndex(exp => exp.id === id);
    if (index === -1) return;

    const expense = expenses[index];

    // DELETE
    if (e.target.classList.contains('delete-expense-btn')) {

        if (!confirm("Delete this expense?")) return;

        expenses.splice(index, 1);
        setData('expenses', expenses);

        renderExpenses();
        renderReports();
    }

    // EDIT
    if (e.target.classList.contains('edit-expense-btn')) {

        document.getElementById('expenseTitle').value = expense.title;
        document.getElementById('expenseAmount').value = expense.amount;

        editingExpenseId = expense.id;
    }

});


// ===============================
// RENDER EXPENSES TABLE
// ===============================

function renderExpenses() {

    expensesTableBody.innerHTML = '';

    expenses.forEach(exp => {

        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${exp.date}</td>
            <td>${exp.title}</td>
            <td>${exp.amount}</td>
            <td>
                <button class="edit-expense-btn" data-id="${exp.id}">Edit</button>
                <button class="delete-expense-btn" data-id="${exp.id}">Delete</button>
            </td>
        `;

        expensesTableBody.appendChild(tr);
    });
}


// ===============================
// INITIAL LOAD
// ===============================

renderExpenses();



// ===============================
// REPORTS + CHART MODULE
// ===============================


/* =====================================================
   1️⃣ CHART STATE (DECLARE FIRST - VERY IMPORTANT)
   ===================================================== */

// This must be declared BEFORE any function uses it
let reportChartInstance = null;


/* =====================================================
   2️⃣ CACHE DOM REFERENCES (AFTER DOM IS LOADED)
   ===================================================== */

// These elements must exist in your HTML
const totalRevenueEl = document.getElementById('totalRevenue');
const totalCostEl = document.getElementById('totalCost');
const grossProfitEl = document.getElementById('grossProfit');
const totalExpensesEl = document.getElementById('totalExpenses');
const netProfitEl = document.getElementById('netProfit');
const topProductEl = document.getElementById('topProduct');


/* =====================================================
   3️⃣ CHART RENDER FUNCTION
   ===================================================== */

function renderChart(revenue, gross, expenses, net) {

    const canvas = document.getElementById('reportChart');

    // Safety: If chart canvas does not exist, stop execution
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy old chart before creating a new one
    // Prevents memory leaks & duplicate charts
    if (reportChartInstance) {
        reportChartInstance.destroy();
    }

    reportChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [
                'Revenue',
                'Gross Profit',
                'Expenses',
                'Net Profit'
            ],
            datasets: [{
                label: 'Business Overview',
                data: [revenue, gross, expenses, net],
                backgroundColor: [
                    '#3b82f6',
                    '#22c55e',
                    '#ef4444',
                    '#a855f7'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


/* =====================================================
   4️⃣ MAIN REPORT RENDER FUNCTION
   ===================================================== */

function renderReports() {

    // Always fetch fresh data locally
    const salesData = getData('sales') || [];
    const productsData = getData('products') || [];
    const expensesData = getData('expenses') || [];

    let totalRevenue = 0;
    let totalCost = 0;
    let productSalesMap = {};

    // -------------------------------
    // PROCESS SALES
    // -------------------------------
    salesData.forEach(sale => {

        // Add revenue
        totalRevenue += sale.total;

        // Find matching product
        const matchedProduct = productsData.find(
            product => product.name === sale.productName
        );

        // Add cost of goods sold
        if (matchedProduct) {
            totalCost += matchedProduct.costPrice * sale.quantity;
        }

        // Track product quantity for best seller
        productSalesMap[sale.productName] =
            (productSalesMap[sale.productName] || 0) + sale.quantity;
    });

    // -------------------------------
    // CALCULATIONS
    // -------------------------------
    const grossProfit = totalRevenue - totalCost;

    const totalExpenses = expensesData.reduce(
        (sum, expense) => sum + expense.amount,
        0
    );

    const netProfit = grossProfit - totalExpenses;

    // -------------------------------
    // FIND TOP PRODUCT
    // -------------------------------
    let topProduct = '-';
    let highestQuantity = 0;

    Object.entries(productSalesMap).forEach(([name, qty]) => {
        if (qty > highestQuantity) {
            highestQuantity = qty;
            topProduct = name;
        }
    });

    // -------------------------------
    // UPDATE UI (SAFETY CHECKS)
    // -------------------------------
    if (totalRevenueEl) totalRevenueEl.textContent = totalRevenue.toFixed(2);
    if (totalCostEl) totalCostEl.textContent = totalCost.toFixed(2);
    if (grossProfitEl) grossProfitEl.textContent = grossProfit.toFixed(2);
    if (totalExpensesEl) totalExpensesEl.textContent = totalExpenses.toFixed(2);
    if (netProfitEl) netProfitEl.textContent = netProfit.toFixed(2);
    if (topProductEl) topProductEl.textContent = topProduct;

    // Update chart
    renderChart(totalRevenue, grossProfit, totalExpenses, netProfit);
}


/* =====================================================
   5️⃣ INITIAL LOAD (ALWAYS LAST)
   ===================================================== */

// Call this AFTER everything above is defined
renderReports();



// ===============================
// CREDIT MODULE
// ===============================


/* =====================================================
   1️⃣ CACHE DOM REFERENCES
   ===================================================== */

const creditTable = document.getElementById('creditTable');
const creditTableBody = document.querySelector('#creditTable tbody');


/* =====================================================
   2️⃣ MAIN RENDER FUNCTION
   ===================================================== */

function renderCredit() {

    // Always fetch fresh data locally
    const salesData = getData('sales') || [];

    // Safety check
    if (!creditTableBody) return;

    // Clear table
    creditTableBody.innerHTML = '';

    // Object to group customer debts
    const creditMap = {};

    /* -------------------------------
       GROUP CREDIT SALES BY CUSTOMER
    -------------------------------- */

    salesData.forEach(sale => {

        if (sale.paymentType === "credit") {

            if (!creditMap[sale.customerName]) {
                creditMap[sale.customerName] = 0;
            }

            creditMap[sale.customerName] += sale.remainingBalance || 0;
        }

    });

    /* -------------------------------
       IF NO CREDIT SALES
    -------------------------------- */

    if (Object.keys(creditMap).length === 0) {
        creditTableBody.innerHTML = `
            <tr>
                <td colspan="4">No credit records found.</td>
            </tr>
        `;
        return;
    }

    /* -------------------------------
       RENDER GROUPED DATA
    -------------------------------- */

    Object.entries(creditMap).forEach(([customer, totalDebt]) => {

        const status = totalDebt === 0 ? "Paid" : "Unpaid";

        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${customer}</td>
            <td>${totalDebt.toFixed(2)}</td>
            <td>${status}</td>
            <td>
                <button class="pay-btn" data-customer="${customer}">
                    Record Payment
                </button>
            </td>
        `;

        creditTableBody.appendChild(tr);
    });
}


/* =====================================================
   3️⃣ PAYMENT EVENT HANDLER
   ===================================================== */

// Add event listener only if table exists
if (creditTable) {

    creditTable.addEventListener('click', function (e) {

        if (!e.target.classList.contains('pay-btn')) return;

        const customerName = e.target.dataset.customer;

        const payment = parseFloat(prompt("Enter payment amount:"));

        if (isNaN(payment) || payment <= 0) {
            alert("Invalid payment amount.");
            return;
        }

        // Fetch fresh sales data
        const salesData = getData('sales') || [];

        let remainingPayment = payment;

        /* ----------------------------------
           APPLY PAYMENT TO CUSTOMER SALES
        ----------------------------------- */

        salesData.forEach(sale => {

            if (
                sale.paymentType === "credit" &&
                sale.customerName === customerName &&
                sale.remainingBalance > 0 &&
                remainingPayment > 0
            ) {

                if (remainingPayment >= sale.remainingBalance) {

                    remainingPayment -= sale.remainingBalance;
                    sale.paidAmount += sale.remainingBalance;
                    sale.remainingBalance = 0;
                    sale.status = "Paid";

                } else {

                    sale.remainingBalance -= remainingPayment;
                    sale.paidAmount += remainingPayment;
                    sale.status = "Partial";
                    remainingPayment = 0;
                }
            }
        });

        // Save updated sales
        setData('sales', salesData);

        // Re-render affected modules
        renderCredit();
        renderReports();

        alert("Payment recorded successfully.");
    });
}


/* =====================================================
   4️⃣ INITIAL LOAD
   ===================================================== */

renderCredit();
