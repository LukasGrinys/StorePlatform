
let catalog = [];
let pageConfig = {
    categoryTitles : [],
    filtersApplied : [],
    sortingType : 0, // 0 - A-Z (default) 1 - Z-A; 2-Low-High; 3 - High-Low
    itemsPerPage : 5,
    pageNumber : 1,
    pagesNeeded : 1,
    mediaWidth: '540px'
};
let orderInfo = [];

let store = {};
store.config = {
    'sessionToken' : false
};

// Document Elements
const checkoutElement = document.getElementsByClassName('checkout')[0];
const proceedToCheckoutButton = document.getElementsByClassName('purchase-btn')[0];
const navbar = document.getElementsByClassName('navigation-bar')[0];
const toggleNavButton = document.getElementsByClassName('toggleNav')[0];
const closeButton = document.getElementsByClassName('closeNav')[0];
const logOutButton = document.getElementsByClassName('nav-log-out')[0];
const filterListElement = document.getElementsByClassName('filter-list')[0];
const loadingScreen = document.getElementsByClassName('loading-screen')[0];
const catalogElement = document.getElementsByClassName('shop-items')[0];
const sortListElement = document.getElementsByClassName('sort-list')[0];
const pageQuantityInput = document.getElementsByClassName('page-quantity')[0];
const pageNumberContainer = document.getElementsByClassName('pages-numbers')[0];
const closeCheckoutButton = document.getElementsByClassName('close-checkout')[0];
const floatingCartText = document.getElementsByClassName('floating-cart-text')[0];
const floatingCartElement = document.getElementsByClassName('floating-cart')[0];
const errorBlock = document.getElementsByClassName('formError')[0];
const sendOrderButton = document.getElementsByClassName('order-send-btn')[0];
const checkOutContainer = document.getElementsByClassName('checkout-container')[0];
const cartTotal = document.getElementsByClassName('cart-total')[0];
const loginButton = document.getElementById('login-btn');
const openManagement = document.getElementById('management');
const checkOrderButton = document.getElementsByClassName('btn-checkOrder')[0];

// Management elements
const ordersTable = document.getElementById('table-orders');
const ordersTableErr = document.getElementsByClassName('orders-table-error')[0];
const errContainer = document.getElementsByClassName('err-container')[0];
const productsTable = document.getElementById('products-table');
const addNewProductButton = document.getElementsByClassName('add-new-product')[0];
const productsModal = document.getElementsByClassName('products-modal')[0];
const productForm = document.getElementsByClassName('product-form')[0];
const closeProductModalButton = document.getElementsByClassName('close-product-modal')[0];
const productButton = document.getElementById('btn-product');
const confirmModal = document.getElementsByClassName('confirm-modal-container')[0];

// Navigation
showNav = function() {    
    let len = navbar.getElementsByTagName('A').length;
    for (let i = 1; i < len; i++) {
        navbar.getElementsByTagName('A')[i].style.display = 'block';
    }
    document.getElementsByClassName('toggleNav')[0].style.display = 'none';
    document.getElementsByClassName('closeNav')[0].style.display = 'block';
}
closeNav = function() {
    let len = navbar.getElementsByTagName('A').length;
    for (let i = 1; i < len; i++) {
        navbar.getElementsByTagName('A')[i].style.display = 'none';
    }
    document.getElementsByClassName('toggleNav')[0].style.display = 'flex';
    document.getElementsByClassName('closeNav')[0].style.display = 'none';
}

displayUserName = () => {
    if (store.config.sessionToken && document.getElementsByClassName('username')[0]) {
        const str = store.config.sessionToken;
        document.getElementsByClassName('username')[0].innerText = str.username;
        document.getElementsByClassName('username')[0].style.display = 'block';
        document.getElementsByClassName('user-section')[0].style.display = '';
    } else if (!store.config.sessionToken && document.getElementsByClassName('username')[0]) {
        document.getElementsByClassName('user-section')[0].style.display = 'none';
        document.getElementsByClassName('username')[0].innerText = '';
        document.getElementsByClassName('username')[0].style.display = 'none';
    }
};



