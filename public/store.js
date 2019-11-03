// LOGIC FOR THE STORE PAGE
var store = {};

var catalog = [];
var pageConfig = {
    categoryTitles : [],
    sortingType : 0, // 0 - A-Z (default) 1 - Z-A; 2-Low-High; 3 - High-Low
    itemsPerPage : 5,
    pageNumber : 1,
    pagesNeeded : 1
};
store.config = {
    'sessionToken' : false
};

var orderInfo = [];
store.requestCatalogData = function()  {
    var xhr = new XMLHttpRequest();
    xhr.open("GET","api/products/load", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
                    var statusCode = xhr.status;
                    var responseReturned = xhr.responseText;
                    var obj = JSON.parse(responseReturned);
                    catalog = obj;
                    store.appendPageNumbers();
                    store.loadCategories(catalog);
                    store.loadCatalogItems();
                    store.closeLoadingScreen();
                    if (statusCode !== 200) {
                        console.log('Error : Could not receive catalog info')
                    }
        };
    };
    xhr.send();
};

store.loadCategories = function(data) {
    for (let i = 0; i < data.length; i++) {
        item = data[i];
        categoryName = item.category.toLowerCase();
        if (pageConfig.categoryTitles.indexOf(categoryName) > -1) {
            // Then we continue;
        } else {
            pageConfig.categoryTitles.push(categoryName);
        }
    }
}

// Loading screen functions
store.closeLoadingScreen = function() {
    if (document.getElementsByClassName('loading-screen')[0]) {
        document.getElementsByClassName('loading-screen')[0].style.display = 'none';
    };
}
store.openLoadingScreen = function() {
    if (document.getElementsByClassName('loading-screen')[0]) {
        document.getElementsByClassName('loading-screen')[0].style.display = 'flex';
    };
}

// Showing the employee name in navigation board
store.displayUserName = function() {
    if (store.config.sessionToken && document.getElementsByClassName('username')[0]) {
        var str = store.config.sessionToken;
        document.getElementsByClassName('username')[0].innerText = str.username;
        document.getElementsByClassName('username')[0].style.display = 'block';
    } else if (!store.config.sessionToken && document.getElementsByClassName('username')[0]) {
        document.getElementsByClassName('username')[0].innerText = '';
        document.getElementsByClassName('username')[0].style.display = 'none';
    }
};

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
        let filterName = filterClass.toLowerCase().slice(4,filterClass.length);
        let filterNameFixed = filterName.replace("-"," ");
        if (filterToCheck.checked == true) {
            filtersApplied.push(filterNameFixed);
        }
    }
    store.openLoadingScreen(); // loading...
    store.requestCatalogData();
}
if (document.getElementsByClassName('filter-btn')[0]) {
    var filterButton = document.getElementsByClassName('filter-btn')[0];
    filterButton.addEventListener('click',store.applyFilter);
};

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
if (document.getElementsByClassName('sort-list')[0]) {
    document.getElementsByClassName('sort-list')[0].addEventListener('change',store.checkSortingType);
};

// Update ItemsPerPage value
store.updateItemsPerPage = function() {
    store.openLoadingScreen(); // Loading..
    pageConfig.itemsPerPage = document.getElementsByClassName('page-quantity')[0].value;
}
if (document.getElementsByClassName('page-quantity')[0]) {
    document.getElementsByClassName('page-quantity')[0].addEventListener('change',store.updateItemsPerPage);
    document.getElementsByClassName('page-quantity')[0].addEventListener('change',store.requestCatalogData);
};

// Append page number elements
store.appendPageNumbers = function() {
    var pageNumberContainer = document.getElementsByClassName('pages-numbers')[0];
    if (pageNumberContainer) {
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
        store.pageNumbers.bind();
    };
}

