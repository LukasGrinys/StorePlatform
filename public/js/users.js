const usersTable = document.getElementById('users-table');
const usersModal = document.getElementsByClassName('users-modal')[0];
const userButton = document.getElementById('btn-user');
const createNewUserButton = document.getElementsByClassName('add-new-user')[0];
const closeUsersModalButton = document.getElementsByClassName('close-users-modal')[0];
const formHeader = document.getElementsByClassName('form-header')[0];

renderUsers = () => {
    usersTable.innerHTML = '<tr><th>User ID</th><th>Full Name</th><th>Username</th><th>Date added</th><th>Actions</th></tr>';
    fetch('/api/users', {
        method: "GET",
        headers: {'Content-type' : 'application/json'}
    }).then( (response) => {
        return response.json();
    }).then( (data) => {
        if (data.users) {
            let sortedList = data.users.sort( (a,b) => { return a.username - b.username});
            for (let i = 0; i < sortedList.length; i++) {
                let tableRow = document.createElement('tr');
                let user = sortedList[i];
                let date = new Date(user.dateCreated);
                let html = `<td>${user.userId}</td>
                <td>${user.firstName + " " + user.lastName}</td>
                <td>${user.username}</td>
                <td>${date.toLocaleDateString() + " " + date.getHours() + ":" + date.getMinutes()}</td>
                <td><div class="actions-column">
                <button type="button" class="btn-blue btn-edit-user">Edit</button>
                <div class="remove-button remove-product">X</div>
                </div></td>`;
                tableRow.innerHTML = html;
                usersTable.append(tableRow);
                document.getElementsByClassName('btn-edit-user')[i].addEventListener('click', () => { openUsersModal("edit", user.userId) });
                document.getElementsByClassName('remove-product')[i].addEventListener('click', () => openDeleteUserModal(user.userId));  
            }
        } else {
            renderTableErrorMessage(data.message);
        }
    })
}

const userIdField = document.getElementById('userId');
const usernameField = document.getElementById('username');
const firstNameField = document.getElementById('firstName');
const lastNameField = document.getElementById('lastName');
const passwordField = document.getElementById('password');
const repeatPasswordField = document.getElementById('repeatedPassword');
const userFormErrBox = document.getElementsByClassName('user-form-error')[0];
const createUserPasswords = document.getElementById('createPassword');
const editUserPasswords = document.getElementById('editPassword');
const oldPasswordField = document.getElementById('oldPassword');
const newPasswordField = document.getElementById('newPassword');

openUsersModal = (method, userId) => {
    usersModal.style.display = "flex";
    if (method === "add") {
        userButton.addEventListener('click', createNewUser);
        document.getElementById('userId').innerText = " NEW";
        formHeader.innerHTML = "Create new user";
        createUserPasswords.style.display = "block";
        editUserPasswords.style.display = "none";
    } else if (method === "edit") {
        let forbidden = false;
        userButton.addEventListener('click', editUser);
        formHeader.innerHTML = "Edit user";
        createUserPasswords.style.display = "none";
        editUserPasswords.style.display = "block";
        fetch(`/api/users?id=${userId}`, {
            method : "GET",
            headers: {'Content-type' : 'application/json'}
        }).then( (response) => {
            if (response.status === 403) {
                forbidden = true;
            }
            return response.json();
        }).then( (data) => {
            if (forbidden === true) {
                renderTableErrorMessage(data.message);
                closeUsersModal();
            } else {
                userButton.addEventListener('click', editUser);
                userIdField.innerHTML = data.userId;
                usernameField.value = data.username;
                usernameField.disabled = true;
                firstNameField.value = data.firstName;
                lastNameField.value = data.lastName;
                newPassword.value = "";
                oldPassword.value = "";
                userFormErrBox.innerHTML = "";
            }
        })
    }
}

closeUsersModal = () => {
    userButton.removeEventListener('click', createNewUser);
    userButton.removeEventListener('click', editUser);
    usersModal.style.display = "none";
    userIdField.innerHTML = "";
    usernameField.value = "";
    usernameField.disabled = false;
    firstNameField.value = "";
    lastNameField.value = "";
    passwordField.value = "";
    oldPasswordField.value = "";
    newPasswordField.value = "";
    repeatPasswordField.value = "";
    userFormErrBox.innerHTML = "";
}

