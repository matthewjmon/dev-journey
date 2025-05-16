const ingredientInput = document.querySelector('#ingredient-input');
const ingredientForm = document.querySelector('#ingredient-form');
const mealName = document.querySelector('#meal-name');
const mealImage = document.querySelector('#meal-image');
const ordersList = document.querySelector('#orders-list');
const completeOrderForm = document.querySelector('#complete-order-form');
const orderNumberInput = document.getElementById('order-number');
const mealSuggestionsSection = document.getElementById('suggestions-section');
const suggestionHeadingContainer = document.getElementById('suggestion-heading-container');
const suggestionError = document.getElementById('suggestion-error');
const suggestionCardContainer = document.getElementById('suggestion-card-container');


ingredientForm.addEventListener('submit', function (event) {
    event.preventDefault();

    // Get and format the input
    const formattedInput = ingredientInput.value.toLowerCase().replace(/\s+/g, "_");

    // Start the recursive fetch
    fetchMeal(formattedInput);

    displaySuggestions(formattedInput);
});

// Function to display meal suggestions based on entered ingredient

function displaySuggestions(ingredient) {
    // Clear previous suggestions
    suggestionCardContainer.innerHTML = "";
    suggestionHeadingContainer.innerHTML = "";
    suggestionError.innerHTML = "";

    fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`)
        .then(response => response.json())
        .then(data => {
            if (data.meals === null) {
                suggestionError.innerHTML = "No meals found for that ingredient. Please try another one.";
                return;
            }

            // Create or update heading
            let suggestionHeading = document.getElementById('suggestion-heading');
            if (!suggestionHeading) {
                suggestionHeading = document.createElement('h4');
                suggestionHeading.id = 'suggestion-heading';
                suggestionHeadingContainer.appendChild(suggestionHeading);
            }
            // No class toggling here, just add once
            suggestionHeading.innerHTML = `Meals containing ${ingredientInput.value.toLowerCase()}:`;
            suggestionHeading.classList.add('animate-fancyFadeScale');

            // Create cards for each meal with staggered animation delay
            data.meals.forEach((meal, index) => {
                const card = document.createElement('div');
                card.className = 'suggestion-card card shadow-lg rounded-4 animate-fancyFadeScale';
                card.style.width = '14rem';
                card.style.cursor = 'pointer';

                // Add staggered animation delay for each card
                card.style.animationDelay = `${index * 0.15}s`;

                // Image
                const img = document.createElement('img');
                img.src = meal.strMealThumb;
                img.className = 'card-img-top rounded-4';
                img.alt = meal.strMeal;

                // Card body
                const body = document.createElement('div');
                body.className = 'card-body text-center';

                const title = document.createElement('h6');
                title.className = 'suggestion-card-title card-title text-center fw-semibold mt-2 mb-3';
                title.textContent = meal.strMeal;

                body.appendChild(title);
                card.appendChild(img);
                card.appendChild(body);

                // Click the card to add the order
                card.addEventListener('click', () => {
                    addOrder(meal);
                    alert(`Ordered: ${meal.strMeal}`);
                });

                // Append to container
                suggestionCardContainer.appendChild(card);
            });
        });
}




// Function to fetch meal
function fetchMeal(ingredient) {
    fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`)
        .then(response => response.json())
        .then(data => {
            // If no meals found, alert and return 
            if (data.meals === null) {
                alert("No meals found for that ingredient. Please try another one.");
                return;
            }

            // Choose a random meal from the array length
            const randMealIndex = Math.floor(Math.random() * data.meals.length);
            const meal = data.meals[randMealIndex];

            // Update DOM
            mealName.innerHTML = meal.strMeal;
            mealImage.src = meal.strMealThumb;

            // Call addOrder function
            addOrder(meal, ingredient);
        })
       .catch(err => console.error("Fetch error:", err));
}


// Order handling logic ---------------------------------------------------

function addOrder(meal) {
  // Get and update order count
  let orderCount = parseInt(sessionStorage.getItem('orderCount')) || 0;
  orderCount++;
  sessionStorage.setItem('orderCount', orderCount);

  // Store the meal
  sessionStorage.setItem(`order_${orderCount}`, JSON.stringify(meal));

  // Add to DOM
  const orderItem = document.createElement('li');
  orderItem.className = "list-group-item";
  orderItem.textContent = `#${orderCount}: ${meal.strMeal}`;
  ordersList.appendChild(orderItem);
}

