const checkoutElement = document.getElementsByClassName('checkout')[0];
const proceedToCheckoutButton = document.getElementsByClassName('purchase-btn')[0];
const filterListElement = document.getElementsByClassName('filter-list')[0];
const loadingScreen = document.getElementsByClassName('loading-screen')[0];
const catalogElement = document.getElementsByClassName('shop-items')[0];
const sortListElement = document.getElementsByClassName('sort-list')[0];
const pageQuantityInput = document.getElementsByClassName('page-quantity')[0];
const pageNumberContainer = document.getElementsByClassName('pages-numbers')[0];
const paginationContainer = document.querySelector('.pages-container');
const closeCheckoutButton = document.getElementsByClassName('close-checkout')[0];
const floatingCartText = document.getElementsByClassName('floating-cart-text')[0];
const floatingCartElement = document.getElementsByClassName('floating-cart')[0];
const errorBlock = document.getElementsByClassName('formError')[0];
const sendOrderButton = document.getElementsByClassName('order-send-btn')[0];
const checkOutContainer = document.getElementsByClassName('checkout-container')[0];
const cartTotal = document.getElementsByClassName('cart-total')[0];
const waitingForPaymentMessage = document.querySelector('.checkout-waiting-message');


let catalog = [];
let pageConfig = {
    categoryTitles : [],
    filtersApplied : [],
    sortingType : 0, // 0 - A-Z (default) 1 - Z-A; 2-Low-High; 3 - High-Low
    itemsPerPage : 5,
    pageNumber : 1,
    pagesNeeded : 1
};

let orderInfo = [];

requestCatalogData = () => {
    openLoadingScreen();
    fetch('/api/products', {
        method: "GET",
        headers: { 'Content-type' : 'application/json'}
    }).then( (response) => {
        if (response.status !== 200) {
            console.log("Error: could not receive catalog info");
            closeLoadingScreen();
        };
        return response.json();
    }).then( (data) => {
        catalog = data;
        compileCategories(catalog);
        appendCatalogItems();
        closeLoadingScreen();
    });
}

compileCategories = (data) => {
    let categories = [];
    for (let i = 0; i < data.length; i++) {
        item = data[i];
        categoryName = item.category;
        if (categories.indexOf(categoryName) === -1) {
            categories.push(categoryName);
        }
    }
    pageConfig.categoryTitles = categories;
    if (filterListElement) { appendFilterOptions();}
}