// Catalog
requestCatalogData = () => {
    if (!catalogElement) {
        return;
    };
    openLoadingScreen();
    const xhr = new XMLHttpRequest();
    xhr.open("GET","api/products", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
                    let statusCode = xhr.status;
                    let responseReturned = xhr.responseText;
                    let obj = JSON.parse(responseReturned);
                    if (statusCode !== 200) {
                        console.log('Error : Could not receive catalog info')
                    } else {
                        catalog = obj;
                        compileCategories(catalog);
                        appendCatalogItems();
                        closeLoadingScreen();
                    }
        };
    };
    xhr.send();
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
        if (catalog.length % pageConfig.itemsPerPage === 0) {
            pageConfig.pagesNeeded = catalog.length / pageConfig.itemsPerPage;
        } else {
            pageConfig.pagesNeeded = Math.floor(catalog.length / pageConfig.itemsPerPage) + 1;
        }
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
            let itemIdNumber = itemIdStr.replace("#","");
            const imageSourceUrl = "public/Items/item" + itemIdNumber + ".jpg";
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
        if (pageCount == 1) {
            pageNumberContainer.style.display = "none";
        } else {
            pageNumberContainer.style.display = "flex";
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
        removeCartItemButtons[i].addEventListener('click',store.removeCartItem);
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
    let fullName = document.getElementById('inputFullName').value.trim();
    let email = document.getElementById('inputEmail').value.trim();
    let addressLineOne = document.getElementById('inputAddOne').value.trim();
    let addressLineTwo = document.getElementById('inputAddTwo').value.trim();
    let address = [addressLineOne, addressLineTwo];
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
                                return response.json()
                             }).then( (data) => {
                                 if (data.success === true) {
                                    displaySuccessMessage(data.orderId);
                                    cleanCart();
                                 } else {
                                    displayErrorMessage(data.errMessage);
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
        checkOutContainer.innerHTML = "Waiting for payment..."
        orderInfo = [];
        let total = 0;
        for (let i = 0; i < cartItemCount; i++) {
            const cartItemId = document.getElementsByClassName('cart-id')[i+1].innerText;
            const cartQuantity = Number(document.getElementsByClassName('cart-quantity-number')[i].value);
            const cartItemPrice = parseFloat(document.getElementsByClassName('cart-price')[i+1].innerText.replace("$",''));
            const itemObj = {
                'id' : cartItemId,
                'quantity' : cartQuantity,
                'price' : cartItemPrice 
            };
            total += parseFloat(cartItemPrice * cartQuantity)
            orderInfo.push(itemObj);
        };
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

closeCheckoutWindow = () => {
    orderInfo = [];
    checkoutElement.style.opacity = '0';
    setTimeout( function() {
        checkoutElement.style.display = 'none';
    }, 800)
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

checkOrder = (event) => {
    event.preventDefault();
    let inputOrderId = document.getElementById('orderId').value;
    const responseBoxElement = document.getElementsByClassName('responseBox')[0];
    inputOrderId = inputOrderId.trim().length === 10 && typeof(inputOrderId) === 'string' ? inputOrderId.trim() : false;
    const url = `api/orders/get?orderId=${inputOrderId}`;
    if (inputOrderId) {
        fetch(`/api/orders?orderId=${inputOrderId}`, {
            method: 'GET',
            headers: { "Content-type" : "application/json"}
        }).then( (response) => {
            console.log(response);
            return response.json()
        }).then( (data) => {
            responseBoxElement.style.display = "block";
            responseBoxElement.innerText = data.message;
        })
    } else {
        responseBoxElement.style.display = "block";
        responseBoxElement.innerText = "Invalid ID";
    };
}

getSessionToken = () => {
    let tokenString = localStorage.getItem('token');
    let token = JSON.parse(tokenString);
    if (token) {
        if (token.expires < Date.now()) {
            store.config.sessionToken = false;
            localStorage.setItem('token', false);
        } else {
            store.config.sessionToken = token;
            renewToken();
        }
    };
};

setSessionToken = (token) => {
    store.config.sessionToken = JSON.parse(token);
    localStorage.setItem('token',token);
    let obj = { auth : token};
    document.cookie = JSON.stringify(obj);
};

renewToken = () => {
    let currentToken = typeof(store.config.sessionToken) === 'object' ? store.config.sessionToken : false;
    if (currentToken) {
        const payload = {
            'id' : currentToken.id,
            'extend' : true
        };
        const xhr = new XMLHttpRequest();
        xhr.open('PUT','api/tokens');
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                var statusCode = xhr.status;
                if (statusCode === 200) {
                    var yhr = new XMLHttpRequest();
                    yhr.open('GET','api/tokens?id='+currentToken.id);
                    yhr.onreadystatechange = function() {
                        if (yhr.readyState === XMLHttpRequest.DONE) {
                            let statusCode = yhr.status;
                            let responsestring = yhr.responseText;
                            if (statusCode === 200) {
                                setSessionToken(responsestring);
                            } else {
                                setSessionToken(false);
                                // callback(true);
                            }
                        }
                    }
                    yhr.send();
                }
            };
        }
        var payloadString = JSON.stringify(payload);
        xhr.send(payloadString);
    };   
};

adminLogin = () => {
    const username = document.getElementById('employeeUsername').value;
    const password = document.getElementById('employeePassword').value;
    const payload = {
        username,
        password
    };
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'api/tokens', true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if(xhr.readyState == XMLHttpRequest.DONE) {
            const statusCode = xhr.status;
            const responseReturned = xhr.responseText;
            if (statusCode !== 200) {
                const responseJSON = JSON.parse(responseReturned);
                const errorText = responseJSON.Error;
                document.getElementsByClassName('errText')[0].innerText = errorText;
            } else {
                setSessionToken(responseReturned);
                window.location = '/dashboard';
            }
        };
    };
    const payloadString = JSON.stringify(payload);
    xhr.send(payloadString); 
};
if (loginButton) { loginButton.addEventListener('click', adminLogin)};

logAdminOut = () => {
    let tokenId = typeof(store.config.sessionToken.id) === 'string' ? store.config.sessionToken.id : false;
    const xhr = new XMLHttpRequest();
    xhr.open('DELETE', `api/tokens?id=${tokenId}`);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        let statusCode = xhr.status;
        let responseReturned = xhr.responseText;
        if (statusCode === 200) {
            setSessionToken(false);
            window.location = '/';
        } else {
            console.log(responseReturned);
        }
      }
    }
    xhr.send();   
};

