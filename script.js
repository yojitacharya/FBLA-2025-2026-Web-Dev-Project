document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('header nav');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('is-active');
        nav.classList.toggle('is-open');
    });
});