const CONFIG = { googleAppsScriptUrl: "https://script.google.com/macros/s/AKfycbwqmq0qZuHoWZr7n0x_cx0kr-2QGJLWd1LMeRWKRqswkF7b39SDy9WFNRFcp_16N90BqQ/exec" };
const KEY = "german_course_registrations_v6_fr", SETTINGS = "german_course_settings_v6_fr";
const DEFAULT_SETTINGS = { company: "Frieden Institut", course: "Cours d’allemand", initials: "FI", logo: "images/kyma-frieden-institut.png", favicon: "images/kyma-frieden-institut.png", dashboardEyebrow: "COURS D’ALLEMAND", dashboardHeadline: "Une gestion plus simple des apprenants en allemand.", dashboardDescription: "Créez des inscriptions, gérez les dossiers des étudiants et générez des reçus professionnels en quelques secondes.", receiptTitle: "Inscription de l’étudiant", footerCopyright: "© 2026 Frieden Institut. Tous droits réservés.", footerCredit: "Conçu et développé par Messways", companyTagline: "Éducation · Immigration · Mobilité", companyAddress: "", companyPhone: "", companyEmail: "", companyHours: "", companyAbout: "Frieden Institut accompagne les étudiants, les professionnels et les voyageurs dans leurs projets d’éducation, d’immigration et de mobilité internationale." };
let records = []; let settings = { ...DEFAULT_SETTINGS }; let pendingIds = new Set(); let settingsDirty = false; let pendingPage = "dashboard"; const PENDING_SETTINGS_KEY = "frieden_pending_settings_v1"; let refreshTimer = null; let toastTimer = null; let refreshInFlight = false; let lastServerSignature = ""; let authToken = localStorage.getItem("fi_admin_token") || ""; let adminUser = localStorage.getItem("fi_admin_user") || ""; let adminName = localStorage.getItem("fi_admin_name") || adminUser || ""; let adminRole = localStorage.getItem("fi_admin_role") || ""; let isAdmin = !!authToken;
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const endpoint = () => CONFIG.googleAppsScriptUrl && CONFIG.googleAppsScriptUrl.startsWith("https://script.google.com/") ? CONFIG.googleAppsScriptUrl : "";
const I18N = {
  en: {
    "Dashboard": "Dashboard", "New Registration": "New Registration", "Students": "Students", "All Registrations": "All Registrations", "Search": "Search", "Receipts": "Receipts", "Reports": "Reports", "Settings": "Settings", "WORKSPACE": "WORKSPACE",
    "Cloud connected": "Cloud connected", "New registration": "New registration", "Browse registrations": "Browse registrations", "Create registration": "Create registration", "View all": "View all", "Recent registrations": "Recent registrations", "Quick actions": "Quick actions", "New registration": "New registration", "Find a student": "Find a student", "Open receipts": "Open receipts", "View reports": "View reports",
    "Total registrations": "Total registrations", "Today": "Today", "Latest level": "Latest level", "Latest reference": "Latest reference", "All students in the system": "All students in the system", "Registrations received today": "Registrations received today", "Most recent learner level": "Most recent learner level", "Use this on future enquiries": "Use this on future enquiries",
    "Reference": "Reference", "Student": "Student", "Level": "Level", "Date": "Date", "Name": "Name", "Phone": "Phone", "Start": "Start", "Email": "Email", "Course": "Course", "Created": "Created", "View receipt": "View receipt", "Receipt": "Receipt", "Open / Print": "Open / Print", "No data yet.": "No data yet.", "No registrations yet.": "No registrations yet.",
    "New registration": "New registration", "Student intake": "STUDENT INTAKE", "Capture the essentials once. The system creates the reference and receipt automatically.": "Capture the essentials once. The system creates the reference and receipt automatically.", "fields": "fields", "Student profile": "Student profile", "Basic identity and contact information.": "Basic identity and contact information.", "Full name": "Full name", "Date of birth": "Date of birth", "Phone number": "Phone number", "Email address": "Email address", "Address": "Address", "Course details": "Course details", "Choose the learner's level and programme.": "Choose the learner's level and programme.", "German level": "German level", "Course type": "Course type", "Start date": "Start date", "Select start date": "Select start date", "Duration": "Duration", "Registered by": "Registered by", "Select staff member": "Select staff member", "Registration status": "Registration status", "Notes": "Notes", "Additional information...": "Additional information...", "Student photo": "Student photo", "Optional. It will appear on the registration receipt.": "Optional. It will appear on the registration receipt.", "Drop a photo here or browse": "Drop a photo here or browse", "JPG, PNG or WEBP • automatically optimised for speed": "JPG, PNG or WEBP • automatically optimised for speed", "Clear form": "Clear form", "Receipt opens instantly after submission": "Receipt opens instantly after submission", "Submit & Generate Receipt": "Submit & Generate Receipt",
    "Students": "Students", "Every learner currently registered in the system.": "Every learner currently registered in the system.", "All registrations": "All registrations", "Central registration records from Google Sheets.": "Central registration records from Google Sheets.", "Export CSV ↗": "Export CSV ↗", "Search students": "Search students", "Find by name, phone, email, level or reference.": "Find by name, phone, email, level or reference.", "Search student, phone, email or reference...": "Search student, phone, email or reference...", "Receipts": "Receipts", "Open, print or save any registration as PDF.": "Open, print or save any registration as PDF.", "Course reports": "Course reports", "A quick view of registrations by German level.": "A quick view of registrations by German level.", "Settings": "Settings", "Manage branding, receipt content and system details.": "Manage branding, receipt content and system details.", "Company name": "Company name", "Course name": "Course name", "Logo initials": "Logo initials", "Dashboard eyebrow": "Dashboard eyebrow", "Dashboard headline": "Dashboard headline", "Dashboard description": "Dashboard description", "Receipt title": "Receipt title", "Footer copyright": "Footer copyright", "Footer credit": "Footer credit", "Receipt / dashboard logo": "Receipt / dashboard logo", "This logo appears on receipts and the dashboard.": "This logo appears on receipts and the dashboard.", "Use default logo": "Use default logo", "Dashboard favicon": "Dashboard favicon", "The small browser-tab icon.": "The small browser-tab icon.", "Use default favicon": "Use default favicon", "Save all settings": "Save all settings", "Download Excel (.xlsx) ↗": "Download Excel (.xlsx) ↗", "Close": "Close", "Print / Download PDF": "Print / Download PDF", "Saving registration": "Saving registration", "Sending the record securely to Google Sheets…": "Sending the record securely to Google Sheets…",
    "Administrator": "Administrator", "Reception": "Reception", "Folly": "Folly", "Course Coordinator": "Course Coordinator", "Standard German Course": "Standard German Course", "Intensive German Course": "Intensive German Course", "Private Lessons": "Private Lessons", "Conversation Course": "Conversation Course", "1 month": "1 month", "2 months": "2 months", "3 months": "3 months", "6 months": "6 months", "Other": "Other", "Registered": "Registered", "Pending": "Pending", "Follow-up required": "Follow-up required", "Not assessed": "Not assessed",
    "STUDENT COPY": "STUDENT COPY", "COMPANY RECORD": "COMPANY RECORD", "OFFICIAL REGISTRATION": "OFFICIAL REGISTRATION", "REFERENCE": "REFERENCE", "REGISTRATION CONFIRMATION": "REGISTRATION CONFIRMATION", "STUDENT INFORMATION": "STUDENT INFORMATION", "COURSE DETAILS": "COURSE DETAILS", "Keep this reference for future enquiries.": "Keep this reference for future enquiries.", "Course Administration": "Course Administration", "Student Registration": "Student Registration", "This document confirms the registration details recorded by": "This document confirms the registration details recorded by"
  },
  fr: {
    "Dashboard": "Tableau de bord", "New Registration": "Nouvelle inscription", "Students": "Étudiants", "All Registrations": "Toutes les inscriptions", "Search": "Recherche", "Receipts": "Reçus", "Reports": "Rapports", "Settings": "Paramètres", "WORKSPACE": "ESPACE DE TRAVAIL",
    "Cloud connected": "Connexion cloud", "New registration": "Nouvelle inscription", "Browse registrations": "Voir les inscriptions", "Create registration": "Créer une inscription", "View all": "Tout voir", "Recent registrations": "Inscriptions récentes", "Quick actions": "Actions rapides", "Find a student": "Trouver un étudiant", "Open receipts": "Ouvrir les reçus", "View reports": "Voir les rapports",
    "Total registrations": "Total des inscriptions", "Today": "Aujourd'hui", "Latest level": "Dernier niveau", "Latest reference": "Dernière référence", "All students in the system": "Tous les étudiants du système", "Registrations received today": "Inscriptions reçues aujourd'hui", "Most recent learner level": "Niveau du dernier apprenant", "Use this on future enquiries": "À utiliser pour toute demande ultérieure",
    "Reference": "Référence", "Student": "Étudiant", "Level": "Niveau", "Date": "Date", "Name": "Nom", "Phone": "Téléphone", "Start": "Début", "Email": "E-mail", "Course": "Cours", "Created": "Créé le", "View receipt": "Voir le reçu", "Receipt": "Reçu", "Open / Print": "Ouvrir / Imprimer", "No data yet.": "Aucune donnée pour le moment.", "No registrations yet.": "Aucune inscription pour le moment.",
    "Student intake": "INSCRIPTION ÉTUDIANT", "Capture the essentials once. The system creates the reference and receipt automatically.": "Saisissez les informations essentielles une seule fois. Le système crée automatiquement la référence et le reçu.", "fields": "champs", "Student profile": "Profil étudiant", "Basic identity and contact information.": "Informations d'identité et de contact.", "Full name": "Nom complet", "Date of birth": "Date de naissance", "Phone number": "Numéro de téléphone", "Email address": "Adresse e-mail", "Address": "Adresse", "Course details": "Détails du cours", "Choose the learner's level and programme.": "Choisissez le niveau et le programme de l'apprenant.", "German level": "Niveau d'allemand", "Course type": "Type de cours", "Start date": "Date de début", "Select start date": "Sélectionner une date de début", "Duration": "Durée", "Registered by": "Enregistré par", "Select staff member": "Sélectionner un membre du personnel", "Registration status": "Statut de l'inscription", "Notes": "Notes", "Additional information...": "Informations supplémentaires...", "Student photo": "Photo de l'étudiant", "Optional. It will appear on the registration receipt.": "Facultatif. Elle apparaîtra sur le reçu d'inscription.", "Drop a photo here or browse": "Déposez une photo ici ou parcourez vos fichiers", "JPG, PNG or WEBP • automatically optimised for speed": "JPG, PNG ou WEBP • optimisé automatiquement pour la rapidité", "Clear form": "Effacer le formulaire", "Receipt opens instantly after submission": "Le reçu s'ouvre instantanément après l'envoi", "Submit & Generate Receipt": "Envoyer et générer le reçu",
    "Every learner currently registered in the system.": "Tous les apprenants actuellement inscrits dans le système.", "Central registration records from Google Sheets.": "Registres centraux des inscriptions depuis Google Sheets.", "Export CSV ↗": "Exporter CSV ↗", "Search students": "Rechercher des étudiants", "Find by name, phone, email, level or reference.": "Rechercher par nom, téléphone, e-mail, niveau ou référence.", "Search student, phone, email or reference...": "Rechercher un étudiant, téléphone, e-mail ou référence...", "Open, print or save any registration as PDF.": "Ouvrir, imprimer ou enregistrer une inscription en PDF.", "Course reports": "Rapports des cours", "A quick view of registrations by German level.": "Aperçu rapide des inscriptions par niveau d'allemand.", "Manage branding, receipt content and system details.": "Gérer la marque, le contenu des reçus et les détails du système.", "Company name": "Nom de l'entreprise", "Course name": "Nom du cours", "Logo initials": "Initiales du logo", "Dashboard eyebrow": "Surtitre du tableau de bord", "Dashboard headline": "Titre du tableau de bord", "Dashboard description": "Description du tableau de bord", "Receipt title": "Titre du reçu", "Footer copyright": "Copyright du pied de page", "Footer credit": "Crédit du pied de page", "Receipt / dashboard logo": "Logo du reçu / tableau de bord", "This logo appears on receipts and the dashboard.": "Ce logo apparaît sur les reçus et le tableau de bord.", "Use default logo": "Utiliser le logo par défaut", "Dashboard favicon": "Favicon du tableau de bord", "The small browser-tab icon.": "Petite icône de l'onglet du navigateur.", "Use default favicon": "Utiliser le favicon par défaut", "Save all settings": "Enregistrer tous les paramètres", "Download Excel (.xlsx) ↗": "Télécharger Excel (.xlsx) ↗", "Close": "Fermer", "Print / Download PDF": "Imprimer / Télécharger PDF", "Saving registration": "Enregistrement de l'inscription", "Sending the record securely to Google Sheets…": "Envoi sécurisé de l'enregistrement vers Google Sheets…",
    "Administrator": "Administrateur", "Reception": "Accueil", "Folly": "Folly", "Course Coordinator": "Coordinateur de cours", "Standard German Course": "Cours d'allemand standard", "Intensive German Course": "Cours d'allemand intensif", "Private Lessons": "Cours particuliers", "Conversation Course": "Cours de conversation", "1 month": "1 mois", "2 months": "2 mois", "3 months": "3 mois", "6 months": "6 mois", "Other": "Autre", "Registered": "Inscrit", "Pending": "En attente", "Follow-up required": "Suivi requis", "Not assessed": "Non évalué",
    "STUDENT COPY": "COPIE ÉTUDIANT", "COMPANY RECORD": "ARCHIVE INSTITUT", "OFFICIAL REGISTRATION": "INSCRIPTION OFFICIELLE", "REFERENCE": "RÉFÉRENCE", "REGISTRATION CONFIRMATION": "CONFIRMATION D'INSCRIPTION", "STUDENT INFORMATION": "INFORMATIONS ÉTUDIANT", "COURSE DETAILS": "DÉTAILS DU COURS", "Keep this reference for future enquiries.": "Conservez cette référence pour toute demande ultérieure.", "Course Administration": "Administration des cours", "Student Registration": "Inscription étudiant", "This document confirms the registration details recorded by": "Ce document confirme les informations d'inscription enregistrées par"
  },
  de: {
    "Dashboard": "Dashboard", "New Registration": "Neue Anmeldung", "Students": "Teilnehmer", "All Registrations": "Alle Anmeldungen", "Search": "Suche", "Receipts": "Belege", "Reports": "Berichte", "Settings": "Einstellungen", "WORKSPACE": "ARBEITSBEREICH",
    "Cloud connected": "Cloud verbunden", "New registration": "Neue Anmeldung", "Browse registrations": "Anmeldungen ansehen", "Create registration": "Anmeldung erstellen", "View all": "Alle anzeigen", "Recent registrations": "Letzte Anmeldungen", "Quick actions": "Schnellaktionen", "Find a student": "Teilnehmer suchen", "Open receipts": "Belege öffnen", "View reports": "Berichte ansehen",
    "Total registrations": "Anmeldungen insgesamt", "Today": "Heute", "Latest level": "Letztes Niveau", "Latest reference": "Letzte Referenz", "All students in the system": "Alle Teilnehmer im System", "Registrations received today": "Heute eingegangene Anmeldungen", "Most recent learner level": "Niveau des letzten Teilnehmers", "Use this on future enquiries": "Für spätere Anfragen verwenden",
    "Reference": "Referenz", "Student": "Teilnehmer", "Level": "Niveau", "Date": "Datum", "Name": "Name", "Phone": "Telefon", "Start": "Beginn", "Email": "E-Mail", "Course": "Kurs", "Created": "Erstellt", "View receipt": "Beleg ansehen", "Receipt": "Beleg", "Open / Print": "Öffnen / Drucken", "No data yet.": "Noch keine Daten.", "No registrations yet.": "Noch keine Anmeldungen.",
    "Student intake": "TEILNEHMERANMELDUNG", "Capture the essentials once. The system creates the reference and receipt automatically.": "Erfassen Sie die wichtigsten Angaben einmal. Das System erstellt automatisch Referenz und Beleg.", "fields": "Felder", "Student profile": "Teilnehmerprofil", "Basic identity and contact information.": "Grundlegende Identitäts- und Kontaktdaten.", "Full name": "Vollständiger Name", "Date of birth": "Geburtsdatum", "Phone number": "Telefonnummer", "Email address": "E-Mail-Adresse", "Address": "Adresse", "Course details": "Kursdetails", "Choose the learner's level and programme.": "Wählen Sie das Niveau und das Programm des Teilnehmers.", "German level": "Deutschniveau", "Course type": "Kursart", "Start date": "Startdatum", "Select start date": "Startdatum auswählen", "Duration": "Dauer", "Registered by": "Angemeldet von", "Select staff member": "Mitarbeiter auswählen", "Registration status": "Anmeldestatus", "Notes": "Notizen", "Additional information...": "Zusätzliche Informationen...", "Student photo": "Teilnehmerfoto", "Optional. It will appear on the registration receipt.": "Optional. Das Foto erscheint auf dem Anmeldebeleg.", "Drop a photo here or browse": "Foto hier ablegen oder auswählen", "JPG, PNG or WEBP • automatically optimised for speed": "JPG, PNG oder WEBP • automatisch für schnelle Verarbeitung optimiert", "Clear form": "Formular leeren", "Receipt opens instantly after submission": "Der Beleg öffnet sich sofort nach dem Absenden", "Submit & Generate Receipt": "Absenden und Beleg erstellen",
    "Every learner currently registered in the system.": "Alle aktuell registrierten Teilnehmer im System.", "Central registration records from Google Sheets.": "Zentrale Anmeldedaten aus Google Sheets.", "Export CSV ↗": "CSV exportieren ↗", "Search students": "Teilnehmer suchen", "Find by name, phone, email, level or reference.": "Nach Name, Telefon, E-Mail, Niveau oder Referenz suchen.", "Search student, phone, email or reference...": "Teilnehmer, Telefon, E-Mail oder Referenz suchen...", "Open, print or save any registration as PDF.": "Jede Anmeldung öffnen, drucken oder als PDF speichern.", "Course reports": "Kursberichte", "A quick view of registrations by German level.": "Schnellübersicht der Anmeldungen nach Deutschniveau.", "Manage branding, receipt content and system details.": "Branding, Beleginhalt und Systemdetails verwalten.", "Company name": "Unternehmensname", "Course name": "Kursname", "Logo initials": "Logo-Initialen", "Dashboard eyebrow": "Dashboard-Surtitel", "Dashboard headline": "Dashboard-Titel", "Dashboard description": "Dashboard-Beschreibung", "Receipt title": "Belegtitel", "Footer copyright": "Copyright im Fußbereich", "Footer credit": "Fußbereich-Credit", "Receipt / dashboard logo": "Beleg-/Dashboard-Logo", "This logo appears on receipts and the dashboard.": "Dieses Logo erscheint auf Belegen und im Dashboard.", "Use default logo": "Standardlogo verwenden", "Dashboard favicon": "Dashboard-Favicon", "The small browser-tab icon.": "Kleines Symbol im Browser-Tab.", "Use default favicon": "Standard-Favicon verwenden", "Save all settings": "Alle Einstellungen speichern", "Download Excel (.xlsx) ↗": "Excel herunterladen (.xlsx) ↗", "Close": "Schließen", "Print / Download PDF": "Drucken / PDF herunterladen", "Saving registration": "Anmeldung wird gespeichert", "Sending the record securely to Google Sheets…": "Datensatz wird sicher an Google Sheets gesendet…",
    "Administrator": "Administrator", "Reception": "Empfang", "Folly": "Folly", "Course Coordinator": "Kurskoordinator", "Standard German Course": "Standard-Deutschkurs", "Intensive German Course": "Intensiv-Deutschkurs", "Private Lessons": "Privatunterricht", "Conversation Course": "Konversationskurs", "1 month": "1 Monat", "2 months": "2 Monate", "3 months": "3 Monate", "6 months": "6 Monate", "Other": "Andere", "Registered": "Registriert", "Pending": "Ausstehend", "Follow-up required": "Nachverfolgung erforderlich", "Not assessed": "Nicht bewertet",
    "STUDENT COPY": "TEILNEHMERKOPIE", "COMPANY RECORD": "INSTITUTSARCHIV", "OFFICIAL REGISTRATION": "OFFIZIELLE ANMELDUNG", "REFERENCE": "REFERENZ", "REGISTRATION CONFIRMATION": "ANMELDEBESTÄTIGUNG", "STUDENT INFORMATION": "TEILNEHMERDATEN", "COURSE DETAILS": "KURSDETAILS", "Keep this reference for future enquiries.": "Bewahren Sie diese Referenz für spätere Anfragen auf.", "Course Administration": "Kursverwaltung", "Student Registration": "Teilnehmeranmeldung", "This document confirms the registration details recorded by": "Dieses Dokument bestätigt die von"
  }
};

