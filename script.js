document.addEventListener('DOMContentLoaded', () => {
    const clickableCircle = document.getElementById('clickableCircle');
    const statusText = document.getElementById('statusText');
    if (clickableCircle && statusText) {
        clickableCircle.addEventListener('click', () => {
            statusText.textContent = "Yükleniyor...";
            clickableCircle.classList.add('pulse-animation');
            setTimeout(() => {
                location.reload();
            }, 1000); 
        });
    }
});