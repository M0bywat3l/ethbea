async function loadApp() {
    const container = document.getElementById('app-container');
    if (!container || typeof PERSON_DATA === 'undefined') return;

    // --- ZABEZPIECZENIE LOGOWANIA ---
    // Sprawdza, czy użytkownik przeszedł przez stronę index.html
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '../index.html';
        return;
    }

    const isMainPage = window.location.pathname.includes('sg.html');
    const templateName = isMainPage ? 'template2.html' : 'template1.html';
    const pageTitle = isMainPage ? "Strona Główna" : "mDowód";

    try {
        // Pobieranie szablonu z folderu nadrzędnego
        const response = await fetch(`../main/templates/${templateName}`);
        if (!response.ok) throw new Error("Błąd pobierania szablonu - sprawdź ścieżkę ../main/templates/");
        let html = await response.text();

        // 1. Podmiana danych {{key}} na dane z info.js
        Object.keys(PERSON_DATA).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, PERSON_DATA[key]);
        });

        // 2. NAPRAWA FORMATOWANIA I ŚCIEŻEK (Główne rozwiązanie problemu gigantycznych grafik)
        // Jeśli plik jest w /gdet/, musi wyjść folder wyżej do /main/
        html = html.replace(/src="main\//g, 'src="../main/');
        html = html.replace(/href="main\//g, 'href="../main/');
        
        // Naprawa teł w stylach inline
        html = html.replace(/url\(main\//g, 'url(../main/');
        html = html.replace(/url\(['"]main\//g, (match) => match.replace('main/', '../main/'));

        // Wstrzyknięcie naprawionego HTML do kontenera
        container.innerHTML = html;
        
        // Wyzwolenie eventu dla skryptów animacji (anim.js)
        document.dispatchEvent(new CustomEvent('templateRendered'));

        // --- LOGOWANIE DO DISCORDA (Autoryzacja przez bota) ---
        // Wysyłamy log tylko raz na otwarcie danej podstrony w sesji
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
                console.log(`Powiadomienie Discord wysłane: ${pageTitle}`);
            })
            .catch(err => console.warn("Bot Discord jest niedostępny (log nie został wysłany)"));
        }

    } catch (err) {
        console.error("Tech Error:", err);
        container.innerHTML = `
            <div style="color:white;text-align:center;padding:50px;font-family:sans-serif;">
                <h2 style="color: #ff4d4d;">Błąd wyświetlania dokumentu</h2>
                <p>${err.message}</p>
                <button onclick="location.reload()" style="background:#3498db;border:none;padding:10px 20px;color:white;border-radius:20px;margin-top:20px;">Odśwież stronę</button>
            </div>`;
    }
}

// Uruchomienie aplikacji po załadowaniu DOM
document.addEventListener('DOMContentLoaded', loadApp);