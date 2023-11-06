function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    // Masquer tous les éléments avec la classe "tabcontent"
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Supprimer la classe "active" de tous les éléments avec la classe "tablinks"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Afficher le contenu de l'onglet actuel, et ajouter une classe "active" au bouton qui a ouvert l'onglet
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}