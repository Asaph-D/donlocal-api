import java.util.Arrays;
import java.util.List;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Classe d'initialisation de la base de données avec des données par défaut
 * Crée des utilisateurs, catégories, ressources et messages de démonstration
 */

public class DBInitializer {

    /**
     * Initialise la base de données avec des données par défaut
     */
    public static void initializeDatabase() {
        createDefaultCategories();
        createDefaultUsers();
        createDefaultResources();
        createDefaultMessages();
    }

    /**
     * Crée les catégories par défaut
     */
    private static void createDefaultCategories() {
        List<Category> defaultCategories = Arrays.asList(
            new Category(
                "CAT001",
                "Dons",
                "🎁",
                "#FF6B6B",
                "Partager des objets dont vous n'avez plus besoin"
            ),
            new Category(
                "CAT002",
                "Services",
                "🔧",
                "#4ECDC4",
                "Offrir ou chercher des services (réparation, nettoyage, etc.)"
            ),
            new Category(
                "CAT003",
                "Échanges",
                "🔄",
                "#45B7D1",
                "Échanger des biens ou services avec d'autres"
            ),
            new Category(
                "CAT004",
                "Aide",
                "🤝",
                "#96CEB4",
                "Demander ou offrir de l'aide (mouvements, conseils, etc.)"
            ),
            new Category(
                "CAT005",
                "Vêtements",
                "👕",
                "#FFEAA7",
                "Partager des vêtements et accessoires"
            ),
            new Category(
                "CAT006",
                "Électronique",
                "💻",
                "#DFE6E9",
                "Dons et échanges d'appareils électroniques"
            ),
            new Category(
                "CAT007",
                "Livres",
                "📚",
                "#A29BFE",
                "Partager des livres et ressources éducatives"
            ),
            new Category(
                "CAT008",
                "Mobilier",
                "🛋️",
                "#FAB1A0",
                "Dons et échanges de meubles"
            )
        );

        for (Category category : defaultCategories) {
            // Sauvegarder la catégorie en base de données
            saveCategory(category);
        }
    }

    /**
     * Crée les utilisateurs par défaut
     */
    private static void createDefaultUsers() {
        List<User> defaultUsers = Arrays.asList(
            new User(
                "Jean Dupont",
                "jean.dupont@example.com",
                "password123", // À hasher en production
                "+237612345678",
                "+237612345678",
                "Yaoundé",
                "https://i.pravatar.cc/150?img=1",
                "Passionné par le partage et l'entraide communautaire",
                true,
                LocalDateTime.now()
            ),
            new User(
                "Marie Nguegoue",
                "marie.nguegoue@example.com",
                "password123",
                "+237698765432",
                "+237698765432",
                "Douala",
                "https://i.pravatar.cc/150?img=2",
                "J'aime aider les gens de mon quartier",
                true,
                LocalDateTime.now()
            ),
            new User(
                "Pierre Martin",
                "pierre.martin@example.com",
                "password123",
                "+237681234567",
                "+237681234567",
                "Bamenda",
                "https://i.pravatar.cc/150?img=3",
                "Artisan et passionné de bricolage",
                true,
                LocalDateTime.now()
            ),
            new User(
                "Aminata Diallo",
                "aminata.diallo@example.com",
                "password123",
                "+237675432109",
                "+237675432109",
                "Garoua",
                "https://i.pravatar.cc/150?img=4",
                "Étudiante cherchant à créer une communauté d'entraide",
                true,
                LocalDateTime.now()
            ),
            new User(
                "Claude Feu",
                "claude.feu@example.com",
                "password123",
                "+237690123456",
                "+237690123456",
                "Buea",
                "https://i.pravatar.cc/150?img=5",
                "Entrepreneur social",
                true,
                LocalDateTime.now()
            )
        );

        for (User user : defaultUsers) {
            // Sauvegarder l'utilisateur en base de données
            saveUser(user);
        }
    }