appendCatalogItems = () => {
    if (catalogElement) {
        catalogElement.innerHTML = "";
        let filteredCatalog = [];
        for (let i = 0; i < catalog.length; i++) {
            let itemCategory = catalog[i].category.trim();
            if (pageConfig.filtersApplied.indexOf(itemCategory) > - 1 || pageConfig.filtersApplied.length === 0) {
                filteredCatalog.push(catalog[i]);
            }
        };
        const sortingType = pageConfig.sortingType;
        if (sortingType === 0) {
            // A-Z
            filteredCatalog.sort(function(a, b){
                var x = a.name.toLowerCase();
                var y = b.name.toLowerCase();
                if (x < y) {return -1;}
                if (x > y) {return 1;}
                return 0;
            });
        };
        if (sortingType === 1) {
            // Z-A
            filteredCatalog.sort(function(a, b){
                var x = a.name.toLowerCase();
                var y = b.name.toLowerCase();
                if (x > y) {return -1;}
                if (x < y) {return 1;}
                return 0;
            });
        };
        if (sortingType === 2) {
            // Cheapest - Expensive
            filteredCatalog.sort(function(a,b) {
                return a.price - b.price
            });
        };
        if (sortingType === 3) {
            // Expensive - Cheapest
            filteredCatalog.sort(function(a,b) {
                return b.price - a.price;
            });
        };

        if (filteredCatalog.length % pageConfig.itemsPerPage === 0) {
            pageConfig.pagesNeeded = filteredCatalog.length / pageConfig.itemsPerPage;
        } else {
            pageConfig.pagesNeeded = Math.floor(filteredCatalog.length / pageConfig.itemsPerPage) + 1;
        }

        if (pageConfig.pagesNeeded === 1) { pageConfig.pageNumber = 1};

        // Cut the catalog according to the page number and itemsPerPage value
        const itemsPerPage = pageConfig.itemsPerPage;
        const page = pageConfig.pageNumber;
        const slicedCatalog = filteredCatalog.slice(itemsPerPage*(page - 1), (itemsPerPage)*(page - 1) + itemsPerPage);
        for (let i = 0; i < slicedCatalog.length; i++) {
            let item = slicedCatalog[i]; 
            let category = item.category;
            let categoryString = category.toLowerCase().replace(" ","");
            const iconSourceUrl = "public/icons/categories/" + categoryString + ".png";
            let itemIdStr = item.id;
            let imageSourceUrl =  item.imageSrc.indexOf("https://") > -1 ? item.imageSrc : "/public/" + item.imageSrc;
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
                <span class="item-price">$${fixThePrice(item.price / 100)}</span>
                <div class="item-quantity-container">
                    <button type="button" onclick="this.parentNode.querySelector('input[type=number]').stepDown()" class="number-change numberDec">-</button>
                    <input type="number" min="1" max="99" value="1">
                    <button type="button" onclick="this.parentNode.querySelector('input[type=number]').stepUp()" class="number-change numberInc">+</button>
                </div>
                <div class="btn-addToCart btn-blue">Add to cart</div>
                </div>`;
            itemContainer.classList.add('item-container');
            catalogElement.appendChild(itemContainer);
        }
    };
    
    addButtonFunctions();
    appendPageNumbers();
}

// Loading screen functions
closeLoadingScreen = () => {
    if (loadingScreen) { loadingScreen.style.display = 'none';};
}
openLoadingScreen = () => {
    if (loadingScreen) { loadingScreen.style.display = 'flex';};
}


// Catalog Options
applyFilter = () => {
    pageConfig.filtersApplied = [];
    const filterCount = (filterListElement.childElementCount - 1) / 3;
    for (let i = 0; i < filterCount; i++) {
        let filterToCheck = filterListElement.getElementsByTagName('input')[i];
        let filterClass = filterToCheck.className;
        let filterName = filterClass.slice(4,filterClass.length);
        let filterNameFixed = filterName.replace("-"," ");
        if (filterToCheck.checked === true) {
            pageConfig.filtersApplied.push(filterNameFixed);
        }
    }
    requestCatalogData();
}

appendFilterOptions = () => {
    filterListElement.innerHTML = "";
    if (filterListElement) {
        const categories = pageConfig.categoryTitles;
        for (let i = 0; i < categories.length; i++) {
            let categoryHTML = categories[i].replace(" ","-");
            let checkboxElement = document.createElement('input');
            checkboxElement.setAttribute('type','checkbox');
            checkboxElement.setAttribute('id','cat'+i+1);
            checkboxElement.setAttribute('class','cat-'+categoryHTML);
            if (pageConfig.filtersApplied.indexOf(categories[i]) > -1) {
                checkboxElement.setAttribute('checked','');
            }
            let labelElement = document.createElement('label');
            labelElement.setAttribute('for','cat'+i+1);
            labelElement.innerText = categories[i];
            let breakElement = document.createElement('br');
            filterListElement.append(checkboxElement, labelElement, breakElement);
        }
        let button = document.createElement('button');
        button.setAttribute('type','button');
        button.setAttribute('class','btn-blue filter-btn');
        button.innerText = "Apply filter";
        button.addEventListener('click', applyFilter);
        filterListElement.append(button);
    };
};

checkSortingType = () => {
    openLoadingScreen();
    const inputs = sortListElement.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].checked === true) {
            pageConfig.sortingType = i;
        }
    }
    requestCatalogData();
}

updateItemsPerPage = () => {
    openLoadingScreen();
    pageConfig.itemsPerPage = pageQuantityInput.value;
    pageConfig.pageNumber = 1;
    requestCatalogData();
}

appendPageNumbers = () => {
    if (pageNumberContainer) {
        pageNumberContainer.innerHTML = "";
        let pageCount = pageConfig.pagesNeeded;
        if (pageCount === 1) {
            paginationContainer.style.display = "none";
        } else {
            paginationContainer.style.display = "flex";
            for (let i = 0; i < pageCount; i++) {
                if (pageConfig.pageNumber === i + 1) {
                    let pageSquare = `<span class="pages-page-number selected-page">${i+1}</span>`;
                    pageNumberContainer.innerHTML += pageSquare;
                } else {
                    let pageSquare = `<span class="pages-page-number">${i+1}</span>`;
                    pageNumberContainer.innerHTML += pageSquare;
                }
            };
        };
        bindPageNumbers();
    };
}

goToFirstPage = () => {
    if (pageConfig.pageNumber !== 1) {
        pageConfig.pageNumber = 1;
        requestCatalogData();
    };
}
goOnePageBack = () => {
    if (pageConfig.pageNumber > 1) {
        pageConfig.pageNumber--;
        requestCatalogData();
    };
}
goToSpecificPage = (num) => {
    if (num !== pageConfig.pageNumber) {
        pageConfig.pageNumber = num;
        requestCatalogData();
    };
}
goOnePageForward = () => {
    if (pageConfig.pageNumber < pageConfig.pagesNeeded) {
        pageConfig.pageNumber++;
        requestCatalogData();
    };
}
goToLastPage = () => {
    if (pageConfig.pageNumber !== pageConfig.pagesNeeded) {
        pageConfig.pageNumber = pageConfig.pagesNeeded;
        requestCatalogData();
    }
}

bindPageNumbers = () => {
    document.getElementsByClassName('pages-to-first')[0].addEventListener('click',goToFirstPage);
    document.getElementsByClassName('pages-back')[0].addEventListener('click', goOnePageBack);
    document.getElementsByClassName('pages-next')[0].addEventListener('click', goOnePageForward);
    document.getElementsByClassName('pages-to-last')[0].addEventListener('click', goToLastPage);
    const numberOfSquares = document.getElementsByClassName('pages-numbers')[0].childElementCount;
    for (let i = 0; i < numberOfSquares; i++) {
        const pageSquare = document.getElementsByClassName('pages-page-number')[i];
        pageSquare.addEventListener('click', function() { 
            var n = i + 1;
            goToSpecificPage(n);
        });
    }
}

// Adding an item to the cart
addItemToCart = (event) => {
    const button = event.target;
    const itemElement = button.parentElement.parentElement;
    const itemId = itemElement.getElementsByClassName('item-id')[0].innerText;
    const itemQuantity = itemElement.getElementsByTagName('INPUT')[0].value;
    const itemName = itemElement.getElementsByClassName('item-header')[0].innerText;
    const itemImageSrc = itemElement.getElementsByTagName('IMG')[1].src;
    const itemPrice = itemElement.getElementsByClassName('item-price')[0].innerText;
    const cartItems = document.getElementsByClassName('cart-table')[0];
    const cartItemsCount = cartItems.childElementCount;
    for (let i = 1; i < cartItemsCount; i++) {
        let idToCheck = cartItems.getElementsByClassName('cart-id')[i].innerText;
        if (idToCheck === itemId) {
            alert("Item is already in the cart");
            return;
        }
    };
    let cartRow = document.createElement('div');
    cartRow.innerHTML = `<div class="cart-id cart-column">${itemId}</div>
    <div class="cart-image cart-column"> 
        <img class="cart-item-image" src=${itemImageSrc} alt="${itemName}">
    </div>
    <div class="cart-item cart-column">${itemName}</div>
    <div class="cart-price cart-column">${itemPrice}</div>
    <div class="cart-quantity cart-column">
        <div class="cart-quantity-box">
            <button type="button" onclick="this.parentNode.querySelector('input[type=number]').stepDown()" class="number-change-cart numberDec">-</button>
            <input class="cart-quantity-number" type="number" min="1" max="99" value="${itemQuantity}">
            <button type="button" onclick="this.parentNode.querySelector('input[type=number]').stepUp()" class="number-change-cart numberInc">+</button><br>
        </div>
    <button type="button" class="btn-remove-item btn-orange">Remove</button>
    </div>`  ;
    cartRow.classList.add('cart-row')
    cartItems.append(cartRow);
    updateTotal();
    updateFloatingCart();
    appendUpdateTotal();
    addButtonFunctions();
};

removeCartItem = (event) => {
    const removeItemButton = event.target;
    const itemToRemove = removeItemButton.parentElement.parentElement;
    itemToRemove.parentElement.removeChild(itemToRemove);
    updateTotal();
    updateFloatingCart();
}

addButtonFunctions = () => {
    const pageItemCount = document.getElementsByClassName('item-container').length;
    for (let i = 0; i < pageItemCount; i++) {
        const itemAddToCartButtons = document.getElementsByClassName('btn-addToCart');
        const button = itemAddToCartButtons[i];
        button.addEventListener('click', addItemToCart);
    };
    const removeCartItemButtons = document.getElementsByClassName('btn-remove-item');
    const len = removeCartItemButtons.length;
    for (let i = 0; i < len; i++) {
        removeCartItemButtons[i].addEventListener('click',removeCartItem);
    }
}

appendUpdateTotal = () => {
    const cartQuantityChangeButtons = document.getElementsByClassName('number-change-cart');
    const len = cartQuantityChangeButtons.length;
    for (let i = 0; i < len; i++) {
        const cartQuantityChangeButton = cartQuantityChangeButtons[i];
        cartQuantityChangeButton.addEventListener('click',  updateTotal);
        cartQuantityChangeButton.addEventListener('click', updateFloatingCart);
    }
};

updateTotal = () => {
    let total = 0;
    const cartItems = document.getElementsByClassName('cart-table')[0];
    if (cartItems) {
        const count = cartItems.childElementCount - 1;
        for (let i = 0; i < count; i++) {
            let cartQuantityElement = document.getElementsByClassName('cart-quantity-number')[i];
            let cartQuantity = cartQuantityElement.value;
            let cartItemPrice = document.getElementsByClassName('cart-price')[i+1].innerText;
            let priceNumber = cartItemPrice.replace("$","");
            let priceRow = Number(cartQuantity) * Number(priceNumber)
            total += priceRow;
        };
        total = parseFloat(total).toFixed(2);
        let totalStr = String(total);
        let pointPosition = totalStr.indexOf(".");
        let decimalParts = totalStr.slice(pointPosition,totalStr.length);
        if (decimalParts.length === 1) {
            totalStr += "0";
        };
        if (decimalParts.length === 0) {
            totalStr += ".00";
        };
        const totalElement = document.getElementsByClassName('cart-total')[0];
        if (totalStr === "0.00") {
            totalElement.innerHTML = `<span>Cart is empty</span>`;
        } else {
            totalElement.innerHTML = `<span><b>Total: </b>$${totalStr}</span>`;
        }
    };
}

stripeHandler = {};

proceedToCheckout = () => {
    const cartItemCount = document.getElementsByClassName('cart-row').length - 2;
    if (cartItemCount === 0) {
        alert("The cart is empty");
        return;
    }
    var stripePublicKey = '';
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/stripeKeys', true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                let statusCode = xhr.status;
                let responseText = xhr.responseText;
                let obj = JSON.parse(responseText);
                if (statusCode === 200) {
                    checkoutElement.style.display = 'flex';
                    setTimeout( () => {
                        checkoutElement.style.opacity = '1';
                    }, 100);
                    stripePublicKey = obj.stripePublicKey;
                    stripeHandler = StripeCheckout.configure({
                        key: stripePublicKey,
                        locale: 'auto',
                        token: function(token) {
                            let fullName = document.getElementById('inputFullName').value.trim();
                            let email = document.getElementById('inputEmail').value.trim();
                            let addressLineOne = document.getElementById('inputAddOne').value.trim();
                            let addressLineTwo = document.getElementById('inputAddTwo').value.trim();
                            let address = [addressLineOne, addressLineTwo];
                             fetch('/api/orders', {
                                 method: 'POST',
                                 headers: { 
                                    "Content-type" : "application/json",
                                    "Accept" : "application/json"
                                },
                                body: JSON.stringify({
                                    tokenId: token.id,
                                    orderInfo: orderInfo,
                                    fullName: fullName,
                                    address: address,
                                    email: email
                                })
                             }).then( (response) => {
                                return response.json();
                             }).then( (data) => {
                                closeWaitingForPayment();
                                 if (data.success === true) {
                                    displaySuccessMessage(data.orderId);
                                    cleanCart();
                                 } else {
                                    displayErrorMessage(data.message);
                                 }
                             }).catch ( (error) => {
                                displayErrorMessage(error)
                             })
                        }
                    });
                }
            }
        }
    xhr.send();
}

sendOrder = (event) => {
    event.preventDefault();
    errorBlock.style.display = 'none';
    const cartItemCount = document.getElementsByClassName('cart-row').length - 2;
    if (cartItemCount === 0) {
        alert("The cart is empty");
        return;
    }
    let fullName = document.getElementById('inputFullName').value;
    let email = document.getElementById('inputEmail').value;
    let addressLineOne = document.getElementById('inputAddOne').value;
    let addressLineTwo = document.getElementById('inputAddTwo').value;
    let agreement = document.getElementById('agreement').checked ? true : false;
    fullName = fullName.length > 0 && typeof(fullName) === 'string' ? fullName : false;
    email = email.indexOf("@") > -1 && email.indexOf(".") > -1 && email.length > 0 && typeof(email) === 'string' ? email : false;
    addressLineOne = typeof(addressLineOne) === 'string' && addressLineOne.length > 0 ? addressLineOne : false;
    addressLineTwo = addressLineTwo.length === 0 ? " " : addressLineTwo;
    if (fullName && email && addressLineOne && agreement) {
        displayWaitingForPayment();
        orderInfo = [];
        let total = 0;
        for (let i = 0; i < cartItemCount; i++) {
            const cartItemId = document.getElementsByClassName('cart-id')[i+1].innerText;
            const cartQuantity = Number(document.getElementsByClassName('cart-quantity-number')[i].value);
            const cartItemPrice = Number(document.getElementsByClassName('cart-price')[i+1].innerText.replace("$",''));
            const itemObj = {
                'id' : cartItemId,
                'quantity' : cartQuantity,
                'price' : cartItemPrice 
            };
            total += Number((cartItemPrice * cartQuantity).toFixed(2)); 
            orderInfo.push(itemObj);
        };
        total = Number(total.toFixed(2));
        stripeHandler.open({
            amount: total * 100
        })
    } else {
        errorBlock.style.display = 'block';
        errorBlock.innerText = "Please fill out all the required fields";
        const errBorder = "1px solid #FF7E57";
        const defBorder = "1px solid grey";
        if (!fullName) { document.getElementById('inputFullName').style.border = errBorder; 
        } else { document.getElementById('inputFullName').style.border = defBorder;};
        if (!email) { document.getElementById('inputEmail').style.border = errBorder; 
        } else {document.getElementById('inputEmail').style.border = defBorder; };
        if (!addressLineOne) { document.getElementById('inputAddOne').style.border = errBorder; 
        } else { document.getElementById('inputAddOne').style.border = defBorder;};
    };
}

displaySuccessMessage = (orderId) => {
    checkOutContainer.innerHTML = `<div class="order-sent-text">
    <h1>Order was sent</h1>
    <span>Your order was sent. Thank you for stopping by!</span><br>
    <span>Your order ID is : ${orderId} </span>
    <div class="btn-blue" onclick="closeCheckoutWindow()">Go back</div>
  </div>`;
}

displayErrorMessage = (message) => {
    checkOutContainer.innerHTML = `<div class="order-sent-text">
    <h1>Error</h1>
    <span>Your order was not successful</span><br>
    <span>Error message: ${message}</span>
    <div class="btn-blue" onclick="closeCheckoutWindow()">Close</div>
  </div>`;
}

displayWaitingForPayment = () => {
    waitingForPaymentMessage.style.display = 'flex';
}
closeWaitingForPayment = () => {
    waitingForPaymentMessage.style.display = 'none';
}

closeCheckoutWindow = () => {
    window.location.href = "/";
}

cleanCart = () => {
    orderInfo = [];
    document.getElementsByClassName('cart-table')[0].innerHTML = 
    `<div class='cart-row'>
      <span class="cart-id cart-header cart-column">ID</span>
      <span class="cart-image cart-header cart-column">IMAGE</span>
      <span class="cart-item cart-header cart-column">ITEM</span>
      <span class="cart-price cart-header cart-column">PRICE</span>
      <span class="cart-quantity cart-header cart-column">QUANTITY</span>
    </div>`;
    updateTotal();
    updateFloatingCart();

}

updateFloatingCart = () => {
    if (floatingCartText) {
        const itemsInCart = document.getElementsByClassName('cart-row').length - 2;
        let itemCount = 0;
        for (let i = 0; i < itemsInCart; i++) {
            let itemQuantity = document.getElementsByClassName('cart-quantity-number')[i].value;
            itemCount += Number(itemQuantity);
        };
        if (itemCount === 0) {
            floatingCartText.innerText = "Cart";
        } else if (itemCount === 1) {
            floatingCartText.innerText = "1 item";
        } else {
            floatingCartText.innerText = itemCount + " items";
        };
        if (itemCount > 99) {
            floatingCartElement.style.fontSize = "0.75em";
            floatingCartElement.style.padding = "10px";
        } else {
            floatingCartElement.style.fontSize = "1em";
            floatingCartElement.style.padding = "8px";
        };
    };
}

scrollToCart = () => {
    window.scrollTo({ 
        top: document.body.scrollHeight, 
        behavior: 'smooth' 
    });
}

sortListElement.addEventListener('change', checkSortingType);
pageQuantityInput.addEventListener('change', updateItemsPerPage);
closeCheckoutButton.addEventListener('click', closeCheckoutWindow);
proceedToCheckoutButton.addEventListener('click', proceedToCheckout);
sendOrderButton.addEventListener('click', sendOrder);
floatingCartElement.addEventListener('click', scrollToCart);

requestCatalogData();
addButtonFunctions();
updateTotal();
appendUpdateTotal();
updateFloatingCart();