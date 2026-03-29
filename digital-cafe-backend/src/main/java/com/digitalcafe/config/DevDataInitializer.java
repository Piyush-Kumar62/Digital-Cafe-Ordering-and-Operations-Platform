package com.digitalcafe.config;

import com.digitalcafe.entity.*;
import com.digitalcafe.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Dev-only data seeder.
 *
 * Activate by running with:  --spring.profiles.active=dev
 * (Requires app.dev.seed.enabled=true — set automatically via application-dev.properties)
 *
 * What gets created (idempotent — guarded by cafeRepository.count() > 0):
 *   5  CAFE_OWNERs   — owner1–5@cafe.com / Owner1–5@123  (owner1 has 6 cafes, others 1–2 each)
 *   11 Cafes         — each with unique logo, gallery, open/close times, address
 *   10 Tables per cafe  (total: 110, seeded with saveAll)
 *   19 Menu items per cafe  (total: 209, all different images & names per cafe)
 *   2  Chefs + 2 Waiters per cafe  (total: 44 staff, seeded with saveAll)
 *   10 Customers  — customer1@demo.com … customer10@demo.com / Customer@123
 *   110 Bookings  (10 per cafe, spread over past 7 days)
 *   110 Orders    (1 per booking, STATUS_CYCLE: 7×SERVED + READY + PREPARING + PLACED)
 *   77  Payments  (COMPLETED, only for the 7 SERVED orders per cafe)
 */
