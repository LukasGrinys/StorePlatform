// LOGIC FOR THE STORE PAGE

var store = {};
// Load the catalog
var catalog = [];
store.requestCatalogData = function()  {
    $.ajax ({
        type: 'get',
        url: './lib/itemCatalog.json',
        success: function(response) {
            catalog = response;
            store.loadCatalogItems();
        }
    });
}

var pageNumber = 1;
var itemsPerPage = 5;
var fullCatalogCount = 4;



// Append all catalog items to the page
//@TODO append the exact amount of items
store.loadCatalogItems = function() {
    var catalogElement = document.getElementsByClassName('shop-items')[0];
    // Values for crafting the category icon source
    var categoryIconId = ["01","02","03","04"];
    var categoryTitles = ["Books","Coffee mugs","Instruments","Plants"];

    for (let i = 0; i < catalog.length; i++) {
        let item = catalog[i];
        // Craft the source url for the category icon
        let category = item.category;
        let categoryIndex = categoryTitles.indexOf(category);
        let categoryId = categoryIconId[categoryIndex];
        let iconSourceUrl = "icons/categories/cat" + categoryId + ".png";
        // Craft the source url for the item image
        let itemIdStr = item.id;
        let itemIdNumber = itemIdStr.replace("#","");
        let imageSourceUrl = "Items/item" + itemIdNumber + ".jpg";

        // Append the item element
        let itemContainer = document.createElement("DIV");
        itemContainer.innerHTML = `<div class='item-id' id="item-id">${item.id}</div>
        <span class="item-header">${item.name}</span>
        <div class="category-icon">
          <img src="${iconSourceUrl}">
          <span class="category-text">${category}</span>
        </div>
        <img src="${imageSourceUrl}" alt="${item.altTitle}">
        <span class="item-description">${item.description}</span>
        <div class="item-details">
          <span class="item-price">$${item.price}</span>
          <button type="button" onclick="this.parentNode.querySelector('input[type=number]').stepDown()" class="number-change numberDec">-</button>
          <input type="number" min="1" max="99" value="1">
          <button type="button" onclick="this.parentNode.querySelector('input[type=number]').stepUp()" class="number-change numberInc">+</button>
          <button type="button" class="btn-addToCart btn-blue">Add to cart</button>
        </div>`;
        itemContainer.classList.add('item-container');
        catalogElement.appendChild(itemContainer);
        // Append the button functions
        store.addingButtonFunctions();
    }
}



//
store.ready = function() {
    // Loading functions
    store.requestCatalogData();

    // "Shopping" functions
    store.addingButtonFunctions();
    store.updateTotal();
    store.appendUpdateTotal();
    store.updateFloatingCart();
}

// SHOPPING FUNCTIONS

// Adding an item to the cart
store.addItemToCart = function(event) {
    var button = event.target;
    var itemElement = button.parentElement.parentElement;
    // Form the cart-item
    var itemId = itemElement.getElementsByClassName('item-id')[0].innerText;
    var itemQuantity = itemElement.getElementsByTagName('INPUT')[0].value;
    var itemName = itemElement.getElementsByClassName('item-header')[0].innerText;
    var itemImageSrc = itemElement.getElementsByTagName('IMG')[1].src;
    var itemPrice = itemElement.getElementsByClassName('item-price')[0].innerText;
    // Check, if the cart item doesnt already exist in the cart
    var cartItems = document.getElementsByClassName('cart-table')[0];
    var cartItemsCount = cartItems.childElementCount;
    for (let i = 1; i < cartItemsCount; i++) {
        let idToCheck = cartItems.getElementsByClassName('cart-id')[i].innerText;
        if (idToCheck == itemId) {
            alert("Item is already in the cart");
            return;
        }
    };
    // Add the cart item
    var cartRow = document.createElement('div');
    cartRow.innerHTML = `<span class="cart-id cart-column">${itemId}</span>
    <div class="cart-item cart-column">
      <img class="cart-item-image" src=${itemImageSrc}>
      <span>${itemName}</span>
    </div>
    <span class="cart-price cart-column">${itemPrice}</span>
    <div class="cart-quantity cart-column">
      <button type="button" onclick="this.parentNode.querySelector('input[type=number]').stepDown()" class="number-change-cart numberDec">-</button>
      <input class="cart-quantity-number" type="number" min="1" max="99" value="${itemQuantity}">
      <button type="button" onclick="this.parentNode.querySelector('input[type=number]').stepUp()" class="number-change-cart numberInc">+</button><br>
    <button type="button" class="btn-remove-item btn-orange">Remove</button>
    </div>`  ;
    cartRow.classList.add('cart-row')
    cartItems.append(cartRow);
    // update total
    store.updateTotal();
    // update floating-cart text;
    store.updateFloatingCart();
    // add updating total function to new buttons;
    store.appendUpdateTotal();
    store.addingButtonFunctions();
};

// Removing the cart items
store.removeCartItem = function(event) {
    var removeItemButton = event.target;
    var itemToRemove = removeItemButton.parentElement.parentElement;
    itemToRemove.parentElement.removeChild(itemToRemove);
    store.updateTotal();
    store.updateFloatingCart();
}


