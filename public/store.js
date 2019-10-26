// LOGIC FOR THE STORE PAGE
var store = {};
// TODO : Set the cookies/localStorage (save orderInfo); Make a login form for users in the future // Headers and footers
// Load the catalog and form the categories data
var catalog = [];
var pageConfig = {
    categoryTitles : [],
    sortingType : 0, // 0 - A-Z (default) 1 - Z-A; 2-Low-High; 3 - High-Low
    itemsPerPage : 5,
    pageNumber : 1,
    pagesNeeded : 1
};

var orderInfo = [];
store.requestCatalogData = function()  {
    // Request the product catalog
    $.ajax ({
        type: 'get',
        url: 'public/itemCatalog.json',
        success: function(response) {
            catalog = JSON.parse(response);
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
    };
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

store.ready();

// Append proceedToCheckout function
var proceedToCheckoutButton = document.getElementsByClassName('purchase-btn')[0];
if (proceedToCheckoutButton) {
    proceedToCheckoutButton.addEventListener('click',store.proceedToCheckout);
};

// Confirming the details with order
store.sendOrder = function(event) {
    // preventing the submitting and collecting values
    event.preventDefault();
    var formId = this.id; // sendOrder
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
        xhr.open('POST', 'api/orders', true);
        console.log("Request made");
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function() {
            if(xhr.readyState == XMLHttpRequest.DONE) {
                var statusCode = xhr.status;
                var responseReturned = xhr.responseText;
                window.location = '/orderSent';
            // Callback if requested
            if(callback){
                try {
                    var parsedResponse = JSON.parse(responseReturned);
                    callback(statusCode,parsedResponse);

                } catch(e){
                callback(statusCode,false);
                }
            }
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

//
//
// 
// Interface for making API calls
store.request = function(headers,path,method,queryStringObject,payload,callback){
    // Set defaults
    headers = typeof(headers) == 'object' && headers !== null ? headers : {};
    path = typeof(path) == 'string' ? path : '/';
    method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
    queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
    payload = typeof(payload) == 'object' && payload !== null ? payload : {};
    callback = typeof(callback) == 'function' ? callback : false;
    // For each query string parameter sent, add it to the path
    var requestUrl = path+'?';
    var counter = 0;
    for(var queryKey in queryStringObject){
       if(queryStringObject.hasOwnProperty(queryKey)){
         counter++;
         // If at least one query string parameter has already been added, preprend new ones with an ampersand
         if(counter > 1){
           requestUrl+='&';
         }
         // Add the key and value
         requestUrl+=queryKey+'='+queryStringObject[queryKey];
       }
    }
    // Form the http request as a JSON type
    var xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader("Content-type", "application/json");
    // For each header sent, add it to the request
    for(var headerKey in headers){
       if(headers.hasOwnProperty(headerKey)){
         xhr.setRequestHeader(headerKey, headers[headerKey]);
       }
    }
    // If there is a current session token set, add that as a header
    //if(store.config.sessionToken){
    //  xhr.setRequestHeader("token", store.config.sessionToken.id);
    //}
    // When the request comes back, handle the response
    xhr.onreadystatechange = function() {
        if(xhr.readyState == XMLHttpRequest.DONE) {
          var statusCode = xhr.status;
          var responseReturned = xhr.responseText;
          // Callback if requested
          if(callback){
            try{
                console.log(responseReturned);
              var parsedResponse = JSON.parse(responseReturned);
              callback(statusCode,parsedResponse);
            } catch(e){
              callback(statusCode,false);

            }
          }
        }
    }
    // Send the payload as JSON
    var payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
};
