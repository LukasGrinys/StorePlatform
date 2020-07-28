const ordersTable = document.getElementById('table-orders');


renderOrders = () => {
        ordersTable.innerHTML = `<tr><th>Order ID</th><th>Stripe Token ID</th><th>Date</th><th>Customer Info</th><th>Order details</th>
        <th>Total price</th><th>Status</th><th>Actions</th></tr>`;
        fetch('/api/orders', {
            method: 'GET',
            headers: { "Content-type" : "application/json"}
        }).then( (response) => {
            return response.json()
        }).then( (data) => {
            let ordersArray = data;
            let sortedArray = ordersArray.sort( (a,b) => { return JSON.parse(a).date - JSON.parse(b).date });
            const orderCount = ordersArray.length;
            for (let i = 0; i < orderCount; i++) {
                let obj = JSON.parse(sortedArray[i]);
                let tableRow = document.createElement('tr');
                let itemString = "";
                let orderData = obj.orderData;
                for (let i = 0; i < orderData.length; i++) {
                    let itemId = orderData[i][0];
                    let itemQuantity = orderData[i][1];
                    itemString += itemId + " x " + itemQuantity + "<br>";
                };
                let dateObj = new Date(obj.date);
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
                    <td class="table-small">${dateObj.toLocaleString()}</td>
                    <td class="table-small">${customerString}</td>
                    <td>${itemString}</td>
                    <td>$${obj.totalPrice}</td>
                    <td>${obj.orderStatus}</td>
                    <td><div class="actions-column">${buttonHTML} <div class="remove-button orders-delete">X</div></div></td>`;
                    ordersTable.append(tableRow);
                    document.getElementsByClassName('orders-action')[i].addEventListener('click',updateOrderStatus);
                    document.getElementsByClassName('orders-delete')[i].addEventListener('click',() => { openDeleteOrderModal(obj.orderId) });
                };
        }) 
};


updateOrderStatus = (event) => {
    const targetRow = event.target.parentElement.parentElement.parentElement;
    let currentStatus = targetRow.childNodes[5].innerText;
    if (currentStatus !== "Shipped") {
        if (store.sessionToken) {
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



renderOrders();