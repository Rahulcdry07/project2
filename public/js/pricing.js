document.addEventListener('DOMContentLoaded', () => {
    const plansGrid = document.getElementById('plans-grid');

    async function fetchPlans() {
        try {
            const response = await fetch('/api/plans');
            const result = await response.json();

            if (result.success) {
                displayPlans(result.plans);
            } else {
                console.error('Failed to load plans:', result.message);
                plansGrid.innerHTML = '<p>Failed to load plans. Please try again later.</p>';
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            plansGrid.innerHTML = '<p>Network error. Failed to load plans.</p>';
        }
    }

    function displayPlans(plans) {
        plansGrid.innerHTML = '';
        plans.forEach(plan => {
            const planCard = document.createElement('div');
            planCard.className = 'plan-card';
            planCard.innerHTML = `
                <h2>${plan.name}</h2>
                <div class="price">$${parseFloat(plan.price).toFixed(2)}<span>/month</span></div>
                <p>${plan.description}</p>
                <ul>
                    ${plan.features.split(',').map(feature => `<li><i class="fas fa-check-circle"></i> ${feature.trim()}</li>`).join('')}
                </ul>
                <button class="btn-select" data-plan-id="${plan.id}">Select Plan</button>
            `;
            plansGrid.appendChild(planCard);
        });

        attachPlanSelectionListeners();
    }

    function attachPlanSelectionListeners() {
        document.querySelectorAll('.btn-select').forEach(button => {
            button.addEventListener('click', async (e) => {
                const planId = e.target.dataset.planId;
                if (confirm(`Are you sure you want to subscribe to the plan?`)) {
                    try {
                        const response = await fetch('/api/subscribe', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ plan_id: planId })
                        });
                        const result = await response.json();

                        if (result.success) {
                            alert(result.message);
                            window.location.href = 'dashboard.html'; // Redirect to dashboard
                        } else {
                            alert(result.message || 'Subscription failed.');
                        }
                    } catch (error) {
                        console.error('Error subscribing:', error);
                        alert('Network error. Subscription failed.');
                    }
                }
            });
        });
    }

    fetchPlans();
});
