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
}

// ============ सभी पेजों के लिए कॉमन फंक्शन ============
function getParties() { return JSON.parse(localStorage.getItem('parties')) || []; }
function getItems() { return JSON.parse(localStorage.getItem('items')) || []; }
function getTransactions() { return JSON.parse(localStorage.getItem('transactions')) || []; }
function getInvoices() { return JSON.parse(localStorage.getItem('invoices')) || []; }

function saveParties(data) { localStorage.setItem('parties', JSON.stringify(data)); }
function saveItems(data) { localStorage.setItem('items', JSON.stringify(data)); }
function saveTransactions(data) { localStorage.setItem('transactions', JSON.stringify(data)); }
function saveInvoices(data) { localStorage.setItem('invoices', JSON.stringify(data)); }

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

// ============ पेज के हिसाब से फंक्शन लोड ============
window.onload = function() {
    initData();
    const page = document.body.getAttribute('data-page');
    
    if (page === 'parties') loadParties();
    else if (page === 'items') loadItems();
    else if (page === 'accounts') loadAccounts();
    else if (page === 'home') loadHome();
};

// ============ PARTY PAGE ============
function loadParties() {
    renderParties();
}

function renderParties() {
    const parties = getParties();
    let html = '<tr><th>ID</th><th>Name</th><th>GST</th><th>State Code</th><th>Type</th><th>Balance</th><th>Action</th></tr>';
    parties.forEach(p => {
        html += `<tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${p.gst}</td>
            <td>${p.stateCode}</td>
            <td>${p.type}</td>
            <td class="${p.balance >= 0 ? 'green' : 'red'}">₹${p.balance}</td>
            <td><button class="danger" onclick="deleteParty('${p.id}')">Delete</button></td>
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

// ============ ITEM PAGE ============
function loadItems() {
    renderItems();
}

function renderItems() {
    const items = getItems();
    let html = '<table><th>ID</th><th>Name</th><th>HSN</th><th>Sale Rate</th><th>GST%</th><th>Stock</th><th>Status</th><th>Action</th></tr>';
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
            <td><button class="danger" onclick="deleteItem('${i.id}')">Delete</button></td>
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

// ============ ACCOUNT PAGE ============
function loadAccounts() {
    renderTransactions();
    updateGSTStats();
}

function renderTransactions() {
    const transactions = getTransactions();
    let html = '<h3>Transaction History</h3><table><th>Date</th><th>Party</th><th>Type</th><th>Amount</th><th>GST Type</th><th>GST Amount</th></tr>';
    transactions.forEach(t => {
        html += `<tr>
            <td>${t.date}</td>
            <td>${t.party}</td>
            <td>${t.type}</td>
            <td class="${t.type === 'Sale' ? 'green' : 'red'}">₹${t.amount}</td>
            <td>${t.gstType || '-'}</td>
            <td>₹${t.gstAmount || 0}</td>
        </tr>`;
    });
    html += '<table>';
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
        party,
        amount,
        type,
        gstType: type === 'Sale' ? 'Output' : 'Input',
        gstAmount: amount * 0.18
    });
    saveTransactions(transactions);
    renderTransactions();
    updateGSTStats();
}

// ============ HOME PAGE (Dashboard) ============
function loadHome() {
    const items = getItems();
    const parties = getParties();
    const transactions = getTransactions();
    
    let totalStockValue = 0;
    items.forEach(i => { totalStockValue += i.stock * i.saleRate; });
    
    let totalSales = 0, totalPurchases = 0;
    transactions.forEach(t => {
        if (t.type === 'Sale') totalSales += t.amount;
        if (t.type === 'Purchase') totalPurchases += t.amount;
    });
    
    document.getElementById('totalParties').innerText = parties.length;
    document.getElementById('totalItems').innerText = items.length;
    document.getElementById('totalStockValue').innerText = totalStockValue.toFixed(2);
    document.getElementById('totalSales').innerText = totalSales.toFixed(2);
    document.getElementById('totalPurchases').innerText = totalPurchases.toFixed(2);
    
    let lowStockHtml = '<ul>';
    items.filter(i => i.stock < i.minStock).forEach(i => {
        lowStockHtml += `<li>${i.name} - Stock: ${i.stock} (Min: ${i.minStock})</li>`;
    });
    lowStockHtml += '</ul>';
    document.getElementById('lowStockList').innerHTML = lowStockHtml || '<p>All stocks OK</p>';
}
