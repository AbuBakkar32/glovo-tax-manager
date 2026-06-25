// Regime Forfettario Constants for Glovo Riders (ATECO 53.20.00)
const COEFFICIENT = 0.67;
const INPS_RATE = 0.2607;
const TAX_RATE = 0.05;

let chartInstance = null;

// Auth Guard: Redirect if not authenticated & display user name
async function checkAuth() {
    try {
        const res = await fetch('/api/auth-check');
        const status = await res.json();

        if (!status.loggedIn) {
            window.location.href = '/login.html';
        } else {
            // Set user name dynamically in the navbar
            const nameSpan = document.getElementById('user-display-name');
            if (nameSpan) {
                // Captilizing first letter for better look
                nameSpan.innerText = status.username ? status.username.toUpperCase() : 'ADMIN';
            }
        }
    } catch (err) {
        window.location.href = '/login.html';
    }
}
checkAuth();

// Dynamic Logout Action Trigger
const logoutButton = document.getElementById('logout-btn');
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        if(confirm("Are you sure you want to logout?")) {
            const res = await fetch('/api/logout', { method: 'POST' });
            if (res.ok) {
                window.location.href = '/login.html';
            }
        }
    });
}

document.getElementById('invoice-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const gross = parseFloat(document.getElementById('gross').value) || 0;
    const tips = parseFloat(document.getElementById('tips').value) || 0;
    const taxable = (gross * COEFFICIENT);
    const inps = (taxable * INPS_RATE);
    const tax = (taxable * TAX_RATE);

    const invoiceData = {
        invoiceNum: document.getElementById('invoiceNum').value,
        month: document.getElementById('month').value,
        gross: gross,
        tips: tips,
        taxable: taxable.toFixed(2),
        inps: inps.toFixed(2),
        tax: tax.toFixed(2),
        netRemaining: (gross + tips - inps - tax).toFixed(2),
        date: new Date().toLocaleDateString()
    };

    try {
        const response = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData)
        });

        if (response.ok) {
            alert('Data successfully saved!');
            document.getElementById('invoice-form').reset();
            // Default reset input tips
            document.getElementById('tips').value = 0;
            loadDashboardData();
        } else {
            alert('Server error occurred while saving.');
        }
    } catch (err) {
        console.error("Error saving invoice:", err);
    }
});

async function loadDashboardData() {
    try {
        const response = await fetch('/api/invoices');
        if (!response.ok) throw new Error('Network error');

        const invoices = await response.json();

        let totalGross = 0, totalTaxable = 0, totalInps = 0, totalTax = 0, totalNet = 0;
        let grandTotalPayable = 0; // Addition for the table summary footer row

        const tableBody = document.getElementById('invoice-table-body');
        tableBody.innerHTML = '';

        const chartData = {
            January: 0, February: 0, March: 0, April: 0, May: 0, June: 0,
            July: 0, August: 0, September: 0, October: 0, November: 0, December: 0
        };

        if (Array.isArray(invoices)) {
            invoices.forEach(inv => {
                const gross = Number(inv.gross) || 0;
                const taxable = Number(inv.taxable) || 0;
                const inps = Number(inv.inps) || 0;
                const tax = Number(inv.tax) || 0;
                const netRemaining = Number(inv.netRemaining) || 0;

                // Calculate Total Payable (INPS + Tax)
                const totalPayable = inps + tax;

                totalGross += gross;
                totalTaxable += taxable;
                totalInps += inps;
                totalTax += tax;
                totalNet += netRemaining;
                grandTotalPayable += totalPayable;

                if (chartData[inv.month] !== undefined) {
                    chartData[inv.month] += gross;
                }

                // Row creation
                tableBody.innerHTML += `
                    <tr class="text-gray-300 border-b border-gray-700/50 hover:bg-gray-700/20 transition-all">
                        <td class="py-3 font-semibold">${inv.invoiceNum || ''}</td>
                        <td class="py-3">${inv.month || ''}</td>
                        <td class="py-3 text-right text-emerald-400">€${gross.toFixed(2)}</td>
                        <td class="py-3 text-right text-blue-400">€${taxable.toFixed(2)}</td>
                        <td class="py-3 text-right text-orange-400">€${inps.toFixed(2)}</td>
                        <td class="py-3 text-right text-red-400">€${tax.toFixed(2)}</td>
                        <td class="py-3 text-right font-bold text-yellow-500">€${totalPayable.toFixed(2)}</td>
                    </tr>
                `;
            });

            // Append the dynamic Total Section Row at the bottom of the table body
            if (invoices.length > 0) {
                tableBody.innerHTML += `
                    <tr class="bg-gray-800/80 border-t-2 border-gray-600 text-gray-100 font-bold font-mono">
                        <td class="py-3 pl-2 text-left" colspan="2">TOTAL:</td>
                        <td class="py-3 text-right text-emerald-400">€${totalGross.toFixed(2)}</td>
                        <td class="py-3 text-right text-blue-400">€${totalTaxable.toFixed(2)}</td>
                        <td class="py-3 text-right text-orange-400">€${totalInps.toFixed(2)}</td>
                        <td class="py-3 text-right text-red-400">€${totalTax.toFixed(2)}</td>
                        <td class="py-3 text-right text-yellow-500 text-lg border-l border-gray-700">€${grandTotalPayable.toFixed(2)}</td>
                    </tr>
                `;
            }
        }

        document.getElementById('stat-revenue').innerText = `€${totalGross.toFixed(2)}`;
        document.getElementById('stat-taxable').innerText = `€${totalTaxable.toFixed(2)}`;
        document.getElementById('stat-inps').innerText = `€${totalInps.toFixed(2)}`;
        document.getElementById('stat-tax').innerText = `€${totalTax.toFixed(2)}`;
        document.getElementById('stat-net').innerText = `€${totalNet.toFixed(2)}`;

        updateChart(chartData);
    } catch (err) {
        console.error("Dashboard load error:", err);
    }
}
function updateChart(chartData) {
    const ctx = document.getElementById('revenueChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(chartData),
            datasets: [{
                label: 'Gross Revenue (€)',
                data: Object.values(chartData),
                backgroundColor: 'rgba(250, 204, 21, 0.6)',
                borderColor: 'rgba(250, 204, 21, 1)',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
            },
            plugins: { legend: { labels: { color: '#f3f4f6' } } }
        }
    });
}

loadDashboardData();