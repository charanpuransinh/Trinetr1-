// ============ डेटा इनिशियलाइज़ करना ============
function initData() {
    if (!localStorage.getItem('parties')) {
        localStorage.setItem('parties', JSON.stringify([
            { id: 'P001', name: 'ABC Traders', gst: '27AAACA1234B1Z', stateCode: '27', phone: '9876543210', address: 'Mumbai', type: 'customer', balance: 0 }
        ]));
    }
    if (!localStorage.getItem('items')) {
        localStorage.setItem('items', JSON.stringify([
            { id: 'I001', name: 'Steel Plate', hsn: '7208', unit: 'Pcs', purchaseRate: 4500, saleRate: 5000, gst: 18, stock: 100, minStock: 20 }
        ]));
    }
    if (!localStorage.getItem('transactions')) {
        localStorage.setItem('transactions', JSON.stringify([]));
    }
    if (!localStorage.getItem('invoices')) {
        localStorage.setItem('invoices', JSON.stringify([]));
    }
    if (!localStorage.getItem('payments')) {
        localStorage.setItem('payments', JSON.stringify([]));
    }
    if (!localStorage.getItem('expenses')) {
        localStorage.setItem('expenses', JSON.stringify([]));
    }
}

// ============ GET / SET फंक्शन ============
function getParties() { return JSON.parse(localStorage.getItem('parties')) || []; }
function getItems() { return JSON.parse(localStorage.getItem('items')) || []; }
function getTransactions() { return JSON.parse(localStorage.getItem('transactions')) || []; }
function getInvoices() { return JSON.parse(localStorage.getItem('invoices')) || []; }
function getPayments() { return JSON.parse(localStorage.getItem('payments')) || []; }
function getExpenses() { return JSON.parse(localStorage.getItem('expenses')) || []; }

function saveParties(data) { localStorage.setItem('parties', JSON.stringify(data)); updateAllBalances(); }
function saveItems(data) { localStorage.setItem('items', JSON.stringify(data)); }
function saveTransactions(data) { localStorage.setItem('transactions', JSON.stringify(data)); }
function saveInvoices(data) { localStorage.setItem('invoices', JSON.stringify(data)); }
function savePayments(data) { localStorage.setItem('payments', JSON.stringify(data)); updateAllBalances(); }
function saveExpenses(data) { localStorage.setItem('expenses', JSON.stringify(data)); }

// ============ पार्टी का बैलेंस अपडेट करना ============
function updateAllBalances() {
    let parties = getParties();
    let payments = getPayments();
    let invoices = getInvoices();
    
    parties.forEach(party => {
        let totalSale = 0, totalPayment = 0;
        invoices.forEach(inv => {
            if(inv.partyId === party.id) totalSale += inv.grandTotal;
        });
        payments.forEach(pay => {
            if(pay.partyId === party.id && pay.type === 'receive') totalPayment += pay.amount;
            if(pay.partyId === party.id && pay.type === 'give') totalPayment -= pay.amount;
        });
        party.balance = totalSale - totalPayment;
    });
    saveParties(parties);
}

// ============ पेमेंट एंट्री ============
function addPayment(partyId, amount, type, note) {
    let payments = getPayments();
    payments.push({
        id: Date.now(),
        partyId: partyId,
        date: new Date().toISOString().split('T')[0],
        amount: amount,
        type: type,
        note: note
    });
    savePayments(payments);
    updateAllBalances();
}

// ============ एक्सपेंस एंट्री ============
function addExpense(expenseName, amount, category) {
    let expenses = getExpenses();
    expenses.push({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        name: expenseName,
        amount: amount,
        category: category
    });
    saveExpenses(expenses);
}

// ============ स्टॉक अपडेट ============
function updateStock(itemId, qty, isSale = true) {
    let items = getItems();
    let itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex !== -1) {
        if (isSale) {
            items[itemIndex].stock -= qty;
        } else {
            items[itemIndex].stock += qty;
        }
        saveItems(items);
    }
}

// ============ ऑटो बैकअप ============
function autoBackup() {
    let backup = {
        parties: getParties(),
        items: getItems(),
        transactions: getTransactions(),
        invoices: getInvoices(),
        payments: getPayments(),
        expenses: getExpenses(),
        backupTime: new Date().toISOString()
    };
    localStorage.setItem('autoBackup', JSON.stringify(backup));
    console.log('Auto Backup Done at', new Date());
}

// हर 10 मिनट में बैकअप
setInterval(autoBackup, 10 * 60 * 1000);

// ============ पेज के हिसाब से फंक्शन ============
window.onload = function() {
    initData();
    autoBackup();
    const page = document.body.getAttribute('data-page');
    
    if (page === 'parties') loadParties();
    else if (page === 'items') loadItems();
    else if (page === 'accounts') loadAccounts();
    else if (page === 'home') loadHome();
    else if (page === 'payment') loadPayment();
};

