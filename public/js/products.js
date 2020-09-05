const addNewProductButton = document.getElementsByClassName('add-new-product')[0];
const productsModal = document.getElementsByClassName('products-modal')[0];
const productForm = document.getElementsByClassName('product-form')[0];
const closeProductModalButton = document.getElementsByClassName('close-product-modal')[0];
const productButton = document.getElementById('btn-product');
const productsTable = document.getElementById('products-table');

let pageConfig = {
    categoryTitles : []
};

renderProducts = () => {
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
            let imageUrl = item.imageSrc.indexOf("https://") > -1 ? item.imageSrc : "public/"+item.imageSrc;
            let title = item.name;
            let category = item.category;
            let price = item.price;
            let lastChanges = item.timeOfChanges;
            let author = item.lastChangesBy;
            let d = new Date(lastChanges);
            let itemHTML = `<td class="table-small">${itemId}</td>
            <td style="width:50px"><img class="cart-item-image" src="${imageUrl}"></td>
            <td class="table-small">${title}</td>
            <td class="table-small">${category}</td>
            <td class="table-small">${fixThePrice(price / 100)}</td>
            <td><div class="actions-column">
            <button type="button" class="btn-blue btn-edit-product">Edit</button>
            <div class="remove-button remove-product">X</div>
            </div></td>
            <td class="table-small">${d.toLocaleString()} <br>by ${author}</td>`
            tableRow.innerHTML = itemHTML;
            productsTable.append(tableRow);
            document.getElementsByClassName('btn-edit-product')[i].addEventListener('click', () => { openProductsModal("edit", itemId) });
            document.getElementsByClassName('remove-product')[i].addEventListener('click', () => openDeleteProductModal(itemId)); 
        }
        compileCategories(sortedCatalog);
    })
};

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
}

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
    imageURL = imageURL.trim().length > 0 ? imageURL.trim() : '';
    let category = productCategory.value;
    let description = productDescription.value;
    description = description.trim().length > 0 ? description.trim() : false;
    let price = Number(productPrice.value) * 100;
    if (title && description && price) {
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
                renderProducts();
            }).catch( (err) => {
                console.log(err);
            })
    } else {
        if (!title) { productTitle.style.border = "1px solid #C84741" } else { productTitle.style.border = "1px solid grey"};
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
    imageURL = imageURL.trim().length > 0 ? imageURL.trim() : '';
    let category = productCategory.value;
    let description = productDescription.value;
    description = description.trim().length > 0 ? description.trim() : false;
    let price = parseFloat(Number(productPrice.value) * 100);
    if (title && description && price) {
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
            renderProducts();
        }).catch( (err) => {
            console.log(err);
        })
    } else {
        if (!title) { productTitle.style.border = "1px solid #C84741" } else { productTitle.style.border = "1px solid grey"};
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
        renderProducts();
    })
}

addNewProductButton.addEventListener('click', () => { openProductsModal("add")});
closeProductModalButton.addEventListener('click', closeProductsModal);

renderProducts();