// Give the page numbering elements their functions
store.pageNumbers = {};
store.pageNumbers.goToFirst = function() {
    if (pageConfig.pageNumber !== 1) {
        pageConfig.pageNumber;
        store.requestCatalogData();
    };
}
store.pageNumbers.goBack = function() {
    if (pageConfig.pageNumber > 1) {
        pageConfig.pageNumber--;
        store.requestCatalogData();
    };
}
store.pageNumbers.goToSpecificPage = function(n) {
    if (n !== pageConfig.pageNumber) {
        pageConfig.pageNumber = n;
        store.requestCatalogData();
    };
 
}
store.pageNumbers.goForward = function() {
    if (pageConfig.pageNumber < pageConfig.pagesNeeded) {
        pageConfig.pageNumber++;
        store.requestCatalogData();
    };
}
store.pageNumbers.goToLast = function() {
    if (pageConfig.pageNumber !== pageConfig.pagesNeeded) {
        pageConfig.pageNumber = pageConfig.pagesNeeded;
        store.requestCatalogData();
    }
}
// Bind the functions to their elements
store.pageNumbers.bind = function() {
    document.getElementsByClassName('pages-to-first')[0].addEventListener('click',store.pageNumbers.goToFirst);
    document.getElementsByClassName('pages-back')[0].addEventListener('click', store.pageNumbers.goBack);
    document.getElementsByClassName('pages-next')[0].addEventListener('click', store.pageNumbers.goForward);
    document.getElementsByClassName('pages-to-last')[0].addEventListener('click', store.pageNumbers.goToLast);
    var numberOfSquares = document.getElementsByClassName('pages-numbers')[0].childElementCount;
    for (let i = 0; i < numberOfSquares; i++) {
        var pageSquare = document.getElementsByClassName('pages-page-number')[i];
        pageSquare.addEventListener('click', function() { 
            var n = i + 1;
            store.pageNumbers.goToSpecificPage(n);
        });
    }
}