// French-first localization for the complete public website and administration interface.
const FR_SITE_TRANSLATIONS = {
  "German Course": "Cours d’allemand",
  "WORKSPACE": "ESPACE DE TRAVAIL",
  "Dashboard": "Tableau de bord",
  "New Registration": "Nouvelle inscription",
  "Students": "Étudiants",
  "All Registrations": "Toutes les inscriptions",
  "Search": "Rechercher",
  "Receipts": "Reçus",
  "Reports": "Rapports",
  "Settings": "Paramètres",
  "System online": "Système en ligne",
  "Cloud registration ready": "Inscriptions en ligne disponibles",
  "Education · Immigration · Mobility": "Éducation · Immigration · Mobilité",
  "Services": "Services",
  "About": "À propos",
  "Contact": "Contact",
  "Staff / Admin ↗": "Personnel / Administration ↗",
  "Build your next chapter.": "Construisez votre avenir.",
  "We'll help you navigate it.": "Nous vous aidons à avancer sereinement.",
  "Education, immigration and international mobility support for people who are ready to move forward.": "Un accompagnement en éducation, immigration et mobilité internationale pour concrétiser vos projets.",
  "Start your application": "Commencer votre démarche",
  "Explore services": "Découvrir nos services",
  "01 — EDUCATION": "01 — ÉDUCATION",
  "02 — IMMIGRATION": "02 — IMMIGRATION",
  "03 — MOBILITY": "03 — MOBILITÉ",
  "Education · Immigration": "Éducation · Immigration",
  "International Mobility": "Mobilité internationale",
  "Clear next steps": "Des étapes claires",
  "From first enquiry to application": "De la première demande au dépôt du dossier",
  "GERMAN COURSES A1–C2": "COURS D’ALLEMAND A1–C2",
  "CAMPUS FRANCE": "CAMPUS FRANCE",
  "CANADA IMMIGRATION": "IMMIGRATION CANADA",
  "STUDENT VISAS": "VISAS ÉTUDIANTS",
  "DUBAI TOURIST VISA": "VISA TOURISTIQUE POUR DUBAÏ",
  "INTERNATIONAL MOBILITY": "MOBILITÉ INTERNATIONALE",
  "WHAT WE DO": "NOS SERVICES",
  "Services built around": "Des services adaptés à",
  "real plans.": "vos projets.",
  "From language learning to international applications, we help you understand the process, prepare properly and take the next step with confidence.": "De l’apprentissage des langues aux démarches internationales, nous vous aidons à comprendre les procédures, à préparer vos documents et à avancer en confiance.",
  "German Courses": "Cours d’allemand",
  "Structured German learning from A1 to C2 for study, work and everyday communication.": "Des cours structurés du niveau A1 à C2 pour les études, le travail et la vie quotidienne.",
  "Explore German courses": "Découvrir les cours d’allemand",
  "Campus France": "Campus France",
  "Support through the French higher-education application process.": "Un accompagnement dans les démarches de candidature à l’enseignement supérieur en France.",
  "Discuss your plans": "Parlons de vos projets",
  "Canada Immigration": "Immigration au Canada",
  "Guidance for Permanent Residence and related immigration pathways.": "Des conseils sur la résidence permanente et les différentes voies d’immigration.",
  "Discuss your case": "Étudions votre situation",
  "Student Visa": "Visa étudiant",
  "Practical application support for students preparing to study abroad.": "Un accompagnement pratique pour les étudiants qui préparent un séjour d’études à l’étranger.",
  "Start a consultation": "Prendre rendez-vous",
  "Dubai Tourist Visa": "Visa touristique pour Dubaï",
  "Assistance with tourist visa preparation and travel documentation.": "Une aide à la préparation du visa touristique et des documents de voyage.",
  "Plan your trip": "Préparer votre voyage",
  "Other Services": "Autres services",
  "Have another international project? Tell us what you are planning.": "Vous avez un autre projet international ? Parlons-en.",
  "Talk to Frieden Institut": "Contacter Frieden Institut",
  "ABOUT FRIEDEN INSTITUT": "À PROPOS DE FRIEDEN INSTITUT",
  "Less confusion.": "Moins d’incertitude.",
  "More direction.": "Plus de clarté.",
  "Frieden Institut helps students, professionals and travellers navigate education, immigration and international mobility services.": "Frieden Institut accompagne les étudiants, les professionnels et les voyageurs dans leurs projets d’éducation, d’immigration et de mobilité internationale.",
  "We focus on the practical side: understanding requirements, preparing documents and knowing what to do next.": "Nous privilégions le concret : comprendre les exigences, préparer les documents et savoir quelle étape suivre.",
  "START HERE": "COMMENCEZ ICI",
  "Have a plan?": "Un projet en tête ?",
  "Let's talk.": "Parlons-en.",
  "Tell us what you want to study, where you want to go or what application you are preparing.": "Dites-nous ce que vous souhaitez étudier, votre destination ou la démarche que vous préparez.",
  "Start an application": "Commencer une démarche",
  "WhatsApp us": "Écrivez-nous sur WhatsApp",
  "OFFICE": "BUREAU",
  "Add your official address in Settings": "Ajoutez l’adresse officielle dans les paramètres",
  "PHONE / WHATSAPP": "TÉLÉPHONE / WHATSAPP",
  "Add your number in Settings": "Ajoutez votre numéro dans les paramètres",
  "EMAIL": "E-MAIL",
  "Add your email in Settings": "Ajoutez votre adresse e-mail dans les paramètres",
  "Dashboard": "Tableau de bord",
  "New Registration": "Nouvelle inscription",
  "Browse registrations": "Consulter les inscriptions",
  "Create registration": "Créer une inscription",
  "FAST WORKFLOW": "PROCÉDURE RAPIDE",
  "GOOGLE SHEETS": "GOOGLE SHEETS",
  "Student Registration": "Inscription de l’étudiant",
  "Student identity and contact details.": "Identité et coordonnées de l’étudiant.",
  "First name": "Prénom",
  "Last name": "Nom",
  "Passport number": "Numéro de passeport",
  "National ID card number": "Numéro de carte nationale d’identité",
  "Date of birth": "Date de naissance",
  "Phone number": "Numéro de téléphone",
  "Email address": "Adresse e-mail",
  "Address": "Adresse",
  "Student photo": "Photo de l’étudiant",
  "Choose services": "Choisir les services",
  "Select one or more paid services and any complimentary add-ons.": "Sélectionnez un ou plusieurs services payants et, si vous le souhaitez, des options gratuites.",
  "Payment summary": "Récapitulatif du paiement",
  "Prices are calculated from the services selected.": "Les prix sont calculés selon les services sélectionnés.",
  "Select services to calculate the amount.": "Sélectionnez des services pour calculer le montant.",
  "Services price on the next tab": "Prix des services dans l’onglet suivant",
  "Next step": "Étape suivante",
  "Next step →": "Étape suivante →",
  "Previous step": "Étape précédente",
  "Previous": "Précédent",
  "Save registration & generate": "Enregistrer l’inscription et générer le reçu",
  "Save registration & generate receipt": "Enregistrer l’inscription et générer le reçu",
  "Save registration & generate receipt →": "Enregistrer l’inscription et générer le reçu →",
  "Username": "Nom d’utilisateur",
  "Password": "Mot de passe",
  "Sign in": "Se connecter",
  "Welcome back.": "Bon retour.",
  "Sign in securely to continue to your workspace.": "Connectez-vous pour accéder à votre espace de travail.",
  "Enter password": "Saisissez votre mot de passe",
  "Staff & administrator access": "Accès du personnel et de l’administration",
  "INTERNAL ADMINISTRATION PORTAL": "PORTAIL D’ADMINISTRATION INTERNE",
  "Staff accounts": "Comptes du personnel",
  "Each team member has an individual login. Their name is recorded automatically on registrations.": "Chaque membre de l’équipe dispose de son propre compte. Son nom est automatiquement associé aux inscriptions.",
  "Add staff": "Ajouter un membre du personnel",
  "Save all settings": "Enregistrer tous les paramètres",
  "Download Excel (.xlsx) ↗": "Télécharger Excel (.xlsx) ↗",
  "Close": "Fermer",
  "Print / Download PDF": "Imprimer / Télécharger le PDF",
  "Active account": "Compte actif",
  "Full name": "Nom complet",
  "Staff member name": "Nom du membre du personnel",
  "Role": "Rôle",
  "Leave blank to keep current password": "Laissez vide pour conserver le mot de passe actuel",
  "Save staff account": "Enregistrer le compte du personnel",
  "Add staff member": "Ajouter un membre du personnel",
  "Edit staff member": "Modifier le membre du personnel",
  "Registration available": "Inscriptions disponibles",
  "Backend not connected": "Serveur non connecté",
  "Cloud connected": "Service en ligne connecté",
  "Login required": "Connexion requise",
  "Enter your username and password.": "Saisissez votre nom d’utilisateur et votre mot de passe.",
  "Signing in…": "Connexion en cours…",
  "Login failed": "Échec de la connexion",
  "Invalid credentials.": "Identifiants incorrects.",
  "Signed out": "Déconnexion effectuée",
  "You have safely signed out of the internal portal.": "Vous êtes déconnecté du portail interne.",
  "Administrator only": "Réservé à l’administrateur",
  "Only an Administrator can manage staff accounts.": "Seul un administrateur peut gérer les comptes du personnel.",
  "Saving registration": "Enregistrement de l’inscription",
  "Preparing Excel…": "Préparation du fichier Excel…",
  "Excel exported": "Fichier Excel exporté",
  "The registration records were downloaded as an .xlsx file.": "Les données d’inscription ont été téléchargées au format .xlsx.",
  "Export failed": "Échec de l’exportation",
  "Could not create the Excel file.": "Impossible de créer le fichier Excel.",
  "Search students": "Rechercher des étudiants",
  "Find by name, phone, email, level or reference.": "Rechercher par nom, téléphone, e-mail, niveau ou référence.",
  "Search student, phone, email or reference...": "Rechercher un étudiant, un téléphone, un e-mail ou une référence…",
  "All Registrations": "Toutes les inscriptions",
  "Course reports": "Rapports de cours",
  "A quick view of registrations by German level.": "Aperçu des inscriptions par niveau d’allemand.",
  "Every learner currently registered in the system.": "Tous les étudiants actuellement inscrits dans le système.",
  "Central registration records from Google Sheets.": "Dossiers d’inscription centralisés dans Google Sheets.",
  "Open, print or save any registration as PDF.": "Ouvrir, imprimer ou enregistrer une inscription au format PDF.",
  "System online": "Système en ligne",
  "Registration status": "Statut de l’inscription",
  "Course details": "Détails du cours",
  "Select start date": "Sélectionner une date de début",
  "Start date": "Date de début",
  "Duration": "Durée",
  "Registered by": "Inscription enregistrée par",
  "Select staff member": "Sélectionner un membre du personnel",
  "Notes": "Remarques",
  "Additional information...": "Informations complémentaires…",
  "Optional. It will appear on the registration receipt.": "Facultatif. Cette photo apparaîtra sur le reçu d’inscription.",
  "Drop a photo here or browse": "Déposez une photo ici ou parcourez vos fichiers",
  "JPG, PNG or WEBP • automatically optimised for speed": "JPG, PNG ou WEBP • optimisation automatique",
  "Clear form": "Effacer le formulaire",
  "Receipt opens instantly after submission": "Le reçu s’ouvre immédiatement après l’envoi",
  "Submit & Generate Receipt": "Envoyer et générer le reçu",
  "Select the learner's level and programme.": "Sélectionnez le niveau et le programme de l’étudiant.",
  "German level": "Niveau d’allemand",
  "Course type": "Type de cours",
  "Payment status": "Statut du paiement",
  "No registrations yet.": "Aucune inscription pour le moment.",
  "No data yet.": "Aucune donnée pour le moment.",
  "Student copy": "Exemplaire de l’étudiant",
  "Company record": "Exemplaire de l’institut",
  "STUDENT COPY": "EXEMPLAIRE DE L’ÉTUDIANT",
  "COMPANY RECORD": "EXEMPLAIRE DE L’INSTITUT",
  "OFFICIAL REGISTRATION": "INSCRIPTION OFFICIELLE",
  "REFERENCE": "RÉFÉRENCE",
  "REGISTRATION CONFIRMATION": "CONFIRMATION D’INSCRIPTION",
  "STUDENT INFORMATION": "INFORMATIONS SUR L’ÉTUDIANT",
  "COURSE DETAILS": "DÉTAILS DU COURS",
  "Keep this reference for future enquiries.": "Conservez cette référence pour toute demande ultérieure.",
  "OPENING HOURS": "HORAIRES D’OUVERTURE",
  "Add opening hours in Settings": "Ajoutez les horaires dans les paramètres",
  "© 2026 Frieden Institut. All rights reserved.": "© 2026 Frieden Institut. Tous droits réservés.",
  "Developed & Designed by Messways": "Conçu et développé par Messways",
  "INTERNAL SYSTEM • FRIEDEN INSTITUT": "SYSTÈME INTERNE • FRIEDEN INSTITUT",
  "🇬🇧 English": "🇬🇧 Anglais",
  "🇫🇷 Français": "🇫🇷 Français",
  "🇩🇪 Deutsch": "🇩🇪 Allemand",
  "Cloud connected": "Connecté au cloud",
  "Admin Login": "Connexion administrateur",
  "Administrator": "Administrateur",
  "Sign out": "Se déconnecter",
  "Inscription Management Center": "Centre de gestion des inscriptions",
  "Create registrations, keep student records organised and generate polished receipts in seconds.": "Créez des inscriptions, gérez les dossiers des étudiants et générez des reçus professionnels en quelques secondes.",
  "Create registration": "Créer une inscription",
  "Browse registrations": "Consulter les inscriptions",
  "FAST WORKFLOW": "PROCESSUS RAPIDE",
  "GOOGLE SHEETS READY": "COMPATIBLE AVEC GOOGLE SHEETS",
  "PRINT-READY RECEIPTS": "REÇUS PRÊTS À IMPRIMER",
  "INSTITUT": "INSTITUT",
  "EST. 2025": "DEPUIS 2025",
  "Total registrations": "Nombre total d’inscriptions",
  "All students in the system": "Tous les étudiants du système",
  "Today": "Aujourd’hui",
  "Registrations received today": "Inscriptions reçues aujourd’hui",
  "Latest level": "Dernier niveau",
  "Most recent learner level": "Niveau du dernier apprenant",
  "Latest reference": "Dernière référence",
  "Use this on future enquiries": "À utiliser lors de vos prochaines demandes",
  "ACTIVITY": "ACTIVITÉ",
  "Recent registrations": "Inscriptions récentes",
  "Latest submissions from the internal registration system.": "Dernières inscriptions du système interne.",
  "View all": "Tout afficher",
  "SHORTCUTS": "RACCOURCIS",
  "Quick actions": "Actions rapides",
  "Add a student in one flow": "Ajouter un étudiant en une seule étape",
  "Find a student": "Rechercher un étudiant",
  "Search by name or reference": "Rechercher par nom ou référence",
  "Open receipts": "Ouvrir les reçus",
  "Print or save as PDF": "Imprimer ou enregistrer en PDF",
  "STUDENT INTAKE": "INSCRIPTION D’UN ÉTUDIANT",
  "Complete each step. Your information stays here as you move between sections.": "Complétez chaque étape. Vos informations sont conservées lorsque vous passez d’une section à l’autre.",
  "steps": "étapes",
  "Personal information": "Informations personnelles",
  "Payment": "Paiement",
  "Student identity and contact details.": "Identité et coordonnées de l’étudiant.",
  "First name": "Prénom",
  "Last name": "Nom",
  "Passport number": "Numéro de passeport",
  "National ID card number": "Numéro de carte nationale d’identité",
  "Date of birth": "Date de naissance",
  "Phone number": "Numéro de téléphone",
  "Email address": "Adresse e-mail",
  "Residential address": "Adresse de résidence",
  "＋ Add student photo": "＋ Ajouter une photo de l’étudiant",
  "Optional · JPG or PNG": "Facultatif · JPG ou PNG",
  "Choose services": "Choisir les services",
  "Select one or more paid services and any complimentary add-ons.": "Sélectionnez un ou plusieurs services payants et, si besoin, des options gratuites.",
  "German course": "Cours d’allemand",
  "Choose course type and level to calculate the fee": "Choisissez le type de cours et le niveau pour calculer le tarif",
  "Search German training contract": "Recherche de contrat de formation en Allemagne",
  "Application support": "Accompagnement aux démarches",
  "Study application support": "Accompagnement aux candidatures d’études",
  "Professional training": "Formation professionnelle",
  "Career skills": "Compétences professionnelles",
  "Driving course": "Cours de conduite",
  "Driving instruction": "Formation à la conduite",
  "German course details": "Détails du cours d’allemand",
  "Course type": "Type de cours",
  "Day course": "Cours de jour",
  "Evening course": "Cours du soir",
  "Individual course": "Cours individuel",
  "Course level": "Niveau du cours",
  "C1 · Price to be confirmed": "C1 · Tarif à confirmer",
  "Exam preparation": "Préparation à l’examen",
  "Start date": "Date de début",
  "Services price on the next tab": "Tarifs des services à l’étape suivante",
  "Complimentary add-ons": "Options gratuites",
  "FREE": "GRATUIT",
  "These are free when added to another paid service. Selected add-ons appear on the receipt.": "Ces options sont gratuites lorsqu’elles accompagnent un service payant. Les options sélectionnées apparaîtront sur le reçu.",
  "Driving introduction": "Initiation à la conduite",
  "Complimentary add-on · 0 CFA": "Option gratuite · 0 FCFA",
  "Baking training": "Formation en pâtisserie",
  "Career orientation": "Orientation professionnelle",
  "Additional notes": "Notes complémentaires",
  "Payment summary": "Récapitulatif du paiement",
  "Prices are calculated from the services selected.": "Les tarifs sont calculés selon les services sélectionnés.",
  "Select services to calculate the amount.": "Sélectionnez des services pour calculer le montant.",
  "Reduction mode": "Type de réduction",
  "Percentage (%)": "Pourcentage (%)",
  "Fixed amount (CFA)": "Montant fixe (FCFA)",
  "Reduction (%)": "Réduction (%)",
  "Reduction amount (CFA)": "Montant de la réduction (FCFA)",
  "Inscription fee (20,000 CFA)": "Frais d’inscription (20 000 FCFA)",
  "Not paid": "Non payé",
  "Paid": "Payé",
  "Service fee status": "Statut du paiement des services",
  "Partially paid": "Partiellement payé",
  "Amount paid toward service fee (CFA)": "Montant payé pour les services (FCFA)",
  "Service fee": "Frais de service",
  "Reduction": "Réduction",
  "Service fee after reduction (Not paid)": "Frais de service après réduction (non payé)",
  "Inscription fee": "Frais d’inscription",
  "20,000 CFA · Not paid": "20 000 FCFA · Non payé",
  "Total paid": "Total payé",
  "Balance due": "Solde restant dû",
  "Registration status": "Statut de l’inscription",
  "Registered": "Inscrit",
  "Pending": "En attente",
  "Follow-up required": "Suivi nécessaire",
  "Clear form": "Effacer le formulaire",
  "← Back": "← Retour",
  "Next step →": "Étape suivante →",
  "Save registration & generate receipt ↗": "Enregistrer l’inscription et générer le reçu ↗",
  "DIRECTORY": "ANNUAIRE",
  "Every learner currently registered in the system.": "Tous les apprenants actuellement inscrits dans le système.",
  "DATABASE": "BASE DE DONNÉES",
  "All registrations": "Toutes les inscriptions",
  "Central registration records from Google Sheets.": "Registre central des inscriptions dans Google Sheets.",
  "Export CSV ↗": "Exporter en CSV ↗",
  "FIND": "RECHERCHE",
  "Search students": "Rechercher des étudiants",
  "Find by name, phone, email, level or reference.": "Rechercher par nom, téléphone, e-mail, niveau ou référence.",
  "DOCUMENTS": "DOCUMENTS",
  "Open, print or save any registration as PDF.": "Ouvrez, imprimez ou enregistrez une inscription au format PDF.",
  "INSIGHTS": "ANALYSES",
  "Course reports": "Rapports des cours",
  "A quick view of registrations by German level.": "Aperçu des inscriptions par niveau d’allemand.",
  "CONTROL CENTRE": "CENTRE DE CONTRÔLE",
  "Manage branding, receipt content and system details.": "Gérez l’identité visuelle, le contenu des reçus et les paramètres du système.",
  "Company name": "Nom de l’établissement",
  "Course name": "Nom du cours",
  "Logo initials": "Initiales du logo",
  "Dashboard eyebrow": "Texte introductif du tableau de bord",
  "Dashboard headline": "Titre du tableau de bord",
  "Dashboard description": "Description du tableau de bord",
  "Receipt title": "Titre du reçu",
  "Footer copyright": "Copyright du pied de page",
  "Footer credit": "Mention de crédit du pied de page",
  "Public company information": "Informations publiques de l’établissement",
  "Public tagline": "Slogan public",
  "Office address": "Adresse du bureau",
  "Phone / WhatsApp": "Téléphone / WhatsApp",
  "Official email": "Adresse e-mail officielle",
  "Opening hours": "Heures d’ouverture",
  "About Frieden Institut": "À propos de Frieden Institut",
  "Receipt / dashboard logo": "Logo du reçu et du tableau de bord",
  "This logo appears on receipts and the dashboard.": "Ce logo apparaît sur les reçus et le tableau de bord.",
  "Use default logo": "Utiliser le logo par défaut",
  "Dashboard favicon": "Icône du navigateur",
  "The small browser-tab icon.": "Petite icône affichée dans l’onglet du navigateur.",
  "Use default favicon": "Utiliser l’icône par défaut",
  "TEAM ACCESS": "ACCÈS DE L’ÉQUIPE",
  "Staff accounts": "Comptes du personnel",
  "Each team member has an individual login. Their name is recorded automatically on registrations.": "Chaque membre de l’équipe dispose de son propre accès. Son nom est automatiquement enregistré sur les inscriptions.",
  "＋ Add staff": "＋ Ajouter un membre du personnel",
  "Save all settings": "Enregistrer tous les paramètres",
  "Download Excel (.xlsx) ↗": "Télécharger Excel (.xlsx) ↗",
  "Google Sheets backend: paste the Apps Script": "Backend Google Sheets : collez l’URL Apps Script",
  "URL into": "URL dans",
  "in": "dans",
  "app.js": "app.js",
  "The dashboard then uses Google Sheets as the central registration database.": "Le tableau de bord utilise ensuite Google Sheets comme base de données centrale des inscriptions.",
  "Frieden Institut by KIMA GROUP": "Frieden Institut par KIMA GROUP",
  "Staff & administrator access": "Accès du personnel et de l’administration",
  "INTERNAL ADMINISTRATION PORTAL": "PORTAIL D’ADMINISTRATION INTERNE",
  "Welcome back.": "Bienvenue.",
  "Sign in securely to continue to your workspace.": "Connectez-vous en toute sécurité pour accéder à votre espace.",
  "Username": "Nom d’utilisateur",
  "Password": "Mot de passe",
  "Sign in": "Se connecter",
  "© 2026 Developed & Designed by Messways": "© 2026 Conçu et développé par Messways",
  "Add staff member": "Ajouter un membre du personnel",
  "Create an individual account for a team member.": "Créer un compte individuel pour un membre de l’équipe.",
  "Full name": "Nom complet",
  "Role": "Rôle",
  "Staff": "Personnel",
  "Manager": "Responsable",
  "Active account": "Compte actif",
  "Save staff account": "Enregistrer le compte du personnel",
  "Close": "Fermer",
  "Print / Download PDF": "Imprimer / Télécharger en PDF",
  "Saved": "Enregistré",
  "Registration saved successfully.": "Inscription enregistrée avec succès.",
  "Saving registration": "Enregistrement de l’inscription",
  "Sending the record securely to Google Sheets…": "Envoi sécurisé des données vers Google Sheets…"
  ,

  "Frieden Institut • Education · Immigration · Mobility": "Frieden Institut • Éducation · Immigration · Mobilité",
  "FRIEDEN INSTITUT": "FRIEDEN INSTITUT",
  "GERMAN COURSE": "COURS D’ALLEMAND",
  "FYMA": "FYMA",
  "− 0 CFA": "− 0 FCFA",
  ". The dashboard then uses Google Sheets as the central registration database.": ". Le tableau de bord utilise ensuite Google Sheets comme base de données centrale des inscriptions.",
  "🇧🇯 Benin (+229)": "🇧🇯 Bénin (+229)",
  "🇬🇭 Ghana (+233)": "🇬🇭 Ghana (+233)",
  "🇳🇬 Nigeria (+234)": "🇳🇬 Nigéria (+234)",
  "🇨🇮 Côte d’Ivoire (+225)": "🇨🇮 Côte d’Ivoire (+225)",
  "🇸🇳 Senegal (+221)": "🇸🇳 Sénégal (+221)",
  "🇩🇪 Germany (+49)": "🇩🇪 Allemagne (+49)",
  "🇺🇸 USA/Canada (+1)": "🇺🇸 États-Unis/Canada (+1)",
  "🇬🇧 UK (+44)": "🇬🇧 Royaume-Uni (+44)",
  "JPG, PNG or WEBP • automatically optimised for speed": "JPG, PNG ou WEBP • optimisé automatiquement",
  "National ID": "Numéro de carte nationale d’identité",
  "Street, city, country": "Rue, ville, pays",
  "Any important details...": "Toute information importante…",
  "Search student, phone, email or reference...": "Rechercher un étudiant, un téléphone, un e-mail ou une référence…",
  "Official office address": "Adresse officielle du bureau",
  "Mon–Fri · 08:00–18:00": "Lun–ven · 08 h 00–18 h 00",
  "Short company description": "Brève présentation de l’établissement",
  "Enter password": "Saisissez le mot de passe",
  "Staff member name": "Nom du membre du personnel",
  "e.g. ama": "Ex. : ama",
  "Leave blank to keep current password": "Laissez vide pour conserver le mot de passe actuel",
  "KymA Frieden Institut logo": "Logo de KIMA Frieden Institut",
  "Frieden Institut": "Frieden Institut",
  "Current logo": "Logo actuel",
  "Current favicon": "Icône actuelle",
  "Language": "Langue",
  "Country code": "Indicatif téléphonique",
  "Refresh registrations": "Actualiser les inscriptions",
  "New registration": "Nouvelle inscription",
  "English": "Anglais",
  "Deutsch": "Allemand",
  "🇹🇬 Togo (+228)": "🇹🇬 Togo (+228)",
  "🇫🇷 France (+33)": "🇫🇷 France (+33)",
  "0 CFA": "0 FCFA"
};

