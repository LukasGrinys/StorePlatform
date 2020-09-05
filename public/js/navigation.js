const navbar = document.querySelector('.navigation-bar');
const toggleNavButton = document.querySelector('.toggleNav');
const closeButton = document.querySelector('.closeNav');
const logOutButton = document.getElementsByClassName('nav-log-out')[0];
const openManagement = document.getElementById('management');
const userSection = document.querySelector('.user-section');

const NAVBAR_CHANGE_WIDTH = 620;

class Navigation {
    constructor() {
        this.events();
    }

    events() {
        const closeNavMethod = this.closeNav;
        window.addEventListener('resize', () => {
            if (window.innerWidth > NAVBAR_CHANGE_WIDTH) {
                const navbarItems = navbar.getElementsByClassName('navbar-item');
                for (let i = 0; i < navbarItems.length; i++) {
                    navbarItems[i].style.display = 'block';
                }
                this.displayUserName();
                toggleNavButton.style.display = 'none';
            } else {
                closeNavMethod();
            }
        });
        window.addEventListener('load', () => {
            this.displayUserName();
        })
    }

    showNav() {    
        let len = navbar.getElementsByClassName('navbar-item').length;
        for (let i = 0; i < len; i++) {
            navbar.getElementsByClassName('navbar-item')[i].style.display = 'block';
        }
        document.getElementsByClassName('toggleNav')[0].style.display = 'none';
        document.getElementsByClassName('closeNav')[0].style.display = 'flex';
    };

    closeNav() {
        let len = navbar.getElementsByClassName('navbar-item').length;
        for (let i = 0; i < len; i++) {
            navbar.getElementsByClassName('navbar-item')[i].style.display = 'none';
        }
        document.getElementsByClassName('toggleNav')[0].style.display = 'flex';
        document.getElementsByClassName('closeNav')[0].style.display = 'none';
    }

    displayUserName() {
        if (store.sessionToken) {
            const username = store.sessionToken.username;
            userSection.style.display = '';
            userSection.innerHTML = `<div class="nav-log-out" onClick="logAdminOut()"></div>
            <a class="username flex-center" href="/dashboard">
                <img src="public/icons/user.png" class="user-icon"/>
                ${username}
            </a>
            `
        } else {
            userSection.style.display = 'none';
            userSection.innerHTML = '';
        }
    };

    redirectUserIfLoggedIn = () => {
        if (store.sessionToken) {
            window.location = '/dashboard'
        } else {
            window.location = '/login'
        }
    };
}

var navigation = new Navigation();

toggleNavButton.addEventListener('click', navigation.showNav);
closeButton.addEventListener('click', navigation.closeNav);
// logOutButton.addEventListener('click', logAdminOut);
if (openManagement) { openManagement.addEventListener('click', navigation.redirectUserIfLoggedIn)};