// Append all catalog items to the page
store.loadCatalogItems = function() {
    var catalogElement = document.getElementsByClassName('shop-items')[0];
    if (catalogElement) {
        // Deleting anything that was before
        catalogElement.innerHTML = "";
        store.openLoadingScreen(); // Loading...
        // Filter out the catalog;
        var filteredCatalog = [];
        for (let i = 0; i < catalog.length; i++) {
            let itemCategory = catalog[i].category.toLowerCase().trim();
            if (filtersApplied.indexOf(itemCategory) > - 1 || filtersApplied.length == 0) {
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
            let iconSourceUrl = "public/icons/categories/" + categoryString + ".png";
                // Craft the source url for the item image
            let itemIdStr = item.id;
            let itemIdNumber = itemIdStr.replace("#","");
            let imageSourceUrl = "public/Items/item" + itemIdNumber + ".jpg";
            // Append the item element
            let itemContainer = document.createElement("DIV");
            itemContainer.innerHTML = `<div class='item-id' id="item-id">${item.id}</div>
                <span class="item-header">${item.name}</span>
                <div class="category-icon">
                <img src="${iconSourceUrl}">
                <span class="category-text">${category.toUpperCase()}</span>
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
    };
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
    if (cartItems) {
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
    };
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

        // Form the orderInfo array of objects to be sent later as payload
        var itemJSON = {
            'name' : cartItemName,
            'quantity' : cartQuantity,
            'price' : cartItemPrice 
        };
        orderInfo.push(itemJSON);
    };
    // Get the total
    var totalStr = document.getElementsByClassName('cart-total')[0].innerText;
    str += `<span class="bill-total"><br>${totalStr}</span></div>`;
    // Storing the text;
    billText.innerHTML = str;
};

store.updateFloatingCart = function() {
    var floatingCart = document.getElementsByClassName('floating-cart-text')[0];
    if (floatingCart) {
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
    };
}

// Append proceedToCheckout function
var proceedToCheckoutButton = document.getElementsByClassName('purchase-btn')[0];
if (proceedToCheckoutButton) {
    proceedToCheckoutButton.addEventListener('click',store.proceedToCheckout);
};

// Confirming the details with order
store.sendOrder = function(event) {
    // preventing the submitting and collecting values
    event.preventDefault();
    var path = this.action; // api/orders
    var method = "POST"; // POST

    var errorBlock = document.getElementsByClassName('formError')[0];
    errorBlock.style.display = 'none';
    // Turn the inputs into a payload
    var payload = {};
    // Collect the values
    var fullName = document.getElementById('inputFullName').value;
    var email = document.getElementById('inputEmail').value;
    var addressLineOne = document.getElementById('inputAddOne').value;
    var addressLineTwo = document.getElementById('inputAddOne').value;
    var agreement = document.getElementById('agreement').checked ? true : false;
    // Check if the values are correct
    fullName = fullName.length > 0 && typeof(fullName) == 'string' ? fullName : false;
    email = email.indexOf("@") > -1 && email.indexOf(".") > -1 && email.length > 0 && typeof(email) == 'string' ? email : false;
    addressLineOne = typeof(addressLineOne) == 'string' && addressLineOne.length > 0 ? addressLineOne : false;
    addressLineTwo = addressLineTwo.length == 0 ? " " : addressLineTwo;

    // Put values into payload
    if (fullName && email && addressLineOne && agreement) {
        payload.fullName = fullName;
        payload.email = email;
        payload.addressLineOne = addressLineOne;
        payload.addressLineTwo = addressLineTwo;
        payload.agreement = agreement;
        payload.order = orderInfo; // collect the orderInfo object formed earlier
        // Send the order
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'api/orders/send', true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function() {
            if(xhr.readyState == XMLHttpRequest.DONE) {
                var statusCode = xhr.status;
                var responseReturned = xhr.responseText;
                window.location = '/orderSent';
            }
        }
        // Send the payload as JSON
        var payloadString = JSON.stringify(payload);
        xhr.send(payloadString);
    } else {
        // Display an error
        errorBlock.style.display = 'block';
        errorBlock.innerText = "Please fill out all the required fields";
        // Mark the missing forms:
        var errBorder = "1px solid #FF7E57";
        var defBorder = "1px solid grey";
        if (!fullName) { 
            document.getElementById('inputFullName').style.border = errBorder; 
        } else {
            document.getElementById('inputFullName').style.border = defBorder; 
        };
        if (!email) { 
            document.getElementById('inputEmail').style.border = errBorder; 
        } else {
            document.getElementById('inputEmail').style.border = defBorder; 
        };
        if (!addressLineOne) { 
            document.getElementById('inputAddOne').style.border = errBorder; 
        } else {
            document.getElementById('inputAddOne').style.border = defBorder; 
        };
    };
}
if (document.getElementsByClassName('order-send-btn')[0]) {
    document.getElementsByClassName('order-send-btn')[0].addEventListener('click', store.sendOrder);
};

store.checkOrder = function(event) {
    event.preventDefault();
    var responseText = "";
    var formId = this.id; // checkOrder
    var path = this.action; // api/orders/check
    var method = this.method;
    // Collect the order id
    var inputOrderId = document.getElementById('orderId').value;
    // Check if its valid
    inputOrderId = inputOrderId.trim().length == 10 && typeof(inputOrderId) == 'string' ? inputOrderId.trim() : false;

    if (inputOrderId) {
        var queryStringObject = {
            'orderId' : inputOrderId
        };
        var path = 'api/orders/check?orderId=' + inputOrderId;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', path, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        if (store.config.sessionToken) {
            xhr.setRequestHeader("token", store.config.sessionToken.id);
        }
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                var statusCode = xhr.status;
                var responseReturned = xhr.responseText;
                var responseJSON = JSON.parse(responseReturned);
                var orderStatus = responseJSON.status;
                if (statusCode == 404) {
                    responseText = "No order with particular ID was found";
                };
                if (statusCode == 200) {
                    responseText = "Your order status: " + orderStatus; 
                };
                document.getElementsByClassName('responseBox')[0].innerText = responseText;
                document.getElementsByClassName('responseBox')[0].style.display = "block";
            }
        };
        xhr.send();
    } else {
        responseText = "Invalid ID";
        document.getElementsByClassName('responseBox')[0].innerText = responseText;
        document.getElementsByClassName('responseBox')[0].style.display = "block";
    };
}
if (document.getElementsByClassName('btn-checkOrder')[0]) {
    document.getElementsByClassName('btn-checkOrder')[0].addEventListener('click',store.checkOrder);
}

// Employee login
store.adminLogin = function(event) {
    event.preventDefault();
    var errorText = "";
    var username = document.getElementById('employeeUsername').value;
    var password = document.getElementById('employeePassword').value;
    var payload = {};
    payload.username = username;
    payload.password = password;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'api/tokens', true);
    xhr.setRequestHeader("Content-type", "application/json");
    // When the request comes back, handle the response
    xhr.onreadystatechange = function() {
        if(xhr.readyState == XMLHttpRequest.DONE) {
            var statusCode = xhr.status;
            var responseReturned = xhr.responseText;
            if (statusCode !== 200) {
                var responseJSON = JSON.parse(responseReturned);
                var errorText = responseJSON.Error;
                document.getElementsByClassName('errText')[0].innerText = errorText;
            } else {
                // If login was successful, set the token in localstorage and redirect the user
                store.setSessionToken(responseReturned);
                window.location = '/dashboard';
            }
        };
    };
    var payloadString = JSON.stringify(payload);
    xhr.send(payloadString); 
};
if (document.getElementsByClassName('employee-login-btn')[0]) {
    document.getElementsByClassName('employee-login-btn')[0].addEventListener('click',store.adminLogin);
};

store.setSessionToken = function(token) {
    store.config.sessionToken = JSON.parse(token);
    localStorage.setItem('token',token);
};

// Get the token from localstorage and set it in the store.config object
store.getSessionToken = function(){
    var tokenString = localStorage.getItem('token');
    var token = JSON.parse(tokenString);
    store.config.sessionToken = token;
};

// Extend the expiration of the token
store.renewToken = function(callback) {
    var currentToken = typeof(store.config.sessionToken) == 'object' ? store.config.sessionToken : false;
    if (currentToken) {
        var payload = {
            'id' : currentToken.id,
            'extend' : true
        };
        var xhr = new XMLHttpRequest();
        xhr.open('PUT','api/tokens');
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                
                var statusCode = xhr.status;
                var responseReturned = xhr.responseText;
                if (statusCode == 200) {
                    var queryStringObject = { 'id' : currentToken.id };
                    var yhr = new XMLHttpRequest();
                    yhr.open('GET','api/tokens?id='+currentToken.id);
                    yhr.onreadystatechange = function() {
                        if (yhr.readyState == XMLHttpRequest.DONE) {
                            let statusCode = yhr.status;
                            let responsestring = yhr.responseText;
                            if (statusCode == 200) {
                                store.setSessionToken(responsestring)
                            } else {
                                console.log("Something wong");
                                store.setSessionToken(false);
                                callback(true);
                            }
                        }
                    }
                    yhr.send();
                } else {
                    console.log("Sum ting wong");
                }
            };
        }
        var payloadString = JSON.stringify(payload);
        xhr.send(payloadString);
    };   
};

// Log the user out then redirect them
store.logAdminOut = function(event){
    event.preventDefault();
    // Get the current token id
    var tokenId = typeof(store.config.sessionToken.id) == 'string' ? store.config.sessionToken.id : false;
    // Send the current token to the tokens endpoint to delete it
    var queryStringObject = {
      'id' : tokenId
    };
    var path = 'api/tokens?id=' + tokenId;
    var xhr = new XMLHttpRequest();
    xhr.open('DELETE', 'api/tokens');
    xhr.setRequestHeader("Content-type", "application/json");
    // When the request comes back, handle the response
    xhr.onreadystatechange = function() {
      if(xhr.readyState == XMLHttpRequest.DONE) {
        var statusCode = xhr.status;
        var responseReturned = xhr.responseText;
        window.location = '/';
      }
    }
    xhr.send();
    // Set the store.config token as false
    store.setSessionToken(false);
};
if (document.getElementById('admin-logout')) {
    document.getElementById('admin-logout').addEventListener('click',store.logAdminOut);
}

// Redirect, if user tries to access unauthorised pages without a token
store.redirect = function() {
    if (document.getElementsByClassName('navigation-admin')[0] && !store.config.sessionToken) {
        window.location = '/login';
    };
};

// If user is logged in, skip the "Log in" page
store.openManagementPage = function() {
    if (store.config.sessionToken) {
        window.location = '/dashboard'
    } else {
        window.location = '/login'
    }
};
if (document.getElementById('management')) {
    document.getElementById('management').addEventListener('click',store.openManagementPage);
};

// Load the orders
store.loadOrders = function() {
    if (document.getElementById('table-orders')) {
        var xhr = new XMLHttpRequest();
        // The request is called to collect data from all order files into one session file, named with the admin username
        xhr.open('POST', 'api/orders/view');
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                var statusCode = xhr.status;
                var responseReturned = xhr.responseText;
                var responseunsorted = JSON.parse(responseReturned);
                var responseobject = responseunsorted.sort(function(a,b) {
                    let x = JSON.parse(a);
                    let y = JSON.parse(b);
                    return x.orderId - y.orderId;
                });
                // load the orders into orders.html
                var tableElement = document.getElementById('table-orders');
                var orderCount = responseobject.length;
                for (let i = 0; i < orderCount; i++) {
                    let obj = JSON.parse(responseobject[i]);
                    let tableRow = document.createElement('tr');
                    // Convert date
                    var d = new Date(obj.time);
                    // Form order list and total price
                    let itemString = "";
                    let totalPrice = 0;
                    let itemsobject = obj.order;
                    for (let i = 0; i < itemsobject.length; i++) {
                        let itemName = itemsobject[i].name;
                        let itemQuantity = itemsobject[i].quantity;
                        let itemPrice = itemsobject[i].price.replace("$","");
                        itemString += itemName + " (" + itemQuantity + " x " + itemPrice + ")<br>";
                        totalPrice += Number(itemQuantity) * Number(itemPrice);
                    };
                    totalPrice = store.fixThePrice(totalPrice);
                    // Form the action button
                    let buttonHTML = '';
                    if (obj.status.trim() == 'Waiting for payment') {
                        buttonHTML = `<button type="button" class="orders-action">Confirm payment</button>`;
                    };
                    if (obj.status.trim() == 'Payment received. Processing') {
                        buttonHTML = '<button type="button" class="orders-action">Ship</button>'
                    };
                    if (obj.status.trim() == 'Shipped') {
                        buttonHTML = '<button type="button" class="orders-action" disabled>Done</button>';
                    }
                    tableRow.innerHTML = `<td>${obj.orderId}</td>
                    <td>${d.toLocaleString()}</th>
                    <td>${obj.fullName}</td>
                    <td>${obj.address[0]}<br>${obj.address[1]}</td>
                    <td>${obj.email}</td>
                    <td>${itemString}</td>
                    <td>$${totalPrice}</td>
                    <td>${obj.status}</td>
                    <td><div class="orders-action-column">${buttonHTML} <div class="orders-delete">X</div></div></td>`;
                    tableElement.append(tableRow);
                    document.getElementsByClassName('orders-action')[i].addEventListener('click',store.adminUpdateOrderStatus);
                    document.getElementsByClassName('orders-delete')[i].addEventListener('click',store.adminDeleteOrder);
                };
            }
        };
        var tokenObject = store.config.sessionToken;
        var payload = {
            'username' : tokenObject.username
        };
        var payloadString = JSON.stringify(payload);
        xhr.send(payloadString); 
    }
};

store.fixThePrice = function(num) {
    let str = String(num);
    let index = str.indexOf(".")
    if (index == -1) {
        return str + ".00";
    };
    let decimal = str.slice(index + 1, str.length);
    if (decimal.length == 1) {
        return str + "0";
    };
    if (decimal.length > 2) {
        return str.slice(0, index + 3);
    }
    return str;
}

store.adminUpdateOrderStatus = function(event) {
    var targetRow = event.target.parentElement.parentElement.parentElement;
    var currentStatus = targetRow.childNodes[7].innerText;
    var errorBox = document.getElementsByClassName('orders-table-error')[0];
    if (currentStatus !== "Shipped") {
        if (store.config.sessionToken) {
            // request
            var orderId = targetRow.firstChild.innerText;
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'api/orders/update');
            xhr.setRequestHeader("Content-type","application/json");
            if (store.config.sessionToken) {
                var parsedToken = store.config.sessionToken.id;
                xhr.setRequestHeader("token", parsedToken);
                var username = store.config.sessionToken.username;
                xhr.setRequestHeader("username", username);
            }
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE) {
                    var statusCode = xhr.status;
                    var responseReturned = xhr.responseText;
                    if (statusCode == 200) {
                        event.target.parentElement.innerHTML = "Order status updated";
                        store.renewToken();
                    } else {
                        errorBox.style.display = "inline-block";
                        errorBox.innerText = responseReturned;
                    }
                }
            };
            var payload = {
                'orderId' : orderId
            };
            var payloadString = JSON.stringify(payload);
            xhr.send(payloadString);
        } else {
            window.location = '/login'
        }
    }
}

store.adminDeleteOrder = function(event) {
    var targetRow = event.target.parentElement.parentElement.parentElement;
    var orderId = targetRow.firstChild.innerText;
    var username = store.config.sessionToken.username;
    if (confirm(`Are you sure about deleting the order (ID: ${orderId} )?\nPress OK to confirm`)) {
        var xhr = new XMLHttpRequest();
        xhr.open('DELETE','api/orders/delete?orderId='+orderId);
        xhr.setRequestHeader("Content-type","application/json");
        if (store.config.sessionToken) {
            var parsedToken = store.config.sessionToken.id
            xhr.setRequestHeader("token", parsedToken);
        };
        xhr.setRequestHeader("username", username);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                var statusCode = xhr.status;
                var responseReturned = xhr.responseText;
                if (statusCode == 200) {
                    targetRow.innerHTML = "";
                    store.renewToken();
                } else {
                    console.log(responseReturned);
                }
            }
        };
        xhr.send();
    } else {
        // 
    }
}

store.adminLoadProducts = function() {
    if (document.getElementById('table-products')) {
        var sessionToken = store.config.sessionToken;
        var xhr = new XMLHttpRequest();
        xhr.open("GET","api/products/adminLoad", true);
        xhr.setRequestHeader('Content-type','application/json');
        if (sessionToken) {
            xhr.setRequestHeader('username',sessionToken.username);
            xhr.setRequestHeader('tokenid',sessionToken.id);
        };
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                var statusCode = xhr.status;
                var responseReturned = xhr.responseText;
                if (statusCode == 200) {
                    var adminCatalog = JSON.parse(responseReturned);
                    var sortedCatalog = adminCatalog.sort(function(a,b) { return a.id.replace("#","") - b.id.replace("#","") });
                    catalog = sortedCatalog;
                    store.adminViewProducts(sortedCatalog);
                    store.renewToken();
                } else if (statusCode == 403) {
                    store.config.sessionToken = false;
                    window.location = "/login";
                } else {
                    console.log(responseReturned);
                }
            };
        };
        xhr.send();
    }
};

store.adminViewProducts = function(adminCatalog) {
    const tableElement = document.getElementById('table-products');
    const len = adminCatalog.length;
    for (let i = 0; i < len; i++) {
        let tableRow = document.createElement('tr');
        let item = adminCatalog[i];
        // Values
        let itemId = item.id;
        let imageUrl = "public/"+item.imageSrc;
        let title = item.name;
        let category = item.category;
        let altTitle = item.altTitle;
        let description = item.description;
        let price = item.price;
        let lastChanges = item.timeOfChanges;
        let author = item.lastChangesBy;
        let d = new Date(lastChanges);
        let itemHTML = `<td>${itemId}</td>
        <td><img class="cart-item-image" src="${imageUrl}"></td>
        <td>${title}</td>
        <td>${category}</td>
        <td>${altTitle}</td>
        <td>${description}</td>
        <td>${price}</td>
        <td class="products-actions-column"><button type="button" class="btn-blue btn-edit-product">Edit product</button><br><div class="remove-product">X</div></td>
        <td>${d.toLocaleString()}</td>
        <td>${author}</td>`
        // append item
        tableRow.innerHTML = itemHTML;
        tableElement.append(tableRow);
        document.getElementsByClassName('btn-edit-product')[i].addEventListener('click',store.adminEditProduct);
        document.getElementsByClassName('remove-product')[i].addEventListener('click',store.adminRemoveProduct); 
    }
}

store.adminPrepareToAddNewProduct = function() {
    // Hide the editing form
    document.getElementById('product-edit-form').style.display = "none";
    // Form the new ID
    var table = document.getElementById('table-products');
    var orderIdStr = table.lastChild.firstChild.innerText;
    var oldOrderIdStr = orderIdStr.replace("#","");
    var newOrderId = Number(oldOrderIdStr) + 1;
    if (newOrderId < 10) {
        var newOrderIdStr = "#00" + newOrderId;
    } else if (newOrderId < 100 && newOrderId > 9) {
        var newOrderIdStr = "#0" + newOrderId;
    } else {
        var newOrderIdStr = "#" + newOrderId;
    }
    document.getElementById('productAddId').innerHTML = newOrderIdStr;
    // Load categories
    store.loadCategories(catalog);
    let categoryTitles = pageConfig.categoryTitles;
    let len = categoryTitles.length;
    var selectElement = document.getElementById('productEditCategory');
    selectElement.innerHTML = "<option></option>";
    for (let i = 0; i < len; i++) {
        var option = document.createElement('option');
        let category = pageConfig.categoryTitles[i];
        option.innerHTML = category;
        selectElement.append(option);
    }
    // Hide the "Add new" button
    document.getElementsByClassName('add-new-product')[0].style.display = "none";
    // Display the form
    document.getElementById('product-add-form').style.display = "block";
};
if (document.getElementsByClassName('add-new-product')[0]) {
    document.getElementsByClassName('add-new-product')[0].addEventListener('click',store.adminPrepareToAddNewProduct);
}

// Adding new product
store.adminAddNewProduct = function(event) {
    event.preventDefault();
    // Collect all the inputs
    console.log("OKAY")
    var formElement = event.target.parentElement;
    var productId = document.getElementById("productAddId").innerText;
    var productName = formElement.getElementsByTagName('INPUT')[0].value;
    var altName = formElement.getElementsByTagName('INPUT')[1].value;
    var category = formElement.getElementsByTagName('SELECT')[0].value;
    var newCategory = formElement.getElementsByTagName('INPUT')[2].value;
    var description = formElement.getElementsByTagName('TEXTAREA')[0].value;
    var price = formElement.getElementsByTagName('INPUT')[3].value;
    // Validate inputs
    productName = typeof(productName) == 'string' && productName.trim().length > 0 ? productName.trim() : false;
    altName = typeof(altName) == 'string' && altName.trim().length > 0 ? altName.trim() : false;
    category = typeof(category) == 'string' && category.trim().length > 0 ? category.trim() : false;
    newCategory = typeof(newCategory) == 'string' && newCategory.trim().length > 0 ? newCategory.trim() : false;
    description = typeof(description) == 'string' && description.trim().length > 0 ? description.trim() : false;
    price = typeof(price) == 'string' && price.trim().length > 0 ? price.trim() : false;
    finalCategory = false;
    // Decide if the category will be one form existing ones or totally new
    if (category) {
        finalCategory = category;
    };
    if (!category && newCategory) {
        finalCategory = newCategory;
    }
    // Form the request to be sent
    if (productId, productName && altName && finalCategory && description && price) {
        var payload = {
            'id' : productId,
            'productName' : productName,
            'altName' : altName,
            'category' : finalCategory,
            'description' : description,
            'price' : store.fixThePrice(price),
            'imageSrc' : 'Items/item'+productId.replace("#","")+".jpg",
        };
        var xhr = new XMLHttpRequest();
        xhr.open("POST","api/products/add");
        xhr.setRequestHeader('Content-type','application/json');
        if (store.config.sessionToken) {
            xhr.setRequestHeader('username', store.config.sessionToken.username);
            xhr.setRequestHeader('tokenId', store.config.sessionToken.id);
        };
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                var statusCode = xhr.status;
                var responseReturned = xhr.responseText;
                if (statusCode == 200) {
                    document.getElementById('product-add-form').style.display = "none";
                    document.getElementsByClassName('products-table-error')[0].style.display = "inline-block";
                    document.getElementsByClassName('products-table-error')[0].innerText = responseReturned;
                } else {
                    document.getElementsByClassName('products-table-error')[0].style.display = "inline-block";
                    document.getElementsByClassName('products-table-error')[0].innerText = responseReturned;
                };
            }
        };
        var payloadString = JSON.stringify(payload);
        xhr.send(payloadString);
    } else {
        document.getElementsByClassName('products-table-error')[0].style.display = "inline-block";
        document.getElementsByClassName('products-table-error')[0].innerText = "Please fill in the required fields";
    }
}
if (document.getElementById('btn-addProduct')) {
    document.getElementById('btn-addProduct').addEventListener('click',store.adminAddNewProduct);
}

store.adminEditProduct = function(event) {
    // Hide the add new product form and show the button
    document.getElementById('product-add-form').style.display = "none";
    document.getElementsByClassName('add-new-product')[0].style.display = "block";

    var tableRow = event.target.parentElement.parentElement;
    // Collect data from row
    var productId = tableRow.childNodes[0].innerText;
    var productTitle = tableRow.childNodes[4].innerText;
    var productCategory = tableRow.childNodes[6].innerText;
    var altTitle = tableRow.childNodes[8].innerText;
    var description = tableRow.childNodes[10].innerText;
    var price = tableRow.childNodes[12].innerText;
    // Insert into form
    var form = document.getElementById('product-edit-form');
    form.style.display = "block";
    document.getElementById('productEditId').innerHTML = productId;
    form.getElementsByTagName('input')[0].value = productTitle;
    form.getElementsByTagName('input')[1].value = altTitle;
    // Load categories
    store.loadCategories(catalog);
    let categoryTitles = pageConfig.categoryTitles;
    let len = categoryTitles.length;
    var selectElement = document.getElementById('editCategories');
    selectElement.innerHTML = "<option></option>";
    for (let i = 0; i < len; i++) {
        var option = document.createElement('option');
        let category = pageConfig.categoryTitles[i];
        if (category == productCategory.toLowerCase()) {
            option.setAttribute("selected", "");
        }
        option.innerHTML = category;
        selectElement.append(option);
    };
    form.getElementsByTagName('textarea')[0].value = description;
    form.getElementsByTagName('input')[3].value = price;
};

store.adminSaveProductChanges = function(event) {
    event.preventDefault();
    var errorBox = document.getElementsByClassName('products-table-error')[0]
    // Collect form data 
    var form = document.getElementById('product-edit-form');
    var productId = document.getElementById('productEditId').innerHTML;
    var productTitle = form.getElementsByTagName('input')[0].value;
    var altTitle = form.getElementsByTagName('input')[1].value;
    var productDescription = form.getElementsByTagName('textarea')[0].value;
    var productPrice = form.getElementsByTagName('input')[3].value;
    // Check if there is a new category:
    if (form.getElementsByTagName('input')[2].value !== "") {
        var productCategory = form.getElementsByTagName('input')[2].value;
    } else {
        var productCategory = document.getElementById("editCategories").value;
    }
    // Form the request
    if (productId && productTitle && altTitle && productDescription && productPrice && productCategory) {
        var xhr = new XMLHttpRequest();
        xhr.open('PUT','api/products/edit');
        xhr.setRequestHeader('Content-Type','application/json');
        if (store.config.sessionToken) {
            xhr.setRequestHeader('username', store.config.sessionToken.username);
            xhr.setRequestHeader('tokenid', store.config.sessionToken.id);
        };
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                var statusCode = xhr.status;
                var responseReturned = xhr.responseText;
                errorBox.style.display = "inline-block";
                errorBox.innerText = responseReturned;
                if (statusCode == 200) {
                    form.style.display = "none";
                }
            }
        };
        var payload = {
            'productId' : productId,
            'productName' : productTitle, 
            'altName' : altTitle,
            'productDescription' : productDescription, 
            'productPrice' : productPrice,
            'productCategory' : productCategory,
        };
        var payloadString = JSON.stringify(payload);
        xhr.send(payloadString);
    } else {
        errorBox.style.display = "inline-block";
        errorBox.innerText = "Please fill in the required fields";
    }
}

if (document.getElementById('btn-editProduct')) {
    document.getElementById('btn-editProduct').addEventListener('click', store.adminSaveProductChanges);
}

store.adminRemoveProduct = function(event) {
    var errorBox = document.getElementsByClassName('products-table-error')[0]
    var tableRow = event.target.parentElement.parentElement;
    var productId = tableRow.childNodes[0].innerText;
    if (confirm(`Are you sure about deleting the product (ID: ${productId})?\nPress OK to confirm`)) {
        var xhr = new XMLHttpRequest();
        xhr.open('DELETE','api/products/delete');
        xhr.setRequestHeader('Content-Type','application/json');
        if (store.config.sessionToken) {
            xhr.setRequestHeader('username', store.config.sessionToken.username);
            xhr.setRequestHeader('tokenid', store.config.sessionToken.id);
        };
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                var statusCode = xhr.status;
                var responseReturned = xhr.responseText;
                errorBox.style.display = "inline-block";
                errorBox.innerText = responseReturned;
                if (statusCode == 200) {
                    tableRow.innerHTML = "";
                }
            }
        };
        var payload = {
            'productId' : productId
        };
        var payloadString = JSON.stringify(payload);
        xhr.send(payloadString);
    }
}
// Initializing the store functions
store.ready = function() {
    // Get the token from local storage
    store.getSessionToken();
    // Load orders if the session token is set
    store.loadOrders();
    // Load products if the session token is set
    store.adminLoadProducts();
    // Loading functions
    store.displayUserName();
    store.requestCatalogData();
    // "Shopping" functions
    store.addingButtonFunctions();
    store.updateTotal();
    store.appendUpdateTotal();
    store.updateFloatingCart();
    // Redirect if there is no token in admin page
    // store.redirect();
};

store.ready();