// ============ PARTY PAGE ============
function loadParties() { renderParties(); }

function renderParties() {
    const parties = getParties();
    let html = '<table><th>ID</th><th>Name</th><th>GST</th><th>State Code</th><th>Type</th><th>Balance</th><th>Action</th></tr>';
    parties.forEach(p => {
        let balanceClass = p.balance >= 0 ? 'green' : 'red';
        let balanceText = p.balance >= 0 ? `₹${p.balance} (Receivable)` : `₹${Math.abs(p.balance)} (Payable)`;
        html += `<tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${p.gst}</td>
            <td>${p.stateCode}</td>
            <td>${p.type}</td>
            <td class="${balanceClass}">${balanceText}</td>
            <td><button class="danger" onclick="deleteParty('${p.id}')">Delete</button>
            <button onclick="showPaymentModal('${p.id}','${p.name}')">Payment</button></td>
        </tr>`;
    });
    html += '</table>';
    document.getElementById('partyList').innerHTML = html;
}

function addParty() {
    const name = document.getElementById('partyName').value;
    const gst = document.getElementById('partyGST').value;
    const stateCode = document.getElementById('partyStateCode').value;
    const type = document.getElementById('partyType').value;
    if (!name) return alert('Enter Party Name');
    let parties = getParties();
    const newId = 'P' + String(parties.length + 1).padStart(3, '0');
    parties.push({ id: newId, name, gst, stateCode, phone: '', address: '', type, balance: 0 });
    saveParties(parties);
    renderParties();
    document.getElementById('partyName').value = '';
    document.getElementById('partyGST').value = '';
    document.getElementById('partyStateCode').value = '';
}

function deleteParty(id) {
    if(confirm('Delete this party?')) {
        let parties = getParties();
        parties = parties.filter(p => p.id !== id);
        saveParties(parties);
        renderParties();
    }
}