// If user is logged in, skip the "Log in" page
redirectUserIfLoggedIn = () => {
    if (store.config.sessionToken) {
        window.location = '/dashboard'
    } else {
        window.location = '/login'
    }
};

renderOrders = () => {
    if (ordersTable) {
        ordersTable.innerHTML = `<tr><th>Order ID</th>f<th>Stripe Token ID</th><th>Customer Info</th><th>Order details</th>
        <th>Total price</th><th>Status</th><th>Actions</th></tr>`
        fetch('/api/orders', {
            method: 'GET',
            headers: { "Content-type" : "application/json"}
        }).then( (response) => {
            return response.json()
        }).then( (data) => {
            let ordersArray = data;
            const orderCount = ordersArray.length;
            for (let i = 0; i < orderCount; i++) {
                let obj = JSON.parse(ordersArray[i]);
                let tableRow = document.createElement('tr');
                let itemString = "";
                let orderData = obj.orderData;
                for (let i = 0; i < orderData.length; i++) {
                    let itemId = orderData[i][0];
                    let itemQuantity = orderData[i][1];
                    itemString += itemId + " x " + itemQuantity + "<br>";
                };
                let customerString = obj.address + "<br>" + obj.email;
                // Form the action button
                let buttonHTML = '';
                if (obj.orderStatus.trim() === 'Pending') {
                    buttonHTML = '<button type="button" class="orders-action">Confirm</button>'
                };
                if (obj.orderStatus.trim() === 'Confirmed') {
                    buttonHTML = '<button type="button" class="orders-action">Ship</button>'
                };
                if (obj.orderStatus.trim() === 'Shipped') {
                    buttonHTML = '<button type="button" class="orders-action" disabled>Done</button>';
                }
                tableRow.innerHTML = `<td class="table-small">${obj.orderId}</td>
                    <td class="table-small">${obj.tokenId}</td>
                    <td class="table-small">${customerString}</td>
                    <td>${itemString}</td>
                    <td>$${obj.totalPrice}</td>
                    <td>${obj.orderStatus}</td>
                    <td><div class="orders-action-column">${buttonHTML} <div class="orders-delete">X</div></div></td>`;
                    ordersTable.append(tableRow);
                    document.getElementsByClassName('orders-action')[i].addEventListener('click',updateOrderStatus);
                    document.getElementsByClassName('orders-delete')[i].addEventListener('click',() => { openDeleteOrderModal(obj.orderId) });
                };
        }) 
    }
};