const FR_RUNTIME_TRANSLATIONS = {
  "WORKSPACE": "ESPACE DE TRAVAIL",
  "System online": "Système en ligne",
  "Cloud registration ready": "Inscriptions en ligne disponibles",
  "New": "Nouvelle",
  "Registration": "Inscription",
  "New Registration": "Nouvelle inscription",
  "Students": "Étudiants",
  "All": "Toutes",
  "Registrations": "les inscriptions",
  "Search": "Recherche",
  "Receipts": "Reçus",
  "Reports": "Rapports",
  "Settings": "Paramètres",
  "Cloud connected": "Connexion au cloud établie",
  "Admin Login": "Connexion administrateur",
  "Sign out": "Se déconnecter",
  "National ID card number": "Numéro de carte nationale d’identité",
  "First name": "Prénom",
  "Last name": "Nom",
  "Passport number": "Numéro de passeport",
  "Next step": "Étape suivante",
  "Back": "Retour",
  "Choose services": "Choisir les services",
  "Select one or more paid services and any complimentary add-ons.": "Sélectionnez un ou plusieurs services payants et, si vous le souhaitez, des options gratuites.",
  "Payment summary": "Récapitulatif du paiement",
  "Prices are calculated from the services selected.": "Les prix sont calculés selon les services sélectionnés.",
  "Select services to calculate the amount.": "Sélectionnez des services pour calculer le montant.",
  "Reduction mode": "Type de réduction",
  "Percentage (%)": "Pourcentage (%)",
  "Fixed amount (CFA)": "Montant fixe (FCFA)",
  "Reduction (%)": "Réduction (%)",
  "Reduction amount (CFA)": "Montant de la réduction (FCFA)",
  "Inscription fee (20,000 CFA)": "Frais d’inscription (20 000 FCFA)",
  "Not paid": "Non payé",
  "Paid": "Payé",
  "Partially paid": "Partiellement payé",
  "Service fee status": "Statut des frais de service",
  "Amount paid toward service fee (CFA)": "Montant payé pour les frais de service (FCFA)",
  "Service fee": "Frais de service",
  "Service fee after reduction": "Frais de service après réduction",
  "Inscription fee": "Frais d’inscription",
  "Total paid": "Total payé",
  "Balance due": "Solde restant dû",
  "Registered": "Inscrit(e)",
  "Pending": "En attente",
  "Follow-up required": "Suivi nécessaire",
  "Clear form": "Effacer le formulaire",
  "Save registration & generate receipt": "Enregistrer l’inscription et générer le reçu",
  "Save registration & generate": "Enregistrer l’inscription et générer le reçu",
  "Username": "Nom d’utilisateur",
  "Password": "Mot de passe",
  "Sign in": "Se connecter",
  "Welcome back.": "Heureux de vous revoir.",
  "Sign in securely to continue to your workspace.": "Connectez-vous en toute sécurité pour accéder à votre espace de travail.",
  "INTERNAL ADMINISTRATION PORTAL": "PORTAIL D’ADMINISTRATION INTERNE",
  "TEAM ACCESS": "ACCÈS DE L’ÉQUIPE",
  "Add staff member": "Ajouter un membre du personnel",
  "Create an individual account for a team member.": "Créez un compte individuel pour un membre de l’équipe.",
  "Full name": "Nom complet",
  "Role": "Rôle",
  "Personnel": "Personnel",
  "Responsable": "Responsable",
  "Administrateur": "Administrateur",
  "Active account": "Compte actif",
  "Save staff account": "Enregistrer le compte du personnel",
  "Close": "Fermer",
  "OFFICIAL RECEIPT": "REÇU OFFICIEL",
  "REFERENCE": "RÉFÉRENCE",
  "STUDENT": "ÉTUDIANT(E)",
  "SERVICES": "SERVICES",
  "Passport:": "Passeport :",
  "National ID:": "Carte nationale d’identité :",
  "Start date:": "Date de début :",
  "Notes:": "Remarques :",
  "Service fee after reduction (Not paid)": "Frais de service après réduction (non payés)",
  "Inscription (Not paid)": "Inscription (non payée)",
  "Keep this reference for future enquiries.": "Conservez cette référence pour toute demande ultérieure.",
  "Authorised administration": "Administration autorisée",
  "Student photo": "Photo de l’étudiant(e)",
  "Choose file": "Choisir un fichier",
  "Saved": "Enregistré",
  "Registration saved successfully.": "Inscription enregistrée avec succès.",
  "Session expired. Please sign in again.": "Session expirée. Veuillez vous reconnecter.",
  "The selected service has no configured price.": "Aucun prix n’est configuré pour le service sélectionné.",

  "Connection issue": "Problème de connexion",
  "Google Sheets is not responding. Your interface is still available.": "Google Sheets ne répond pas. L’interface reste disponible.",
  "Photo error": "Erreur de photo",
  "Choose a service": "Choisir un service",
  "Select at least one paid service before continuing.": "Sélectionnez au moins un service payant avant de continuer.",
  "Select at least one service.": "Sélectionnez au moins un service.",
  "Waiting for Google Sheets to confirm the official reference…": "En attente de la confirmation de la référence officielle par Google Sheets…",
  "Registration saved": "Inscription enregistrée",
  "Receipt reference confirmed with Google Sheets.": "Référence du reçu confirmée par Google Sheets.",
  "Save failed": "Échec de l’enregistrement",
  "Google Sheets did not confirm this registration. Your form entries are still here; please try again.": "Google Sheets n’a pas confirmé cette inscription. Les informations saisies sont conservées ; veuillez réessayer.",
  "Could not create registration": "Impossible de créer l’inscription",
  "Please check the form and try again.": "Vérifiez le formulaire et réessayez.",
  "Login required": "Connexion requise",
  "Enter your username and password.": "Saisissez votre nom d’utilisateur et votre mot de passe.",
  "Login failed": "Échec de la connexion",
  "Invalid credentials.": "Identifiants incorrects.",
  "Signed out": "Déconnexion effectuée",
  "You have safely signed out of the internal portal.": "Vous êtes déconnecté du portail interne.",
  "Administrator only": "Administrateur uniquement",
  "Only an Administrator can manage staff accounts.": "Seul un administrateur peut gérer les comptes du personnel.",
  "Staff list unavailable": "Liste du personnel indisponible",
  "Missing information": "Informations manquantes",
  "Name and username are required.": "Le nom et le nom d’utilisateur sont obligatoires.",
  "Password required": "Mot de passe requis",
  "New staff accounts need a password.": "Un mot de passe est requis pour les nouveaux comptes du personnel.",
  "Staff account saved": "Compte du personnel enregistré",
  "Could not save staff": "Impossible d’enregistrer le compte",
  "Could not delete account": "Impossible de supprimer le compte",
  "Staff account deleted": "Compte du personnel supprimé",
  "The account has been removed.": "Le compte a été supprimé.",
  "Image error": "Erreur d’image",
  "Settings saved": "Paramètres enregistrés",
  "Your public company information and branding are stored in Google Sheets.": "Les informations publiques et l’identité visuelle de l’établissement sont enregistrées dans Google Sheets.",
  "Save pending": "Enregistrement en attente",
  "The changes are kept and will be retried automatically. If this persists, redeploy the latest Code.gs as a new Apps Script version.": "Les modifications sont conservées et une nouvelle tentative sera effectuée automatiquement. Si le problème persiste, redéployez la dernière version de Code.gs dans Apps Script.",
  "Backend not connected": "Backend non connecté",
  "Add the Apps Script /exec URL in app.js first.": "Ajoutez d’abord l’URL /exec d’Apps Script dans app.js.",
  "CSV exported": "Export CSV terminé",
  "The registration records were downloaded as a CSV file.": "Les inscriptions ont été téléchargées au format CSV.",
  "Export failed": "Échec de l’exportation",
  "Could not create the CSV file.": "Impossible de créer le fichier CSV.",
  "Excel exported": "Export Excel terminé",
  "Could not create the Excel file.": "Impossible de créer le fichier Excel.",
  "Dashboard refreshed": "Tableau de bord actualisé",
  "Latest registrations have been loaded.": "Les dernières inscriptions ont été chargées.",
  "Saving registration…": "Enregistrement de l’inscription…",
  "Signing in…": "Connexion en cours…",
  "Saving…": "Enregistrement…",
  "Preparing…": "Préparation…",
  "Preparing Excel…": "Préparation du fichier Excel…",
  "Exporting…": "Exportation…",
  "Save staff account": "Enregistrer le compte du personnel",
  "Total paid": "Total payé",
  "German course": "Cours d’allemand",
  "Backend error": "Erreur du backend",
  "Unable to reach Google Apps Script": "Impossible de joindre Google Apps Script",
  "POST request failed": "Échec de la requête POST",
  "Google Apps Script login request failed": "Échec de la connexion à Google Apps Script",
  "Google Sheets did not return the official registration reference.": "Google Sheets n’a pas renvoyé la référence officielle de l’inscription.",
  "CSV export request failed": "Échec de la demande d’exportation CSV",
  "No registration data is available to export.": "Aucune donnée d’inscription n’est disponible pour l’exportation.",
  "Excel export request failed": "Échec de la demande d’exportation Excel",
  "Excel export failed": "Échec de l’exportation Excel",
  "Registration available": "Inscriptions disponibles",
  "The registration records were downloaded as an .xlsx file.": "Les dossiers d’inscription ont été téléchargés au format .xlsx.",
  "Google Apps Script URL is not configured.": "L’URL Google Apps Script n’est pas configurée.",
  "Authentication required.": "Authentification requise.",
  "Could not create the CSV file.": "Impossible de créer le fichier CSV.",
  "Could not create the Excel file.": "Impossible de créer le fichier Excel.",
  "Staff sheet missing. Run setup() first.": "Feuille Personnel introuvable. Exécutez d’abord setup().",
  "Staff sheet not found.": "Feuille Personnel introuvable.",
  "Staff headers do not match. No staff records were changed.": "Les en-têtes de la feuille Personnel ne correspondent pas. Aucun compte du personnel n’a été modifié.",
};
Object.keys(FR_RUNTIME_TRANSLATIONS).forEach(key => {
  if (I18N.en[key] === undefined) I18N.en[key] = key;
  I18N.fr[key] = FR_RUNTIME_TRANSLATIONS[key];
});
Object.keys(FR_SITE_TRANSLATIONS).forEach(key => {
  if (I18N.en[key] === undefined) I18N.en[key] = key;
  I18N.fr[key] = FR_SITE_TRANSLATIONS[key];
});