@Slf4j
@Component
@org.springframework.core.annotation.Order(2)
@Profile({"dev", "e2e"})
@ConditionalOnProperty(name = "app.dev.seed.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DevDataInitializer implements CommandLineRunner {

    // ── Repositories ──────────────────────────────────────────────────────────
    private final UserRepository        userRepository;
    private final RoleRepository        roleRepository;
    private final CafeRepository        cafeRepository;
    private final CafeTableRepository   cafeTableRepository;
    private final MenuItemRepository    menuItemRepository;
    private final CafeGalleryRepository cafeGalleryRepository;
    private final BookingRepository     bookingRepository;
    private final OrderRepository       orderRepository;
    private final PaymentRepository     paymentRepository;
    private final PasswordEncoder       passwordEncoder;

    @Value("${app.dev.seed.log-credentials:false}")
    private boolean logCredentials;

    @Value("${app.dev.seed.verbose:false}")
    private boolean verboseLogging;

    // ── Image asset paths (Angular-relative, served at localhost:4200/assets/…) ─
    private static final String ASSETS_MENU    = "assets/downloads/menu-items/";
    private static final String ASSETS_CAFE    = "assets/downloads/cafes/";
    private static final String ASSETS_GALLERY = "assets/cafe/";

    // ── Passwords ─────────────────────────────────────────────────────────────
    private static final String OWNER_PW    = "Owner@123";   // primary demo owner (owner@cafe.com)
    private static final String OWNER2_PW   = "Owner2@123";
    private static final String OWNER3_PW   = "Owner3@123";
    private static final String OWNER4_PW   = "Owner4@123";
    private static final String OWNER5_PW   = "Owner5@123";
    private static final String CHEF_PW     = "Chef@123";
    private static final String WAITER_PW   = "Waiter@123";
    private static final String CUSTOMER_PW = "Customer@123";

    // ── Order status rotation (7 SERVED + 1 READY + 1 PREPARING + 1 PLACED per cafe)
    private static final Order.OrderStatus[] STATUS_CYCLE = {
        Order.OrderStatus.SERVED,
        Order.OrderStatus.SERVED,
        Order.OrderStatus.SERVED,
        Order.OrderStatus.SERVED,
        Order.OrderStatus.SERVED,
        Order.OrderStatus.SERVED,
        Order.OrderStatus.SERVED,
        Order.OrderStatus.READY,
        Order.OrderStatus.PREPARING,
        Order.OrderStatus.PLACED
    };

    // ── Days-ago per slot (0 = today for live statuses, 1–7 = past for analytics)
    private static final int[] DAYS_AGO      = {7, 6, 5, 4, 3, 2, 1, 0, 0, 0};
    private static final int[] BOOKING_HOURS = {8, 10, 11, 12, 13, 14, 16, 18, 19, 20};
    private static final int[] BOOKING_MINS  = {0, 30,  0,  0, 30,  0,  0,  0, 30,  0};

    // ── All available gallery images (14 distinct images) ─────────────────────
    private static final String[] ALL_GALLERY = {
        ASSETS_GALLERY + "cafe-interior-01.jpg",
        ASSETS_GALLERY + "cafe-interior-02.jpg",
        ASSETS_GALLERY + "cafe-interior-pexels-01.jpg",
        ASSETS_GALLERY + "cafe-table-seating.jpg",
        ASSETS_GALLERY + "cafe-bistro-blur-bg.jpg",
        ASSETS_GALLERY + "cafe-scene-jon-tyson.jpg",
        ASSETS_GALLERY + "cafe-scene-syauqy.jpg",
        ASSETS_GALLERY + "cafe-ambience-cozy.jpg",
        ASSETS_GALLERY + "bakery-cafe-counter.jpg",
        ASSETS_GALLERY + "city-cafe-steaming-cup.jpg",
        ASSETS_GALLERY + "coffee-scene-kayleigh.jpg",
        ASSETS_GALLERY + "coffee-shop-scene-01.jpg",
        ASSETS_GALLERY + "coffee-shop-scene-02.jpg",
        ASSETS_GALLERY + "cafe-counter-illustration.png"
    };

    // ── Menu image pool (rotated by cafe+item index for visual variety) ──────
    private static final String[] MENU_IMAGE_POOL = {
        "appetizer.jpg", "beverage.jpg", "burger.jpg", "cake.jpg",
        "coffee.jpg", "dessert.jpg", "fries.jpg", "ice-cream.jpg",
        "juice.jpg", "other.jpg", "pasta.jpg", "pizza.jpg",
        "salad.jpg", "sandwich.jpg", "smoothie.jpg", "snacks.jpg",
        "tea.jpg"
    };

    private static final Set<String> VALID_MENU_IMAGE_FILES = Set.of(
        "appetizer.jpg", "beverage.jpg", "burger.jpg", "cake.jpg",
        "coffee.jpg", "dessert.jpg", "fries.jpg", "ice-cream.jpg",
        "juice.jpg", "other.jpg", "pasta.jpg", "pizza.jpg",
        "salad.jpg", "sandwich.jpg", "smoothie.jpg", "snacks.jpg",
        "tea.jpg"
    );

    private static final Map<MenuItem.Category, String> CATEGORY_IMAGE_MAP = Map.ofEntries(
        Map.entry(MenuItem.Category.COFFEE, "coffee.jpg"),
        Map.entry(MenuItem.Category.TEA, "tea.jpg"),
        Map.entry(MenuItem.Category.BEVERAGE, "beverage.jpg"),
        Map.entry(MenuItem.Category.JUICE, "juice.jpg"),
        Map.entry(MenuItem.Category.SMOOTHIE, "smoothie.jpg"),
        Map.entry(MenuItem.Category.BREAKFAST, "breakfast.jpg"),
        Map.entry(MenuItem.Category.SANDWICH, "sandwich.jpg"),
        Map.entry(MenuItem.Category.BURGER, "burger.jpg"),
        Map.entry(MenuItem.Category.PASTA, "pasta.jpg"),
        Map.entry(MenuItem.Category.PIZZA, "pizza.jpg"),
        Map.entry(MenuItem.Category.SALAD, "salad.jpg"),
        Map.entry(MenuItem.Category.SNACKS, "snacks.jpg"),
        Map.entry(MenuItem.Category.DESSERT, "dessert.jpg"),
        Map.entry(MenuItem.Category.MAIN_COURSE, "other.jpg")
    );

    // ============================================================
    //  Entry point
    // ============================================================
    @Override
    @Transactional
    public void run(String... args) {
        log.info("[DevSeed] Dev seed enabled (verbose={}, logCredentials={})", verboseLogging, logCredentials);
        // ── 1. Roles — always idempotent ────────────────────────────────────────
        ensureRole(Role.RoleName.ADMIN, "System Administrator");
        Role ownerRole    = ensureRole(Role.RoleName.CAFE_OWNER, "Cafe Owner");
        Role chefRole     = ensureRole(Role.RoleName.CHEF,       "Chef");
        Role waiterRole   = ensureRole(Role.RoleName.WAITER,     "Waiter");
        Role customerRole = ensureRole(Role.RoleName.CUSTOMER,   "Customer");

        // ── 2. Primary demo owner — always ensure owner@cafe.com exists and is activated.
        //    Runs on every startup so a previously-registered but still-pending account
        //    (isActive=false / PENDING_APPROVAL) gets dev-approved automatically.
        User owner1 = findOrCreateOwner("owner@cafe.com", "Raj",     "Sharma",   "9876540001", OWNER_PW,  ownerRole);

        if (cafeRepository.count() > 0) {
            log.info("[DevSeed] Cafes already present ({}) — skipping demo seed.", cafeRepository.count());
            repairExistingMetadata(owner1);

            if (orderRepository.count() == 0) {
                log.info("[DevSeed] No orders found — seeding demo transactions for dashboards.");
                List<Cafe> cafes = cafeRepository.findAll();

                for (int i = 0; i < cafes.size(); i++) {
                    Cafe cafe = cafes.get(i);
                    int seedIndex = i % CHEF_SEEDS.size();
                    if (cafeTableRepository.findByCafeId(cafe.getId()).isEmpty()) {
                        seedTables(cafe, seedIndex);
                    }
                    if (menuItemRepository.findByCafeIdAndIsAvailableTrueAndIsDeletedFalse(cafe.getId()).isEmpty()) {
                        seedMenuItems(cafe, seedIndex);
                    }
                    if (userRepository.findByCafeIdAndRoleName(cafe.getId(), Role.RoleName.CHEF).isEmpty()) {
                        User owner = cafe.getOwner() != null ? cafe.getOwner() : owner1;
                        seedStaff(cafe, chefRole, owner, seedIndex, true);
                    }
                    if (userRepository.findByCafeIdAndRoleName(cafe.getId(), Role.RoleName.WAITER).isEmpty()) {
                        User owner = cafe.getOwner() != null ? cafe.getOwner() : owner1;
                        seedStaff(cafe, waiterRole, owner, seedIndex, false);
                    }
                }

                List<User> customers = userRepository.findByRoleName(Role.RoleName.CUSTOMER);
                if (customers.isEmpty()) {
                    customers = batchCreateCustomers(customerRole);
                }

                List<User> chefs = userRepository.findByRoleName(Role.RoleName.CHEF);
                List<User> waiters = userRepository.findByRoleName(Role.RoleName.WAITER);

                int totalOrders = seedDemoTransactions(cafes, customers, chefs, waiters);
                log.info("[DevSeed] Demo transactions seeded for existing cafes | orders={}", totalOrders);
            }

            logAllCredentials();
            log.info("[DevSeed] DevDataInitializer completed (skipped demo seed).");
            return;
        }

        if (verboseLogging) {
            log.info("[DevSeed] Seeding demo data for Digital Cafe Platform");
        }

        // 4. Remaining cafe owners — owner2–owner5
        User owner2 = findOrCreateOwner("owner2@cafe.com", "Priya",  "Nair",     "9876540002", OWNER2_PW, ownerRole);
        User owner3 = findOrCreateOwner("owner3@cafe.com", "Vikram", "Patel",    "9876540003", OWNER3_PW, ownerRole);
        User owner4 = findOrCreateOwner("owner4@cafe.com", "Ananya", "Iyer",     "9876540004", OWNER4_PW, ownerRole);
        User owner5 = findOrCreateOwner("owner5@cafe.com", "Suresh", "Menon",    "9876540005", OWNER5_PW, ownerRole);

        // 5. Create 11 cafes: owner=6, owner2=2, owner3=1, owner4=1, owner5=1
        List<Cafe> cafes = createAllCafes(owner1, owner2, owner3, owner4, owner5);

        // 6. Tables, menu items, and staff per cafe
        List<User> allChefs   = new ArrayList<>();
        List<User> allWaiters = new ArrayList<>();
        for (int i = 0; i < cafes.size(); i++) {
            Cafe cafe = cafes.get(i);
            seedTables(cafe, i);
            seedMenuItems(cafe, i);
            // Use owner of the cafe as createdBy for staff
            User cafeOwner = cafe.getOwner();
            allChefs.addAll(seedStaff(cafe, chefRole,   cafeOwner, i, true));
            allWaiters.addAll(seedStaff(cafe, waiterRole, cafeOwner, i, false));
        }

        // 7. Customers
        List<User> customers = batchCreateCustomers(customerRole);

        // 8. Bookings + orders + payments for all cafes
        int totalOrders = seedDemoTransactions(cafes, customers, allChefs, allWaiters);

        log.info("[DevSeed] Seed complete | cafes=11 tables=110 menuItems=209 staff=44 customers={} orders={}",
            customers.size(), totalOrders);
        logAllCredentials();
        log.info("[DevSeed] DevDataInitializer completed.");
    }

    // ============================================================
    //  Dev credentials summary — always printed on startup
    // ============================================================
    private void logAllCredentials() {
        if (!logCredentials) {
            return;
        }
        log.info("");
        log.info("[DevSeed] ╔══════════════════════════════════════════════════════════════════════╗");
        log.info("[DevSeed] ║                DEV SEED — LOGIN CREDENTIALS                         ║");
        log.info("[DevSeed] ╠══════════════════════════════════════════════════════════════════════╣");
        log.info("[DevSeed] ║  ROLE        EMAIL                           PASSWORD                ║");
        log.info("[DevSeed] ╠══════════════════════════════════════════════════════════════════════╣");
        log.info("[DevSeed] ║  CAFE_OWNER  owner@cafe.com   (6 cafes)      {}               ║", OWNER_PW);
        log.info("[DevSeed] ║  CAFE_OWNER  owner2@cafe.com  (2 cafes)      {}               ║", OWNER2_PW);
        log.info("[DevSeed] ║  CAFE_OWNER  owner3@cafe.com  (1 cafe)       {}               ║", OWNER3_PW);
        log.info("[DevSeed] ║  CAFE_OWNER  owner4@cafe.com  (1 cafe)       {}               ║", OWNER4_PW);
        log.info("[DevSeed] ║  CAFE_OWNER  owner5@cafe.com  (1 cafe)       {}               ║", OWNER5_PW);
        log.info("[DevSeed] ╠══════════════════════════════════════════════════════════════════════╣");
        log.info("[DevSeed] ║  CHEF        chef1.brew@demo.com             {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef2.brew@demo.com             {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef1.urban@demo.com            {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef2.urban@demo.com            {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef1.latte@demo.com            {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef2.latte@demo.com            {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef1.midnight@demo.com         {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef2.midnight@demo.com         {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef1.sunrise@demo.com          {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef2.sunrise@demo.com          {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef1.harbor@demo.com           {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef2.harbor@demo.com           {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef1.garden@demo.com           {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef2.garden@demo.com           {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef1.stone@demo.com            {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef2.stone@demo.com            {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef1.chapter@demo.com          {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef2.chapter@demo.com          {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef1.ember@demo.com            {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef2.ember@demo.com            {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef1.bloom@demo.com            {}               ║", CHEF_PW);
        log.info("[DevSeed] ║  CHEF        chef2.bloom@demo.com            {}               ║", CHEF_PW);
        log.info("[DevSeed] ╠══════════════════════════════════════════════════════════════════════╣");
        log.info("[DevSeed] ║  WAITER      waiter1.brew@demo.com           {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter2.brew@demo.com           {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter1.urban@demo.com          {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter2.urban@demo.com          {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter1.latte@demo.com          {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter2.latte@demo.com          {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter1.midnight@demo.com       {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter2.midnight@demo.com       {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter1.sunrise@demo.com        {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter2.sunrise@demo.com        {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter1.harbor@demo.com         {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter2.harbor@demo.com         {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter1.garden@demo.com         {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter2.garden@demo.com         {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter1.stone@demo.com          {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter2.stone@demo.com          {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter1.chapter@demo.com        {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter2.chapter@demo.com        {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter1.ember@demo.com          {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter2.ember@demo.com          {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter1.bloom@demo.com          {}             ║", WAITER_PW);
        log.info("[DevSeed] ║  WAITER      waiter2.bloom@demo.com          {}             ║", WAITER_PW);
        log.info("[DevSeed] ╠══════════════════════════════════════════════════════════════════════╣");
        log.info("[DevSeed] ║  CUSTOMER    customer1@demo.com              {}           ║", CUSTOMER_PW);
        log.info("[DevSeed] ║  CUSTOMER    customer2@demo.com              {}           ║", CUSTOMER_PW);
        log.info("[DevSeed] ║  CUSTOMER    customer3@demo.com              {}           ║", CUSTOMER_PW);
        log.info("[DevSeed] ║  CUSTOMER    customer4@demo.com              {}           ║", CUSTOMER_PW);
        log.info("[DevSeed] ║  CUSTOMER    customer5@demo.com              {}           ║", CUSTOMER_PW);
        log.info("[DevSeed] ║  CUSTOMER    customer6@demo.com              {}           ║", CUSTOMER_PW);
        log.info("[DevSeed] ║  CUSTOMER    customer7@demo.com              {}           ║", CUSTOMER_PW);
        log.info("[DevSeed] ║  CUSTOMER    customer8@demo.com              {}           ║", CUSTOMER_PW);
        log.info("[DevSeed] ║  CUSTOMER    customer9@demo.com              {}           ║", CUSTOMER_PW);
        log.info("[DevSeed] ║  CUSTOMER    customer10@demo.com             {}           ║", CUSTOMER_PW);
        log.info("[DevSeed] ╚══════════════════════════════════════════════════════════════════════╝");
        log.info("");
    }

    private void logVerbose(String message, Object... args) {
        if (verboseLogging) {
            log.info(message, args);
        }
    }

    // ============================================================
    //  1. Roles
    // ============================================================
    private Role ensureRole(Role.RoleName name, String description) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = Role.builder().name(name).description(description).build();
            return roleRepository.save(role);
        });
    }

    // ============================================================
    //  Central user builder — ALL flags set on every user path
    // ============================================================
    private User buildBaseUser(String firstName, String lastName,
                               String email, String username, String rawPassword) {
        User u = new User();
        u.setFirstName(firstName);
        u.setLastName(lastName);
        u.setDisplayName(firstName + " " + lastName);
        u.setEmail(email);
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setIsEmailVerified(true);
        u.setIsProfileComplete(true);
        u.setProfileCompletionPercentage(100);
        u.setIsActive(true);
        u.setAccountStatus(User.AccountStatus.ACTIVE);
        u.setRegistrationStatus(User.RegistrationStatus.APPROVED);
        u.setMustResetPassword(false);
        u.setIsTempPassword(false);
        return u;
    }

    // ============================================================
    //  Cafe Owners — findOrCreate helper
    //  Also activates users that were previously registered via the
    //  sign-up flow (isActive=false / PENDING_APPROVAL) so they can
    //  immediately use the dashboard in dev mode.
    // ============================================================
    private User findOrCreateOwner(String email, String firstName, String lastName,
                                    String phone, String pw, Role ownerRole) {
        return userRepository.findByEmail(email).map(existing -> {
            boolean dirty = false;
            if (!Boolean.TRUE.equals(existing.getIsActive())) {
                existing.setIsActive(true);
                dirty = true;
            }
            if (existing.getAccountStatus() != User.AccountStatus.ACTIVE) {
                existing.setAccountStatus(User.AccountStatus.ACTIVE);
                dirty = true;
            }
            if (existing.getRegistrationStatus() != User.RegistrationStatus.APPROVED) {
                existing.setRegistrationStatus(User.RegistrationStatus.APPROVED);
                dirty = true;
            }
            boolean hasOwnerRole = existing.getRoles().stream()
                    .anyMatch(r -> r.getName() == Role.RoleName.CAFE_OWNER);
            if (!hasOwnerRole) {
                existing.getRoles().add(ownerRole);
                dirty = true;
            }
            if (dirty) {
                existing = userRepository.save(existing);
                logVerbose("[DevSeed] Activated/updated existing owner for dev: {}", email);
            }
            return existing;
        }).orElseGet(() -> {
            User u = buildBaseUser(firstName, lastName, email, email, pw);
            u.setPhoneNumber(phone);
            u.getRoles().add(ownerRole);
            User saved = userRepository.save(u);
            logVerbose("[DevSeed] Created cafe owner: {}", email);
            return saved;
        });
    }

    // ============================================================
    //  11 Cafes: owner1=6, owner2=2, owner3=1, owner4=1, owner5=1
    //  Each cafe gets a unique logo (cafe-01 to cafe-06 cycle) and
    //  a unique set of 3 gallery images from the 14 available assets.
    // ============================================================
    private record CafeSeed(
        String name, String description, String address, String city, String state,
        String pincode, String phone, String email, String openTime, String closeTime,
        String logo, String cover, Double rating, String fssai
    ) {}

    private List<Cafe> createAllCafes(User owner1, User owner2, User owner3,
                                       User owner4, User owner5) {
        // logo rotates through cafe-01 to cafe-06 (we have 6 logos for 11 cafes)
        String[] LOGOS = {
            ASSETS_CAFE + "cafe-01.jpg",
            ASSETS_CAFE + "cafe-02.jpg",
            ASSETS_CAFE + "cafe-03.jpg",
            ASSETS_CAFE + "cafe-04.jpg",
            ASSETS_CAFE + "cafe-05.jpg",
            ASSETS_CAFE + "cafe-06.jpg"
        };

        // 11 café definitions — each with unique name, city, owner and FSSAI
        // owner1 (index 0-5 = 6 cafes), owner2 (6-7 = 2), owner3 (8), owner4 (9), owner5 (10)
        record CafeOwned(CafeSeed seed, User owner, int logoIdx) {}

        List<CafeOwned> defs = List.of(
            // ── owner1 group (6 cafes) ─────────────────────────────────────────
            new CafeOwned(new CafeSeed(
                "Brew Haven",
                "A cosy neighbourhood cafe famous for artisan espresso, fresh pastries, and a warm welcoming atmosphere perfect for work or catch-ups.",
                "12, Linking Road, Bandra West", "Mumbai", "Maharashtra", "400050",
                "9800001111", "brewhaven@demo.com", "07:00", "22:00",
                LOGOS[0], ALL_GALLERY[0], 4.7, "10012345678901"), owner1, 0),

            new CafeOwned(new CafeSeed(
                "Urban Beans",
                "Modern all-day cafe serving specialty single-origin coffee, gourmet burgers, and vibrant salads in a loft-style urban setting.",
                "45, Koregaon Park, Lane 6", "Pune", "Maharashtra", "411001",
                "9800001112", "urbanbeans@demo.com", "08:00", "23:00",
                LOGOS[1], ALL_GALLERY[1], 4.5, "10012345678902"), owner1, 1),

            new CafeOwned(new CafeSeed(
                "Latte Lounge",
                "Specialty coffee experience with pour-over brews, single-origin beans, and a curated brunch menu in a calming lounge environment.",
                "88, MG Road, Near Metro Station", "Bengaluru", "Karnataka", "560001",
                "9800001113", "lattelounge@demo.com", "07:30", "21:30",
                LOGOS[2], ALL_GALLERY[2], 4.8, "10012345678903"), owner1, 2),

            new CafeOwned(new CafeSeed(
                "Midnight Cafe",
                "A late-night haven with dark roast coffees, indulgent desserts, and comfort bites for night owls and after-dinner crowds.",
                "23, Connaught Place, Block D", "Delhi", "Delhi", "110001",
                "9800001114", "midnightcafe@demo.com", "12:00", "02:00",
                LOGOS[3], ALL_GALLERY[4], 4.4, "10012345678904"), owner1, 3),

            new CafeOwned(new CafeSeed(
                "Sunrise Coffee",
                "Your perfect morning start — wholesome breakfast plates, fresh-squeezed juices, and single-origin filter coffees from sunrise to noon.",
                "5, Park Street, Near Victoria Memorial", "Kolkata", "West Bengal", "700016",
                "9800001115", "sunrisecoffee@demo.com", "06:00", "14:00",
                LOGOS[4], ALL_GALLERY[3], 4.6, "10012345678905"), owner1, 4),

            new CafeOwned(new CafeSeed(
                "Harbor Brew",
                "Scenic waterfront cafe offering cold-brew flights, fresh seafood bites, and spectacular harbour views with specialty pour-overs.",
                "7, Marine Drive, Nariman Point", "Mumbai", "Maharashtra", "400021",
                "9800001116", "harborbrew@demo.com", "08:00", "22:00",
                LOGOS[5], ALL_GALLERY[5], 4.9, "10012345678906"), owner1, 5),

            // ── owner2 group (2 cafes) ─────────────────────────────────────────
            new CafeOwned(new CafeSeed(
                "The Garden Cafe",
                "A botanical garden-inspired cafe with open-air seating, herbal infusions, artisanal toasts, and farm-fresh seasonal specials.",
                "14, Residency Road, Near Cubbon Park", "Bengaluru", "Karnataka", "560025",
                "9800002221", "gardencafe@demo.com", "07:00", "20:00",
                LOGOS[0], ALL_GALLERY[6], 4.7, "10012345678907"), owner2, 0),

            new CafeOwned(new CafeSeed(
                "Bean & Stone",
                "A minimalist industrial-chic café with stone counter tops, specialty espresso and craft sandwiches in the heart of the old city.",
                "33, Chandni Chowk Lane 2", "Delhi", "Delhi", "110006",
                "9800002222", "beanstone@demo.com", "09:00", "21:00",
                LOGOS[1], ALL_GALLERY[7], 4.3, "10012345678908"), owner2, 1),

            // ── owner3 (1 cafe) ────────────────────────────────────────────────
            new CafeOwned(new CafeSeed(
                "The Last Chapter",
                "A bookstore-cafe hybrid where every corner has a story — single-origin coffees, quiet reading nooks, and homemade cakes.",
                "8, College Street, Near Presidency Univ", "Kolkata", "West Bengal", "700073",
                "9800003331", "lastchapter@demo.com", "09:00", "21:00",
                LOGOS[2], ALL_GALLERY[8], 4.5, "10012345678909"), owner3, 2),

            // ── owner4 (1 cafe) ────────────────────────────────────────────────
            new CafeOwned(new CafeSeed(
                "Ember & Oak",
                "A rustic wood-fired cafe with specialty drip coffees, stone-baked pizzas, and warm desserts — a haven for comfort food lovers.",
                "22, Banjara Hills, Road 12", "Hyderabad", "Telangana", "500034",
                "9800004441", "emberoak@demo.com", "08:00", "23:00",
                LOGOS[3], ALL_GALLERY[9], 4.6, "10012345678910"), owner4, 3),

            // ── owner5 (1 cafe) ────────────────────────────────────────────────
            new CafeOwned(new CafeSeed(
                "Bloom Cafe",
                "A floral-themed all-day dining cafe with rose lattes, edible-flower desserts, light meals, and a curated wine & mocktail list.",
                "18, Panjim Market Square", "Panjim", "Goa", "403001",
                "9800005551", "bloomcafe@demo.com", "08:30", "22:30",
                LOGOS[4], ALL_GALLERY[10], 4.8, "10012345678911"), owner5, 4)
        );

        // Gallery sets — 3 unique images per cafe, cycling through ALL_GALLERY[14]
        // Each cafe gets images at positions (i*3 % 14), (i*3+1 % 14), (i*3+2 % 14)
        List<Cafe> cafes = new ArrayList<>();
        for (int i = 0; i < defs.size(); i++) {
            CafeOwned co = defs.get(i);
            CafeSeed  s  = co.seed();
            User      o  = co.owner();

            Cafe cafe = new Cafe();
            cafe.setName(s.name());
            cafe.setDescription(s.description());
            cafe.setAddress(s.address());
            cafe.setCity(s.city());
            cafe.setState(s.state());
            cafe.setPincode(s.pincode());
            cafe.setPhoneNumber(s.phone());
            cafe.setEmail(s.email());
            cafe.setOpenTime(s.openTime());
            cafe.setCloseTime(s.closeTime());
            cafe.setLogoUrl(s.logo());
            cafe.setCoverUrl(s.cover());
            cafe.setImageUrl(s.cover());
            cafe.setRating(s.rating());
            cafe.setFssaiNumber(s.fssai());
            cafe.setIsActive(true);
            cafe.setOwner(o);
            Cafe savedCafe = cafeRepository.save(cafe);

            // 3 gallery images per cafe — unique, cycling through 14 available images
            List<CafeGallery> galleryBatch = new ArrayList<>();
            for (int g = 0; g < 3; g++) {
                int imgIdx = (i * 3 + g) % ALL_GALLERY.length;
                galleryBatch.add(CafeGallery.builder()
                    .cafe(savedCafe)
                    .imageUrl(ALL_GALLERY[imgIdx])
                    .caption(s.name() + " — gallery photo " + (g + 1))
                    .displayOrder(g)
                    .createdAt(LocalDateTime.now().minusDays(7 - g))
                    .build());
            }
            cafeGalleryRepository.saveAll(galleryBatch);

            cafes.add(savedCafe);
            logVerbose("[DevSeed] Created cafe: {} (owner: {})", s.name(), o.getEmail());
        }
        return cafes;
    }

    // ============================================================
    //  Tables — saveAll batch (10 per cafe, global table numbers)
    // ============================================================
    private static final int[]                 TABLE_CAPS  = {2, 2, 4, 4, 4, 6, 6, 8, 2, 4};
    private static final CafeTable.TableType[] TABLE_TYPES = {
        CafeTable.TableType.REGULAR, CafeTable.TableType.REGULAR,
        CafeTable.TableType.REGULAR, CafeTable.TableType.REGULAR,
        CafeTable.TableType.VIP,     CafeTable.TableType.REGULAR,
        CafeTable.TableType.OUTDOOR, CafeTable.TableType.VIP,
        CafeTable.TableType.PRIVATE, CafeTable.TableType.OUTDOOR
    };
    private static final String[] TABLE_LOCS = {
        "Window side", "Corner", "Centre hall", "Near entrance",
        "VIP lounge",  "Garden area", "Terrace", "Private VIP suite",
        "Private alcove", "Outdoor patio"
    };

    private void seedTables(Cafe cafe, int cafeIndex) {
        List<CafeTable> batch = new ArrayList<>();
        for (int j = 0; j < 10; j++) {
            String tableNumber = "T" + (cafeIndex * 10 + j + 1);
            if (!cafeTableRepository.existsByCafeIdAndTableNumber(cafe.getId(), tableNumber)) {
                CafeTable t = new CafeTable();
                t.setCafe(cafe);
                t.setTableNumber(tableNumber);
                t.setCapacity(TABLE_CAPS[j]);
                t.setTableType(TABLE_TYPES[j]);
                t.setIsAvailable(true);
                t.setLocationDescription(TABLE_LOCS[j]);
                batch.add(t);
            }
        }
        if (!batch.isEmpty()) {
            cafeTableRepository.saveAll(batch);
            logVerbose("[DevSeed] {} tables seeded for: {}", batch.size(), cafe.getName());
        }
    }

    // ============================================================
    //  Menu Items — 19 unique items per cafe (11 cafes × 19 = 209 total)
    //  Each cafe uses different item names AND different image files
    // ============================================================
    private record MenuSeed(
        String name, String description, double price,
        MenuItem.Category category, String imageFile,
        boolean isVeg, int prepMins
    ) {}

    private void seedMenuItems(Cafe cafe, int cafeIndex) {
        List<MenuSeed> defs = getMenuItemsForCafe(cafeIndex);
        List<MenuItem> batch = new ArrayList<>(defs.size());
        Set<String> seenNames = new HashSet<>();
        for (int itemIndex = 0; itemIndex < defs.size(); itemIndex++) {
            MenuSeed m = defs.get(itemIndex);
            String dedupeKey = m.name().trim().toLowerCase(Locale.ROOT);
            if (!seenNames.add(dedupeKey)) {
                log.warn("[DevSeed] Duplicate menu item skipped for cafe={} name={}", cafe.getName(), m.name());
                continue;
            }
            MenuItem item = new MenuItem();
            item.setCafe(cafe);
            item.setName(m.name());
            item.setDescription(m.description());
            item.setPrice(BigDecimal.valueOf(m.price()));
            item.setCategory(m.category());
            item.setImageUrl(ASSETS_MENU + resolveMenuImage(cafeIndex, itemIndex, m.category(), m.imageFile()));
            item.setIsAvailable(true);
            item.setIsDeleted(false);
            item.setIsVegetarian(m.isVeg());
            item.setPreparationTimeMinutes(m.prepMins());
            batch.add(item);
        }
        menuItemRepository.saveAll(batch);
        logVerbose("[DevSeed] {} menu items seeded for: {}", batch.size(), cafe.getName());
    }

    private String resolveMenuImage(int cafeIndex, int itemIndex, MenuItem.Category category, String fallbackImage) {
        String normalizedFallback = fallbackImage == null ? "" : fallbackImage.trim().toLowerCase(Locale.ROOT);
        if (VALID_MENU_IMAGE_FILES.contains(normalizedFallback)) {
            return normalizedFallback;
        }
        String mapped = CATEGORY_IMAGE_MAP.get(category);
        if (mapped != null) {
            return mapped;
        }
        if (MENU_IMAGE_POOL.length == 0) {
            return "other.jpg";
        }
        int idx = Math.floorMod(cafeIndex * 7 + itemIndex * 3, MENU_IMAGE_POOL.length);
        return MENU_IMAGE_POOL[idx];
    }

    private List<MenuSeed> getMenuItemsForCafe(int cafeIndex) {
        return switch (cafeIndex) {
            case 0  -> brewHavenMenu();
            case 1  -> urbanBeansMenu();
            case 2  -> latteLoungeMenu();
            case 3  -> midnightCafeMenu();
            case 4  -> sunriseCoffeeMenu();
            case 5  -> harborBrewMenu();
            case 6  -> gardenCafeMenu();
            case 7  -> beanStoneMenu();
            case 8  -> lastChapterMenu();
            case 9  -> emberOakMenu();
            case 10 -> bloomCafeMenu();
            default -> Collections.emptyList();
        };
    }

    // ── Cafe 0: Brew Haven (Mumbai) ───────────────────────────────────────────
    private List<MenuSeed> brewHavenMenu() {
        return List.of(
            new MenuSeed("Espresso Shot",       "Intense single-origin espresso in a demitasse",          99,  MenuItem.Category.COFFEE,    "coffee.jpg",      true,  3),
            new MenuSeed("Americano",           "Espresso lengthened with hot water — bold & clean",       119, MenuItem.Category.COFFEE,    "coffee.jpg",      true,  4),
            new MenuSeed("Cappuccino",          "1/3 espresso, 1/3 steamed milk, 1/3 microfoam",          149, MenuItem.Category.COFFEE,    "coffee.jpg",      true,  5),
            new MenuSeed("Café Latte",          "Smooth double-shot latte with creamy steamed milk",       159, MenuItem.Category.COFFEE,    "coffee.jpg",      true,  5),
            new MenuSeed("Cold Brew",           "18-hour cold-steeped coffee — low acid, smooth",          179, MenuItem.Category.COFFEE,    "coffee.jpg",      true,  2),
            new MenuSeed("Flat White",          "Ristretto with velvety stretched milk",                   169, MenuItem.Category.COFFEE,    "coffee.jpg",      true,  5),
            new MenuSeed("Matcha Latte",        "Ceremonial-grade matcha whisked with oat milk",           185, MenuItem.Category.TEA,       "tea.jpg",         true,  5),
            new MenuSeed("Green Tea",           "Japanese sencha loose-leaf brewed to perfection",           99,  MenuItem.Category.TEA,       "tea.jpg",         true,  3),
            new MenuSeed("Cold Coffee",         "Blended iced coffee with cream & condensed milk",          149, MenuItem.Category.BEVERAGE,  "milkshake.jpg",   true,  5),
            new MenuSeed("Blueberry Muffin",    "Oven-fresh muffin loaded with wild blueberries",           89,  MenuItem.Category.BREAKFAST, "breakfast.jpg",   true,  10),
            new MenuSeed("Butter Croissant",    "All-butter, flaky Parisian-style croissant",               79,  MenuItem.Category.BREAKFAST, "breakfast.jpg",   true,  5),
            new MenuSeed("Avocado Toast",       "Whipped feta & smashed avocado on toasted sourdough",     149, MenuItem.Category.BREAKFAST, "breakfast.jpg",   true,  8),
            new MenuSeed("Classic Cheese Sandwich","Grilled sandwich with aged cheddar & heirloom tomato", 139, MenuItem.Category.SANDWICH,  "sandwich.jpg",    true,  8),
            new MenuSeed("Chicken Wrap",        "Grilled chicken, cos lettuce, aioli in a tortilla",       179, MenuItem.Category.SANDWICH,  "sandwich.jpg",    false, 10),
            new MenuSeed("Club Sandwich",       "Triple-decker: chicken, fried egg & cucumber relish",     189, MenuItem.Category.SANDWICH,  "sandwich.jpg",    false, 12),
            new MenuSeed("Dark Brownie",        "Dense 65% dark-chocolate fudge brownie",                   99,  MenuItem.Category.DESSERT,   "brownie.jpg",     true,  5),
            new MenuSeed("Cheesecake Slice",    "NY-baked cheesecake with strawberry coulis",               159, MenuItem.Category.DESSERT,   "dessert.jpg",     true,  3),
            new MenuSeed("Choco Lava Cake",     "Warm chocolate sponge with a liquid molten core",          149, MenuItem.Category.DESSERT,   "cake.jpg",        true,  12),
            new MenuSeed("Fresh Lime Soda",     "Squeezed lime fizz — choose sweet, salted or masala",      89,  MenuItem.Category.JUICE,     "juice.jpg",       true,  3)
        );
    }

    // ── Cafe 1: Urban Beans (Pune) ────────────────────────────────────────────
    private List<MenuSeed> urbanBeansMenu() {
        return List.of(
            new MenuSeed("Double Espresso",     "Two bold espresso shots in one cup",                      129, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  3),
            new MenuSeed("Cortado",             "Equal espresso & steamed milk for a balanced kick",       169, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Turmeric Latte",      "Golden spiced latte with turmeric, ginger & black pepper",199, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Oat Milk Latte",      "Barista oat milk with a double ristretto shot",           219, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Iced Cold Brew",      "Cold brew concentrate over ice with light cream",         199, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  2),
            new MenuSeed("Belgian Hot Chocolate","Thick Belgian cocoa with vanilla-steamed milk foam",     149, MenuItem.Category.BEVERAGE, "milkshake.jpg",   true,  5),
            new MenuSeed("Chai Latte",          "Masala chai concentrate with barista-frothed milk",       129, MenuItem.Category.TEA,      "tea.jpg",         true,  5),
            new MenuSeed("Paneer Burger",       "Crispy marinated paneer, sriracha mayo, brioche bun",     259, MenuItem.Category.BURGER,   "burger.jpg",      true,  15),
            new MenuSeed("Caesar Salad",        "Romaine, parmesan, house croutons & Caesar dressing",     199, MenuItem.Category.SALAD,    "salad.jpg",       true,  8),
            new MenuSeed("Pasta Carbonara",     "Spaghetti with pancetta, egg yolk & aged parmesan",       299, MenuItem.Category.PASTA,    "pasta.jpg",       false, 18),
            new MenuSeed("Margherita Pizza",    "Neapolitan base, San Marzano tomato, buffalo mozzarella", 349, MenuItem.Category.PIZZA,    "pizza.jpg",       true,  20),
            new MenuSeed("Paneer Wrap",         "Tandoori paneer, mint-chutney & shredded lettuce roll",   219, MenuItem.Category.SANDWICH, "sandwich.jpg",    true,  12),
            new MenuSeed("Loaded Nachos",       "Tortilla chips, pico de gallo, jalapeños, sour cream",    189, MenuItem.Category.SNACKS,   "snacks.jpg",      true,  10),
            new MenuSeed("Walnut Brownie",      "70% cocoa brownie studded with toasted walnuts",           119, MenuItem.Category.DESSERT,  "brownie.jpg",     true,  5),
            new MenuSeed("Honey Waffle",        "Belgian waffle drizzled with raw honey & mixed berries",  199, MenuItem.Category.DESSERT,  "waffle.jpg",      true,  12),
            new MenuSeed("Tiramisu",            "Espresso-soaked ladyfingers with mascarpone cream",        219, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  5),
            new MenuSeed("Strawberry Smoothie", "Fresh strawberries, Greek yogurt & raw honey blend",      179, MenuItem.Category.SMOOTHIE, "smoothie.jpg",    true,  5),
            new MenuSeed("Mango Smoothie",      "Alphonso mango, coconut milk & chia seeds",               169, MenuItem.Category.SMOOTHIE, "smoothie.jpg",    true,  5),
            new MenuSeed("Fresh Lemonade",      "Cold-pressed lime, mint syrup & soda — refreshing",        99,  MenuItem.Category.JUICE,    "juice.jpg",       true,  5)
        );
    }

    // ── Cafe 2: Latte Lounge (Bengaluru) ─────────────────────────────────────
    private List<MenuSeed> latteLoungeMenu() {
        return List.of(
            new MenuSeed("Pour Over Coffee",    "Chemex-brewed single-origin Highland Arabica",             249, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  8),
            new MenuSeed("Rose Latte",          "Damascus rose syrup & espresso in oat milk foam",          229, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  6),
            new MenuSeed("Nutella Latte",       "Double espresso swirled with Nutella & hazelnut milk",     239, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  6),
            new MenuSeed("Vanilla Bean Latte",  "Madagascar vanilla bean espresso latte",                   219, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Caramel Macchiato",   "Vanilla syrup, espresso, steamed milk, caramel drizzle",  229, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Brown Sugar Latte",   "Cold espresso over ice, brown sugar, oat milk",           199, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Decaf Espresso",      "Full-bodied decaffeinated espresso — no caffeine",         149, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  3),
            new MenuSeed("Pancake Stack",       "Three buttermilk pancakes with Canadian maple syrup",      199, MenuItem.Category.BREAKFAST,"pancake.jpg",     true,  12),
            new MenuSeed("French Toast",        "Brioche French toast, mixed berries, whipped cream",       179, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  10),
            new MenuSeed("Eggs Benedict",       "Poached eggs, hollandaise sauce on toasted muffin",        249, MenuItem.Category.BREAKFAST,"breakfast.jpg",   false, 15),
            new MenuSeed("Greek Salad",         "Kalamata olives, feta, cucumber & heirloom tomatoes",      219, MenuItem.Category.SALAD,    "salad.jpg",       true,  8),
            new MenuSeed("Mushroom Quesadilla", "Portobello, roasted peppers & melted cheese tortilla",     199, MenuItem.Category.SNACKS,   "snacks.jpg",      true,  12),
            new MenuSeed("Panna Cotta",         "Vanilla bean panna cotta with raspberry coulis",           189, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("French Macarons",     "Three assorted Ladurée-inspired macarons",                 169, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Fruit Tart",          "Pâté sucrée shell, crème pâtissière, seasonal fruits",     199, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Affogato",            "Vanilla gelato drowned in a piping hot espresso shot",     179, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  5),
            new MenuSeed("Masala Chai",         "Cardamom, ginger, cinnamon & clove spiced milk tea",        99,  MenuItem.Category.TEA,      "tea.jpg",         true,  5),
            new MenuSeed("Cold Pressed Juice",  "Rotating seasonal vegetable & fruit cold-press blend",     149, MenuItem.Category.JUICE,    "juice.jpg",       true,  3),
            new MenuSeed("Boba Milk Tea",       "Tapioca pearls in creamy taro or brown-sugar milk tea",    179, MenuItem.Category.TEA,      "tea.jpg",         true,  8)
        );
    }

    // ── Cafe 3: Midnight Cafe (Delhi) ─────────────────────────────────────────
    private List<MenuSeed> midnightCafeMenu() {
        return List.of(
            new MenuSeed("Nitro Cold Brew",     "Nitrogen-charged cold brew on draught — ultra-smooth",    219, MenuItem.Category.COFFEE,      "coffee.jpg",      true,  2),
            new MenuSeed("Dark Roast Americano","Sumatra dark roast espresso topped with still water",      149, MenuItem.Category.COFFEE,      "coffee.jpg",      true,  4),
            new MenuSeed("Hazelnut Mocha",      "Espresso, Frangelico hazelnut, dark chocolate, milk",     219, MenuItem.Category.COFFEE,      "coffee.jpg",      true,  6),
            new MenuSeed("Midnight Latte",      "Activated-charcoal & black-sesame espresso latte",        229, MenuItem.Category.COFFEE,      "coffee.jpg",      true,  6),
            new MenuSeed("Turkish Coffee",      "Cardamom-forward thick Turkish ibrik brew",               169, MenuItem.Category.COFFEE,      "coffee.jpg",      true,  5),
            new MenuSeed("Vietnamese Coffee",   "Drip dark roast over sweetened condensed milk & ice",     199, MenuItem.Category.COFFEE,      "coffee.jpg",      true,  5),
            new MenuSeed("Cold Brew Float",     "Draught cold brew poured over a scoop of vanilla gelato",239, MenuItem.Category.COFFEE,      "coffee.jpg",      true,  5),
            new MenuSeed("Cheese Loaded Fries", "Thick-cut fries drenched in hot cheese sauce & jalapeños",179, MenuItem.Category.SNACKS,      "fries.jpg",       true,  12),
            new MenuSeed("Chicken Tacos",       "Pulled chipotle chicken, pickled slaw in corn tortillas", 279, MenuItem.Category.MAIN_COURSE, "sandwich.jpg",    false, 15),
            new MenuSeed("Smoky BBQ Burger",    "House-ground beef patty, BBQ sauce, crispy fried onion",  319, MenuItem.Category.BURGER,      "burger.jpg",      false, 18),
            new MenuSeed("Baked Mac & Cheese",  "Three-cheese béchamel baked macaroni with breadcrumb",    269, MenuItem.Category.MAIN_COURSE, "pasta.jpg",       true,  15),
            new MenuSeed("Guacamole Nachos",    "House-made guacamole, pico de gallo on warm tortilla chips",199,MenuItem.Category.SNACKS,    "snacks.jpg",      true,  10),
            new MenuSeed("Choco Lava Cake",     "Belgian valrhona molten cake with vanilla ice cream",     169, MenuItem.Category.DESSERT,     "cake.jpg",        true,  12),
            new MenuSeed("Red Velvet Slice",    "Red velvet sponge with tangy cream-cheese frosting",      189, MenuItem.Category.DESSERT,     "cake.jpg",        true,  3),
            new MenuSeed("Classic Sundae",      "Two scoops vanilla, chocolate sauce, whipped cream",      149, MenuItem.Category.DESSERT,     "ice-cream.jpg",   true,  5),
            new MenuSeed("Chocolate Milkshake", "Thick blended dark chocolate ice cream & whole milk",     199, MenuItem.Category.BEVERAGE,    "milkshake-lg.jpg",true,  8),
            new MenuSeed("Mango Lassi",         "Alphonso mango blended with yogurt, cardamom & saffron",  149, MenuItem.Category.BEVERAGE,    "smoothie.jpg",    true,  5),
            new MenuSeed("Blue Lemonade",       "Butterfly pea flower colour-changing lemonade & soda",   119, MenuItem.Category.JUICE,       "juice.jpg",       true,  5),
            new MenuSeed("Masala Tea",          "Ginger-cardamom-cinnamon boiled milk tea",                 99,  MenuItem.Category.TEA,         "tea.jpg",         true,  5)
        );
    }

    // ── Cafe 4: Sunrise Coffee (Kolkata) ─────────────────────────────────────
    private List<MenuSeed> sunriseCoffeeMenu() {
        return List.of(
            new MenuSeed("Sunrise Espresso",    "Bright citrus-forward house-blend single-origin shot",    129, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  3),
            new MenuSeed("Sunrise Latte",       "House espresso with lightly spiced warm-steamed milk",    169, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Iced Matcha Latte",   "Ceremonial matcha over ice with almond barista milk",     199, MenuItem.Category.TEA,      "tea.jpg",         true,  5),
            new MenuSeed("Filter Coffee",       "South Indian brass-filter drip coffee with frothed milk", 149, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Cold Brew Tonic",     "Cold brew espresso with Indian tonic water & orange peel",209, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  2),
            new MenuSeed("Buttermilk Pancakes", "Stack of 3 airy pancakes with maple syrup & butter",     229, MenuItem.Category.BREAKFAST,"pancake.jpg",     true,  12),
            new MenuSeed("Waffle Tower",        "Stacked Belgian waffles with berry compote & cream",      249, MenuItem.Category.BREAKFAST,"waffle.jpg",      true,  15),
            new MenuSeed("Full English",        "Eggs, baked beans, herbed sausage, mushroom & toast",     349, MenuItem.Category.BREAKFAST,"breakfast.jpg",   false, 20),
            new MenuSeed("Veggie Omelette",     "Herb-butter three-egg omelette with garden vegetables",   219, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  12),
            new MenuSeed("Avocado Toast Deluxe","Sourdough, smashed avocado, poached egg & sesame seeds",  199, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  10),
            new MenuSeed("Granola Bowl",        "House-toasted granola, strained yogurt & raw honey",      179, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  5),
            new MenuSeed("Cinnamon Roll",       "Warm spiral cinnamon roll with thick cream-cheese glaze", 119, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  8),
            new MenuSeed("Blueberry Pancakes",  "Buttermilk pancakes topped with fresh blueberry compote", 219, MenuItem.Category.BREAKFAST,"pancake.jpg",     true,  12),
            new MenuSeed("Egg Muffin",          "Poached egg, spinach & smoked cheese on a toasted muffin",149, MenuItem.Category.SANDWICH, "sandwich.jpg",    false, 10),
            new MenuSeed("French Toast Supreme","Brioche toast, banana, berries, nut butter & agave",      199, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  10),
            new MenuSeed("Banana Smoothie",     "Frozen banana, almond milk, honey & flaxseed blend",      149, MenuItem.Category.SMOOTHIE, "smoothie.jpg",    true,  5),
            new MenuSeed("Berry Smoothie Bowl", "Acai & berry purée base topped with house granola",       189, MenuItem.Category.SMOOTHIE, "smoothie.jpg",    true,  8),
            new MenuSeed("Fresh Orange Juice",  "Cold-pressed Valencia oranges pressed to order",          119, MenuItem.Category.JUICE,    "juice.jpg",       true,  3),
            new MenuSeed("Ginger Lemon Tea",    "Sliced fresh ginger, lemon juice, hot water & honey",      99,  MenuItem.Category.TEA,      "tea.jpg",         true,  5)
        );
    }

    // ── Cafe 5: Harbor Brew (Mumbai waterfront) ───────────────────────────────
    private List<MenuSeed> harborBrewMenu() {
        return List.of(
            new MenuSeed("Sea Breeze Espresso", "Bright washed Ethiopian Yirgacheffe espresso shot",       139, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  3),
            new MenuSeed("Ocean Cold Brew",     "24-hr cold brew from Coorg natural-process beans",        189, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  2),
            new MenuSeed("Salty Caramel Latte", "Sea-salt caramel espresso latte with oat milk foam",      229, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Iced Shaken Espresso","Two espresso shots shaken over ice with sweet cream",     199, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  4),
            new MenuSeed("Coconut Latte",       "Fresh coconut water, coconut milk & double espresso",     239, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Hibiscus Iced Tea",   "Cold-brewed hibiscus & rosehip tea, lightly sweetened",   129, MenuItem.Category.TEA,      "tea.jpg",         true,  3),
            new MenuSeed("Pineapple Juice",     "Cold-pressed fresh pineapple with a pinch of chilli",     119, MenuItem.Category.JUICE,    "juice.jpg",       true,  3),
            new MenuSeed("Fish Tacos",          "Crispy fish, mango salsa & chipotle slaw in corn tortillas",329, MenuItem.Category.MAIN_COURSE,"sandwich.jpg",false, 18),
            new MenuSeed("Prawn Linguine",      "Sautéed tiger prawns, white wine & cherry tomato pasta",  389, MenuItem.Category.PASTA,    "pasta.jpg",       false, 20),
            new MenuSeed("Harbor Burger",       "Crab-cake-style patty, tartar sauce & pickled cucumber",  349, MenuItem.Category.BURGER,   "burger.jpg",      false, 18),
            new MenuSeed("Seafood Chowder",     "Creamy clam & prawn chowder with sourdough bread bowl",   299, MenuItem.Category.SOUP,     "soup.jpg",        false, 15),
            new MenuSeed("Corn & Avocado Salad","Charred sweet corn, baby avocado & feta in balsamic",     219, MenuItem.Category.SALAD,    "salad.jpg",       true,  8),
            new MenuSeed("Calamari Rings",      "Lightly battered squid rings with lemon aioli",            249, MenuItem.Category.APPETIZER,"appetizer.jpg",   false, 12),
            new MenuSeed("Key Lime Pie",        "Tangy Florida-style key lime tart with meringue",          189, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Coconut Panna Cotta", "Coconut cream panna cotta with passion-fruit gel",         179, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Mango Sorbet",        "Dairy-free Alphonso mango sorbet, fresh mint",             149, MenuItem.Category.DESSERT,  "ice-cream.jpg",   true,  3),
            new MenuSeed("Watermelon Juice",    "Freshly pressed watermelon with sea salt & basil",         99,  MenuItem.Category.JUICE,    "juice.jpg",       true,  3),
            new MenuSeed("Ginger Beer",         "House-brewed spicy ginger beer with fresh lime juice",     119, MenuItem.Category.BEVERAGE, "milkshake.jpg",   true,  5),
            new MenuSeed("Lassi (Sweet/Salt)",  "Classic thick yogurt lassi — sweet or salty",              99,  MenuItem.Category.BEVERAGE, "smoothie.jpg",    true,  3)
        );
    }

    // ── Cafe 6: The Garden Cafe (Bengaluru) ───────────────────────────────────
    private List<MenuSeed> gardenCafeMenu() {
        return List.of(
            new MenuSeed("Herb Garden Latte",   "Lavender & vanilla espresso latte with frothy oat milk",  229, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Chamomile Cold Brew", "Cold-steeped chamomile and Ethiopian cold brew blend",    199, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  2),
            new MenuSeed("Garden Matcha",       "Shade-grown Japanese matcha with coconut barista milk",   209, MenuItem.Category.TEA,      "tea.jpg",         true,  5),
            new MenuSeed("Basil Lemonade",      "Homemade fresh lemonade muddled with sweet basil",        109, MenuItem.Category.JUICE,    "juice.jpg",       true,  5),
            new MenuSeed("Herbal Infusion",     "Rotating seasonal herb tisane — ask today's blend",        89,  MenuItem.Category.TEA,      "tea.jpg",         true,  4),
            new MenuSeed("Avocado Sourdough",   "House sourdough with smashed avocado & microgreens",      169, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  8),
            new MenuSeed("Granola Power Bowl",  "Oat granola, chia seeds, seasonal fruits & agave",        189, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  5),
            new MenuSeed("Zucchini Fritters",   "Golden zucchini & halloumi fritters with tzatziki",       199, MenuItem.Category.SNACKS,   "snacks.jpg",      true,  12),
            new MenuSeed("Garden Buddha Bowl",  "Brown rice, roasted veg, chickpeas, tahini dressing",     259, MenuItem.Category.SALAD,    "salad.jpg",       true,  12),
            new MenuSeed("Caprese Salad",       "Buffalo mozzarella, heirloom tomato, basil & EVOO",       219, MenuItem.Category.SALAD,    "salad.jpg",       true,  5),
            new MenuSeed("Pesto Pasta",         "Linguine in homemade basil-pine nut pesto & parmesan",    289, MenuItem.Category.PASTA,    "pasta.jpg",       true,  15),
            new MenuSeed("Veggie Frittata",     "Baked egg frittata with peppers, spinach & goat cheese",  229, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  20),
            new MenuSeed("Lemon Tart",          "Crisp pastry, sharp lemon curd, torched meringue",        179, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Rose Petal Cake",     "Chiffon sponge with rose-water buttercream frosting",     199, MenuItem.Category.DESSERT,  "cake.jpg",        true,  3),
            new MenuSeed("Almond Financier",    "Browned-butter financier with dark-chocolate chips",      139, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Garden Berry Smoothie","Blended acai, blueberry, raspberry & coconut water",     179, MenuItem.Category.SMOOTHIE, "smoothie.jpg",    true,  5),
            new MenuSeed("Aloe Vera Juice",     "Fresh aloe vera, cucumber & lime cooler",                  99,  MenuItem.Category.JUICE,   "juice.jpg",       true,  3),
            new MenuSeed("Masala Nimbu Pani",   "Freshly squeezed lemon, chaat masala, mint & soda",        79,  MenuItem.Category.JUICE,   "juice.jpg",       true,  3),
            new MenuSeed("Sparkling Water",     "Chilled sparkling mineral water with a slice of lemon",    59,  MenuItem.Category.BEVERAGE,"milkshake.jpg",   true,  1)
        );
    }

    // ── Cafe 7: Bean & Stone (Delhi) ──────────────────────────────────────────
    private List<MenuSeed> beanStoneMenu() {
        return List.of(
            new MenuSeed("Drip Batch Coffee",   "Freshly batch-brewed light-roast Kenyan drip",             99,  MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Stone-Cold Brew",     "Stone-filtered 20-hr cold brew concentrate",               179, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  2),
            new MenuSeed("Gibraltar",           "Rich ristretto & equal steamed milk in a rock glass",      179, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  4),
            new MenuSeed("Piccolo Latte",       "Ristretto with velvety steamed milk in a 100ml glass",     159, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  4),
            new MenuSeed("Cold Matcha Tonic",   "Matcha concentrate & Indian tonic water over ice",         189, MenuItem.Category.TEA,      "tea.jpg",         true,  4),
            new MenuSeed("Chai Concentrate",    "Reduced masala chai — double strength with milk",           119, MenuItem.Category.TEA,      "tea.jpg",         true,  5),
            new MenuSeed("Stone-Baked Sourdough","Stone-baked sourdough served warm with compound butter", 129, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  10),
            new MenuSeed("Shakshuka",           "Eggs in spiced tomato-pepper sauce with feta & pita",      229, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  15),
            new MenuSeed("Bircher Muesli",      "Overnight oat muesli soaked in apple juice & cream",       169, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  3),
            new MenuSeed("Croissant Club",      "Toasted croissant stuffed with ham, dijon & gruyere",     229, MenuItem.Category.SANDWICH, "sandwich.jpg",    false, 10),
            new MenuSeed("Smashed Avo & Feta",  "Smashed avocado, marinated feta on multigrain toast",     189, MenuItem.Category.SANDWICH, "sandwich.jpg",    true,  8),
            new MenuSeed("Stone-Fired Pizza",   "Thin-crust stone-fired pizza with truffle oil & rocket",   389, MenuItem.Category.PIZZA,   "pizza.jpg",       true,  20),
            new MenuSeed("Roasted Garlic Hummus","Stone-ground hummus with roasted garlic & warm pita",     179, MenuItem.Category.APPETIZER,"appetizer.jpg",   true,  5),
            new MenuSeed("Chocolate Ganache Tart","Dark chocolate ganache in a butter-pastry shell",        199, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Opera Cake Slice",    "Layered coffee-almond sponge, ganache & buttercream",      219, MenuItem.Category.DESSERT,  "cake.jpg",        true,  3),
            new MenuSeed("Churros & Chocolate", "Fried churros dusted with cinnamon sugar & dipping sauce",199, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  12),
            new MenuSeed("Kombucha",            "House-fermented ginger & lemon kombucha on tap",           129, MenuItem.Category.BEVERAGE, "milkshake.jpg",   true,  2),
            new MenuSeed("Elderflower Cordial", "Chilled elderflower cordial with sparkling water & mint",  109, MenuItem.Category.JUICE,   "juice.jpg",       true,  3),
            new MenuSeed("Hot Cider",            "Warm spiced apple cider with cinnamon & star anise",       99,  MenuItem.Category.BEVERAGE,"milkshake.jpg",   true,  5)
        );
    }

    // ── Cafe 8: The Last Chapter (Kolkata) ────────────────────────────────────
    private List<MenuSeed> lastChapterMenu() {
        return List.of(
            new MenuSeed("Chapter Blend Espresso","Balanced medium-roast espresso with chocolate notes",    119, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  3),
            new MenuSeed("Bookworm Cold Brew",   "Light-roast cold brew steeped for 24 hrs on oat milk",    179, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  2),
            new MenuSeed("Library Latte",        "Double espresso with cinnamon-vanilla steamed milk",      189, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Pu-erh Tea",           "Aged Chinese fermented pu-erh brewed gong fu style",      149, MenuItem.Category.TEA,      "tea.jpg",         true,  5),
            new MenuSeed("Darjeeling FTGFOP",   "1st flush Darjeeling loose-leaf — the champagne of teas", 129, MenuItem.Category.TEA,      "tea.jpg",         true,  4),
            new MenuSeed("Cardamom Chai",        "Bengal-style cardamom-strong milk tea",                    89,  MenuItem.Category.TEA,      "tea.jpg",         true,  5),
            new MenuSeed("Mishti Doi Latte",     "Sweet yogurt mishti doi blended into a warm latte",       179, MenuItem.Category.BEVERAGE, "milkshake.jpg",   true,  5),
            new MenuSeed("Mughlai Paratha",      "Flaky egg-stuffed paratha with raita & pickle",           179, MenuItem.Category.BREAKFAST,"breakfast.jpg",   false, 15),
            new MenuSeed("Luchi & Aloor Dam",   "Deep-fried Bengali luchi with spiced potato curry",        169, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  15),
            new MenuSeed("Toast & Preserves",   "Thick sourdough toast with house-made seasonal jam",       99,  MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  5),
            new MenuSeed("Egg Devil (Dimer Devil)","Bengali crumbed deep-fried spiced half egg",            149, MenuItem.Category.SNACKS,   "snacks.jpg",      false, 12),
            new MenuSeed("Singara (Samosa)",     "Crispy Bengali-style samosa with cauliflower filling",     79,  MenuItem.Category.SNACKS,   "snacks.jpg",      true,  10),
            new MenuSeed("Mishti Pulao",         "Fragrant sweet rice with raisins, cashews & ghee",        149, MenuItem.Category.MAIN_COURSE,"sandwich.jpg",  true,  20),
            new MenuSeed("Rosogolla",            "Spongy chenna balls soaked in light sugar syrup",          89,  MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Sandesh",              "Artisan chenna sweetmeat with rose water & pistachio",     99,  MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Mishti Doi",           "Caramelised sweet fermented yogurt in clay pot",           109, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Kheer",               "Slow-cooked rice pudding with cardamom & saffron",         129, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Aam Panna",            "Raw mango & cumin cooler — a summer tradition",            89,  MenuItem.Category.JUICE,   "juice.jpg",       true,  3),
            new MenuSeed("Jal Jeera",            "Cumin-tamarind digestive cooler with mint",                79,  MenuItem.Category.BEVERAGE,"milkshake.jpg",   true,  3)
        );
    }

    // ── Cafe 9: Ember & Oak (Hyderabad) ───────────────────────────────────────
    private List<MenuSeed> emberOakMenu() {
        return List.of(
            new MenuSeed("Ember Espresso",       "Wood-fire-infused smoky espresso blend",                  149, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  3),
            new MenuSeed("Oak Aged Cold Brew",   "Cold brew aged in toasted oak chips — barrel notes",      209, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  2),
            new MenuSeed("Fire-Spiced Latte",   "Espresso with chilli, cinnamon & smoked maple syrup",     219, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Halwa Chai",           "Ghee halwa-infused chai with cardamom & ginger",          139, MenuItem.Category.TEA,      "tea.jpg",         true,  5),
            new MenuSeed("Oak Smoked Tea",       "Lapsang souchong oolong with honey & orange peel",        149, MenuItem.Category.TEA,      "tea.jpg",         true,  4),
            new MenuSeed("Tandoori Pizza",       "Stone-baked pizza with tandoori chicken, mint chutney",   399, MenuItem.Category.PIZZA,    "pizza.jpg",       false, 20),
            new MenuSeed("Ember-Grilled Paneer", "Smoked paneer tikka cubes over charcoal embers",          289, MenuItem.Category.MAIN_COURSE,"sandwich.jpg",  true,  20),
            new MenuSeed("Wood-Fired Biryani",   "Dum-cooked mutton biryani in sealed cast-iron pot",       449, MenuItem.Category.MAIN_COURSE,"biryani.jpg",   false, 40),
            new MenuSeed("Oak Plank Salmon",     "Cedar-planked salmon with herb butter & lemon",           499, MenuItem.Category.MAIN_COURSE,"sandwich.jpg",  false, 25),
            new MenuSeed("Smoked Falafels",      "House-smoked falafels with tahini & pickled cabbage",     249, MenuItem.Category.APPETIZER,"appetizer.jpg",   true,  15),
            new MenuSeed("Fire-Roasted Soup",    "Charred tomato & red pepper bisque with cream swirl",     189, MenuItem.Category.SOUP,     "soup.jpg",        true,  10),
            new MenuSeed("Coal-Roasted Veg Bowl","Pumpkin, beetroot & sweet potato with chimichurri",       259, MenuItem.Category.SALAD,    "salad.jpg",       true,  15),
            new MenuSeed("Smoky Noodles",        "Stir-fried glass noodles with smokehouse soy sauce",      249, MenuItem.Category.MAIN_COURSE,"noodles.jpg",   false, 15),
            new MenuSeed("Molten Caramel Pudding","Sticky toffee pudding with salted caramel sauce",        199, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  15),
            new MenuSeed("Smoked Brownie",       "Lightly oak-smoked chocolate brownie with sea-salt",      169, MenuItem.Category.DESSERT,  "brownie.jpg",     true,  5),
            new MenuSeed("S'mores Platter",      "Dark chocolate, graham crackers & toasted marshmallow",   189, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  10),
            new MenuSeed("Mango Aam Ras",        "Thick Alphonso mango pulp with cardamom — seasonal",      129, MenuItem.Category.JUICE,   "juice.jpg",       true,  3),
            new MenuSeed("Tamarind Cooler",      "Sweet-tangy tamarind shrub, soda & smoked salt rim",       99,  MenuItem.Category.BEVERAGE,"milkshake.jpg",  true,  5),
            new MenuSeed("Rose Sharbat",         "Persian rose & basil-seed cooling sharbat on ice",         99,  MenuItem.Category.JUICE,    "juice.jpg",      true,  3)
        );
    }

    // ── Cafe 10: Bloom Cafe (Goa) ─────────────────────────────────────────────
    private List<MenuSeed> bloomCafeMenu() {
        return List.of(
            new MenuSeed("Bloom Espresso",       "Single-origin Coorg natural-process espresso",            139, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  3),
            new MenuSeed("Rose Gold Latte",      "Rose syrup, 24k gold flakes & double espresso foam",      289, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  6),
            new MenuSeed("Elderflower Latte",    "Elderflower cordial & espresso with steamed oat milk",    249, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Iced Hibiscus Latte",  "Cold espresso bloomed with hibiscus syrup & oat milk",    229, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  4),
            new MenuSeed("Butterfly Pea Latte",  "Colour-changing butterfly pea flower espresso latte",     239, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  5),
            new MenuSeed("Floral Oolong",         "Taiwanese high mountain oolong with jasmine pearls",      159, MenuItem.Category.TEA,      "tea.jpg",         true,  5),
            new MenuSeed("Lavender Honey Tea",   "Dried lavender & honey with chamomile tisane",             129, MenuItem.Category.TEA,      "tea.jpg",         true,  4),
            new MenuSeed("Edible Flower Pancakes","Fluffy pancakes garnished with in-season edible flowers", 259, MenuItem.Category.BREAKFAST,"pancake.jpg",     true,  15),
            new MenuSeed("Berry Acai Bowl",      "Frozen acai, granola, fresh berries & honey drizzle",     239, MenuItem.Category.BREAKFAST,"breakfast.jpg",   true,  8),
            new MenuSeed("Floral Eggs Benedict", "Poached eggs, wild-herb hollandaise & edible flowers",    279, MenuItem.Category.BREAKFAST,"breakfast.jpg",   false, 15),
            new MenuSeed("Rose Petal Pavlova",   "Meringue pavlova with rose cream & seasonal berries",     249, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  5),
            new MenuSeed("Lavender Cheesecake",  "Baked lavender cheesecake with blueberry compote",        229, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Honey Almond Tart",    "Frangipane tart with toasted almonds & wildflower honey", 199, MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Floral Cotton Candy",  "Handspun rose & violet flavoured cotton candy",            99,  MenuItem.Category.DESSERT,  "dessert.jpg",     true,  3),
            new MenuSeed("Caprese Bloom",        "Buffalo mozzarella, heirloom tomato & edible flowers",    229, MenuItem.Category.SALAD,    "salad.jpg",       true,  5),
            new MenuSeed("Petal Pasta",          "Handmade pasta in rose-tomato sauce & ricotta salata",    319, MenuItem.Category.PASTA,    "pasta.jpg",       true,  18),
            new MenuSeed("Bloom Watermelon Juice","Cold-pressed watermelon, rose water & basil seeds",      119, MenuItem.Category.JUICE,    "juice.jpg",       true,  3),
            new MenuSeed("Floral Mocktail",      "Rotating seasonal floral mocktail — ask for today's",     149, MenuItem.Category.BEVERAGE, "milkshake.jpg",   true,  5),
            new MenuSeed("Rose Lassi",           "Chilled yogurt lassi with rose syrup & cardamom",         129, MenuItem.Category.BEVERAGE, "smoothie.jpg",    true,  3)
        );
    }

    // ============================================================
    //  7. Staff — Chefs + Waiters (unified, saveAll batch)  (Req #2)
    // ============================================================
    private record StaffSeed(String firstName, String lastName, String email, String username) {}

    private static final List<List<StaffSeed>> CHEF_SEEDS = List.of(
        // 0: Brew Haven
        List.of(new StaffSeed("Amit",    "Kumar",    "chef1.brew@demo.com",     "chef1.brew"),
                new StaffSeed("Pooja",   "Mehta",    "chef2.brew@demo.com",     "chef2.brew")),
        // 1: Urban Beans
        List.of(new StaffSeed("Rahul",   "Verma",    "chef1.urban@demo.com",    "chef1.urban"),
                new StaffSeed("Anita",   "Singh",    "chef2.urban@demo.com",    "chef2.urban")),
        // 2: Latte Lounge
        List.of(new StaffSeed("Suresh",  "Nair",     "chef1.latte@demo.com",    "chef1.latte"),
                new StaffSeed("Deepa",   "Pillai",   "chef2.latte@demo.com",    "chef2.latte")),
        // 3: Midnight Cafe
        List.of(new StaffSeed("Vikram",  "Patel",    "chef1.midnight@demo.com", "chef1.midnight"),
                new StaffSeed("Priya",   "Joshi",    "chef2.midnight@demo.com", "chef2.midnight")),
        // 4: Sunrise Coffee
        List.of(new StaffSeed("Kiran",   "Rao",      "chef1.sunrise@demo.com",  "chef1.sunrise"),
                new StaffSeed("Meena",   "Reddy",    "chef2.sunrise@demo.com",  "chef2.sunrise")),
        // 5: Harbor Brew
        List.of(new StaffSeed("Naveen",  "Menon",    "chef1.harbor@demo.com",   "chef1.harbor"),
                new StaffSeed("Lakshmi", "Nambiar",  "chef2.harbor@demo.com",   "chef2.harbor")),
        // 6: The Garden Cafe
        List.of(new StaffSeed("Arun",    "Krishnan", "chef1.garden@demo.com",   "chef1.garden"),
                new StaffSeed("Shalini", "Iyer",     "chef2.garden@demo.com",   "chef2.garden")),
        // 7: Bean & Stone
        List.of(new StaffSeed("Manoj",   "Tiwari",   "chef1.stone@demo.com",    "chef1.stone"),
                new StaffSeed("Rekha",   "Gupta",    "chef2.stone@demo.com",    "chef2.stone")),
        // 8: The Last Chapter
        List.of(new StaffSeed("Debasis", "Ghosh",    "chef1.chapter@demo.com",  "chef1.chapter"),
                new StaffSeed("Sutapa",  "Bose",     "chef2.chapter@demo.com",  "chef2.chapter")),
        // 9: Ember & Oak
        List.of(new StaffSeed("Srikanth","Reddy",    "chef1.ember@demo.com",    "chef1.ember"),
                new StaffSeed("Padma",   "Venkat",   "chef2.ember@demo.com",    "chef2.ember")),
        // 10: Bloom Cafe
        List.of(new StaffSeed("Carlos",  "Fernandes","chef1.bloom@demo.com",    "chef1.bloom"),
                new StaffSeed("Maria",   "D'Souza",  "chef2.bloom@demo.com",    "chef2.bloom"))
    );

    private static final List<List<StaffSeed>> WAITER_SEEDS = List.of(
        // 0: Brew Haven
        List.of(new StaffSeed("Ravi",    "Shankar",  "waiter1.brew@demo.com",     "waiter1.brew"),
                new StaffSeed("Sunita",  "Das",      "waiter2.brew@demo.com",     "waiter2.brew")),
        // 1: Urban Beans
        List.of(new StaffSeed("Mohan",   "Gupta",    "waiter1.urban@demo.com",    "waiter1.urban"),
                new StaffSeed("Kavita",  "Sharma",   "waiter2.urban@demo.com",    "waiter2.urban")),
        // 2: Latte Lounge
        List.of(new StaffSeed("Sunil",   "Kumar",    "waiter1.latte@demo.com",    "waiter1.latte"),
                new StaffSeed("Radha",   "Menon",    "waiter2.latte@demo.com",    "waiter2.latte")),
        // 3: Midnight Cafe
        List.of(new StaffSeed("Ajay",    "Tiwari",   "waiter1.midnight@demo.com", "waiter1.midnight"),
                new StaffSeed("Geeta",   "Yadav",    "waiter2.midnight@demo.com", "waiter2.midnight")),
        // 4: Sunrise Coffee
        List.of(new StaffSeed("Rohit",   "Mishra",   "waiter1.sunrise@demo.com",  "waiter1.sunrise"),
                new StaffSeed("Swati",   "Patil",    "waiter2.sunrise@demo.com",  "waiter2.sunrise")),
        // 5: Harbor Brew
        List.of(new StaffSeed("Sanjay",  "Kamat",    "waiter1.harbor@demo.com",   "waiter1.harbor"),
                new StaffSeed("Meghna",  "Sawant",   "waiter2.harbor@demo.com",   "waiter2.harbor")),
        // 6: The Garden Cafe
        List.of(new StaffSeed("Prasad",  "Hegde",    "waiter1.garden@demo.com",   "waiter1.garden"),
                new StaffSeed("Nandini", "Rao",      "waiter2.garden@demo.com",   "waiter2.garden")),
        // 7: Bean & Stone
        List.of(new StaffSeed("Gaurav",  "Arora",    "waiter1.stone@demo.com",    "waiter1.stone"),
                new StaffSeed("Nisha",   "Aggarwal", "waiter2.stone@demo.com",    "waiter2.stone")),
        // 8: The Last Chapter
        List.of(new StaffSeed("Arnab",   "Mukherjee","waiter1.chapter@demo.com",  "waiter1.chapter"),
                new StaffSeed("Mou",     "Chatterjee","waiter2.chapter@demo.com", "waiter2.chapter")),
        // 9: Ember & Oak
        List.of(new StaffSeed("Ramesh",  "Naidu",    "waiter1.ember@demo.com",    "waiter1.ember"),
                new StaffSeed("Jyoti",   "Rao",      "waiter2.ember@demo.com",    "waiter2.ember")),
        // 10: Bloom Cafe
        List.of(new StaffSeed("Ashwin",  "Pereira",  "waiter1.bloom@demo.com",    "waiter1.bloom"),
                new StaffSeed("Priya",   "Rodrigues","waiter2.bloom@demo.com",    "waiter2.bloom"))
    );

    /**
     * Unified staff seeder — builds a saveAll batch for either chefs or waiters.
     * Uses buildBaseUser() so all flags (emailVerified, profileComplete, etc.) are always set.
     */
    private List<User> seedStaff(Cafe cafe, Role role, User owner,
                                  int cafeIndex, boolean isChef) {
        List<StaffSeed> seeds   = isChef ? CHEF_SEEDS.get(cafeIndex) : WAITER_SEEDS.get(cafeIndex);
        String          rawPw   = isChef ? CHEF_PW : WAITER_PW;
        List<User>      batch   = new ArrayList<>();
        for (StaffSeed s : seeds) {
            if (!userRepository.existsByEmail(s.email())) {
                User u = buildBaseUser(s.firstName(), s.lastName(),
                                       s.email(), s.username(), rawPw);
                u.setCafe(cafe);
                u.setCreatedByUser(owner);
                u.setJoiningDate(LocalDate.now().minusMonths(3));
                u.setExperienceYears(2);
                u.setShift("MORNING");
                u.getRoles().add(role);
                batch.add(u);
            }
        }
        List<User> saved = userRepository.saveAll(batch);   // Req #2
        if (!saved.isEmpty()) {
            logVerbose("[DevSeed] {} {} seeded for: {}",
                      saved.size(), isChef ? "chefs" : "waiters", cafe.getName());
        }
        return saved;
    }

    // ============================================================
    //  8. Customers — saveAll batch  (Req #1, #2)
    // ============================================================
    private static final String[][] CUSTOMER_DATA = {
        {"Arjun",    "Kapoor",    "customer1@demo.com",  "9876543210"},
        {"Sneha",    "Malhotra",  "customer2@demo.com",  "9876543211"},
        {"Nikhil",   "Banerjee",  "customer3@demo.com",  "9876543212"},
        {"Riya",     "Choudhury", "customer4@demo.com",  "9876543213"},
        {"Aditya",   "Trivedi",   "customer5@demo.com",  "9876543214"},
        {"Preeti",   "Saxena",    "customer6@demo.com",  "9876543215"},
        {"Manish",   "Bose",      "customer7@demo.com",  "9876543216"},
        {"Ananya",   "Iyer",      "customer8@demo.com",  "9876543217"},
        {"Sanjay",   "Rawat",     "customer9@demo.com",  "9876543218"},
        {"Divya",    "Kulkarni",  "customer10@demo.com", "9876543219"}
    };

    private List<User> batchCreateCustomers(Role customerRole) {
        List<User> batch = new ArrayList<>();
        for (String[] cd : CUSTOMER_DATA) {
            if (!userRepository.existsByEmail(cd[2])) {
                User c = buildBaseUser(cd[0], cd[1], cd[2], cd[2], CUSTOMER_PW);
                c.setPhoneNumber(cd[3]);
                c.getRoles().add(customerRole);
                batch.add(c);
            }
        }
        List<User> saved = userRepository.saveAll(batch);   // Req #2
        logVerbose("[DevSeed] {} customers seeded.", saved.size());
        return saved;
    }

    // ============================================================
    //  9. Bookings → Orders → OrderItems → Payments
    //     50 orders: 5 cafes × 10 slots, spread over past 7 days.
    //     Req #3: ≥50 orders  Req #4: status variety  Req #5: unique slots
    //     Req #6: realistic timestamps  Req #7: correct FK chain
    // ============================================================
    private int seedDemoTransactions(List<Cafe> cafes,
                                      List<User> customers,
                                      List<User> chefs,
                                      List<User> waiters) {
        if (customers.isEmpty()) {
            log.warn("[DevSeed] No customers available — skipping orders.");
            return 0;
        }

        int         totalCreated = 0;
        Set<String> usedSlots    = new HashSet<>();   // Req #5: in-memory collision guard

        for (int cafeIdx = 0; cafeIdx < cafes.size(); cafeIdx++) {
            Cafe cafe = cafes.get(cafeIdx);

            List<CafeTable>  tables    = cafeTableRepository.findByCafeId(cafe.getId());
            List<MenuItem>   menuItems = menuItemRepository
                    .findByCafeIdAndIsAvailableTrueAndIsDeletedFalse(cafe.getId());

            if (tables.isEmpty() || menuItems.isEmpty()) {
                log.warn("[DevSeed] Skipping orders for {} — no tables or menu items.", cafe.getName());
                continue;
            }

            for (int slot = 0; slot < 10 && slot < tables.size(); slot++) {
                CafeTable          table  = tables.get(slot);
                Order.OrderStatus  status = STATUS_CYCLE[slot];
                int                daysAgo = DAYS_AGO[slot];

                LocalDate     bookingDate = LocalDate.now().minusDays(daysAgo);   // Req #6
                LocalTime     bookingTime = LocalTime.of(BOOKING_HOURS[slot], BOOKING_MINS[slot]);

                // Derive placedAt: past orders placed at the actual booking hour; today's placed recently
                LocalDateTime placedAt = (daysAgo > 0)
                    ? bookingDate.atTime(bookingTime)
                    : LocalDateTime.now().minusHours(slot == 7 ? 4 : slot == 8 ? 2 : 1).minusMinutes(30);

                // Req #5: uniqueness — in-memory first, then DB
                String slotKey = table.getId() + "|" + bookingDate + "|" + bookingTime;
                if (usedSlots.contains(slotKey)) {
                    log.debug("[DevSeed] Slot {} already claimed in this run — skipping.", slotKey);
                    continue;
                }
                if (!bookingRepository.findByTableIdAndBookingDate(table.getId(), bookingDate).isEmpty()) {
                    log.debug("[DevSeed] DB already has booking for table {} on {} — skipping.",
                              table.getTableNumber(), bookingDate);
                    continue;
                }
                usedSlots.add(slotKey);

                User customer = customers.get((cafeIdx * 10 + slot) % customers.size());

                try {
                    // 9a. Booking — status derived from order status (Req #4)
                    Booking booking = new Booking();
                    booking.setBookingNumber("BK" + System.currentTimeMillis() + cafeIdx + slot);
                    booking.setCustomer(customer);
                    booking.setCafe(cafe);
                    booking.setTable(table);
                    booking.setBookingDate(bookingDate);
                    booking.setBookingTime(bookingTime);
                    booking.setStartTime(bookingTime);
                    booking.setEndTime(bookingTime.plusHours(2));
                    booking.setNumberOfGuests(Math.min(table.getCapacity(), 2));
                    booking.setStatus(deriveBookingStatus(status));    // Req #4
                    booking.setSpecialRequests("Please prepare the table before arrival.");
                    // Bug #3 fix: set createdAt before save so @CreatedDate auditing keeps the
                    // historical value instead of stamping now() — critical for dashboard analytics.
                    booking.setCreatedAt(placedAt);
                    Booking savedBooking = bookingRepository.save(booking);

                    // 9b. Order
                    Order order = new Order();
                    order.setOrderNumber("ORD" + System.currentTimeMillis() + cafeIdx + slot);
                    order.setBooking(savedBooking);
                    order.setCustomer(customer);
                    order.setCafe(cafe);
                    order.setStatus(status);
                    order.setPlacedAt(placedAt);
                    order.setDiscount(BigDecimal.ZERO);
                    order.setSpecialInstructions("Seat near the window if possible.");

                    // Assign chef / waiter only for statuses where they are active.
                    // PLACED  → neither assigned yet.
                    // PREPARING → chef active, waiter not yet.
                    // READY / SERVED → both assigned.
                    int baseStaffIdx = cafeIdx * 2;
                    if (status != Order.OrderStatus.PLACED) {
                        if (!chefs.isEmpty() && baseStaffIdx < chefs.size())
                            order.setPreparingByChef(chefs.get(baseStaffIdx));
                    }
                    if (status == Order.OrderStatus.READY || status == Order.OrderStatus.SERVED) {
                        if (!waiters.isEmpty() && baseStaffIdx < waiters.size())
                            order.setServedByWaiter(waiters.get(baseStaffIdx));
                    }

                    applyStatusTimestamps(order, status, placedAt);    // Req #6

                    // 9c. Order items — 2 or 3 items, bidirectional FK via addOrderItem (Req #7)
                    int itemCount = 2 + (slot % 2);   // alternates 2 / 3
                    BigDecimal subtotal = BigDecimal.ZERO;
                    for (int k = 0; k < itemCount && k < menuItems.size(); k++) {
                        MenuItem mi  = menuItems.get((slot + k) % menuItems.size());
                        int      qty = (k == 0) ? 2 : 1;
                        OrderItem oi = new OrderItem();
                        oi.setMenuItem(mi);
                        oi.setQuantity(qty);
                        oi.setUnitPrice(mi.getPrice());
                        BigDecimal lineTotal = mi.getPrice().multiply(BigDecimal.valueOf(qty));
                        oi.setTotalPrice(lineTotal);
                        subtotal = subtotal.add(lineTotal);
                        order.addOrderItem(oi);    // sets oi.order = order (Req #7 bidirectional)
                    }
                    BigDecimal tax   = subtotal.multiply(new BigDecimal("0.05"))
                                               .setScale(2, RoundingMode.HALF_UP);
                    BigDecimal total = subtotal.add(tax);
                    order.setSubtotal(subtotal);
                    order.setTax(tax);
                    order.setTotalAmount(total);
                    // Bug #3 fix: anchor createdAt to placedAt so historical orders appear
                    // in the correct day bucket on analytics dashboards.
                    order.setCreatedAt(placedAt);
                    Order savedOrder = orderRepository.save(order);   // cascade saves OrderItems

                    // 9d. Payment — ONLY for SERVED orders  (Req #4)
                    if (status == Order.OrderStatus.SERVED) {
                        Payment.PaymentMethod method = (slot % 2 == 0)
                            ? Payment.PaymentMethod.UPI
                            : Payment.PaymentMethod.CREDIT_CARD;
                        Payment payment = new Payment();
                        payment.setOrder(savedOrder);
                        payment.setAmount(total);
                        payment.setCurrency("INR");
                        payment.setStatus(Payment.PaymentStatus.COMPLETED);
                        payment.setPaymentMethod(method);
                        payment.setPaymentGateway("RAZORPAY");
                        payment.setTransactionId("TXN_DEMO_" +
                            UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
                        payment.setPaymentGatewayOrderId("order_DEMO_" + cafeIdx + "_" + slot);
                        payment.setPaymentGatewayPaymentId("pay_DEMO_" +
                            UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase());
                        payment.setInitiatedAt(placedAt);
                        payment.setCompletedAt(placedAt.plusMinutes(40));
                        paymentRepository.save(payment);
                    }

                    // Mark the table as occupied for live (today's) active orders so
                    // the owner dashboard "Table Availability" chart is realistic.
                    if (daysAgo == 0 && status != Order.OrderStatus.SERVED) {
                        table.setIsAvailable(false);
                        cafeTableRepository.save(table);
                    }

                    totalCreated++;
                    log.info("[DevSeed] [{}] slot {} | {} | {} | {} → {}",
                             cafe.getName(), slot, bookingDate, bookingTime,
                             customer.getEmail(), status);

                } catch (Exception e) {
                    log.warn("[DevSeed] Could not create order for cafe={} slot={}: {}",
                             cafe.getName(), slot, e.getMessage());
                }
            }
        }

        log.info("[DevSeed] seedDemoTransactions complete — {} orders created.", totalCreated);
        return totalCreated;
    }

    /**
     * Repairs missing relationships/metadata for older dev datasets so dashboards show complete values.
     */
    private void repairExistingMetadata(User defaultOwner) {
        List<Cafe> cafes = cafeRepository.findAll();
        if (cafes.isEmpty()) {
            return;
        }

        List<User> owners = userRepository.findByRoleName(Role.RoleName.CAFE_OWNER);
        if (owners.isEmpty() && defaultOwner != null) {
            owners = List.of(defaultOwner);
        }
        List<User> customers = userRepository.findByRoleName(Role.RoleName.CUSTOMER);

        int cafesUpdated = 0;
        for (int i = 0; i < cafes.size(); i++) {
            Cafe cafe = cafes.get(i);
            boolean changed = false;
            if (cafe.getOwner() == null && !owners.isEmpty()) {
                cafe.setOwner(owners.get(i % owners.size()));
                changed = true;
            }
            if (cafe.getLogoUrl() == null || cafe.getLogoUrl().isBlank()) {
                int logoIdx = (i % 6) + 1;
                cafe.setLogoUrl(ASSETS_CAFE + String.format("cafe-%02d.jpg", logoIdx));
                changed = true;
            }
            if ((cafe.getCoverUrl() == null || cafe.getCoverUrl().isBlank()) && cafe.getLogoUrl() != null) {
                cafe.setCoverUrl(cafe.getLogoUrl());
                changed = true;
            }
            if (changed) {
                cafeRepository.save(cafe);
                cafesUpdated++;
            }
        }

        List<Booking> bookings = bookingRepository.findAll();
        int bookingsUpdated = 0;
        for (int i = 0; i < bookings.size(); i++) {
            Booking booking = bookings.get(i);
            boolean changed = false;
            if (booking.getCafe() == null && !cafes.isEmpty()) {
                booking.setCafe(cafes.get(i % cafes.size()));
                changed = true;
            }
            if (booking.getCustomer() == null && !customers.isEmpty()) {
                booking.setCustomer(customers.get(i % customers.size()));
                changed = true;
            }
            if (booking.getBookingNumber() == null || booking.getBookingNumber().isBlank()) {
                booking.setBookingNumber("BK-FIX-" + booking.getId());
                changed = true;
            }
            if (changed) {
                bookingRepository.save(booking);
                bookingsUpdated++;
            }
        }

        List<Order> orders = orderRepository.findAll();
        int ordersUpdated = 0;
        for (Order order : orders) {
            boolean changed = false;
            if (order.getBooking() != null) {
                if (order.getCafe() == null && order.getBooking().getCafe() != null) {
                    order.setCafe(order.getBooking().getCafe());
                    changed = true;
                }
                if (order.getCustomer() == null && order.getBooking().getCustomer() != null) {
                    order.setCustomer(order.getBooking().getCustomer());
                    changed = true;
                }
            }
            if (order.getOrderNumber() == null || order.getOrderNumber().isBlank()) {
                order.setOrderNumber("ORD-FIX-" + order.getId());
                changed = true;
            }
            if (changed) {
                orderRepository.save(order);
                ordersUpdated++;
            }
        }

        List<Payment> payments = paymentRepository.findAll();
        int paymentsUpdated = 0;
        for (Payment payment : payments) {
            if (payment.getTransactionId() == null || payment.getTransactionId().isBlank()) {
                payment.setTransactionId("TXN-FIX-" + payment.getId());
                paymentRepository.save(payment);
                paymentsUpdated++;
            }
        }

        List<MenuItem> menuItems = menuItemRepository.findAll();
        int menuItemsUpdated = 0;
        int duplicateMenuItemsMarked = 0;
        Set<String> seenMenuKeys = new HashSet<>();
        menuItems.sort(Comparator.comparing(MenuItem::getId));
        for (MenuItem item : menuItems) {
            boolean changed = false;

            Long cafeId = item.getCafe() != null ? item.getCafe().getId() : -1L;
            String name = item.getName() != null ? item.getName().trim().toLowerCase(Locale.ROOT) : "";
            String dedupeKey = cafeId + "::" + name;
            if (!name.isBlank() && !seenMenuKeys.add(dedupeKey)) {
                item.setIsDeleted(true);
                item.setIsAvailable(false);
                changed = true;
                duplicateMenuItemsMarked++;
            }

            String imageUrl = item.getImageUrl();
            String filename = imageUrl == null || imageUrl.isBlank()
                    ? ""
                    : imageUrl.substring(imageUrl.lastIndexOf('/') + 1).toLowerCase(Locale.ROOT);

            String expected = CATEGORY_IMAGE_MAP.getOrDefault(item.getCategory(), "other.jpg");
            if (!VALID_MENU_IMAGE_FILES.contains(filename) || !filename.equals(expected)) {
                item.setImageUrl(ASSETS_MENU + expected);
                changed = true;
            }

            if (changed) {
                menuItemRepository.save(item);
                menuItemsUpdated++;
            }
        }

        log.info("[DevSeed] Metadata repair complete | cafesUpdated={} bookingsUpdated={} ordersUpdated={} paymentsUpdated={} menuItemsUpdated={} duplicateMenuItemsMarked={}",
                cafesUpdated, bookingsUpdated, ordersUpdated, paymentsUpdated, menuItemsUpdated, duplicateMenuItemsMarked);
    }

    /** Derives booking status from the order status for consistent FK state. */
    private Booking.BookingStatus deriveBookingStatus(Order.OrderStatus orderStatus) {
        return switch (orderStatus) {
            case SERVED               -> Booking.BookingStatus.COMPLETED;
            case READY, PREPARING     -> Booking.BookingStatus.CHECKED_IN;
            case PLACED               -> Booking.BookingStatus.CONFIRMED;
            default                   -> Booking.BookingStatus.CONFIRMED;
        };
    }

    /** Sets sub-timestamps on the order according to its final status. */
    private void applyStatusTimestamps(Order order, Order.OrderStatus status, LocalDateTime placedAt) {
        switch (status) {
            case SERVED -> {
                order.setPreparingAt(placedAt.plusMinutes(5));
                order.setReadyAt(placedAt.plusMinutes(20));
                order.setServedAt(placedAt.plusMinutes(35));
            }
            case READY -> {
                order.setPreparingAt(placedAt.plusMinutes(5));
                order.setReadyAt(LocalDateTime.now().minusMinutes(10));
            }
            case PREPARING -> {
                order.setPreparingAt(placedAt.plusMinutes(5));
            }
            case PLACED -> { /* no sub-timestamps yet */ }
        }
    }

}