function showPaymentModal(partyId, partyName) {
    let modal = document.getElementById('paymentModal');
    document.getElementById('modalPartyId').value = partyId;
    document.getElementById('modalPartyName').innerText = partyName;
    modal.style.display = 'block';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

function submitPayment() {
    let partyId = document.getElementById('modalPartyId').value;
    let amount = parseFloat(document.getElementById('paymentAmount').value);
    let type = document.getElementById('paymentType').value;
    let note = document.getElementById('paymentNote').value;
    if(!amount) return alert('Enter amount');
    addPayment(partyId, amount, type, note);
    closePaymentModal();
    renderParties();
    alert('Payment recorded!');
}

// ============ ITEM PAGE ============
function loadItems() { renderItems(); }

function renderItems() {
    const items = getItems();
    let html = '</table><th>ID</th><th>Name</th><th>HSN</th><th>Sale Rate</th><th>GST%</th><th>Stock</th><th>Status</th><th>Action</th></tr>';
    items.forEach(i => {
        let status = i.stock < i.minStock ? '<span class="red">Low Stock</span>' : '<span class="green">OK</span>';
        html += `<tr>
            <td>${i.id}</td>
            <td>${i.name}</td>
            <td>${i.hsn}</td>
            <td>₹${i.saleRate}</td>
            <td>${i.gst}%</td>
            <td>${i.stock}</td>
            <td>${status}</td>
            <td><button class="danger" onclick="deleteItem('${i.id}')">Delete</button>
            <button onclick="addStock('${i.id}')">+Stock</button></td>
        </tr>`;
    });
    html += '</table>';
    document.getElementById('itemList').innerHTML = html;
}

function addItem() {
    const name = document.getElementById('itemName').value;
    const rate = parseFloat(document.getElementById('itemRate').value);
    const gst = parseFloat(document.getElementById('itemGST').value);
    if (!name) return alert('Enter Item Name');
    let items = getItems();
    const newId = 'I' + String(items.length + 1).padStart(3, '0');
    items.push({ id: newId, name, hsn: '0000', unit: 'Pcs', purchaseRate: rate, saleRate: rate, gst, stock: 0, minStock: 10 });
    saveItems(items);
    renderItems();
    document.getElementById('itemName').value = '';
    document.getElementById('itemRate').value = '';
    document.getElementById('itemGST').value = '';
}

function deleteItem(id) {
    if(confirm('Delete this item?')) {
        let items = getItems();
        items = items.filter(i => i.id !== id);
        saveItems(items);
        renderItems();
    }
}

function addStock(itemId) {
    let qty = prompt('Enter quantity to add:');
    if(qty && !isNaN(qty)) {
        updateStock(itemId, parseInt(qty), false);
        renderItems();
    }
}

// ============ ACCOUNT PAGE (GST + Payment History + Expense) ============
function loadAccounts() {
    renderTransactions();
    updateGSTStats();
    renderPaymentHistory();
    renderExpenseList();
}

function renderTransactions() {
    const transactions = getTransactions();
    let html = '<h3>GST Transactions</h3> <table><tr><th>Date</th><th>Party</th><th>Type</th><th>Amount</th><th>GST Type</th><th>GST Amount</th></tr>';
    transactions.forEach(t => {
        html += `<tr><td>${t.date}</td><td>${t.party}</td><td>${t.type}</td><td class="${t.type === 'Sale' ? 'green' : 'red'}">₹${t.amount}</td><td>${t.gstType || '-'}</td><td>₹${t.gstAmount || 0}</td></tr>`;
    });
    html += '</table>';
    document.getElementById('transactionList').innerHTML = html;
}

function updateGSTStats() {
    const transactions = getTransactions();
    let inputGST = 0, outputGST = 0;
    transactions.forEach(t => {
        if (t.type === 'Purchase') inputGST += t.gstAmount || 0;
        if (t.type === 'Sale') outputGST += t.gstAmount || 0;
    });
    document.getElementById('inputGST').innerText = inputGST.toFixed(2);
    document.getElementById('outputGST').innerText = outputGST.toFixed(2);
    document.getElementById('netGST').innerText = (outputGST - inputGST).toFixed(2);
}

function addTransaction() {
    const party = document.getElementById('transParty').value;
    const amount = parseFloat(document.getElementById('transAmount').value);
    const type = document.getElementById('transType').value;
    if (!party || !amount) return alert('Fill all fields');
    let transactions = getTransactions();
    transactions.push({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        party, amount, type,
        gstType: type === 'Sale' ? 'Output' : 'Input',
        gstAmount: amount * 0.18
    });
    saveTransactions(transactions);
    renderTransactions();
    updateGSTStats();
}

function renderPaymentHistory() {
    let payments = getPayments();
    let parties = getParties();
    let html = '<h3>Payment History</h3><table><tr><th>Date</th><th>Party</th><th>Type</th><th>Amount</th><th>Note</th></tr>';
    payments.forEach(p => {
        let party = parties.find(pr => pr.id === p.partyId);
        html += `<tr><td>${p.date}</td><td>${party ? party.name : p.partyId}</td><td class="${p.type === 'receive' ? 'green' : 'red'}">${p.type === 'receive' ? 'Received' : 'Given'}</td><td>₹${p.amount}</td><td>${p.note || '-'}</td></tr>`;
    });
    html += '</table>';
    document.getElementById('paymentHistory').innerHTML = html;
}

function renderExpenseList() {
    let expenses = getExpenses();
    let html = '<h3>Expenses</h3><table><tr><th>Date</th><th>Name</th><th>Category</th><th>Amount</th></tr>';
    expenses.forEach(e => {
        html += `<tr><td>${e.date}</td><td>${e.name}</td><td>${e.category}</td><td class="red">₹${e.amount}</td></tr>`;
    });
    html += '</table>';
    document.getElementById('expenseList').innerHTML = html;
}

function addExpenseFromAccounts() {
    let name = document.getElementById('expenseName').value;
    let amount = parseFloat(document.getElementById('expenseAmount').value);
    let category = document.getElementById('expenseCategory').value;
    if(!name || !amount) return alert('Fill all fields');
    addExpense(name, amount, category);
    renderExpenseList();
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
}

// ============ HOME PAGE ============
function loadHome() {
    const items = getItems();
    const parties = getParties();
    const transactions = getTransactions();
    const payments = getPayments();
    const expenses = getExpenses();
    
    let totalStockValue = items.reduce((sum, i) => sum + (i.stock * i.saleRate), 0);
    let totalSales = transactions.filter(t => t.type === 'Sale').reduce((sum, t) => sum + t.amount, 0);
    let totalPurchases = transactions.filter(t => t.type === 'Purchase').reduce((sum, t) => sum + t.amount, 0);
    let totalReceivable = parties.filter(p => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);
    let totalPayable = parties.filter(p => p.balance < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);
    let totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    document.getElementById('totalParties').innerText = parties.length;
    document.getElementById('totalItems').innerText = items.length;
    document.getElementById('totalStockValue').innerText = totalStockValue.toFixed(2);
    document.getElementById('totalSales').innerText = totalSales.toFixed(2);
    document.getElementById('totalReceivable').innerText = totalReceivable.toFixed(2);
    document.getElementById('totalPayable').innerText = totalPayable.toFixed(2);
    document.getElementById('totalExpenses').innerText = totalExpenses.toFixed(2);
    
    let lowStockHtml = '<ul>';
    items.filter(i => i.stock < i.minStock).forEach(i => {
        lowStockHtml += `<li>${i.name} - Stock: ${i.stock} (Min: ${i.minStock})</li>`;
    });
    lowStockHtml += '</ul>';
    document.getElementById('lowStockList').innerHTML = lowStockHtml || '<p>All stocks OK</p>';
}
