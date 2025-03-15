// classMENU.js
// Erstellt das MenueFenster und verwaltet die Menue-Fenster.

class classMENU {
    constructor() {
        // Initialize MENU_liste
        this.MENU_liste = [];

        // Create the WinBox window
        this.MENU_Window = new WinBox({
            title: 'MENU',
            x: 'right',     // Position: right side of the screen
            y: '0',         // Position: top of the screen
            width: '100px',
            height: '100px',
            class: ['no-max', 'no-close', 'no-resize', 'no-full' ],
            html: '', // Initialer Inhalt ist leer, wird durch update_MENU() gefüllt
            onclose: () => {
                // Hide instead of destroying
                this.MENU_Window.hide();
            }
        });
    }

    register_to_MENU(menuObject) {
        this.MENU_liste.push(menuObject);
        this.update_MENU();
        // console.log(this.MENU_liste); // Optional: for debugging purposes
    }

    update_MENU() {
        let htmlContent = '';
        for (let i = 0; i < this.MENU_liste.length; i++) {
            // Zugriff auf die MENU_Name Eigenschaft und hinzufügen eines Klick-Events
            htmlContent += `<div class="menu-item" data-index="${i}">${this.MENU_liste[i].MENU_Name}</div>`;
        };

        this.MENU_Window.body.innerHTML = htmlContent;

        // Event-Listener für die Menüpunkte hinzufügen
        this.MENU_Window.body.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (event) => {
                const index = event.target.dataset.index;
                this.handle_MENU_Click(index);
            });
        });
    };

    handle_MENU_Click(index) {
        if (this.MENU_liste[index] && typeof this.MENU_liste[index].MENU_Klick === 'function') {
            this.MENU_liste[index].MENU_Klick();
        }
    }
}

// Export MENU instance for global use
window.MENU = new classMENU();