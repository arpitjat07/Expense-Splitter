// Dashboard Logic - Validated for New Config

document.addEventListener('DOMContentLoaded', () => {
    // New Trip Button - Redirects to main app with param
    const newTripBtn = document.getElementById('new-trip-btn');
    if (newTripBtn) {
        newTripBtn.addEventListener('click', () => {
            window.location.href = 'index.html?new=true';
        });
    }

    // Check Auth
    if (window.auth) {
        window.auth.onAuthStateChanged(user => {
            if (user) {
                console.log("Dashboard: User authenticated", user.uid);
                loadDashboard(user);
            } else {
                console.log("Dashboard: No user, redirecting to login");
                window.location.href = 'login.html';
            }
        });
    } else {
        console.error("Firebase Auth not found!");
    }
});

async function loadDashboard(user) {
    const activeDiv = document.getElementById('active-trips');
    const completedDiv = document.getElementById('completed-trips');
    const activeCountSpan = document.getElementById('active-count');
    const completedCountSpan = document.getElementById('completed-count');

    activeDiv.innerHTML = '<div class="loading">Loading trips...</div>';
    completedDiv.innerHTML = '<div class="loading">Loading trips...</div>';

    try {
        // Query trips where user is a member
        const snapshot = await window.db.collection('trips')
            .where('memberIds', 'array-contains', user.uid)
            .get();

        const trips = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            trips.push({
                id: doc.id,
                name: data.name,
                status: data.status || 'active',
                totalSpending: data.totalSpending || 0,
                expenseCount: data.expenseCount || 0,
                memberCount: (data.memberIds && data.memberIds.length) || 1
            });
        });

        // Filter
        const active = trips.filter(t => t.status === 'active');
        const completed = trips.filter(t => t.status === 'completed');

        // Render Active
        if (active.length > 0) {
            activeDiv.innerHTML = active.map(t => createTripCard(t)).join('');
            activeCountSpan.textContent = active.length;
        } else {
            activeDiv.innerHTML = getEmptyState('active');
            activeCountSpan.textContent = '0';
        }

        // Render Completed
        if (completed.length > 0) {
            completedDiv.innerHTML = completed.map(t => createTripCard(t)).join('');
            completedCountSpan.textContent = completed.length;
        } else {
            completedDiv.innerHTML = getEmptyState('completed');
            completedCountSpan.textContent = '0';
        }

    } catch (error) {
        console.error("Error loading trips:", error);
        activeDiv.innerHTML = '<div class="error">Failed to load trips. Check your network or permissions.</div>';
    }
}

function createTripCard(trip) {
    return `
    <div class="trip-card" onclick="window.location.href='index.html?trip=${trip.id}'">
        <div class="trip-card-header">
            <div class="trip-name">${trip.name}</div>
            <span class="trip-status ${trip.status}">${trip.status}</span>
        </div>
        <div class="trip-stats">
            <div class="trip-stat">
                <span class="trip-stat-label">Total Spending</span>
                <span class="trip-stat-value">₹${trip.totalSpending.toLocaleString()}</span>
            </div>
            <div class="trip-stat">
                <span class="trip-stat-label">Members</span>
                <span class="trip-stat-value">${trip.memberCount}</span>
            </div>
             <div class="trip-stat">
                <span class="trip-stat-label">Expenses</span>
                <span class="trip-stat-value">${trip.expenseCount}</span>
            </div>
        </div>
    </div>
    `;
}

function getEmptyState(type) {
    if (type === 'active') {
        return `
        <div class="empty-state">
            <div class="empty-state-icon">🌍</div>
            <div class="empty-state-text">No active trips. Click "New Trip" to start!</div>
        </div>
        `;
    }
    return `
    <div class="empty-state">
        <div class="empty-state-icon">✓</div>
        <div class="empty-state-text">No completed trips yet.</div>
    </div>
    `;
}