fixThePrice = (num) => {
    let str = String(num);
    let index = str.indexOf(".")
    if (index === -1) {
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

renderTableErrorMessage = (msg) => {
    errContainer.innerHTML = msg;
    errContainer.style.opacity = 1;
    setTimeout( () => {
        errContainer.style.opacity = 0;
    }, 1500);
    setTimeout( () => {
        errContainer.innerHTML = ``;
    },3000);
};

updateOrderStatus = (event) => {
    const targetRow = event.target.parentElement.parentElement.parentElement;
    let currentStatus = targetRow.childNodes[5].innerText;
    if (currentStatus !== "Shipped") {
        if (store.config.sessionToken) {
            let orderId = targetRow.firstChild.innerText;
            let errorMessage = '';
            let isError = false;
            fetch('/api/orders', {
                method : 'PUT',
                headers : { "Content-type" : "application/json"},
                body: JSON.stringify({
                    orderId : orderId
                })
            }).then( (response) => {
                if (response.status === 200) {
                    event.target.parentElement.innerHTML = "Updated!";
                } else {
                    isError = true;
                }
                return response.json()
            }).then ( (data) => {
                if (isError) {
                    renderTableErrorMessage(data.message);
                }
            })
        } else {
            window.location = '/login'
        }
    }
}

openDeleteOrderModal = (orderId) => {
    confirmModal.innerHTML = `
    <div class="modal-black"></div>
    <div class="confirm-box">
        <div class="form-line">Are you sure you want to delete this order?</div>
        <div class="buttons-line">
            <div class="btn-blue" id="delete-order">Yes</div>
            <div class="btn-blue" id="dont-delete">No</div>
        </div>
    </div>`;
    confirmModal.style.display = "flex";
    document.getElementById("delete-order").addEventListener('click', () => deleteOrder(orderId));
    document.getElementById("dont-delete").addEventListener('click', closeConfirmModal);
}

deleteOrder = (orderId) => {
    fetch(`/api/orders?id=${orderId}`, {
        method : "DELETE",
        headers: { 'Content-type' : 'application/json'}
    }).then( (response) => { 
        if (response.status === 403) {
            window.location = "/login";
        }
        return response.json();
    })
    .then( (data) => {
        renderTableErrorMessage(data.message);
        renderOrders();
        closeConfirmModal();
    });
}

renderProductsForAdmin = () => {
    fetch('api/products', {
        method : "GET",
        headers: { 'Content-type' : 'application/json'}
    }).then( (response) => {
        return response.json()
    }).then( (data) => {
        const catalog = data;
        const sortedCatalog = catalog.sort( (a,b) => { return Number(a.id.replace("#","")) - Number(b.id.replace("#",""))});    
        const len = sortedCatalog.length;
        productsTable.innerHTML = "<tr><th>ID</th><th>Picture</th><th>Title</th><th>Category</th><th>Price</th><th>Actions</th><th>Last changes</th></tr>";
        for (let i = 0; i < len; i++) {
            let tableRow = document.createElement('tr');
            let item = sortedCatalog[i];
            let itemId = item.id;
            let imageUrl = "public/"+item.imageSrc;
            let title = item.name;
            let category = item.category;
            let price = item.price;
            let lastChanges = item.timeOfChanges;
            let author = item.lastChangesBy;
            let d = new Date(lastChanges);
            let itemHTML = `<td class="table-small">${itemId}</td>
            <td><img class="cart-item-image" src="${imageUrl}"></td>
            <td class="table-small">${title}</td>
            <td class="table-small">${category}</td>
            <td class="table-small">${fixThePrice(price / 100)}</td>
            <td><div class="products-actions-column"><button type="button" class="btn-blue btn-edit-product">Edit</button><div class="remove-product">X</div></div></td>
            <td class="table-small">${d.toLocaleString()} <br>by ${author}</td>`
            tableRow.innerHTML = itemHTML;
            productsTable.append(tableRow);
            document.getElementsByClassName('btn-edit-product')[i].addEventListener('click', () => { openProductsModal("edit", itemId) });
            document.getElementsByClassName('remove-product')[i].addEventListener('click', () => openDeleteProductModal(itemId)); 
        }
        compileCategories(sortedCatalog);
    })
};

const productTitle = document.getElementById('productTitle');
const productImageURL = document.getElementById('imageURL');
const productCategory = document.getElementById('productEditCategory');
const productDescription = document.getElementById('productDescription');
const productPrice = document.getElementById('productPrice');
const errBox = document.getElementsByClassName('product-form-error')[0];
const formHeader = document.getElementsByClassName('form-header')[0];

openProductsModal = (method, itemId) => {
    productsModal.style.display = "flex";
    const categoryTitles = pageConfig.categoryTitles;
    const listElement = document.getElementById('productEditCategory');
    for (category of categoryTitles) {
        let html = `<option>${category}</option>`
        listElement.innerHTML += html;
    };
    if (method === "add") {
        productButton.addEventListener('click', addNewProduct);
        document.getElementById('productId').innerText = " NEW";
        formHeader.innerHTML = "Add new product";
    } else if (method === "edit") {
        productButton.addEventListener('click', editProduct);
        document.getElementById('productId').innerText = " " + itemId;
        formHeader.innerHTML = "Edit product";
        let queryId = itemId.replace("#","");
        fetch(`/api/products?itemId=${queryId}`, {
            method : "GET",
            headers: { 'Content-type' : 'application/json' }
        }).then( (response) => {
            return response.json()
        }).then( (data) => {
            productTitle.value = data.name;
            productImageURL.value = data.imageSrc;
            productCategory.value = data.category;
            productDescription.value = data.description;
            productPrice.value = fixThePrice(data.price / 100);
            errBox.innerHTML = "";
        })
    }
}
closeProductsModal = () => {
    productButton.removeEventListener('click', addNewProduct);
    productButton.removeEventListener('click', editProduct);
    productsModal.style.display = "none";
    productTitle.value = "";
    productImageURL.value = "";
    productCategory.innerHTML = "";
    productDescription.value = "";
    productPrice.value = "";
    errBox.innerHTML = "";
    formHeader.innerHTML = "";
};

addNewProduct = () => {
    let title = productTitle.value;
    title = title.trim().length > 0 ? title.trim() : false;
    let imageURL = productImageURL.value;
    imageURL = imageURL.trim().length > 0 ? imageURL.trim() : false;
    let category = productCategory.value;
    let description = productDescription.value;
    description = description.trim().length > 0 ? description.trim() : false;
    let price = Number(productPrice.value) * 100;
    if (title && imageURL && description && price) {
        fetch('/api/products', {
            method: 'POST',
            headers: {'Content-type' : 'application/json'},
            body: JSON.stringify({
                title: title,
                imageURL : imageURL,
                category: category,
                description: description,
                price: price })
            }).then( (response) => {
                if (response.status === 403) {
                    window.location = "/login"
                }   
                return response.json()
            }).then( (data) => {
                closeProductsModal();
                renderTableErrorMessage(data.message);
                renderProductsForAdmin();

        })
    } else {
        if (!title) { productTitle.style.border = "1px solid #C84741" } else { productTitle.style.border = "1px solid grey"};
        if (!imageURL) { productImageURL.style.border = "1px solid #C84741" } else {productImageURL.style.boder = "1px solid grey"};
        if (!description) { productDescription.style.border = "1px solid #C84741"} else { productDescription.style.border = "1px solid grey"};
        if (!price) { productPrice.style.border = "1px solid #C84741"} else { productPrice.style.border = "1px solid grey" };
        errBox.innerHTML = "Please fill in the inputs marked"
    }
}

editProduct = () => {
    let itemId = document.getElementById('productId').innerText;
    let title = productTitle.value;
    title = title.trim().length > 0 ? title.trim() : false;
    let imageURL = productImageURL.value;
    imageURL = imageURL.trim().length > 0 ? imageURL.trim() : false;
    let category = productCategory.value;
    let description = productDescription.value;
    description = description.trim().length > 0 ? description.trim() : false;
    let price = parseFloat(Number(productPrice.value) * 100);
    if (title && imageURL && description && price) {
        fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-type' : 'application/json'},
            body: JSON.stringify({
                title: title,
                imageURL : imageURL,
                category: category,
                description: description,
                price: price,
                itemId : itemId
            })
        }).then( (response) => {
            if (response.status === 403) {
                window.location = "/login";
            }
            return response.json();
        }).then( (data) => {
            closeProductsModal();
            renderTableErrorMessage(data.message);
            renderProductsForAdmin();
        })
    } else {
        if (!title) { productTitle.style.border = "1px solid #C84741" } else { productTitle.style.border = "1px solid grey"};
        if (!imageURL) { productImageURL.style.border = "1px solid #C84741" } else {productImageURL.style.boder = "1px solid grey"};
        if (!description) { productDescription.style.border = "1px solid #C84741"} else { productDescription.style.border = "1px solid grey"};
        if (!price) { productPrice.style.border = "1px solid #C84741"} else { productPrice.style.border = "1px solid grey" };
        errBox.innerHTML = "Please fill in the inputs marked"
    }
}