const SUPPORTED_LANGUAGES = ["fr", "en", "de"];
let currentLanguage = SUPPORTED_LANGUAGES.includes(localStorage.getItem("friedenLanguage_v2"))
  ? localStorage.getItem("friedenLanguage_v2")
  : "fr";
const localeFor = lang => ({ en: "en-US", fr: "fr-FR", de: "de-DE" }[lang] || "fr-FR");
const t = key => (I18N[currentLanguage] && I18N[currentLanguage][key]) || I18N.en[key] || key;
const tValue = value => t(value);
function translateStatic() {
  const dict = I18N[currentLanguage] || I18N.fr;
  const normalize = value => String(value || "").replace(/\\s+/g, " ").trim();
  const reverse = {};
  Object.keys(I18N.en).forEach(key => Object.keys(I18N).forEach(lang => {
    const val = I18N[lang][key];
    if (val) reverse[normalize(val)] = key;
  }));
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = []; let n; while (n = walker.nextNode()) nodes.push(n);
  nodes.forEach(node => {
    const raw = node.nodeValue, trimmed = raw.trim();
    if (!trimmed || node.parentElement.closest("script,style")) return;
    const normalized = normalize(trimmed);
    const key = reverse[normalized] || normalized;
    if (dict[key] && normalize(dict[key]) !== normalized) node.nodeValue = raw.replace(trimmed, dict[key]);
  });
  ["placeholder", "title", "aria-label", "alt"].forEach(attribute => {
    document.querySelectorAll("[" + attribute + "]").forEach(el => {
      const raw = el.getAttribute(attribute), normalized = normalize(raw);
      const key = reverse[normalized] || normalized;
      if (dict[key]) el.setAttribute(attribute, dict[key]);
    });
  });
  document.documentElement.lang = currentLanguage;
}
const translationObserver = new MutationObserver(() => translateStatic());
translationObserver.observe(document.body, { childList: true, characterData: true, subtree: true });
function setLanguage(lang) {
  currentLanguage = SUPPORTED_LANGUAGES.includes(lang) ? lang : "fr";
  localStorage.setItem("friedenLanguage_v2", currentLanguage);
  const sel = $("#language-select");
  if (sel) sel.value = currentLanguage;
  populateStartDates();
  translateStatic();
  render();
  openActiveReceiptIfAny();
}
function openActiveReceiptIfAny() { const modal = $("#receipt-modal"); if (modal && !modal.classList.contains("hidden")) { const ref = modal.querySelector(".receipt-copy .premium-ref strong")?.textContent; const r = records.find(x => x.ref === ref); if (r) openReceipt(r.id) } }
const REGISTERED_BY_OPTIONS = ["Administrator", "Reception", "Folly", "Course Coordinator"];
function populateRegisteredBy() { const el = $("#registered-by-select"); if (!el) return; const selected = el.value; el.innerHTML = `<option value="">${t("Select staff member")}</option>` + REGISTERED_BY_OPTIONS.map(v => `<option value="${esc(v)}">${esc(t(v))}</option>`).join(""); if (selected) el.value = selected; }
function populateStartDates() { const el = $("#start-date-select"); if (!el) return; const selected = el.value; const today = new Date(); today.setHours(0, 0, 0, 0); const opts = [`<option value="">${esc(t("Select start date"))}</option>`]; for (let i = 0; i < 90; i++) { const d = new Date(today); d.setDate(today.getDate() + i); const iso = d.toISOString().slice(0, 10); const label = new Intl.DateTimeFormat(localeFor(currentLanguage), { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(d); opts.push(`<option value="${iso}">${esc(label)}</option>`) } el.innerHTML = opts.join(""); if (selected) el.value = selected; }

function esc(v = "") { return String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])) }
function dateFmt(v) { if (!v) return "—"; const d = new Date(v + "T00:00:00"); return isNaN(d) ? String(v) : d.toLocaleDateString(localeFor(currentLanguage), { day: "2-digit", month: "2-digit", year: "numeric" }) }
function table(rows, headers) { if (!rows.length) return `<div class="empty">${t("No registrations yet.")}</div>`; return `<table class="table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>` }
function localSave() { try { localStorage.setItem(SETTINGS, JSON.stringify(settings)) } catch (e) { } }
function showToast(title, message, type = "success") { $("#toast-title").textContent = title; $("#toast-message").textContent = message; $("#toast").classList.add("show"); $("#toast").querySelector(".toast-icon").textContent = type === "error" ? "!" : "✓"; clearTimeout(toastTimer); toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4500) }
$("#toast-close").onclick = () => $("#toast").classList.remove("show");
function setConnection(online, label) { const el = $("#connection-status"); if (!el) return; el.classList.toggle("offline", !online); el.innerHTML = `<span class="status-dot"></span><span>${esc(label)}</span>` }
async function api(payload) {
  const url = endpoint(); if (!url) throw new Error("Google Apps Script URL is not configured.");
  const body = { ...payload }; if (authToken) body.token = authToken;
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error("POST request failed");
    const data = await r.json(); if (data.ok === false) throw new Error(data.error || "Backend error"); return data;
  } catch (postError) {
    if (payload.action !== "login") throw postError;
    const q = new URLSearchParams({ action: "login", username: String(payload.username || ""), password: String(payload.password || "") });
    const r = await fetch(url + "?" + q.toString(), { cache: "no-store" });
    if (!r.ok) throw new Error("Google Apps Script login request failed");
    const data = await r.json(); if (data.ok === false) throw new Error(data.error || "Invalid username or password."); return data;
  }
}
async function fetchBootstrap() { const url = endpoint(); if (!url) throw new Error("Google Apps Script URL is not configured."); if (!isAdmin) throw new Error("Authentication required."); const response = await fetch(url + "?action=bootstrap&token=" + encodeURIComponent(authToken), { cache: "no-store" }); if (!response.ok) throw new Error("Unable to reach Google Apps Script"); const data = await response.json(); if (data.ok === false) throw new Error(data.error || "Backend error"); return data }
async function loadData(options = {}) {
  const silent = !!options.silent;
  const url = endpoint();
  if (!url) { records = []; settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS) || "{}") }; setConnection(false, "Backend not connected"); return false }
  try {
    // If settings were edited locally and the save is still pending, retry the
    // server save before accepting the server copy. This prevents the 5-second
    // live-sync loop from reverting a freshly edited setting to an older value.
    const pendingSettings = localStorage.getItem(PENDING_SETTINGS_KEY);
    if (pendingSettings) {
      try {
        const pending = JSON.parse(pendingSettings);
        const saved = await api({ action: "settings", settings: pending });
        if (saved.ok !== false) {
          settings = { ...DEFAULT_SETTINGS, ...(saved.settings || pending) };
          settingsDirty = false;
          localStorage.removeItem(PENDING_SETTINGS_KEY);
        }
      } catch (e) {
        settingsDirty = true;
      }
    }
    const data = await fetchBootstrap();
    const serverRecords = data.records || [];
    const optimistic = records.filter(r => pendingIds.has(r.id));
    const map = new Map(serverRecords.map(r => [String(r.id), r]));
    optimistic.forEach(r => map.set(String(r.id), r));
    const nextRecords = Array.from(map.values()).sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0));
    const nextSettings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
    const signature = JSON.stringify({ records: nextRecords, settings: nextSettings });
    const changed = signature !== lastServerSignature;
    records = nextRecords;
    // Never replace an actively edited settings object with the live-sync copy.
    // The edit is either already saved or will be retried from PENDING_SETTINGS_KEY.
    if (!settingsDirty && !localStorage.getItem(PENDING_SETTINGS_KEY)) settings = nextSettings;
    lastServerSignature = signature;
    setConnection(true, changed ? "Cloud synced" : "Cloud connected");
    return changed;
  } catch (e) {
    console.error(e);
    setConnection(false, "Connection issue");
    if (!silent) showToast("Connection issue", "Google Sheets is not responding. Your interface is still available.", "error");
    if (!records.length) settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS) || "{}") };
    return false;
  } finally {
    refreshInFlight = false;
  }
}
function ref() { const d = new Date(), y = d.getFullYear(); return `GER-${y}-${String(records.length + 1).padStart(5, "0")}-${Math.random().toString(36).slice(2, 5).toUpperCase()}` }
function applyBranding() {
  const logo = "images/kyma-frieden-institut.png", fav = "images/kyma-frieden-institut.png";
  ["#sidebar-logo", "#current-logo-preview", "#public-logo"].forEach(x => { const el = $(x); if (el) el.src = logo });
  const fi = $("#current-favicon-preview"); if (fi) fi.src = fav; const df = $("#dynamic-favicon"); if (df) df.href = fav;
  const setText = (id, val) => { const el = $(id); if (el) el.textContent = val || "" };
  setText("#sidebar-company", settings.company); setText("#sidebar-course", settings.course); setText("#hero-initials", settings.initials); setText("#hero-company", (settings.company || "").toUpperCase());
  setText("#dashboard-eyebrow", settings.dashboardEyebrow); setText("#dashboard-headline", settings.dashboardHeadline); setText("#dashboard-description", settings.dashboardDescription);
  setText("#footer-copyright", settings.footerCopyright); setText("#footer-credit", settings.footerCredit); setText("#top-eyebrow", `INTERNAL SYSTEM • ${(settings.company || "").toUpperCase()}`);
  const phone = $("#public-phone"); if (phone && settings.companyPhone) phone.innerHTML = `<a href="tel:${esc(settings.companyPhone)}">${esc(settings.companyPhone)}</a>`;
  const staffName = $("#staff-name"), staffRole = $("#staff-role"), avatar = $("#staff-avatar"); if (staffName) staffName.textContent = adminName || adminUser || "Staff"; if (staffRole) staffRole.textContent = adminRole || "Staff"; if (avatar) avatar.textContent = (adminName || adminUser || "S").charAt(0).toUpperCase();
  document.title = `${settings.company} • ${settings.course}`;
}
function fillSettings() { for (const [id, key] of [["company-name", "company"], ["course-name", "course"], ["logo-initials", "initials"], ["dashboard-eyebrow-setting", "dashboardEyebrow"], ["dashboard-headline-setting", "dashboardHeadline"], ["dashboard-description-setting", "dashboardDescription"], ["receipt-title-setting", "receiptTitle"], ["footer-copyright-setting", "footerCopyright"], ["footer-credit-setting", "footerCredit"], ["company-tagline-setting", "companyTagline"], ["company-address-setting", "companyAddress"], ["company-phone-setting", "companyPhone"], ["company-email-setting", "companyEmail"], ["company-hours-setting", "companyHours"], ["company-about-setting", "companyAbout"]]) { const el = $("#" + id); if (el) el.value = settings[key] || "" } }
function showPage(id) {
  if (!isAdmin) {
    if (id !== "registration") { pendingPage = id; openLogin(); return }
    document.body.classList.add("public-registration-mode");
  } else { document.body.classList.remove("public-registration-mode") }
  $$('.page').forEach(p => p.classList.toggle('active', p.id === id)); $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === id));
  const labels = { dashboard: t("Dashboard"), registration: t("New Registration"), students: t("Students"), records: t("All Registrations"), search: t("Search"), receipts: t("Receipts"), reports: t("Reports"), settings: t("Settings") };
  const title = $("#page-title"); if (title) title.textContent = labels[id] || "Dashboard"; render();
}
function showPublicHome() { document.body.classList.remove("public-registration-mode"); window.scrollTo({ top: 0, behavior: "smooth" }) }
function render() { applyBranding(); fillSettings(); if (isAdmin && adminRole === "Administrator") { $("#staff-management")?.classList.remove("hidden"); } else { $("#staff-management")?.classList.add("hidden"); } $("#stat-total").textContent = records.length; const today = new Date().toISOString().slice(0, 10); $("#stat-today").textContent = records.filter(r => String(r.created || "").slice(0, 10) === today).length; $("#stat-level").textContent = records.length ? records[0].level || "—" : "—"; $("#stat-ref").textContent = records.length ? records[0].ref || "—" : "—"; const recent = records.slice(0, 6); $("#recent-table").innerHTML = table(recent.map(r => `<tr><td class="ref">${esc(r.ref)}</td><td>${esc(r.name)}</td><td>${esc(r.level)}</td><td>${new Date(r.created).toLocaleDateString(localeFor(currentLanguage))}</td><td><button class="action-btn" onclick="openReceipt('${esc(r.id)}')">${t("Receipt")}</button></td></tr>`), [t("Reference"), t("Student"), t("Level"), t("Date"), ""]); $("#records-table").innerHTML = table(records.map(r => `<tr><td class="ref">${esc(r.ref)}</td><td>${esc(r.name)}</td><td>${esc(r.phone)}</td><td>${esc(r.level)}</td><td>${dateFmt(r.start)}</td><td><button class="action-btn" onclick="openReceipt('${esc(r.id)}')">${t("View receipt")}</button></td></tr>`), [t("Reference"), t("Name"), t("Phone"), t("Level"), t("Start"), ""]); $("#students-table").innerHTML = table(records.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.phone)}</td><td>${esc(r.email)}</td><td>${esc(r.level)}</td><td>${esc(t(r.course))}</td></tr>`), [t("Name"), t("Phone"), t("Email"), t("Level"), t("Course")]); $("#receipts-table").innerHTML = table(records.map(r => `<tr><td class="ref">${esc(r.ref)}</td><td>${esc(r.name)}</td><td>${new Date(r.created).toLocaleString()}</td><td><button class="action-btn" onclick="openReceipt('${esc(r.id)}')">${t("Open / Print")}</button></td></tr>`), [t("Reference"), t("Student"), t("Created"), ""]); const counts = {}; records.forEach(r => counts[r.level] = (counts[r.level] || 0) + 1); $("#report-bars").innerHTML = Object.keys(counts).length ? Object.entries(counts).map(([k, v]) => `<div class="report-row"><div class="report-meta"><span>${esc(k)}</span><span>${v}</span></div><div class="report-track"><div class="report-fill" style="width:${Math.max(4, v / records.length * 100)}%"></div></div></div>`).join("") : `<div class="empty">${t("No data yet.")}</div>`; populateStartDates(); translateStatic(); applyBranding(); updateGermanPriceOptions(); doSearch() }
function doSearch() { const q = $("#search-input")?.value || "", query = q.toLowerCase().trim(); if (!$("#search-results")) return; const found = records.filter(r => !query || [r.ref, r.name, r.phone, r.email, r.level].join(" ").toLowerCase().includes(query)); $("#search-results").innerHTML = table(found.map(r => `<tr><td class="ref">${esc(r.ref)}</td><td>${esc(r.name)}</td><td>${esc(r.phone)}</td><td>${esc(r.level)}</td><td><button class="action-btn" onclick="openReceipt('${esc(r.id)}')">${t("Receipt")}</button></td></tr>`), [t("Reference"), t("Name"), t("Phone"), t("Level"), ""]) }
$("#search-input").addEventListener("input", doSearch);
function readImage(file, maxW = 1100, maxH = 1300, quality = .82) { return new Promise((resolve, reject) => { if (!file) return resolve(""); if (!file.type.startsWith("image/")) return reject(new Error("Please choose an image file.")); const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => { const scale = Math.min(1, maxW / img.width, maxH / img.height), w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale)); const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h; const ctx = canvas.getContext("2d"); ctx.drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL("image/jpeg", quality)) }; img.onerror = () => reject(new Error("Could not read image.")); img.src = reader.result }; reader.onerror = () => reject(reader.error || new Error("Could not read image.")); reader.readAsDataURL(file) }) }
$("#studentPhoto").addEventListener("change", async e => { const f = e.target.files?.[0], p = $("#photoPreview"); if (!f) { p.innerHTML = ""; return } try { const d = await readImage(f, 900, 1100, .78); p.innerHTML = `<img src="${d}" alt="Student preview">` } catch (err) { p.innerHTML = ""; showToast("Photo error", err.message, "error"); e.target.value = "" } });
// Multi-step registration wizard. Inputs remain in the same form, so moving
// between steps never discards data.
let registrationStep = 0;
function showRegistrationStep(step) {
  registrationStep = Math.max(0, Math.min(2, step));
  $$(".wizard-panel").forEach((p, i) => p.classList.toggle("active", i === registrationStep));
  $$(".wizard-step").forEach((b, i) => { b.classList.toggle("active", i === registrationStep); b.classList.toggle("complete", i < registrationStep) });
  $("#wizard-back").disabled = registrationStep === 0;
  $("#wizard-next").classList.toggle("hidden", registrationStep === 2);
  $("#registration-form .submit-button").classList.toggle("hidden", registrationStep !== 2);
  if (registrationStep === 2) updatePayment();
}
$$(".wizard-step").forEach(b => b.addEventListener("click", () => showRegistrationStep(Number(b.dataset.stepTarget))));
$("#wizard-back").addEventListener("click", () => showRegistrationStep(registrationStep - 1));
$("#wizard-next").addEventListener("click", () => {
  if (registrationStep === 0) {
    const form = $("#registration-form");
    for (const name of ["firstName", "lastName", "phoneLocal"]) { const el = form.elements[name]; if (!el.value.trim()) { el.reportValidity(); el.focus(); return } }
  }
  if (registrationStep === 1 && !selectedServices().length) { showToast("Choose a service", "Select at least one paid service before continuing.", "error"); return }
  showRegistrationStep(registrationStep + 1);
});
$("#clear-registration").addEventListener("click", () => setTimeout(() => { $("#photoPreview").innerHTML = ""; showRegistrationStep(0); updatePayment(); }, 0));
const GERMAN_PRICES = {
  "Day course": { "A1": 100000, "A2": 120000, "B1": 140000, "B2": 180000, "C1": 0, "Exam preparation": 100000 },
  "Evening course": { "A1": 140000, "A2": 160000, "B1": 180000, "B2": 200000, "C1": 0, "Exam preparation": 100000 },
  "Individual course": { "A1": 230000, "A2": 270000, "B1": 320000, "B2": 380000, "C1": 0, "Exam preparation": 100000 }
};
function germanCoursePrice(type, level) { return Number(GERMAN_PRICES[type]?.[level] || 0) }
function updateGermanPriceOptions() {
  const type = $("#course-type")?.value || "Day course", level = $("#course-level")?.value || "A1";
  const price = germanCoursePrice(type, level), hint = $("#german-price-hint");
  if (hint) hint.textContent = price ? `${type} · ${level}: ${money(price)}. Price are shown on the payment tab` : `${type} · ${level}: price must be confirmed before registration.`;
  const selected = $('input[name="service"][value="German course"]'); if (selected) { const small = selected.closest('.service-choice')?.querySelector('small'); if (small) small.textContent = "German course"; }
}
function selectedServices() {
  const f = $("#registration-form");
  const selected = [...f.querySelectorAll('input[name="service"]:checked')].map(el => {
    if (el.value === "German course") {
      const level = $("#course-level").value, courseType = $("#course-type").value;
      const price = germanCoursePrice(courseType, level);
      return { name: `German course ${level}`, price, free: false, level, courseType };
    }
    return { name: el.value, price: Number(el.dataset.price) || 100000, free: false };
  });
  return selected.concat([...f.querySelectorAll('input[name="addon"]:checked')].map(el => ({ name: el.value, price: 0, free: true })));
}
function money(n) { return Math.round(Number(n) || 0).toLocaleString("fr-FR") + " CFA" }
function updatePayment() {
  const services = selectedServices(), subtotal = services.reduce((sum, x) => sum + x.price, 0);
  const discountMode = $("#discount-mode").value;
  const reductionPercent = Math.max(0, Math.min(100, Number($("#reduction-percent").value) || 0));
  const reductionAmountInput = Math.max(0, Number($("#reduction-amount").value) || 0);
  const reduction = discountMode === "percent" ? Math.round(subtotal * reductionPercent / 100) : Math.min(subtotal, reductionAmountInput);
  const serviceTotal = Math.max(0, subtotal - reduction);
  const inscriptionStatus = $("#inscription-status").value, inscriptionFee = 20000;
  const status = $("#service-fee-status");
  if (status.value === "Paid") $("#amount-paid").value = serviceTotal;
  else if (status.value === "Not paid") $("#amount-paid").value = 0;
  const servicePaid = Math.min(serviceTotal, Math.max(0, Number($("#amount-paid").value) || 0));
  const inscriptionPaid = inscriptionStatus === "Paid" ? inscriptionFee : 0;
  const totalDue = serviceTotal + inscriptionFee;
  const totalPaid = servicePaid + inscriptionPaid;
  const balance = Math.max(0, totalDue - totalPaid);
  $("#payment-services").innerHTML = services.length ? services.map(x => `<div class="payment-service-row"><span>${esc(x.name)}${x.free ? ' <small>FREE ADD-ON</small>' : ''}${x.courseType ? ` <small>· ${esc(x.courseType)}</small>` : ''}</span><b>${money(x.price)}</b></div>`).join("") : '<p>Select services to calculate the amount.</p>';
  $("#pay-subtotal").textContent = money(subtotal); $("#pay-reduction").textContent = "− " + money(reduction); $("#pay-service-total").textContent = money(serviceTotal); $("#pay-inscription").textContent = `${money(inscriptionFee)} · ${inscriptionStatus}`; $("#pay-total").textContent = money(totalPaid); $("#pay-balance").textContent = money(balance);
  const totalLabel = $("#pay-total-label"); if (totalLabel) totalLabel.textContent = "Total paid";
  const serviceTotalLabel = $("#pay-service-total-label"); if (serviceTotalLabel) serviceTotalLabel.textContent = `Service fee after reduction (${status.value})`;
  return { services, subtotal, reduction, reductionPercent, discountMode, inscriptionStatus, inscriptionFee, serviceTotal, total: totalDue, totalDue, totalPaid, paid: servicePaid, inscriptionPaid, balance, paymentStatus: status.value, serviceFeeStatus: status.value, vatRate: 0, vat: 0 };
}
["#reduction-percent", "#reduction-amount", "#discount-mode", "#amount-paid", "#inscription-status", "#service-fee-status"].forEach(sel => $(sel).addEventListener("input", updatePayment));
$("#service-fee-status").addEventListener("change", () => { if ($("#service-fee-status").value === "Paid") $("#amount-paid").value = updatePayment().serviceTotal; else if ($("#service-fee-status").value === "Not paid") $("#amount-paid").value = 0; updatePayment() });
$$('input[name="service"],input[name="addon"]').forEach(el => el.addEventListener("change", () => {
  $("#german-options").classList.toggle("hidden", !$('input[name="service"][value="German course"]').checked); updateGermanPriceOptions(); updatePayment();
}));
$("#course-level").addEventListener("change", () => { updateGermanPriceOptions(); updatePayment() }); $("#course-type").addEventListener("change", () => { updateGermanPriceOptions(); updatePayment() });
$("#phone-country").addEventListener("change", () => {
  const el = $("#phone-local");
  el.placeholder = currentLanguage === "fr" ? "Numéro sans indicatif (ex. 90 12 34 56)" : currentLanguage === "de" ? "Nummer ohne Ländercode (z. B. 90 12 34 56)" : "Number without country code (e.g. 90 12 34 56)";
});
$("#language-select")?.addEventListener("change", e => setLanguage(e.target.value));
$("#studentPhoto").addEventListener("change", async e => { const f = e.target.files?.[0], p = $("#photoPreview"); if (!f) { p.innerHTML = ""; return } try { const d = await readImage(f, 900, 1100, .78); p.innerHTML = `<img src="${d}" alt="Student preview">` } catch (err) { p.innerHTML = ""; showToast("Photo error", err.message, "error"); e.target.value = "" } });
$("#registration-form").addEventListener("submit", async e => {
  e.preventDefault(); if (registrationStep !== 2) { showRegistrationStep(registrationStep + 1); return }
  const form = e.target, submitButton = form.querySelector('button[type="submit"]');
  if (!selectedServices().length) { showToast("Choose a service", "Select at least one service.", "error"); showRegistrationStep(1); return }
  if (submitButton) { submitButton.disabled = true; submitButton.dataset.original = submitButton.innerHTML; submitButton.innerHTML = '<span class="loader-inline"></span> Saving registration…' }
  let localRecordId = null;
  try {
    const f = new FormData(form), now = new Date(), photo = await readImage($("#studentPhoto")?.files?.[0], 900, 1100, .78), payment = updatePayment();
    const fullName = [f.get("firstName"), f.get("lastName")].filter(Boolean).join(" ").trim();
    const serviceNames = payment.services.map(x => x.name);
    const details = { firstName: f.get("firstName"), lastName: f.get("lastName"), passport: f.get("passport"), nationalId: f.get("nationalId"), services: payment.services, subtotal: payment.subtotal, reduction: payment.reduction, reductionPercent: payment.reductionPercent, discountMode: payment.discountMode, vatRate: 0, vat: 0, total: payment.total, totalDue: payment.totalDue, totalPaid: payment.totalPaid, serviceTotal: payment.serviceTotal, inscriptionFee: payment.inscriptionFee, inscriptionPaid: payment.inscriptionPaid, inscriptionStatus: payment.inscriptionStatus, paid: payment.paid, balance: payment.balance, paymentStatus: payment.paymentStatus, serviceFeeStatus: payment.serviceFeeStatus, courseType: f.get("courseType") || "", addons: payment.services.filter(x => x.free).map(x => x.name) };
    const r = { id: crypto.randomUUID(), ref: ref(), created: now.toISOString(), studentPhoto: photo, firstName: f.get("firstName") || "", lastName: f.get("lastName") || "", name: fullName, dob: f.get("dob"), passport: f.get("passport") || "", nationalId: f.get("nationalId") || "", countryCode: $("#phone-country").value, phone: $("#phone-country").value + " " + f.get("phoneLocal"), email: f.get("email"), address: f.get("address"), level: f.get("level") || "", course: f.get("courseType") || serviceNames.join(", "), start: f.get("start") || "", duration: "", registrationStatus: f.get("registrationStatus") || "Registered", notes: JSON.stringify({ details, notes: f.get("notes") || "" }) };
    localRecordId = r.id; records = [r, ...records]; pendingIds.add(r.id); render();
    showToast("Saving registration", "Waiting for Google Sheets to confirm the official reference…");
    const out = await api({ action: "registration", record: r });
    const saved = out.record;
    if (!saved || !saved.id || !saved.ref) throw new Error("Google Sheets did not return the official registration reference.");
    records = records.filter(x => x.id !== r.id && x.id !== saved.id); records = [saved, ...records];
    pendingIds.delete(r.id); setConnection(true, "Cloud connected"); render();
    openReceipt(saved.id);
    showToast("Registration saved", "Receipt reference confirmed with Google Sheets.");
    form.reset(); $("#photoPreview").innerHTML = ""; $("#german-options").classList.add("hidden"); showRegistrationStep(0); updatePayment();
  } catch (err) { if (localRecordId) { pendingIds.delete(localRecordId); records = records.filter(x => x.id !== localRecordId); render(); showToast("Save failed", "Google Sheets did not confirm this registration. Your form entries are still here; please try again.", "error") } else { showToast("Could not create registration", err.message || "Please check the form and try again.", "error") } console.error(err) }
  finally { if (submitButton) { submitButton.disabled = false; submitButton.innerHTML = submitButton.dataset.original || 'Save registration & generate receipt' } }
});
function receiptCopy(r, label) {
  let meta = {}; try { meta = JSON.parse(r.notes || "").details || {} } catch (e) { }
  const extraNotes = (() => { try { return JSON.parse(r.notes || "").notes || "" } catch (e) { return r.notes || "" } })();
  const created = new Date(r.created), date = created.toLocaleDateString(localeFor(currentLanguage), { day: "2-digit", month: "short", year: "numeric" }), time = created.toLocaleTimeString(localeFor(currentLanguage), { hour: "2-digit", minute: "2-digit" });
  const services = Array.isArray(meta.services) ? meta.services : [];
  const serviceText = services.map(x => `${x.name}${x.free ? " — FREE" : ""}`).join(", ") || r.course || "—";
  const photoHtml = r.studentPhoto ? `<img class="receipt-student-photo" src="${esc(r.studentPhoto)}" alt="Student photo">` : "";
  const inscription = Number(meta.inscriptionFee) || 20000;
  const serviceTotal = Number(meta.serviceTotal) || Math.max(0, (Number(meta.subtotal) || 0) - (Number(meta.reduction) || 0));
  const servicePaid = Math.min(serviceTotal, Math.max(0, Number(meta.paid) || 0));
  const inscriptionPaid = meta.inscriptionStatus === "Paid" ? inscription : 0;
  const totalPaid = Number.isFinite(Number(meta.totalPaid)) ? Number(meta.totalPaid) : servicePaid + inscriptionPaid;
  const totalDue = Number.isFinite(Number(meta.totalDue)) ? Number(meta.totalDue) : serviceTotal + inscription;
  const balance = Number.isFinite(Number(meta.totalDue)) ? Number(meta.balance) : Math.max(0, totalDue - totalPaid);
  return `<article class="receipt-copy receipt-compact"><div class="receipt-watermark" aria-hidden="true"></div><div class="receipt-accent"></div><div class="copy-label"><span>${t(label)}</span></div><div class="receipt-topline"><span>${esc(settings.company)}</span><span>REÇU OFFICIEL</span></div><div class="receipt-head"><div class="receipt-logo"><img class="receipt-brand-logo" src="images/kyma-frieden-institut.png" alt="KymA Frieden Institut logo"><div class="receipt-brand-text"><strong>${esc(settings.company)}</strong><div>${esc(settings.companyTagline || "Formation · Langues · Voyage · Avenir")}</div></div></div><div class="receipt-ref"><span>RÉFÉRENCE</span><strong>${esc(r.ref)}</strong><small>${date} · ${time}</small></div></div><div class="compact-receipt-main"><div class="compact-student"><div><b>ÉTUDIANT(E)</b><strong>${esc(r.name || "—")}</strong><span>${esc(r.phone || "—")}${r.email ? ` · ${esc(r.email)}` : ""}</span><span>${esc(r.address || "—")}</span><span>Passeport : ${esc(r.passport || meta.passport || "—")} · Carte nationale d’identité : ${esc(r.nationalId || meta.nationalId || "—")}</span></div>${photoHtml}</div><div class="compact-service"><b>SERVICES</b><span>${esc(serviceText)}</span>${r.start ? `<small>Date de début : ${esc(dateFmt(r.start))}</small>` : ""}${extraNotes ? `<small>Remarques : ${esc(extraNotes)}</small>` : ""}</div><div class="compact-finance"><div><span>Frais de service</span><b>${money(meta.subtotal || 0)}</b></div><div><span>Réduction ${meta.discountMode === "percent" ? `(${Number(meta.reductionPercent) || 0} %)` : "(fixe)"}</span><b>− ${money(meta.reduction || 0)}</b></div><div><span>Frais de service après réduction (${esc(meta.serviceFeeStatus || meta.paymentStatus || "Non payé")})</span><b>${money(serviceTotal)}</b></div><div><span>Frais d’inscription (${esc(meta.inscriptionStatus || "Non payé")})</span><b>${money(inscription)}</b></div><div class="compact-total"><span>Total payé</span><b>${money(totalPaid)}</b></div><div><span>Solde restant dû</span><b>${money(balance)}</b></div></div></div><div class="receipt-bottom"><div class="receipt-status"><strong>${esc((r.registrationStatus || "Registered").toUpperCase())}</strong><small>Conservez cette référence pour toute demande ultérieure.</small></div><div class="receipt-sign">${esc(settings.company)}<span>Administration autorisée</span></div></div></article>`;
}
function cell(k, v) { return `<div class="receipt-cell"><b>${t(k)}</b><span>${esc(v || "—")}</span></div>` }
function openReceipt(id) { const r = records.find(x => x.id === id); if (!r) return; $("#receipt-content").innerHTML = `<div class="receipt-sheet">${receiptCopy(r, "STUDENT COPY")}${receiptCopy(r, "COMPANY RECORD")}</div>`; $("#receipt-modal").classList.remove("hidden") }
function cell(k, v) { return `<div class="receipt-cell"><b>${t(k)}</b><span>${esc(v || "—")}</span></div>` }
async function waitForReceiptImages() { const images = [...document.querySelectorAll("#receipt-content img")]; await Promise.all(images.map(img => { if (img.complete && img.naturalWidth > 0) return Promise.resolve(); return new Promise(resolve => { const done = () => resolve(); img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true }); setTimeout(resolve, 4500) }) })) }
$("#close-receipt").onclick = () => $("#receipt-modal").classList.add("hidden");
$("#print-receipt").onclick = async () => { const b = $("#print-receipt"); b.disabled = true; const old = b.innerHTML; b.innerHTML = '<span class="loader-inline"></span> Preparing…'; await waitForReceiptImages(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); b.innerHTML = old; b.disabled = false; window.print() };
function setAdminState(on, targetPage = "dashboard") {
  isAdmin = !!on; document.body.classList.toggle("signed-out", !isAdmin); document.body.classList.toggle("public-mode", !isAdmin); document.body.classList.toggle("public-registration-mode", false);
  $("#admin-login")?.classList.toggle("hidden", isAdmin); $("#admin-logout")?.classList.toggle("hidden", !isAdmin); $("#staff-identity")?.classList.toggle("hidden", !isAdmin);
  if (!isAdmin) { records = []; settings = { ...DEFAULT_SETTINGS }; lastServerSignature = ""; $("#login-modal")?.classList.remove("hidden"); setConnection(!!endpoint(), endpoint() ? "Registration available" : "Backend not connected"); }
  else { $("#login-modal")?.classList.add("hidden"); showPage(targetPage || "dashboard"); loadData({ silent: false }).then(() => { render(); if (adminRole === "Administrator") loadStaff() }) }
}
function openLogin() { const m = $("#login-modal"); if (m) { m.classList.remove("hidden"); setTimeout(() => $("#login-username")?.focus(), 60) } }
function closeLogin() { $("#login-modal")?.classList.add("hidden") }
async function doLogin() {
  const u = $("#login-username")?.value.trim(), p = $("#login-password")?.value || "", b = $("#login-submit");
  if (!u || !p) { showToast("Login required", "Enter your username and password.", "error"); return }
  b.disabled = true; b.innerHTML = '<span class="loader-inline"></span> Signing in…';
  try {
    const r = await api({ action: "login", username: u, password: p });
    if (!r.token) throw new Error(r.error || "Login failed.");
    authToken = r.token; adminUser = r.username || u; adminName = r.name || adminUser; adminRole = r.role || "Staff";
    localStorage.setItem("fi_admin_token", authToken); localStorage.setItem("fi_admin_user", adminUser); localStorage.setItem("fi_admin_name", adminName); localStorage.setItem("fi_admin_role", adminRole);
    closeLogin();
    const destination = pendingPage || "dashboard"; pendingPage = "dashboard";
    setAdminState(true, destination);
    showToast(`Welcome, ${adminName}`, `${adminRole} access granted.`);
  } catch (e) { showToast("Login failed", e.message || "Invalid credentials.", "error") } finally { b.disabled = false; b.innerHTML = "Se connecter" }
}
async function logout() { const oldToken = authToken; try { if (oldToken && endpoint()) await fetch(endpoint(), { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "logout", token: oldToken }) }); } catch (e) { console.warn("Logout request failed", e) } authToken = ""; adminUser = ""; adminName = ""; adminRole = ""; localStorage.removeItem("fi_admin_token"); localStorage.removeItem("fi_admin_user"); localStorage.removeItem("fi_admin_name"); localStorage.removeItem("fi_admin_role"); setAdminState(false); showToast("Signed out", "You have safely signed out of the internal portal.") }
async function verifySession() { if (!authToken) return false; try { const data = await fetchBootstrap(); adminUser = data.user?.username || adminUser; adminName = data.user?.name || adminName || adminUser; adminRole = data.user?.role || adminRole || "Staff"; localStorage.setItem("fi_admin_user", adminUser); localStorage.setItem("fi_admin_name", adminName); localStorage.setItem("fi_admin_role", adminRole); return true } catch (e) { authToken = ""; adminUser = ""; adminName = ""; adminRole = ""; localStorage.removeItem("fi_admin_token"); localStorage.removeItem("fi_admin_user"); localStorage.removeItem("fi_admin_name"); localStorage.removeItem("fi_admin_role"); return false } }

let editingStaffUsername = "";
function openStaffEditor(username = "") {
  if (adminRole !== "Administrator") { showToast("Administrator only", "Only an Administrator can manage staff accounts.", "error"); return }
  editingStaffUsername = username; const modal = $("#staff-modal"); if (!modal) return;
  const row = (window.staffAccounts || []).find(x => x.username === username) || {};
  $("#staff-editor-title").textContent = username ? "Edit staff member" : "Add staff member";
  $("#staff-edit-username").value = username || ""; $("#staff-edit-username-visible").value = row.username || ""; $("#staff-edit-username-visible").disabled = !!username; $("#staff-edit-name").value = row.name || ""; $("#staff-edit-role").value = row.role || "Staff"; $("#staff-edit-password").value = ""; $("#staff-edit-active").checked = username ? row.active !== false : true; modal.classList.remove("hidden");
}
function closeStaffEditor() { $("#staff-modal")?.classList.add("hidden") }
async function loadStaff() { if (!isAdmin || adminRole !== "Administrator") return; try { const out = await api({ action: "staffList" }); window.staffAccounts = out.staff || []; renderStaff() } catch (e) { showToast("Staff list unavailable", e.message, "error") } }
function renderStaff() { const el = $("#staff-table"); if (!el) return; const rows = window.staffAccounts || []; el.innerHTML = `<div class="staff-row head"><span>Name</span><span>Username</span><span>Role</span><span>Status</span><span></span></div>` + (rows.length ? rows.map(r => `<div class="staff-row"><strong>${esc(r.name)}</strong><span>${esc(r.username)}</span><span>${esc(r.role)}</span><span><b class="staff-status ${r.active ? '' : 'off'}">${r.active ? 'Active' : 'Inactive'}</b></span><span class="staff-actions"><button class="ghost" type="button" data-staff-edit="${esc(r.username)}">Edit</button><button class="ghost" type="button" data-staff-delete="${esc(r.username)}">Delete</button></span></div>`).join("") : "<div class=\"empty\">No staff accounts yet.</div>") }
async function saveStaffAccount() {
  const username = $("#staff-edit-username").value || $("#staff-edit-username-visible").value.trim().toLowerCase(), name = $("#staff-edit-name").value.trim(), role = $("#staff-edit-role").value, password = $("#staff-edit-password").value, active = $("#staff-edit-active").checked;
  const b = $("#staff-save"); if (!name || !username) { showToast("Missing information", "Name and username are required.", "error"); return } if (!editingStaffUsername && !password) { showToast("Password required", "New staff accounts need a password.", "error"); return }
  b.disabled = true; b.textContent = "Saving…"; try { const out = await api({ action: "staffSave", staff: { username, name, role, password, active } }); window.staffAccounts = out.staff || []; closeStaffEditor(); renderStaff(); showToast("Staff account saved", `${name} can now sign in with their own account.`) } catch (e) { showToast("Could not save staff", e.message, "error") } finally { b.disabled = false; b.textContent = "Save staff account" }
}
async function deleteStaffAccount(username) { if (adminRole !== "Administrator") return; if (!confirm(`Delete staff account “${username}”?`)) return; try { const out = await api({ action: "staffDelete", username }); window.staffAccounts = out.staff || []; renderStaff(); showToast("Staff account deleted", "The account has been removed.") } catch (e) { showToast("Could not delete account", e.message, "error") } }
async function imageSetting(inputId, key, previewId) { const file = $(inputId).files?.[0]; if (!file) return; try { settings[key] = await readImage(file, 1000, 800, .82); $(previewId).src = settings[key] } catch (e) { showToast("Image error", e.message, "error"); $(inputId).value = "" } }
$("#logo-file").addEventListener("change", () => imageSetting("#logo-file", "logo", "#current-logo-preview")); $("#favicon-file").addEventListener("change", () => imageSetting("#favicon-file", "favicon", "#current-favicon-preview"));
$("#remove-logo").onclick = () => { settings.logo = DEFAULT_SETTINGS.logo; $("#logo-file").value = ""; $("#current-logo-preview").src = settings.logo; applyBranding() }; $("#remove-favicon").onclick = () => { settings.favicon = DEFAULT_SETTINGS.favicon; $("#favicon-file").value = ""; $("#current-favicon-preview").src = settings.favicon; applyBranding() };
$("#save-settings").onclick = async () => {
  settings.company = $("#company-name").value || DEFAULT_SETTINGS.company;
  settings.course = $("#course-name").value || DEFAULT_SETTINGS.course;
  settings.initials = $("#logo-initials").value || DEFAULT_SETTINGS.initials;
  settings.dashboardEyebrow = $("#dashboard-eyebrow-setting").value || DEFAULT_SETTINGS.dashboardEyebrow;
  settings.dashboardHeadline = $("#dashboard-headline-setting").value || DEFAULT_SETTINGS.dashboardHeadline;
  settings.dashboardDescription = $("#dashboard-description-setting").value || DEFAULT_SETTINGS.dashboardDescription;
  settings.receiptTitle = $("#receipt-title-setting").value || DEFAULT_SETTINGS.receiptTitle;
  settings.footerCopyright = $("#footer-copyright-setting").value || DEFAULT_SETTINGS.footerCopyright;
  settings.footerCredit = $("#footer-credit-setting").value || DEFAULT_SETTINGS.footerCredit; settings.companyTagline = $("#company-tagline-setting").value || DEFAULT_SETTINGS.companyTagline; settings.companyAddress = $("#company-address-setting").value || ""; settings.companyPhone = $("#company-phone-setting").value || ""; settings.companyEmail = $("#company-email-setting").value || ""; settings.companyHours = $("#company-hours-setting").value || ""; settings.companyAbout = $("#company-about-setting").value || DEFAULT_SETTINGS.companyAbout;
  settingsDirty = true;
  localStorage.setItem(PENDING_SETTINGS_KEY, JSON.stringify(settings));
  localSave();
  const button = $("#save-settings");
  const old = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="loader-inline"></span> Saving…';
  try {
    const out = await api({ action: "settings", settings });
    if (out.ok === false) throw new Error(out.error || "Settings save failed");
    settings = { ...DEFAULT_SETTINGS, ...(out.settings || settings) };
    settingsDirty = false;
    localStorage.removeItem(PENDING_SETTINGS_KEY);
    lastServerSignature = "";
    applyBranding();
    render();
    showToast("Settings saved", "Your public company information and branding are stored in Google Sheets.");
  } catch (e) {
    // Keep the edited values visible and queue them for an automatic retry.
    settingsDirty = true;
    localStorage.setItem(PENDING_SETTINGS_KEY, JSON.stringify(settings));
    localSave();
    applyBranding();
    showToast("Save pending", "The changes are kept and will be retried automatically. If this persists, redeploy the latest Code.gs as a new Apps Script version.", "error");
  } finally {
    button.disabled = false;
    button.innerHTML = old;
  }
};
async function downloadCsv() {
  if (!endpoint()) { showToast("Backend not connected", "Add the Apps Script /exec URL in app.js first.", "error"); return }
  const b = $("#export-btn");
  if (!b) return;
  const old = b.innerHTML;
  b.disabled = true;
  b.innerHTML = '<span class="loader-inline"></span> Exporting…';
  try {
    const r = await fetch(endpoint() + "?action=csv&token=" + encodeURIComponent(authToken), { cache: "no-store" });
    if (!r.ok) throw new Error("CSV export request failed");
    const csv = await r.text();
    if (!csv.trim()) throw new Error("No registration data is available to export.");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frieden-institut-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("CSV exported", "The registration records were downloaded as a CSV file.");
  } catch (e) {
    showToast("Export failed", e.message || "Could not create the CSV file.", "error");
  } finally {
    b.disabled = false;
    b.innerHTML = old;
  }
}
$("#export-btn").onclick = downloadCsv;
$("#download-excel").onclick = async () => { if (!endpoint()) { showToast("Backend not connected", "Add the Apps Script /exec URL in app.js first.", "error"); return } const b = $("#download-excel"); const old = b.innerHTML; b.disabled = true; b.innerHTML = '<span class="loader-inline"></span> Preparing Excel…'; try { const r = await fetch(endpoint() + "?action=xlsx&token=" + encodeURIComponent(authToken), { cache: "no-store" }); if (!r.ok) throw new Error("Excel export request failed"); const out = await r.json(); if (!out.ok) throw new Error(out.error || "Excel export failed"); const bytes = Uint8Array.from(atob(out.base64), c => c.charCodeAt(0)); const blob = new Blob([bytes], { type: out.mime || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = out.filename || "frieden-institut-registrations.xlsx"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); showToast("Excel exported", "The registration records were downloaded as an .xlsx file.") } catch (e) { showToast("Export failed", e.message || "Could not create the Excel file.", "error") } finally { b.disabled = false; b.innerHTML = old } };
$("#refresh-data").onclick = async () => { const b = $("#refresh-data"); b.style.transform = "rotate(360deg)"; await loadData({ silent: false }); render(); setTimeout(() => b.style.transform = "", 350); showToast("Dashboard refreshed", "Latest registrations have been loaded.") };
function updateClock() { const now = new Date(); $("#live-time").textContent = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now); $("#live-date").textContent = new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "2-digit", year: "numeric" }).format(now) }

document.addEventListener("click", e => {
  const nav = e.target.closest("[data-page]");
  if (nav) { e.preventDefault(); showPage(nav.dataset.page); return }
  const edit = e.target.closest("[data-staff-edit]"); if (edit) openStaffEditor(edit.dataset.staffEdit);
  const del = e.target.closest("[data-staff-delete]"); if (del) deleteStaffAccount(del.dataset.staffDelete);
});
$("#add-staff")?.addEventListener("click", () => openStaffEditor());
$("#staff-close")?.addEventListener("click", closeStaffEditor);
$("#staff-save")?.addEventListener("click", saveStaffAccount);
$("#staff-modal")?.addEventListener("click", e => { if (e.target.id === "staff-modal") closeStaffEditor() });
(async () => {
  const langSel = $("#language-select");
  if (langSel) { langSel.disabled = false; langSel.value = currentLanguage; langSel.setAttribute("aria-label", currentLanguage === "fr" ? "Langue" : currentLanguage === "de" ? "Language" : "Language"); }
  const phoneInput = $("#phone-local");
  if (phoneInput) phoneInput.placeholder = currentLanguage === "fr" ? "Numéro sans indicatif (ex. 90 12 34 56)" : currentLanguage === "de" ? "Nummer ohne Ländercode (z. B. 90 12 34 56)" : "Number without country code (e.g. 90 12 34 56)";
  populateStartDates(); translateStatic(); applyBranding();
  const valid = await verifySession();
  if (valid) { isAdmin = true; setAdminState(true); setConnection(true, "Cloud connected"); }
  else { isAdmin = false; setAdminState(false); setConnection(!!endpoint(), endpoint() ? "Registration available" : "Backend not connected"); }
  render();
  translateStatic();
  if (isAdmin && adminRole === "Administrator") loadStaff();
  updateClock(); setInterval(updateClock, 1000);
  if (isAdmin && endpoint()) {
    refreshTimer = setInterval(async () => { if (document.hidden) return; const changed = await loadData({ silent: true }); if (changed) render() }, 5000);
    window.addEventListener("focus", async () => { const changed = await loadData({ silent: true }); if (changed) render() });
    document.addEventListener("visibilitychange", async () => { if (!document.hidden) { const changed = await loadData({ silent: true }); if (changed) render() } });
  }
  $("#login-submit")?.addEventListener("click", doLogin);
  $("#login-close")?.addEventListener("click", () => { if (isAdmin) closeLogin() });
  $("#admin-login")?.addEventListener("click", openLogin);
  $("#admin-logout")?.addEventListener("click", logout);
  $("#login-password")?.addEventListener("keydown", e => { if (e.key === "Enter") doLogin() });
  $("#login-username")?.addEventListener("keydown", e => { if (e.key === "Enter") $("#login-password")?.focus() });
})();
