// Core Application Logic (script.js) - Validated for New Config

let state = {
    user: null, // Current Auth User
    tripId: null, // Current Trip ID
    trip: null, // Trip Data
    members: [], // List of Members
    expenses: [], // List of Expenses
    editingMemberId: null,
    editingExpenseId: null
};

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("App Initializing...");

    if (!window.auth) {
        alert("System Error: Firebase Auth not loaded. Please refresh.");
        return;
    }

    window.auth.onAuthStateChanged(user => {
        if (user) {
            console.log("User Logged In:", user.uid);
            state.user = user;
            init();
        } else {
            console.log("No User, Redirecting...");
            window.location.href = 'login.html';
        }
    });
});

function init() {
    setupUI();
    checkURL();
}

function setupUI() {
    // Add Event Listeners if elements exist
    const on = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    };

    on('new-trip-btn', 'click', showNewTripForm);
    on('save-trip-btn', 'click', createTrip);
    on('cancel-trip-btn', 'click', hideNewTripForm);
    on('delete-trip-btn', 'click', deleteTrip);
    on('mark-completed-btn', 'click', toggleTripStatus);

    on('trip-select', 'change', (e) => loadTrip(e.target.value, true));

    on('add-member-btn', 'click', saveMember);
    on('add-expense-btn', 'click', saveExpense);

    // Split Method Toggles
    document.querySelectorAll('input[name="split-method"]').forEach(radio => {
        radio.addEventListener('change', updateSplitInputs);
    });

    // Load Trip List
    loadTripList();
}

function checkURL() {
    const params = new URLSearchParams(window.location.search);
    const tripId = params.get('trip');
    const isNew = params.get('new');

    if (tripId) {
        loadTrip(tripId);
    } else if (isNew) {
        showNewTripForm();
    }
}

// --- Trip List Management ---

async function loadTripList() {
    const select = document.getElementById('trip-select');
    if (!select) return;

    try {
        const snapshot = await window.db.collection('trips')
            .where('memberIds', 'array-contains', state.user.uid)
            .get();

        select.innerHTML = '<option value="" disabled selected>Select a trip...</option>';

        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${data.name} (${data.status})`;
            if (state.tripId === doc.id) option.selected = true;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Load Trip List Error:", err);
    }
}

// --- Specific Trip Management ---

async function loadTrip(tripId, updateUrl = false) {
    if (!tripId) return;
    state.tripId = tripId;

    // Update Dropdown Selection UI
    const select = document.getElementById('trip-select');
    if (select && select.value !== tripId) select.value = tripId;

    if (updateUrl) {
        const newUrl = `${window.location.pathname}?trip=${tripId}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    }

    try {
        // 1. Get Trip Doc
        const tripDoc = await window.db.collection('trips').doc(tripId).get();
        if (!tripDoc.exists) throw new Error("Trip not found");
        state.trip = tripDoc.data();

        // 2. Get Members
        const memSnap = await window.db.collection('trips').doc(tripId).collection('members').get();
        state.members = [];
        memSnap.forEach(d => state.members.push({ id: d.id, ...d.data() }));
        state.members.sort((a, b) => a.name.localeCompare(b.name));

        // 3. Get Expenses
        const expSnap = await window.db.collection('trips').doc(tripId).collection('expenses')
            .orderBy('date', 'desc').get();
        state.expenses = [];
        expSnap.forEach(d => state.expenses.push({ id: d.id, ...d.data() }));

        // Render All
        renderAll();

    } catch (err) {
        console.error("Load Trip Error:", err);
        alert("Failed to load trip: " + err.message);
    }
}

function renderAll() {
    updateTripUI();
    renderMembers();
    renderExpenses();
    renderSettlements();
}