// Adding the function to button elements
store.addingButtonFunctions = function() {
    // Add to cart
    var pageItemCount = document.getElementsByClassName('item-container').length;
    for (let i = 0; i < pageItemCount; i++) {
        var itemAddToCartButtons = document.getElementsByClassName('btn-addToCart');
        var button = itemAddToCartButtons[i];
        button.addEventListener('click', store.addItemToCart);
    };
    // Remove from cart
    var removeCartItemButtons = document.getElementsByClassName('btn-remove-item');
    var len = removeCartItemButtons.length;
    for (let i = 0; i < len; i++) {
        removeCartItemButtons[i].addEventListener('click',store.removeCartItem);
    }
}

// Append the cart total change and the floating-cart item change when cart item quantity changes
store.appendUpdateTotal = function() {
    var cartQuantityChangeButtons = document.getElementsByClassName('number-change-cart');
    var len = cartQuantityChangeButtons.length;
    for (let i = 0; i < len; i++) {
        var cartQuantityChangeButton = cartQuantityChangeButtons[i];
        cartQuantityChangeButton.addEventListener('click', store.updateTotal);
        cartQuantityChangeButton.addEventListener('click',store.updateFloatingCart);
    }
};

// Updating the cart total
store.updateTotal = function() {
    var total = 0;
    var cartItems = document.getElementsByClassName('cart-table')[0];
    var count = cartItems.childElementCount - 1;
    for (let i = 0; i < count; i++) {
        // Get item quantity
        var cartQuantityElement = document.getElementsByClassName('cart-quantity-number')[i];
        var cartQuantity = cartQuantityElement.value;
        // Get item price
        var cartItemPrice = document.getElementsByClassName('cart-price')[i+1].innerText;
        var priceNumber = cartItemPrice.replace("$","");
        // Multiply the numbers, add up to total;
        var priceRow = Number(cartQuantity) * Number(priceNumber)
        total += priceRow;
    };
    total = parseFloat(total).toFixed(2);
    var totalStr = total.toString();
    var pointPosition = totalStr.indexOf(".");
    var decimalParts = totalStr.slice(pointPosition,totalStr.length);
    if (decimalParts.length == 1) {
        totalStr += "0";
    };
    if (decimalParts.length == 0) {
        totalStr += ".00";
    };
    var totalElement = document.getElementsByClassName('cart-total')[0];
    if (totalStr == "0.00") {
        totalElement.innerHTML = `<span>Cart is empty</span>`;
    } else {
        totalElement.innerHTML = `<span><b>Total: </b>$${totalStr}</span>`;
    }
}

// Showing the Checkout section and forming an order bill
store.proceedToCheckout = function(){
    // Do the sanity check, if the cart is empty
    var cartItemCount = document.getElementsByClassName('cart-row').length - 2;
    if (cartItemCount == 0) {
        alert("The cart is empty");
        return;
    }
    // Showing the checkout div section
    var checkoutElement = document.getElementsByClassName('checkout')[0];
    checkoutElement.style.display = 'block';
    // Forming the bill text
    var billText = document.getElementsByClassName('order-bill')[0];
    var str = '<h2>Bill</h2>';
    // Collecting the data from cart
    var cart = document.getElementsByClassName('cart')[0];
    for (let i = 0; i < cartItemCount; i++) {
        // Get item name
        var cartItemName = document.getElementsByClassName('cart-item')[i+1].innerText;
        // Get item quantity
        var cartQuantityElement = document.getElementsByClassName('cart-quantity-number')[i];
        var cartQuantity = cartQuantityElement.value;
        // Get item price
        var cartItemPrice = document.getElementsByClassName('cart-price')[i+1].innerText;
        // Form the text
        str += '<span>' + cartItemName + ' x ' + cartQuantity + ' (' + cartItemPrice + ')</span><br>';
    };
    // Get the total
    var totalStr = document.getElementsByClassName('cart-total')[0].innerText;
    str += `<span class="bill-total"><br>${totalStr}</span></div>`;
    // Storing the text;
    billText.innerHTML = str;
};

store.updateFloatingCart = function() {
    var floatingCart = document.getElementsByClassName('floating-cart-text')[0];
    // Count the items x quantity
    var itemsInCart = document.getElementsByClassName('cart-row').length - 2;
    var itemCount = 0;
    for (let i = 0; i < itemsInCart; i++) {
        let itemQuantity = document.getElementsByClassName('cart-quantity-number')[i].value;
        itemCount += Number(itemQuantity);
    };
    // Update cart text
    if (itemCount == 0) {
        floatingCart.innerText = "Cart";
    } else if (itemCount == 1) {
        floatingCart.innerText = "1 item";
    } else {
        floatingCart.innerText = itemCount + " items";
    };
    // Set smaller font size for larger number
    var floatingCartElement = document.getElementsByClassName('floating-cart')[0];
    if (itemCount > 99) {
        floatingCartElement.style.fontSize = "0.75em";
        floatingCartElement.style.padding = "10px";
    } else {
        floatingCartElement.style.fontSize = "1em";
        floatingCartElement.style.padding = "8px";
    };
}

store.ready();
var proceedToCheckoutButton = document.getElementsByClassName('purchase-btn')[0];
proceedToCheckoutButton.addEventListener('click',store.proceedToCheckout);