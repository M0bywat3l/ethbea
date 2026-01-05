/**
 * Plik: main/js/tech.js
 * Odpowiada za:
 * 1. Weryfikację sesji logowania.
 * 2. Ładowanie szablonów HTML.
 * 3. Podmianę danych z info.js (PERSON_DATA).
 * 4. Naprawę ścieżek do grafik i CSS.
 * 5. Powiadomienia Discord przez API bota.
 */

async function loadApp() {
    const container = document.getElementById('app-container');
    
    // Sprawdzenie czy kontener istnieje i czy dane osoby są załadowane
    if (!container || typeof PERSON_DATA === 'undefined') {
        console.error("Błąd: Nie znaleziono kontenera 'app-container' lub danych PERSON_DATA.");
        return;
    }

    // --- ZABEZPIECZENIE LOGOWANIA ---
    // Jeśli użytkownik nie wpisał hasła na index.html, wyrzuć go z powrotem
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '../index.html';
        return;
    }

    // Określenie którą stronę przeglądamy
    const isMainPage = window.location.pathname.includes('sg.html');
    const templateName = isMainPage ? 'template2.html' : 'template1.html';
    const pageTitle = isMainPage ? "Strona Główna" : "mDowód";

    try {
        // Pobieranie szablonu HTML
        const response = await fetch(`../main/templates/${templateName}`);
        if (!response.ok) throw new Error(`Błąd pobierania szablonu: ${templateName}`);
        
        let html = await response.text();

        // 1. Podmiana danych {{klucz}} na wartości z info.js
        Object.keys(PERSON_DATA).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, PERSON_DATA[key]);
        });

        // 2. NAPRAWA ŚCIEŻEK (Rozwiązanie problemu gigantycznych/brakujących grafik)
        // Zamiana "main/..." na "../main/..." ponieważ plik HTML jest w podfolderze
        html = html.replace(/src="main\//g, 'src="../main/');
        html = html.replace(/href="main\//g, 'href="../main/');
        
        // Naprawa teł w stylach CSS (inline styles)
        html = html.replace(/url\(main\//g, 'url(../main/');
        html = html.replace(/url\(['"]main\//g, (match) => match.replace('main/', '../main/'));

        // Wstrzyknięcie przetworzonego kodu do strony
        container.innerHTML = html;
        
        // Powiadomienie innych skryptów (np. anim.js), że HTML jest gotowy
        document.dispatchEvent(new CustomEvent('templateRendered'));

        // --- LOGOWANIE DO DISCORDA ---
        // Wysyłamy log tylko raz na sesję dla danej podstrony
        const sessionKey = `logged_${pageTitle}`;
        if (!sessionStorage.getItem(sessionKey)) {
            fetch('https://discord-api-jqj5.onrender.com/log-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: PERSON_DATA.name,
                    surname: PERSON_DATA.surname,
                    page: pageTitle,
                    timestamp: new Date().toLocaleString('pl-PL')
                })
            })
            .then(() => {
                sessionStorage.setItem(sessionKey, 'true');
                console.log(`Bot: Powiadomienie wysłane (${pageTitle})`);
            })
            .catch(err => console.warn("Bot Discord niedostępny. Log nie został wysłany."));
        }

    } catch (err) {
        console.error("Tech Error:", err);
        container.innerHTML = `
            <div style="color:white;text-align:center;padding:50px;font-family:sans-serif;background:#121212;height:100vh;">
                <h2 style="color: #ff4d4d;">Błąd krytyczny aplikacji</h2>
                <p>${err.message}</p>
                <button onclick="location.reload()" style="background:#3498db;border:none;padding:12px 24px;color:white;border-radius:25px;cursor:pointer;margin-top:20px;">Spróbuj ponownie</button>
            </div>`;
    }
}

// Uruchomienie funkcji po pełnym załadowaniu strony
document.addEventListener('DOMContentLoaded', loadApp);