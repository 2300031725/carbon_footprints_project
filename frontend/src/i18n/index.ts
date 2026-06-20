import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';


const resources = {
  en: {
    translation: {
      "app_name": "EcoTrack",
      "slogan": "Track, reduce, and offset your carbon footprint.",
      "landing_title": "Take Action for a Sustainable Future",
      "landing_subtitle": "Calculate your daily carbon footprint, receive smart reduction goals, join eco challenges, and connect with a green community.",
      "get_started": "Get Started",
      "login": "Login",
      "register": "Register",
      "logout": "Logout",
      "dashboard": "Dashboard",
      "calculator": "Carbon Calculator",
      "goals": "Sustainability Goals",
      "challenges": "Eco Challenges",
      "community": "Community Board",
      "leaderboard": "Leaderboard",
      "profile": "Profile Settings",
      "admin_dashboard": "Admin Panel",
      "points": "Eco Points",
      "badges": "Achievements & Badges",
      "sustainability_score": "Sustainability Score",
      "total_monthly": "Total Monthly Footprint",
      "total_annual": "Total Annual Footprint",
      "kg_co2": "kg CO2",
      "transportation": "Transportation",
      "energy": "Energy Consumption",
      "food": "Food Habits",
      "lifestyle": "Shopping & Lifestyle",
      "save_changes": "Save Changes",
      "calculate_btn": "Calculate Footprint",
      "active_goals": "Active Goals",
      "completed_goals": "Completed Goals"
    }
  },
  es: {
    translation: {
      "app_name": "EcoTrack",
      "slogan": "Rastrea, reduce y compensa tu huella de carbono.",
      "landing_title": "Actúa por un Futuro Sostenible",
      "landing_subtitle": "Calcula tu huella de carbono diaria, recibe metas inteligentes de reducción, únete a retos ecológicos y conéctate con una comunidad verde.",
      "get_started": "Comenzar",
      "login": "Iniciar Sesión",
      "register": "Registrarse",
      "logout": "Cerrar Sesión",
      "dashboard": "Tablero",
      "calculator": "Calculadora de Carbono",
      "goals": "Metas Sostenibles",
      "challenges": "Retos Ecológicos",
      "community": "Comunidad",
      "leaderboard": "Clasificación",
      "profile": "Mi Perfil",
      "admin_dashboard": "Panel de Admin",
      "points": "Puntos Eco",
      "badges": "Logros y Medallas",
      "sustainability_score": "Puntaje de Sostenibilidad",
      "total_monthly": "Huella Mensual Total",
      "total_annual": "Huella Anual Total",
      "kg_co2": "kg CO2",
      "transportation": "Transporte",
      "energy": "Consumo Energético",
      "food": "Hábitos Alimenticios",
      "lifestyle": "Estilo de Vida",
      "save_changes": "Guardar Cambios",
      "calculate_btn": "Calcular Huella",
      "active_goals": "Metas Activas",
      "completed_goals": "Metas Completadas"
    }
  },
  fr: {
    translation: {
      "app_name": "EcoTrack",
      "slogan": "Suivez, réduisez et compensez votre empreinte carbone.",
      "landing_title": "Agissez pour un Avenir Durable",
      "landing_subtitle": "Calculez votre empreinte carbone quotidienne, obtenez des objectifs intelligents de réduction, rejoignez des défis écologiques et connectez-vous avec une communauté verte.",
      "get_started": "Commencer",
      "login": "Connexion",
      "register": "S'inscrire",
      "logout": "Déconnexion",
      "dashboard": "Tableau de Bord",
      "calculator": "Calculateur de Carbone",
      "goals": "Objectifs Durables",
      "challenges": "Défis Écologiques",
      "community": "Conseil Communautaire",
      "leaderboard": "Classement",
      "profile": "Mon Profil",
      "admin_dashboard": "Panel Admin",
      "points": "Points Éco",
      "badges": "Succès & Badges",
      "sustainability_score": "Score de Durabilité",
      "total_monthly": "Empreinte Mensuelle Totale",
      "total_annual": "Empreinte Annuelle Totale",
      "kg_co2": "kg CO2",
      "transportation": "Transports",
      "energy": "Consommation Énergie",
      "food": "Habitudes Alimentaires",
      "lifestyle": "Mode de Vie & Achats",
      "save_changes": "Enregistrer",
      "calculate_btn": "Calculer l'Empreinte",
      "active_goals": "Objectifs Actifs",
      "completed_goals": "Objectifs Complétés"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