createNewUser = () => {
    userFormErrBox.innerHTML = "";
    let username = usernameField.value;
    let firstName = firstNameField.value;
    let lastName = lastNameField.value;
    let password = passwordField.value;
    let repeatedPassword = repeatPasswordField.value;
    let badRequest = false;
    username = username.trim().length > 0 && username.trim().indexOf(" ") === -1 ? username.trim() : false;
    password = password.trim().length > 6 ? password.trim() : false; 
    let passwordMatch = repeatedPassword.trim() === password ? true : false;
    if (username && password && passwordMatch) {
        const body = {
            username: username,
            password: password,
            firstName: firstName.trim(),
            lastName: lastName.trim()
        };
        fetch('/api/users', {
            method: "POST",
            headers: {'Content-type' : 'application/json'},
            body: JSON.stringify(body)
        }).then( (response) => {
            if (response.status === 400) { badRequest = true;}
            return response.json();
        }).then( (data) => {
            if (badRequest) {
                userFormErrBox.innerHTML = data.message;
            } else {
                renderTableErrorMessage(data.message);
                renderUsers();
                closeUsersModal();
            }
        })
    } else {
        if (!username) { userFormErrBox.innerHTML += "You must fill in the username field. It cannot contain white spaces<br>";};
        if (!password) { userFormErrBox.innerHTML += "Password must be at least 7 characters long<br>";};
        if (!passwordMatch) { userFormErrBox.innerHTML += "Passwords dont match"};
    }
}

editUser = () => {
    userFormErrBox.innerHTML = "";
    const userId = userIdField.innerHTML.trim();
    let firstName = firstNameField.value;
    let lastName = lastNameField.value;
    let oldPassword = oldPasswordField.value;
    let newPassword = newPasswordField.value;
    let badRequest = false;
    newPassword = newPassword.trim().length > 6 || newPassword.trim().length === 0 ? newPassword.trim() : false; 
    if (newPassword !== false) {
        const body = {
            userId: userId,
            oldPassword: oldPassword,
            newPassword: newPassword,
            firstName: firstName.trim(),
            lastName: lastName.trim()
        };
        fetch('/api/users', {
            method: "PUT",
            headers: {'Content-type' : 'application/json'},
            body: JSON.stringify(body)
        }).then( (response) => {
            if (response.status === 400) { badRequest = true;}
            return response.json();
        }).then( (data) => {
            if (badRequest) {
                userFormErrBox.innerHTML = data.message;
            } else {
                renderTableErrorMessage(data.message);
                renderUsers();
                closeUsersModal();
            }
        })
    } else {
        userFormErrBox.innerHTML += "Password must be at least 7 characters long<br>";
    }
}

openDeleteUserModal = (userId) => {
    let forbidden = false;
    fetch(`/api/users?id=${userId}`, {
        method : "GET",
        headers: {'Content-type' : 'application/json'}
    }).then( (response) => {
        if (response.status === 403) {
            forbidden = true;
        }
        return response.json();
    }).then( (data) => {
        if (forbidden === true) {
            renderTableErrorMessage(data.message);
        } else {
            if (store.sessionToken.username === "admin" || store.sessionToken.username === "devadmin") {
                confirmModal.innerHTML = `<div class="modal-black"></div>
                <div class="confirm-box">
                    <div class="form-line">Are you sure you want to delete this account? (ID :${userId})</div>
                    <div class="buttons-line">
                        <div class="btn-blue" id="delete-user">Yes</div>
                        <div class="btn-blue" id="dont-delete">No</div>
                    </div>
                </div>`;
                confirmModal.style.display = "flex";
                document.getElementById("delete-user").addEventListener('click', () => deleteUser(userId, true));
                document.getElementById("dont-delete").addEventListener('click', closeConfirmModal);
            } else {
                confirmModal.innerHTML = `<div class="modal-black"></div>
                <div class="confirm-box">
                    <div class="form-line">Are you sure you want to delete your account?</div>
                    <div class="buttons-line">
                        <div class="btn-blue" id="delete-user">Yes</div>
                        <div class="btn-blue" id="dont-delete">No</div>
                    </div>
                </div>`;
                confirmModal.style.display = "flex";
                document.getElementById("delete-user").addEventListener('click', () => deleteUser(userId, false));
                document.getElementById("dont-delete").addEventListener('click', closeConfirmModal);
            }
            
        }
    })
}

deleteUser = (userId, isAdmin) => {
    let forbidden = false;
    let error = false;
    fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
        headers: { 'Content-type' : 'application/json'}
    }).then( (response) => {
        if (response.status === 403) {
            forbidden = true;
        };
        if (response.status === 500) {
            error = true;
        }
        return response.json();
    }).then( (data) => {
        if (forbidden) {
            renderTableErrorMessage(data.message);
            closeConfirmModal();
        } else {
            if (isAdmin === true || (isAdmin === false && error === true)) {
                renderTableErrorMessage(data.message);
                closeConfirmModal();
                renderUsers();
            } else if (error === false) {
                setSessionToken(false);
                window.location = "/login";
            }
        }
    })
}

createNewUserButton.addEventListener('click', () => { openUsersModal("add")} );
closeUsersModalButton.addEventListener('click', closeUsersModal);

renderUsers(); 