openDeleteProductModal = (itemId) => {
    confirmModal.innerHTML = `
    <div class="modal-black"></div>
    <div class="confirm-box">
        <div class="form-line">Are you sure you want to delete this item?</div>
        <div class="buttons-line">
            <div class="btn-blue" id="delete-product">Yes</div>
            <div class="btn-blue" id="dont-delete">No</div>
        </div>
    </div>`;
    confirmModal.style.display = "flex";
    document.getElementById("delete-product").addEventListener('click', () => deleteProduct(itemId));
    document.getElementById("dont-delete").addEventListener('click', closeConfirmModal);
}

deleteProduct = (itemId) => {
    let idNum = itemId.replace("#","");
    fetch(`/api/products?id=${idNum}`, {
        method: "DELETE",
        headers: { 'Content-type' : 'application/json'}
    }).then( (response) => {        
        if (response.status === 403) {
            window.location = "/login"
        }
        return response.json();
    }).then( (data) => {
        closeConfirmModal();
        renderTableErrorMessage(data.message)
        renderProductsForAdmin();
    })
}

closeConfirmModal = () => {
    confirmModal.innerHTML = '';
    confirmModal.style.display = 'none';
}

// Append functions
if (toggleNavButton) { toggleNavButton.addEventListener('click', showNav)};
if (closeButton) { closeButton.addEventListener('click', closeNav)};
if (sortListElement) { sortListElement.addEventListener('change', checkSortingType)};
if (pageQuantityInput) { pageQuantityInput.addEventListener('change', updateItemsPerPage)};
if (closeCheckoutButton) { closeCheckoutButton.addEventListener('click', closeCheckoutWindow);}
if (proceedToCheckoutButton) { proceedToCheckoutButton.addEventListener('click', proceedToCheckout)};
if (sendOrderButton) { sendOrderButton.addEventListener('click', sendOrder)};
if (logOutButton) { logOutButton.addEventListener('click', logAdminOut)};
if (openManagement) { openManagement.addEventListener('click', redirectUserIfLoggedIn) };
if (checkOrderButton) { checkOrderButton.addEventListener('click',checkOrder); }
if (addNewProductButton) { addNewProductButton.addEventListener('click', () => { openProductsModal("add")});}
if (closeProductModalButton) { closeProductModalButton.addEventListener('click', closeProductsModal)};


initializeStore = () => {
    getSessionToken();
    if (ordersTable) { renderOrders();}
    if (productsTable) { renderProductsForAdmin();}
    // Loading functions
    displayUserName();
    requestCatalogData();
    // "Shopping" functions
    addButtonFunctions();
    updateTotal();
    appendUpdateTotal();
    updateFloatingCart();
};

initializeStore();
