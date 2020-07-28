const checkOrderButton = document.getElementsByClassName('btn-checkOrder')[0];

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

checkOrderButton.addEventListener('click',checkOrder);