// Utility functions to manage sessionStorage ------------------------------

function getOrders() {
    return JSON.parse(sessionStorage.getItem('orders')) || [];
}

function saveOrders(orders) {
    sessionStorage.setItem('orders', JSON.stringify(orders));
}

function getLastOrderNumber() {
   return parseInt(sessionStorage.getItem('lastOrderNumber')) || 0;
}

function setLastOrderNumber(num) {
    sessionStorage.setItem('lastOrderNumber', num);
}

// Add a new order (called after fetching a meal)

function addOrder(meal, ingredient) {
    const orders = getOrders();
    let lastOrder = getLastOrderNumber();

    const newOrder = {
        orderNumber: ++lastOrder,
        description: meal.strMeal,
        complete: false,
        timestamp: new Date().toLocaleString()
    };

    orders.push(newOrder);
    saveOrders(orders);
    setLastOrderNumber(lastOrder);

    displayOrders();
}


// Display all orders
function displayOrders() {
  const orders = getOrders();
  ordersList.innerHTML = "";

  const ordersSection = document.getElementById('incomplete-orders-section');

  if (orders.length === 0) {
    ordersSection.classList.add('d-none');
    return;
  } else {
    ordersSection.classList.remove('d-none');
  }

  orders.forEach(order => {
    const container = document.createElement("div");
    container.className = "d-flex align-items-center mb-2";

    const trashIcon = document.createElement("i");
    trashIcon.className = "bi bi-trash text-danger me-3";
    trashIcon.style.cursor = "pointer";
    trashIcon.setAttribute("data-order", order.orderNumber);

    trashIcon.addEventListener("click", () => {
      deleteOrder(order.orderNumber);
      displayOrders();
    });

    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center flex-grow-1";
    li.innerHTML = `
      <div>
        <strong>#${order.orderNumber}</strong> ${order.description}
        <small class="text-muted d-block">${order.timestamp}</small>
      </div>
      <span class="badge bg-${order.complete ? 'secondary' : 'warning'} text-dark">
        ${order.complete ? 'Complete' : 'Incomplete'}
      </span>
    `;

    container.appendChild(trashIcon);
    container.appendChild(li);
    ordersList.appendChild(container);
  });
}


// Delete order ----------------------------------------------------------------------

function deleteOrder(orderNumber) {
    // Get current orders
    let orders = getOrders();

    // Filter out the order with the matching orderNumber
    orders = orders.filter(order => order.orderNumber !== orderNumber);

    // Save updated orders back to sessionStorage
    saveOrders(orders);

    // Refresh the displayed list
    displayOrders();
}

// Mark an order as complete ------------------------------------------------

function markOrderComplete(orderNumber) {
    const orders = getOrders();
    const index = orders.findIndex(order => order.orderNumber === orderNumber);

    if (index === -1) {
        alert("Order number not found.");
        return;
    }

    if (orders[index].complete) {
        alert("This order is already marked complete.");
        return;
    }

    orders[index].complete = true;
    saveOrders(orders);
    alert(`Order #${orderNumber} marked as complete.`);
    displayOrders();
}


// Form handler to complete an order


completeOrderForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const number = parseInt(orderNumberInput.value);

  if (!number) {
    alert("No order marked.");
    return;
  }

  markOrderComplete(number);
  orderNumberInput.value = ""; // clear input
});



// 🔹 On page load, show all orders
window.addEventListener('load', displayOrders);


// Clear all orders
document.addEventListener('DOMContentLoaded', () => {
  const clearOrdersBtn = document.getElementById('clear-orders');
  clearOrdersBtn.addEventListener('click', function () {
    const currentOrders = getOrders();

    if (currentOrders.length === 0) {
      alert("There are no orders to clear.");
      return;
    }

    if (confirm("Are you sure you want to clear all orders?")) {
      sessionStorage.removeItem('orders');
      sessionStorage.removeItem('lastOrderNumber');
      displayOrders();
    }
  });
});