    /**
     * Crée les ressources par défaut
     */
    private static void createDefaultResources() {
        List<Resource> defaultResources = Arrays.asList(
            new Resource(
                "Vélo enfant en bon état",
                "Vélo de 24 pouces, parfait pour un enfant de 8-12 ans. Très peu utilisé, en excellent état. " +
                "Couleur rouge vif avec casque inclus.",
                "don",
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
                null,
                "Yaoundé - Quartier Bastos",
                "disponible",
                0,
                "USER001", // Jean Dupont
                "CAT001"   // Dons
            ),
            new Resource(
                "Service de réparation électrique",
                "Je propose mes services pour tous les travaux électriques : installation, réparation, entretien. " +
                "15 ans d'expérience. Devis gratuit.",
                "service",
                "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400",
                null,
                "Douala - Bonanjo",
                "disponible",
                0,
                "USER003", // Pierre Martin
                "CAT002"   // Services
            ),
            new Resource(
                "Échange : Table basse contre chaises",
                "Je propose ma belle table basse en bois (bon état) en échange de 4 chaises confortables. " +
                "Idéale pour une salle à manger.",
                "echange",
                "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
                null,
                "Bamenda - Nkwen",
                "disponible",
                0,
                "USER002", // Marie Nguegoue
                "CAT003"   // Échanges
            ),
            new Resource(
                "Besoin d'aide pour déménagement",
                "Je cherche 2-3 personnes pour m'aider à déménager le 25 décembre. " +
                "Mon logement est au 3e étage. En échange, je fournirai à manger et à boire.",
                "aide",
                "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400",
                null,
                "Garoua - Centre-ville",
                "disponible",
                0,
                "USER004", // Aminata Diallo
                "CAT004"   // Aide
            ),
            new Resource(
                "Lots de vêtements de marque",
                "Lot de vêtements de marque (T-shirts, chemises, pantalons) taille M et L. " +
                "Vêtements peu portés, très bon état.",
                "don",
                "https://images.unsplash.com/photo-1489987046614-19164713d5a6?w=400",
                null,
                "Buea - Down Beach",
                "disponible",
                0,
                "USER005", // Claude Feu
                "CAT005"   // Vêtements
            ),
            new Resource(
                "Ancien laptop donné",
                "Laptop HP EliteBook, 8GB RAM, 256GB SSD. Complètement fonctionnel, " +
                "parfait pour étudiant ou utilisation basique.",
                "don",
                "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400",
                null,
                "Yaoundé - Mvan",
                "disponible",
                0,
                "USER001", // Jean Dupont
                "CAT006"   // Électronique
            ),
            new Resource(
                "Livres de développement personnel",
                "Collection de 10 livres sur le développement personnel et l'entrepreneuriat. " +
                "En français, en bon état.",
                "don",
                "https://images.unsplash.com/photo-1507842217343-583f20270319?w=400",
                null,
                "Douala - Akwa",
                "disponible",
                0,
                "USER002", // Marie Nguegoue
                "CAT007"   // Livres
            ),
            new Resource(
                "Canapé 3 places à récupérer",
                "Magnifique canapé 3 places, gris clair, très confortable. " +
                "À récupérer avant le 31 décembre. Localisation avec accès facile.",
                "don",
                "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
                null,
                "Bamenda - Mile 2",
                "disponible",
                0,
                "USER003", // Pierre Martin
                "CAT008"   // Mobilier
            )
        );

        for (Resource resource : defaultResources) {
            // Sauvegarder la ressource en base de données
            saveResource(resource);
        }
    }

