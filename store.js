// LOGIC FOR THE STORE PAGE
var store = {};

// Load the catalog and form the categories data
var catalog = [];
var pageConfig = {
    categoryTitles : [],
    sortingType : 0, // 0 - A-Z (default) 1 - Z-A; 2-Low-High; 3 - High-Low
    itemsPerPage : document.getElementsByClassName('page-quantity')[0].value,
    pageNumber : 1,
    pagesNeeded : 1
};

store.requestCatalogData = function()  {
    // Request the product catalog
    $.ajax ({
        type: 'get',
        url: './.data/itemCatalog.json',
        success: function(response) {
            catalog = response;
            if (catalog.length % pageConfig.itemsPerPage == 0) {
                pageConfig.pagesNeeded = catalog.length / pageConfig.itemsPerPage;
            } else {
                pageConfig.pagesNeeded = Math.floor(catalog.length / pageConfig.itemsPerPage) + 1;
            };
            store.appendPageNumbers();
            store.loadCategories(catalog);
            store.loadCatalogItems();
            store.closeLoadingScreen(); // it is opened by default and after changing product display options
        }
    });
}
store.loadCategories = function(data) {
    for (let i = 0; i < data.length; i++) {
        item = data[i];
        categoryName = item.category.trim().toLowerCase();
        if (pageConfig.categoryTitles.indexOf(categoryName) > -1) {
            // Then we continue;
        } else {
            pageConfig.categoryTitles.push(categoryName);
        }
    }
}

// Loading screen functions
store.closeLoadingScreen = function() {
    document.getElementsByClassName('loading-screen')[0].style.display = 'none';
    
}
store.openLoadingScreen = function() {
    document.getElementsByClassName('loading-screen')[0].style.display = 'flex';
}

// PAGE OPTION FUNCTIONS for sorting, filtering and displaying items

// Add the filterapplying function (applied filters - global variable, so the other displaying functions (sorting/paging) can use it)
var filtersApplied = [];
store.applyFilter = function() {
    filtersApplied = [];
    var filtersList = document.getElementsByClassName('filter-list')[0]
    var filterCount = (filtersList.childElementCount - 1) / 3;
    for (let i = 0; i < filterCount; i++) {
        let filterToCheck = filtersList.getElementsByTagName('input')[i];
        let filterClass = filterToCheck.className;
        let filterWithCat = filterClass.trim().toLowerCase();
        let filterName = filterWithCat.slice(4,filterWithCat.length);
        if (filterToCheck.checked == true) {
            filtersApplied.push(filterName);
        }
    }
    store.openLoadingScreen(); // loading...
    store.requestCatalogData();
}
var filterButton = document.getElementsByClassName('filter-btn')[0];
filterButton.addEventListener('click',store.applyFilter);

store.checkSortingType = function() {
    store.openLoadingScreen(); // Loading...
    var sort1 = document.getElementById('sort01').checked;
    var sort2 = document.getElementById('sort02').checked;
    var sort3 = document.getElementById('sort03').checked;
    var sort4 = document.getElementById('sort04').checked;
    if (sort1) {
        pageConfig.sortingType = 0;
    };
    if (sort2) {
        pageConfig.sortingType = 1;
    };
    if (sort3) {
        pageConfig.sortingType = 2;
    };
    if (sort4) {
        pageConfig.sortingType = 3;
    };
    // Re-load the items
    store.requestCatalogData();
}
document.getElementsByClassName('sort-list')[0].addEventListener('change',store.checkSortingType);

// Update ItemsPerPage value
store.updateItemsPerPage = function() {
    store.openLoadingScreen(); // Loading..
    pageConfig.itemsPerPage = document.getElementsByClassName('page-quantity')[0].value;
}
document.getElementsByClassName('page-quantity')[0].addEventListener('change',store.updateItemsPerPage);
document.getElementsByClassName('page-quantity')[0].addEventListener('change',store.requestCatalogData);

// Append page number elements
store.appendPageNumbers = function() {
    var pageNumberContainer = document.getElementsByClassName('pages-numbers')[0];
    pageNumberContainer.innerHTML = "";
    var pageCount = pageConfig.pagesNeeded;
    if (pageCount == 1) {
        document.getElementsByClassName('pages-container')[0].style.display = "none";
    } else {
        document.getElementsByClassName('pages-container')[0].style.display = "flex";
        for (let i = 0; i < pageCount; i++) {
            if (pageConfig.pageNumber == i + 1) {
                let pageSquare = `<span class="pages-page-number selected-page">${i+1}</span>`;
                pageNumberContainer.innerHTML += pageSquare;
            } else {
                let pageSquare = `<span class="pages-page-number">${i+1}</span>`;
                pageNumberContainer.innerHTML += pageSquare;
            }
        };
    };
}



// Append all catalog items to the page
store.loadCatalogItems = function() {
    var catalogElement = document.getElementsByClassName('shop-items')[0];
    // Deleting anything that was before
    catalogElement.innerHTML = "";
    store.openLoadingScreen(); // Loading...
    // Filter out the catalog;
    var filteredCatalog = [];
    for (let i = 0; i < catalog.length; i++) {
        let itemCategory = catalog[i].category.toLowerCase();
        if (pageConfig.categoryTitles.indexOf(itemCategory) > - 1 || pageConfig.categoryTitles.length == 0) {
            filteredCatalog.push(catalog[i]);
        }
    };
    // Sort the catalog
    var sortingType = pageConfig.sortingType;
    if (sortingType == 0) {
        // A-Z
        filteredCatalog.sort(function(a, b){
            var x = a.name.toLowerCase();
            var y = b.name.toLowerCase();
            if (x < y) {return -1;}
            if (x > y) {return 1;}
            return 0;
          });
    };
    if (sortingType == 1) {
        // Z-A
        filteredCatalog.sort(function(a, b){
            var x = a.name.toLowerCase();
            var y = b.name.toLowerCase();
            if (x > y) {return -1;}
            if (x < y) {return 1;}
            return 0;
          });
    };
    if (sortingType == 2) {
        // Cheapest - Expensive
        filteredCatalog.sort(function(a,b) {
            return a.price - b.price
        });
    };
    if (sortingType == 3) {
        // Expensive - Cheapest
        filteredCatalog.sort(function(a,b) {
            return b.price - a.price;
        });
    };
    // Cut the catalog according to the page number and itemsPerPage value
    var itemsPerPage = pageConfig.itemsPerPage;
    var page = pageConfig.pageNumber;
    var slicedCatalog = filteredCatalog.slice(itemsPerPage*(page - 1), (itemsPerPage)*(page - 1) + itemsPerPage);
    for (let i = 0; i < slicedCatalog.length; i++) {
        let item = slicedCatalog[i];
        // Check if the item passes filter or the page settings 
        let category = item.category;
        let categoryStringUntrimmed = category.toLowerCase();
        let categoryString = categoryStringUntrimmed.replace(" ","")
        // Craft the source url for the category icon
        let iconSourceUrl = "icons/categories/" + categoryString + ".png";
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