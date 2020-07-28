
let store = {
    sessionToken : false 
};

// Common elements
const errContainer = document.getElementsByClassName('err-container')[0];
const confirmModal = document.getElementsByClassName('confirm-modal-container')[0];

// Auth
getSessionToken = () => {
    let token = JSON.parse(localStorage.getItem('token')); 
    if (token) {
        if (token.expires < Date.now()) {
            store.sessionToken = false;
            localStorage.setItem('token', false);
        } else {
            store.sessionToken = token;
            renewToken();
        }
    } else {
        store.sessionToken = false;
        localStorage.setItem('token', false);
    }
};
setSessionToken = (token) => {
    store.sessionToken = token;
    let tokenStr = JSON.stringify(token);
    localStorage.setItem('token',tokenStr);
    let obj = { auth : token} ;
    document.cookie = JSON.stringify(obj);
};

renewToken = () => {
    let currentToken = store.sessionToken;
    let error = false;
    if (currentToken !== false) {
        fetch('/api/tokens', {
            method: "PUT",
            headers: { 'Content-type' : 'application/json'},
            body: JSON.stringify({
                id: currentToken.id,
                extend: true
            })
        }).then( (response) => {
            if (response.status !== 200) {
                error = true;
            }
            return response.json();
        }).then( (data) => {
            if (error === false) {
                setSessionToken(data);
            }
        })
    };   
};

adminLogin = () => {
    if (loginButton.classList.contains('btn-disabled')) return;
    document.getElementsByClassName('errText')[0].innerText = '';
    let username = document.getElementById('employeeUsername').value;
    let password = document.getElementById('employeePassword').value;
    if (username.trim().length === 0) {
        document.getElementsByClassName('errText')[0].innerText = 'Please enter your username';
        return;
    }
    if (password.trim().length === 0) {
        document.getElementsByClassName('errText')[0].innerText = 'Please enter your password';
        return;
    };
    loginButton.classList.add('btn-disabled');
    const payload = {
        username,
        password
    };
    let error = false;
    fetch('api/tokens', {
        method: "POST",
        headers: { 'Content-type' : 'application/json'},
        body: JSON.stringify(payload)
    }).then( (response) => {
        if (response.status !== 200) {
            error = true;
        }
        return response.json()
    }).then( (data) => {
        if (error === true) {
            document.getElementsByClassName('errText')[0].innerText = data.message;
            loginButton.classList.remove('btn-disabled');
        } else {
            setSessionToken(data);
            window.location = '/dashboard';
        }
    })
};

logAdminOut = () => {
    let tokenId = typeof(store.sessionToken.id) === 'string' ? store.sessionToken.id : false;
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

// Common functions

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

closeConfirmModal = () => {
    confirmModal.innerHTML = '';
    confirmModal.style.display = 'none';
}

// Init
getSessionToken();