    /**
     * Crée les messages par défaut
     */
    private static void createDefaultMessages() {
        List<Message> defaultMessages = Arrays.asList(
            new Message(
                "USER001", // Jean Dupont
                "USER002", // Marie Nguegoue
                "Bonjour, je suis intéressé par votre offre de service. Pouvez-vous me contacter?",
                false,
                LocalDateTime.now()
            ),
            new Message(
                "USER002", // Marie Nguegoue
                "USER001", // Jean Dupont
                "Bien sûr ! Je peux passer demain après-midi. C'est possible pour vous?",
                false,
                LocalDateTime.now()
            ),
            new Message(
                "USER003", // Pierre Martin
                "USER004", // Aminata Diallo
                "Bonsoir, je peux vous aider pour votre déménagement. Combien de temps cela prendra-t-il?",
                false,
                LocalDateTime.now()
            ),
            new Message(
                "USER004", // Aminata Diallo
                "USER005", // Claude Feu
                "Merci pour votre générosité! Quand puis-je venir récupérer les vêtements?",
                false,
                LocalDateTime.now()
            ),
            new Message(
                "USER005", // Claude Feu
                "USER001", // Jean Dupont
                "J'ai vu que vous aviez un laptop à donner. Je suis très intéressé.",
                false,
                LocalDateTime.now()
            )
        );

        for (Message message : defaultMessages) {
            // Sauvegarder le message en base de données
            saveMessage(message);
        }
    }

    // Méthodes helper pour la sauvegarde (à adapter selon votre persistence)
    private static void saveCategory(Category category) {
        // Implémentation de la sauvegarde en BD
        System.out.println("Category créée: " + category.getName());
    }

    private static void saveUser(User user) {
        // Implémentation de la sauvegarde en BD
        System.out.println("User créé: " + user.getName());
    }

    private static void saveResource(Resource resource) {
        // Implémentation de la sauvegarde en BD
        System.out.println("Resource créée: " + resource.getTitle());
    }

    private static void saveMessage(Message message) {
        // Implémentation de la sauvegarde en BD
        System.out.println("Message créé entre " + message.getSender() + " et " + message.getReceiver());
    }

    public static void main(String[] args) {
        System.out.println("Initialisation de la base de données...");
        initializeDatabase();
        System.out.println("Initialisation terminée!");
    }
}

/**
 * Classe représentant une Catégorie
 */
class Category {
    private String id;
    private String name;
    private String icon;
    private String color;
    private String description;

    public Category(String id, String name, String icon, String color, String description) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.color = color;
        this.description = description;
    }

    // Getters et Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

/**
 * Classe représentant un Utilisateur
 */
class User {
    private String name;
    private String email;
    private String password;
    private String phone;
    private String whatsapp;
    private String location;
    private String avatar;
    private String bio;
    private Boolean emailVerified;
    private LocalDateTime createdAt;

    public User(String name, String email, String password, String phone, String whatsapp, 
                String location, String avatar, String bio, Boolean emailVerified, LocalDateTime createdAt) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.whatsapp = whatsapp;
        this.location = location;
        this.avatar = avatar;
        this.bio = bio;
        this.emailVerified = emailVerified;
        this.createdAt = createdAt;
    }

    // Getters et Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

/**
 * Classe représentant une Ressource
 */
class Resource {
    private String title;
    private String description;
    private String category;
    private String imageUrl;
    private String imagePublicId;
    private String location;
    private String status;
    private Integer views;
    private String userId;
    private String categoryId;

    public Resource(String title, String description, String category, String imageUrl, 
                   String imagePublicId, String location, String status, Integer views, 
                   String userId, String categoryId) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.imageUrl = imageUrl;
        this.imagePublicId = imagePublicId;
        this.location = location;
        this.status = status;
        this.views = views;
        this.userId = userId;
        this.categoryId = categoryId;
    }

    // Getters et Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getImagePublicId() { return imagePublicId; }
    public void setImagePublicId(String imagePublicId) { this.imagePublicId = imagePublicId; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getViews() { return views; }
    public void setViews(Integer views) { this.views = views; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
}

/**
 * Classe représentant un Message
 */
class Message {
    private String sender;
    private String receiver;
    private String content;
    private Boolean read;
    private LocalDateTime createdAt;

    public Message(String sender, String receiver, String content, Boolean read, LocalDateTime createdAt) {
        this.sender = sender;
        this.receiver = receiver;
        this.content = content;
        this.read = read;
        this.createdAt = createdAt;
    }

    // Getters et Setters
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getReceiver() { return receiver; }
    public void setReceiver(String receiver) { this.receiver = receiver; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Boolean getRead() { return read; }
    public void setRead(Boolean read) { this.read = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