function updateTripUI() {
    const isActive = state.trip?.status === 'active';
    const totalEl = document.getElementById('total-spending');
    if (totalEl) totalEl.textContent = `₹${(state.trip.totalSpending || 0).toLocaleString()}`;

    // Show/Hide Action Buttons based on trip status
    const markBtn = document.getElementById('mark-completed-btn');
    const delBtn = document.getElementById('delete-trip-btn');

    if (markBtn) {
        markBtn.style.display = 'flex';
        markBtn.innerHTML = '';

        if (isActive) {
            markBtn.title = "Mark as Completed";
            // Check Icon
            markBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        } else {
            markBtn.title = "Reopen Trip";
            // Reopen Icon
            markBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`;
        }
    }
    if (delBtn) delBtn.style.display = 'flex';

    // Disable inputs if completed
    const inputs = document.querySelectorAll('input, select, button.secondary, #add-expense-btn, #add-member-btn');
    inputs.forEach(el => {
        // Don't disable navigation/global buttons
        if (el.id === 'trip-select' || el.id === 'new-trip-btn' ||
            el.id === 'mark-completed-btn' || el.id === 'delete-trip-btn') return;
        el.disabled = !isActive;
    });
}

// --- New Trip Creation ---

function showNewTripForm() {
    document.getElementById('trip-select-container').style.display = 'none';
    document.getElementById('new-trip-form').style.display = 'flex';
    document.getElementById('new-trip-name').focus();
}

function hideNewTripForm() {
    document.getElementById('new-trip-form').style.display = 'none';
    document.getElementById('trip-select-container').style.display = 'flex';
    document.getElementById('new-trip-name').value = '';
}

async function createTrip() {
    const name = document.getElementById('new-trip-name').value.trim();
    if (!name) return alert("Enter a trip name");

    try {
        const tripRef = await window.db.collection('trips').add({
            name: name,
            createdBy: state.user.uid,
            memberIds: [state.user.uid],
            status: 'active',
            totalSpending: 0,
            expenseCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Add 'Me' as member
        await tripRef.collection('members').add({
            name: state.user.displayName || "Me",
            userId: state.user.uid,
            addedBy: state.user.uid,
            isUser: true
        });

        hideNewTripForm();
        loadTripList(); // Refresh dropdown
        loadTrip(tripRef.id, true); // Load it

    } catch (err) {
        alert("Error creating trip: " + err.message);
    }
}

// --- Member Logic ---

async function saveMember() {
    const input = document.getElementById('new-member-name');
    const name = input.value.trim();
    if (!name) return alert("Enter member name");

    try {
        const coll = window.db.collection('trips').doc(state.tripId).collection('members');

        if (state.editingMemberId) {
            await coll.doc(state.editingMemberId).update({ name });
            state.editingMemberId = null;
            document.getElementById('add-member-btn').textContent = "Add";
        } else {
            await coll.add({
                name,
                addedBy: state.user.uid
            });
        }
        input.value = '';
        loadTrip(state.tripId); // Reload to update lists

    } catch (err) {
        alert("Error saving member: " + err.message);
    }
}

function renderMembers() {
    const list = document.getElementById('members-list');
    if (!list) return;
    list.innerHTML = '';

    state.members.forEach(m => {
        const item = document.createElement('div');
        item.className = 'list-item';
        // Only allow edit/delete if trip is active
        const actions = state.trip?.status === 'active' ? `
            <div class="member-actions" style="display: flex; gap: 8px;">
                <button onclick="window.appEditMember('${m.id}', '${m.name}')" class="action-icon-btn">✎</button>
                <button onclick="window.appDeleteMember('${m.id}')" class="action-icon-btn" style="color:red;">🗑</button>
            </div>
        ` : '';

        item.innerHTML = `<span>${m.name}</span>${actions}`;
        list.appendChild(item);
    });

    // Update the dropdowns in expense form
    populateMemberDropdowns();
}

// --- Exposed Member Actions ---
window.appEditMember = (id, name) => {
    state.editingMemberId = id;
    const input = document.getElementById('new-member-name');
    input.value = name;
    input.focus();
    document.getElementById('add-member-btn').textContent = "Update";
};

window.appDeleteMember = async (id) => {
    if (!confirm("Remove this member?")) return;
    try {
        await window.db.collection('trips').doc(state.tripId).collection('members').doc(id).delete();
        loadTrip(state.tripId);
    } catch (e) { alert(e.message); }
};

// --- Expense UI Helper ---

function populateMemberDropdowns() {
    const payerSelect = document.getElementById('expense-payer');
    const beneficiariesDiv = document.getElementById('expense-beneficiaries');

    // Save current payer selection if any
    const currentPayer = payerSelect.value;

    payerSelect.innerHTML = '<option value="" disabled selected>Paid by...</option>';
    beneficiariesDiv.innerHTML = '';

    state.members.forEach(m => {
        // Payer Option
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        payerSelect.appendChild(opt);

        // Beneficiary Checkbox
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <label style="flex: 1;">
                <input type="checkbox" value="${m.id}" checked> 
                <span>${m.name}</span>
            </label>
            <input type="number" class="manual-split-input" data-uid="${m.id}" placeholder="Amount" 
                style="width: 80px; padding: 4px; display: none; font-size: 0.8rem;">
        `;
        beneficiariesDiv.appendChild(div);
    });

    // Restore payer if still valid
    if (state.members.find(m => m.id === currentPayer)) {
        payerSelect.value = currentPayer;
    }

    updateSplitInputs(); // Ensure visibility is correct
}

function updateSplitInputs() {
    const method = document.querySelector('input[name="split-method"]:checked').value;
    const isManual = method === 'manual';

    document.querySelectorAll('.manual-split-input').forEach(inp => {
        inp.style.display = isManual ? 'block' : 'none';
    });
}

// --- Expense Logic ---

async function saveExpense() {
    const desc = document.getElementById('expense-desc').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const payerId = document.getElementById('expense-payer').value;
    const splitMethod = document.querySelector('input[name="split-method"]:checked').value;

    if (!desc || !amount || !payerId) return alert("Fill all fields");

    // Gather Beneficiaries
    const checks = Array.from(document.querySelectorAll('#expense-beneficiaries input[type="checkbox"]:checked'));
    if (!checks.length) return alert("Select at least one split person");

    let beneficiaries = [];
    if (splitMethod === 'manual') {
        let sum = 0;
        for (let cb of checks) {
            const uid = cb.value;
            const val = parseFloat(document.querySelector(`.manual-split-input[data-uid="${uid}"]`).value) || 0;
            if (val <= 0) return alert("Invalid split amount");
            sum += val;
            beneficiaries.push({ id: uid, amount: val });
        }
        if (Math.abs(sum - amount) > 0.1) return alert(`Split sum (${sum}) != Total (${amount})`);
    } else {
        beneficiaries = checks.map(c => c.value); // IDs only
    }

    // Save to DB
    try {
        const batch = window.db.batch();
        const tripRef = window.db.collection('trips').doc(state.tripId);

        let amountDiff = amount;

        if (state.editingExpenseId) {
            // Edit
            const ref = tripRef.collection('expenses').doc(state.editingExpenseId);
            // Get old amount to adjust total
            const oldExp = state.expenses.find(e => e.id === state.editingExpenseId);
            if (oldExp) amountDiff = amount - oldExp.amount;

            batch.update(ref, {
                description: desc,
                amount: amount,
                payerId,
                beneficiaries,
                splitMethod,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            state.editingExpenseId = null;
            document.getElementById('add-expense-btn').textContent = "Add Expense";
        } else {
            // New
            const ref = tripRef.collection('expenses').doc();
            batch.set(ref, {
                description: desc,
                amount: amount,
                payerId,
                beneficiaries,
                splitMethod,
                date: firebase.firestore.FieldValue.serverTimestamp()
            });
            batch.update(tripRef, { expenseCount: firebase.firestore.FieldValue.increment(1) });
        }

        // Update Total
        if (Math.abs(amountDiff) > 0.01) {
            batch.update(tripRef, { totalSpending: firebase.firestore.FieldValue.increment(amountDiff) });
        }

        await batch.commit();

        // Reset Form
        document.getElementById('expense-desc').value = '';
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-payer').value = '';
        document.querySelector('input[name="split-method"][value="equal"]').checked = true;

        loadTrip(state.tripId);

    } catch (e) {
        alert("Error saving expense: " + e.message);
    }
}

function renderExpenses() {
    const list = document.getElementById('expenses-list');
    if (!list) return;
    list.innerHTML = '';

    // Create Map for Name Lookups
    const nameMap = {};
    state.members.forEach(m => nameMap[m.id] = m.name);

    state.expenses.forEach(exp => {
        const div = document.createElement('div');
        div.className = 'list-item';
        // Only allow actions if active
        const actions = state.trip?.status === 'active' ? `
             <div class="expense-actions" style="display: flex; gap: 4px;">
                <button onclick="window.appEditExpense('${exp.id}')" class="action-icon-btn">✎</button>
                <button onclick="window.appDeleteExpense('${exp.id}', ${exp.amount})" class="action-icon-btn" style="color:red;">🗑</button>
            </div>
        ` : '';

        div.innerHTML = `
            <div class="expense-details">
                <strong>${exp.description}</strong>
                <div class="expense-meta">Paid by ${nameMap[exp.payerId] || 'Unknown'}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="expense-amount">₹${exp.amount}</div>
                ${actions}
            </div>
        `;
        list.appendChild(div);
    });
}

// --- Exposed Expense Actions ---
window.appEditExpense = (id) => {
    const exp = state.expenses.find(e => e.id === id);
    if (!exp) return;
    state.editingExpenseId = id;

    document.getElementById('expense-desc').value = exp.description;
    document.getElementById('expense-amount').value = exp.amount;
    document.getElementById('expense-payer').value = exp.payerId;

    // Set Method
    const method = exp.splitMethod || 'equal';
    document.querySelector(`input[name="split-method"][value="${method}"]`).checked = true;
    updateSplitInputs(); // toggle inputs visibility

    // Set Beneficiaries
    document.querySelectorAll('#expense-beneficiaries input[type="checkbox"]').forEach(c => c.checked = false);

    if (method === 'manual') {
        exp.beneficiaries.forEach(ben => {
            const cb = document.querySelector(`#expense-beneficiaries input[value="${ben.id}"]`);
            if (cb) {
                cb.checked = true;
                const inp = document.querySelector(`.manual-split-input[data-uid="${ben.id}"]`);
                if (inp) inp.value = ben.amount;
            }
        });
    } else {
        // Equal: array of IDs
        exp.beneficiaries.forEach(bid => {
            const cb = document.querySelector(`#expense-beneficiaries input[value="${bid}"]`);
            if (cb) cb.checked = true;
        });
    }

    document.getElementById('add-expense-btn').textContent = "Update Expense";
    document.getElementById('expense-desc').scrollIntoView();
};

window.appDeleteExpense = async (id, amount) => {
    if (!confirm("Delete this expense?")) return;
    try {
        const batch = window.db.batch();
        const tRef = window.db.collection('trips').doc(state.tripId);
        batch.delete(tRef.collection('expenses').doc(id));
        batch.update(tRef, {
            totalSpending: firebase.firestore.FieldValue.increment(-amount),
            expenseCount: firebase.firestore.FieldValue.increment(-1)
        });
        await batch.commit();
        loadTrip(state.tripId);
    } catch (e) { alert(e.message); }
};

// --- Settlement & Debt Logic (Calculations) ---

function renderSettlements() {
    const list = document.getElementById('settlements-list');
    const memberGrid = document.getElementById('member-spending-grid');
    if (!list || !memberGrid) return;

    list.innerHTML = '';
    memberGrid.innerHTML = '';

    // calculation
    const balances = {};
    const paid = {};
    const share = {};

    state.members.forEach(m => { balances[m.id] = 0; paid[m.id] = 0; share[m.id] = 0; });

    state.expenses.forEach(exp => {
        const amt = parseFloat(exp.amount) || 0;
        const payer = exp.payerId;
        if (!balances.hasOwnProperty(payer)) return; // skip if payer deleted

        // Add to payer
        balances[payer] += amt;
        paid[payer] += amt;

        // Subtract from beneficiaries
        let bens = exp.beneficiaries || [];
        if (exp.splitMethod === 'manual') {
            bens.forEach(b => {
                if (balances.hasOwnProperty(b.id)) {
                    balances[b.id] -= b.amount;
                    share[b.id] += b.amount;
                }
            });
        } else {
            const splitAmt = amt / (bens.length || 1);
            bens.forEach(bid => {
                if (balances.hasOwnProperty(bid)) {
                    balances[bid] -= splitAmt;
                    share[bid] += splitAmt;
                }
            });
        }
    });

    // 1. Render Spending Grid
    state.members.forEach(m => {
        const card = document.createElement('div');
        card.className = 'member-spending-card';
        card.innerHTML = `
            <div class="member-name">${m.name}</div>
            <div class="spending-info">
                <div class="spending-row"><span class="spending-label">Paid</span><span>₹${paid[m.id].toLocaleString()}</span></div>
                <div class="spending-row"><span class="spending-label">Share</span><span>₹${share[m.id].toLocaleString()}</span></div>
            </div>
        `;
        memberGrid.appendChild(card);
    });

    // 2. Render Settlements (Greedy/Simplify Algorithm)
    const debtors = [];
    const creditors = [];

    for (let uid in balances) {
        const val = balances[uid];
        if (val < -0.01) debtors.push({ id: uid, amount: val }); // owes money
        else if (val > 0.01) creditors.push({ id: uid, amount: val }); // owed money
    }

    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const d = debtors[i];
        const c = creditors[j];

        const amountToSettle = Math.min(Math.abs(d.amount), c.amount);

        // Find names
        const dName = state.members.find(m => m.id === d.id)?.name || 'Unknown';
        const cName = state.members.find(m => m.id === c.id)?.name || 'Unknown';

        // Render UI Item
        const div = document.createElement('div');
        div.className = 'settlement-item';
        div.innerHTML = `
             <div class="settlement-visual">
                <span class="person-badge">${dName}</span>
                <span style="margin: 0 12px; color: var(--text-secondary);">→</span>
                <span class="person-badge">${cName}</span>
            </div>
            <span class="settlement-amount">₹${amountToSettle.toFixed(2)}</span>
        `;
        list.appendChild(div);

        // adjust
        d.amount += amountToSettle;
        c.amount -= amountToSettle;

        if (Math.abs(d.amount) < 0.01) i++;
        if (c.amount < 0.01) j++;
    }

    if (list.children.length === 0) list.innerHTML = '<div style="padding:10px;color:#888;">No settlements needed.</div>';
}

// Extras: Trip Status Toggles
async function toggleTripStatus() {
    if (!state.tripId) return;

    const oldStatus = state.trip.status;
    const newStatus = oldStatus === 'active' ? 'completed' : 'active';

    // 1. Optimistic Update
    state.trip.status = newStatus;
    updateTripUI();

    try {
        await window.db.collection('trips').doc(state.tripId).update({ status: newStatus });
        loadTripList(); // Refresh dropdown
    } catch (e) {
        console.error(e);
        // Revert UI
        state.trip.status = oldStatus;
        updateTripUI();
        alert("Action failed: " + e.message);
    }
}

async function deleteTrip() {
    if (!confirm("This will permanently delete the trip and all expenses. Continue?")) return;
    try {
        // Firestore doesn't delete subcollections automatically, ideally use Cloud Functions,
        // but for client side, we batch delete what we can see.
        // (Simplified for robustness: just delete trip doc + what we loaded)

        const batch = window.db.batch();

        // Delete loaded expenses
        state.expenses.forEach(e => {
            batch.delete(window.db.collection('trips').doc(state.tripId).collection('expenses').doc(e.id));
        });

        // Delete loaded members
        state.members.forEach(m => {
            batch.delete(window.db.collection('trips').doc(state.tripId).collection('members').doc(m.id));
        });

        batch.delete(window.db.collection('trips').doc(state.tripId));

        await batch.commit();

        alert("Trip deleted.");
        window.location.href = 'dashboard.html';
    } catch (e) { alert("Error deleting: " + e.message); }
}
