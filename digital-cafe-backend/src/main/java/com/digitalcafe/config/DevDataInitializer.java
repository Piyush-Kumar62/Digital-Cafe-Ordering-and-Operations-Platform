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
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Dev-only data seeder.
 *
 * Activate by running with:  --spring.profiles.active=dev
 * (Requires app.dev.seed.enabled=true — set automatically via application-dev.properties)
 *
 * What gets created (idempotent — guarded by cafeRepository.count() > 0):
 *   5  CAFE_OWNERs — owner@cafe.com + owner2..owner5@cafe.com
 *   50 Cafes       — 10 demo cafes per owner, each with logo/cover/gallery metadata
 *   10 Tables per cafe
 *   50 Menu items per cafe (one per category, demo metadata)
 *   1 Chef + 1 Waiter per cafe (extra legacy staff is deactivated by repair)
 *   10 Customers — customer1@demo.com … customer10@demo.com / Customer@123
 *   Orders + bookings + payments with mixed statuses for dashboard coverage
 */
@Slf4j
@Component
@org.springframework.core.annotation.Order(2)
@Profile({"dev", "e2e"})
@ConditionalOnProperty(name = "app.dev.seed.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DevDataInitializer implements CommandLineRunner {

    // Repositories
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

    // Image asset paths (Angular-relative, served at localhost:4200/assets/...)
    private static final String ASSETS_MENU    = "assets/downloads/menu-items/";
    private static final String ASSETS_CAFE    = "assets/downloads/cafes/";
    private static final String ASSETS_GALLERY = "assets/cafe/";

    // Passwords
    private static final String OWNER_PW    = "Owner@123";   // primary demo owner (owner@cafe.com)
    private static final String OWNER2_PW   = "Owner2@123";
    private static final String OWNER3_PW   = "Owner3@123";
    private static final String OWNER4_PW   = "Owner4@123";
    private static final String OWNER5_PW   = "Owner5@123";
    private static final String CHEF_PW     = "Chef@123";
    private static final String WAITER_PW   = "Waiter@123";
    private static final String CUSTOMER_PW = "Customer@123";
    private static final int DEMO_OWNERS = 5;
    private static final int DEMO_CAFES_PER_OWNER = 10;
    private static final int EXPECTED_DEMO_CAFES = DEMO_OWNERS * DEMO_CAFES_PER_OWNER;
    private static final String[] DEMO_STEMS = {
            "Aurora", "Banyan", "Cinder", "Dawn", "Elm",
            "Fable", "Grove", "Horizon", "Iris", "Juniper"
    };
    private static final String[] DEMO_OWNER_THEMES = {
            "Roastery", "Kitchen", "Bistro", "Veranda", "Collective"
    };
    private static final String[] DEMO_STYLE_NOTES = {
            "single-origin coffees and seasonal pour-overs",
            "stone-baked comfort plates and craft beverages",
            "artisan desserts and small-batch cold brews",
            "all-day brunch favorites and signature mocktails",
            "regional fusion bites and curated tea flights",
            "wood-fired snacks and house-made syrups",
            "farm-fresh salads and premium espresso blends",
            "late-evening comfort meals and tasting boards",
            "baked-daily pastries and micro-lot cappuccinos",
            "chef-led specials and hand-crafted beverages"
    };
    private static final String[] DEMO_AMBIENCE_NOTES = {
            "sunlit interiors with warm acoustic vibes",
            "cozy reading corners and relaxed community tables",
            "open kitchen energy with modern industrial decor",
            "minimalist aesthetics with lush indoor greens",
            "heritage-inspired details and soft evening lighting",
            "modern lounge seating with upbeat cafe playlists",
            "calm corner booths designed for long work sessions",
            "rooftop-friendly ambience and city-view seating",
            "earthy textures, handcrafted accents, and warm tones",
            "bright weekend mood with family-friendly seating"
    };

    // ── Order status rotation with richer dashboard metadata coverage per cafe
    private static final Order.OrderStatus[] STATUS_CYCLE = {
        Order.OrderStatus.SERVED,
        Order.OrderStatus.READY,
        Order.OrderStatus.PREPARING,
        Order.OrderStatus.PLACED,
        Order.OrderStatus.PENDING_PAYMENT,
        Order.OrderStatus.CANCELLED,
        Order.OrderStatus.SERVED,
        Order.OrderStatus.READY,
        Order.OrderStatus.PREPARING,
        Order.OrderStatus.PLACED
    };

    // ── Days-ago per slot (0 = today for live statuses, 1–7 = past for analytics)
    private static final int[] DAYS_AGO      = {7, 6, 5, 4, 3, 2, 1, 0, 0, 0};
    private static final int[] BOOKING_HOURS = {8, 10, 11, 12, 13, 14, 16, 18, 19, 20};
    private static final int[] BOOKING_MINS  = {0, 30,  0,  0, 30,  0,  0,  0, 30,  0};
    private static final int TRANSACTION_SLOTS_PER_CAFE = 20;

    // Demo cafe image pools (dev/e2e only)
    private static final String[] DEMO_CAFE_LOGOS = {
        ASSETS_CAFE + "cafe-01.jpg",
        ASSETS_CAFE + "cafe-02.jpg",
        ASSETS_CAFE + "cafe-03.jpg",
        ASSETS_CAFE + "cafe-04.jpg",
        ASSETS_CAFE + "cafe-05.jpg",
        ASSETS_CAFE + "cafe-06.jpg",
        ASSETS_CAFE + "117988644_339599183891354_811174711112183463_n.webp",
        ASSETS_CAFE + "171300581_225089309380169_7110508433115508859_n.webp",
        ASSETS_CAFE + "278289423_665264021195771_3461501505322840900_n.webp",
        ASSETS_CAFE + "284508116_779045543084988_8740149800341406610_n.webp",
        ASSETS_CAFE + "72193912_162125674875481_8865137224777710747_n.webp"
    };

    private static final String[] DEMO_CAFE_COVERS = {
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
        ASSETS_GALLERY + "coffee-scene-kayleigh.jpg"
    };

    // 11 cafes x 3 gallery images = 33 slots.
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
        ASSETS_GALLERY + "cafe-counter-illustration.png",
        ASSETS_CAFE + "117988644_339599183891354_811174711112183463_n.webp",
        ASSETS_CAFE + "171300581_225089309380169_7110508433115508859_n.webp",
        ASSETS_CAFE + "278289423_665264021195771_3461501505322840900_n.webp",
        ASSETS_CAFE + "284508116_779045543084988_8740149800341406610_n.webp",
        ASSETS_CAFE + "72193912_162125674875481_8865137224777710747_n.webp",
        ASSETS_CAFE + "Bastian.webp",
        ASSETS_CAFE + "cafe-01.jpg",
        ASSETS_CAFE + "cafe-02.jpg",
        ASSETS_CAFE + "cafe-03.jpg",
        ASSETS_CAFE + "cafe-04.jpg",
        ASSETS_CAFE + "cafe-05.jpg",
        ASSETS_CAFE + "cafe-06.jpg",
        "assets/downloads/unsplash/landing-cafe-01.jpg",
        "assets/downloads/unsplash/landing-cafe-02.jpg",
        "assets/downloads/unsplash/landing-cafe-03.jpg",
        "assets/downloads/unsplash/landing-cafe-04.jpg",
        "assets/downloads/unsplash/landing-cafe-05.jpg",
        "assets/downloads/unsplash/landing-cafe-06.jpg",
        "assets/downloads/unsplash/cafe-cover-default.jpg",
        "assets/downloads/unsplash/cafe-detail-hero.jpg"
    };

    // Demo menu image pools (full relative URLs for richer variation)
    private static final List<String> MENU_IMAGE_POOL = List.of(
        ASSETS_MENU + "appetizer.jpg",
        ASSETS_MENU + "beverage.jpg",
        ASSETS_MENU + "burger.jpg",
        ASSETS_MENU + "cake.jpg",
        ASSETS_MENU + "coffee.jpg",
        ASSETS_MENU + "dessert.jpg",
        ASSETS_MENU + "fries.jpg",
        ASSETS_MENU + "ice-cream.jpg",
        ASSETS_MENU + "juice.jpg",
        ASSETS_MENU + "other.jpg",
        ASSETS_MENU + "pasta.jpg",
        ASSETS_MENU + "pizza.jpg",
        ASSETS_MENU + "salad.jpg",
        ASSETS_MENU + "sandwich.jpg",
        ASSETS_MENU + "smoothie.jpg",
        ASSETS_MENU + "snacks.jpg",
        ASSETS_MENU + "tea.jpg",
        "assets/downloads/unsplash/menu-appetizer.jpg",
        "assets/downloads/unsplash/menu-beverage.jpg",
        "assets/downloads/unsplash/menu-coffee.jpg",
        "assets/downloads/unsplash/menu-default.jpg",
        "assets/downloads/unsplash/menu-dessert.jpg",
        "assets/downloads/unsplash/menu-main-course.jpg",
        "assets/downloads/unsplash/menu-snack.jpg",
        "assets/downloads/unsplash/cart-appetizer.jpg",
        "assets/downloads/unsplash/cart-beverage.jpg",
        "assets/downloads/unsplash/cart-default.jpg",
        "assets/downloads/unsplash/cart-dessert.jpg",
        "assets/downloads/unsplash/cart-main-course.jpg",
        "assets/downloads/unsplash/cart-snack.jpg",
        "assets/downloads/unsplash/cafe-detail-item-default.jpg",
        "assets/coffee/barista-latte-art.jpg",
        "assets/coffee/barista-pour-pexels.jpg",
        "assets/coffee/coffee-beans-01.jpg",
        "assets/coffee/coffee-cup-01.jpg",
        "assets/coffee/coffee-cup-closeup.jpg",
        "assets/coffee/coffee-cup-pexels-01.jpeg",
        "assets/coffee/coffee-cup-pexels-02.webp",
        "assets/coffee/coffee-cup-unsplash-01.jpg",
        "assets/coffee/coffee-cup-unsplash-02.jpg",
        "assets/coffee/coffee-pour-01.jpg",
        "assets/coffee/coffee-scene-nathan-01.jpg",
        "assets/coffee/coffee-scene-nathan-02.jpg",
        "assets/coffee/coffee-scene-nathan-03.jpg",
        "assets/coffee/coffee-table-pexels.jpg"
    );
    private static final List<String> MENU_GENERATED_IMAGE_POOL = IntStream.rangeClosed(1, 80)
            .mapToObj(i -> String.format("assets/downloads/menu-generated/gen-%02d.svg", i))
            .toList();

    private static final Set<String> VALID_MENU_IMAGE_FILES = Set.of(
        "appetizer.jpg", "beverage.jpg", "burger.jpg", "cake.jpg",
        "coffee.jpg", "dessert.jpg", "fries.jpg", "ice-cream.jpg",
        "juice.jpg", "other.jpg", "pasta.jpg", "pizza.jpg",
        "salad.jpg", "sandwich.jpg", "smoothie.jpg", "snacks.jpg",
        "tea.jpg",
        "gen-01.svg", "gen-02.svg", "gen-03.svg", "gen-04.svg", "gen-05.svg",
        "gen-06.svg", "gen-07.svg", "gen-08.svg", "gen-09.svg", "gen-10.svg",
        "gen-11.svg", "gen-12.svg", "gen-13.svg", "gen-14.svg", "gen-15.svg",
        "gen-16.svg", "gen-17.svg", "gen-18.svg", "gen-19.svg", "gen-20.svg",
        "gen-21.svg", "gen-22.svg", "gen-23.svg", "gen-24.svg", "gen-25.svg",
        "gen-26.svg", "gen-27.svg", "gen-28.svg", "gen-29.svg", "gen-30.svg",
        "gen-31.svg", "gen-32.svg", "gen-33.svg", "gen-34.svg", "gen-35.svg",
        "gen-36.svg", "gen-37.svg", "gen-38.svg", "gen-39.svg", "gen-40.svg",
        "gen-41.svg", "gen-42.svg", "gen-43.svg", "gen-44.svg", "gen-45.svg",
        "gen-46.svg", "gen-47.svg", "gen-48.svg", "gen-49.svg", "gen-50.svg",
        "gen-51.svg", "gen-52.svg", "gen-53.svg", "gen-54.svg", "gen-55.svg",
        "gen-56.svg", "gen-57.svg", "gen-58.svg", "gen-59.svg", "gen-60.svg",
        "gen-61.svg", "gen-62.svg", "gen-63.svg", "gen-64.svg", "gen-65.svg",
        "gen-66.svg", "gen-67.svg", "gen-68.svg", "gen-69.svg", "gen-70.svg",
        "gen-71.svg", "gen-72.svg", "gen-73.svg", "gen-74.svg", "gen-75.svg",
        "gen-76.svg", "gen-77.svg", "gen-78.svg", "gen-79.svg", "gen-80.svg"
    );

    private static final Map<MenuItem.Category, List<String>> CATEGORY_IMAGE_POOL = Map.ofEntries(
        Map.entry(MenuItem.Category.COFFEE, List.of(
            "assets/coffee/barista-latte-art.jpg",
            "assets/coffee/coffee-pour-01.jpg",
            "assets/coffee/coffee-cup-unsplash-01.jpg",
            "assets/coffee/coffee-cup-unsplash-02.jpg",
            "assets/downloads/unsplash/menu-coffee.jpg",
            ASSETS_MENU + "coffee.jpg"
        )),
        Map.entry(MenuItem.Category.TEA, List.of(
            ASSETS_MENU + "tea.jpg",
            "assets/downloads/unsplash/menu-beverage.jpg",
            "assets/coffee/coffee-table-pexels.jpg",
            "assets/cafe/cafe-ambience.jpg"
        )),
        Map.entry(MenuItem.Category.BEVERAGE, List.of(
            ASSETS_MENU + "beverage.jpg",
            ASSETS_MENU + "smoothie.jpg",
            "assets/downloads/unsplash/cart-beverage.jpg",
            "assets/downloads/unsplash/menu-beverage.jpg"
        )),
        Map.entry(MenuItem.Category.JUICE, List.of(
            ASSETS_MENU + "juice.jpg",
            ASSETS_MENU + "smoothie.jpg",
            "assets/downloads/unsplash/cart-beverage.jpg",
            "assets/downloads/unsplash/menu-beverage.jpg"
        )),
        Map.entry(MenuItem.Category.SMOOTHIE, List.of(
            ASSETS_MENU + "smoothie.jpg",
            ASSETS_MENU + "juice.jpg",
            "assets/downloads/unsplash/cart-beverage.jpg",
            "assets/downloads/unsplash/menu-beverage.jpg"
        )),
        Map.entry(MenuItem.Category.BREAKFAST, List.of(
            ASSETS_MENU + "sandwich.jpg",
            ASSETS_MENU + "dessert.jpg",
            ASSETS_MENU + "snacks.jpg",
            "assets/downloads/unsplash/menu-main-course.jpg"
        )),
        Map.entry(MenuItem.Category.SANDWICH, List.of(
            ASSETS_MENU + "sandwich.jpg",
            ASSETS_MENU + "snacks.jpg",
            ASSETS_MENU + "burger.jpg",
            "assets/downloads/unsplash/menu-main-course.jpg"
        )),
        Map.entry(MenuItem.Category.BURGER, List.of(
            ASSETS_MENU + "burger.jpg",
            ASSETS_MENU + "sandwich.jpg",
            "assets/downloads/unsplash/menu-main-course.jpg",
            "assets/downloads/unsplash/cart-main-course.jpg"
        )),
        Map.entry(MenuItem.Category.PASTA, List.of(
            ASSETS_MENU + "pasta.jpg",
            ASSETS_MENU + "other.jpg",
            "assets/downloads/unsplash/menu-main-course.jpg",
            "assets/downloads/unsplash/cart-main-course.jpg"
        )),
        Map.entry(MenuItem.Category.PIZZA, List.of(
            ASSETS_MENU + "pizza.jpg",
            ASSETS_MENU + "other.jpg",
            "assets/downloads/unsplash/menu-main-course.jpg",
            "assets/downloads/unsplash/cart-main-course.jpg"
        )),
        Map.entry(MenuItem.Category.SALAD, List.of(
            ASSETS_MENU + "salad.jpg",
            ASSETS_MENU + "appetizer.jpg",
            "assets/downloads/unsplash/menu-appetizer.jpg",
            "assets/downloads/unsplash/cart-appetizer.jpg"
        )),
        Map.entry(MenuItem.Category.SNACKS, List.of(
            ASSETS_MENU + "snacks.jpg",
            ASSETS_MENU + "fries.jpg",
            "assets/downloads/unsplash/menu-snack.jpg",
            "assets/downloads/unsplash/cart-snack.jpg"
        )),
        Map.entry(MenuItem.Category.DESSERT, List.of(
            ASSETS_MENU + "dessert.jpg",
            ASSETS_MENU + "cake.jpg",
            ASSETS_MENU + "ice-cream.jpg",
            "assets/downloads/unsplash/menu-dessert.jpg",
            "assets/downloads/unsplash/cart-dessert.jpg"
        )),
        Map.entry(MenuItem.Category.MAIN_COURSE, List.of(
            ASSETS_MENU + "other.jpg",
            ASSETS_MENU + "pasta.jpg",
            ASSETS_MENU + "sandwich.jpg",
            "assets/downloads/unsplash/menu-main-course.jpg",
            "assets/downloads/unsplash/cart-main-course.jpg"
        )),
        Map.entry(MenuItem.Category.APPETIZER, List.of(
            ASSETS_MENU + "appetizer.jpg",
            ASSETS_MENU + "snacks.jpg",
            "assets/downloads/unsplash/menu-appetizer.jpg",
            "assets/downloads/unsplash/cart-appetizer.jpg"
        )),
        Map.entry(MenuItem.Category.SOUP, List.of(
            ASSETS_MENU + "other.jpg",
            ASSETS_MENU + "appetizer.jpg",
            "assets/downloads/unsplash/menu-main-course.jpg",
            "assets/downloads/unsplash/cart-main-course.jpg"
        ))
    );
    //  Entry point
    @Override
    @Transactional
    public void run(String... args) {
        log.info("[DevSeed] Dev seed enabled (verbose={}, logCredentials={})", verboseLogging, logCredentials);
        // 1. Roles — always idempotent
        ensureRole(Role.RoleName.ADMIN, "System Administrator");
        Role ownerRole    = ensureRole(Role.RoleName.CAFE_OWNER, "Cafe Owner");
        Role chefRole     = ensureRole(Role.RoleName.CHEF,       "Chef");
        Role waiterRole   = ensureRole(Role.RoleName.WAITER,     "Waiter");
        Role customerRole = ensureRole(Role.RoleName.CUSTOMER,   "Customer");
        ensureAllProfilesComplete();

        // Always ensure owner@cafe.com exists and is active, including previously pending dev signups.
        User owner1 = findOrCreateOwner("owner@cafe.com", "Raj",     "Sharma",   "9876540001", OWNER_PW,  ownerRole);
        User owner2 = findOrCreateOwner("owner2@cafe.com", "Priya",  "Nair",     "9876540002", OWNER2_PW, ownerRole);
        User owner3 = findOrCreateOwner("owner3@cafe.com", "Vikram", "Patel",    "9876540003", OWNER3_PW, ownerRole);
        User owner4 = findOrCreateOwner("owner4@cafe.com", "Ananya", "Iyer",     "9876540004", OWNER4_PW, ownerRole);
        User owner5 = findOrCreateOwner("owner5@cafe.com", "Suresh", "Menon",    "9876540005", OWNER5_PW, ownerRole);

        if (cafeRepository.count() > 0) {
            long totalBefore = cafeRepository.count();
            long demoBefore = countDemoCafes();
            log.info("[DevSeed] Existing cafes detected (total={}, demo={}) — running demo top-up and metadata repair.",
                    totalBefore, demoBefore);
            // Top-up demo cafes for owners so public UI can show the complete dev catalog.
            createAllCafes(owner1, owner2, owner3, owner4, owner5);
            repairExistingMetadata(owner1);
            List<Cafe> cafes = cafeRepository.findAll();
            cafes.sort(Comparator.comparing(Cafe::getId));

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

            long currentOrders = orderRepository.count();
            long targetOrders = (long) cafes.size() * TRANSACTION_SLOTS_PER_CAFE;
            if (currentOrders < targetOrders) {
                log.info("[DevSeed] Orders below target for demo pagination (current={}, target={}) — seeding top-up transactions.",
                        currentOrders, targetOrders);
                List<User> customers = userRepository.findByRoleName(Role.RoleName.CUSTOMER);
                if (customers.isEmpty()) {
                    customers = batchCreateCustomers(customerRole);
                }

                int totalOrders = seedDemoTransactions(cafes, customers);
                log.info("[DevSeed] Demo transactions seeded for existing cafes | orders={}", totalOrders);
            }

            long demoAfter = countDemoCafes();
            log.info("[DevSeed] Post-repair summary | cafes={} demoCafes={} activeCafes={} activeChefs={} activeWaiters={} activeCustomers={}",
                    cafeRepository.count(),
                    demoAfter,
                    cafeRepository.findByIsActive(true).size(),
                    userRepository.findByRoleName(Role.RoleName.CHEF).stream().filter(u -> Boolean.TRUE.equals(u.getIsActive())).count(),
                    userRepository.findByRoleName(Role.RoleName.WAITER).stream().filter(u -> Boolean.TRUE.equals(u.getIsActive())).count(),
                    userRepository.findByRoleName(Role.RoleName.CUSTOMER).stream().filter(u -> Boolean.TRUE.equals(u.getIsActive())).count());
            if (demoAfter < EXPECTED_DEMO_CAFES) {
                log.warn("[DevSeed] Demo cafes below expected count (expected={}, actual={}).", EXPECTED_DEMO_CAFES, demoAfter);
            }

            log.info("[DevSeed] DevDataInitializer completed (existing-data mode).");
            return;
        }

        if (verboseLogging) {
            log.info("[DevSeed] Seeding demo data for Digital Cafe Platform");
        }

        // 4. Create demo cafes (10 per owner, total 50)
        List<Cafe> cafes = createAllCafes(owner1, owner2, owner3, owner4, owner5);

        // 5. Tables, menu items, and staff per cafe
        for (int i = 0; i < cafes.size(); i++) {
            Cafe cafe = cafes.get(i);
            seedTables(cafe, i);
            seedMenuItems(cafe, i);
            // Use owner of the cafe as createdBy for staff
            User cafeOwner = cafe.getOwner();
            seedStaff(cafe, chefRole, cafeOwner, i, true);
            seedStaff(cafe, waiterRole, cafeOwner, i, false);
        }

        // 6. Customers
        List<User> customers = batchCreateCustomers(customerRole);

        // 7. Bookings + orders + payments for all cafes
        int totalOrders = seedDemoTransactions(cafes, customers);

        long totalTables = cafeTableRepository.count();
        long totalMenuItems = menuItemRepository.count();
        long totalChefs = userRepository.findByRoleName(Role.RoleName.CHEF).size();
        long totalWaiters = userRepository.findByRoleName(Role.RoleName.WAITER).size();
        log.info("[DevSeed] Seed complete | cafes={} demoCafes={} tables={} menuItems={} chefs={} waiters={} customers={} orders={}",
            cafes.size(), countDemoCafes(), totalTables, totalMenuItems, totalChefs, totalWaiters, customers.size(), totalOrders);
        log.info("[DevSeed] DevDataInitializer completed.");
    }

    public void logCredentialsSummary() {
        logAllCredentials();
    }

    private long countDemoCafes() {
        return cafeRepository.findAll().stream()
                .map(Cafe::getEmail)
                .filter(email -> email != null && email.startsWith("demo.cafe.") && email.endsWith("@demo.com"))
                .count();
    }

    private void ensureAllProfilesComplete() {
        List<User> users = userRepository.findAll();
        int updated = 0;
        for (User user : users) {
            boolean changed = false;
            if (!Boolean.TRUE.equals(user.getIsProfileComplete())) {
                user.setIsProfileComplete(true);
                changed = true;
            }
            if (user.getProfileCompletionPercentage() == null || user.getProfileCompletionPercentage() < 100) {
                user.setProfileCompletionPercentage(100);
                changed = true;
            }

            if (changed) {
                userRepository.save(user);
                updated++;
            }
        }
        if (updated > 0) {
            log.info("[DevSeed] Marked {} users as profile-complete for demo access.", updated);
        }
    }
    //  Dev credentials summary — always printed on startup
    private void logAllCredentials() {
        if (!logCredentials) {
            return;
        }
        log.info("");
        log.info("[DevSeed] =====================================================================");
        log.info("[DevSeed] DEV SEED LOGIN CREDENTIALS");
        log.info("[DevSeed] ---------------------------------------------------------------------");
        log.info("[DevSeed] | ROLE       | EMAIL                           | PASSWORD             |");
        log.info("[DevSeed] ---------------------------------------------------------------------");
        logCredentialRow("CAFE_OWNER", "owner@cafe.com", OWNER_PW);
        logCredentialRow("CAFE_OWNER", "owner2@cafe.com", OWNER2_PW);
        logCredentialRow("CAFE_OWNER", "owner3@cafe.com", OWNER3_PW);
        logCredentialRow("CAFE_OWNER", "owner4@cafe.com", OWNER4_PW);
        logCredentialRow("CAFE_OWNER", "owner5@cafe.com", OWNER5_PW);
        log.info("[DevSeed] ---------------------------------------------------------------------");
        logRoleCredentialRows(Role.RoleName.CHEF, CHEF_PW, Integer.MAX_VALUE);
        log.info("[DevSeed] ---------------------------------------------------------------------");
        logRoleCredentialRows(Role.RoleName.WAITER, WAITER_PW, Integer.MAX_VALUE);
        log.info("[DevSeed] ---------------------------------------------------------------------");
        logRoleCredentialRows(Role.RoleName.CUSTOMER, CUSTOMER_PW, Integer.MAX_VALUE);
        log.info("[DevSeed] =====================================================================");
        log.info("");
    }

    private void logRoleCredentialRows(Role.RoleName roleName, String password, int maxRows) {
        List<User> users = userRepository.findByRoleName(roleName).stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .filter(u -> isDevSeedCredentialForRole(roleName, u.getEmail()))
                .sorted(Comparator.comparing(User::getEmail, String.CASE_INSENSITIVE_ORDER))
                .toList();
        if (users.isEmpty()) {
            logCredentialRow(roleName.name(), "(none)", password);
            return;
        }
        int limit = (maxRows <= 0 || maxRows == Integer.MAX_VALUE) ? users.size() : Math.min(users.size(), maxRows);
        for (int i = 0; i < limit; i++) {
            logCredentialRow(roleName.name(), users.get(i).getEmail(), password);
        }
        if (users.size() > limit) {
            logCredentialRow(roleName.name(), "... and " + (users.size() - limit) + " more", password);
        }
    }

    private boolean isDevSeedCredentialForRole(Role.RoleName roleName, String email) {
        if (email == null) {
            return false;
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        return switch (roleName) {
            case CHEF -> normalized.endsWith("@demo.com")
                    && (normalized.startsWith("chef.") || normalized.startsWith("chef1.") || normalized.startsWith("chef2."));
            case WAITER -> normalized.endsWith("@demo.com")
                    && (normalized.startsWith("waiter.") || normalized.startsWith("waiter1.") || normalized.startsWith("waiter2."));
            case CUSTOMER -> normalized.endsWith("@demo.com")
                    && normalized.startsWith("customer");
            default -> false;
        };
    }

    private void logCredentialRow(String role, String email, String password) {
        String cleanRole = fit(role, 10);
        String cleanEmail = email == null ? "" : email.trim();
        String cleanPassword = password == null ? "" : password.trim();
        log.info(String.format(Locale.ROOT,
                "[DevSeed] | %-10s | %-31s | %-20s |",
                cleanRole,
                cleanEmail,
                cleanPassword));
    }

    private String fit(String value, int width) {
        String v = value == null ? "" : value.trim();
        if (v.length() <= width) {
            return v;
        }
        if (width <= 3) {
            return v.substring(0, width);
        }
        return v.substring(0, width - 3) + "...";
    }

    private void logVerbose(String message, Object... args) {
        if (verboseLogging) {
            log.info(message, args);
        }
    }
    //  1. Roles
    private Role ensureRole(Role.RoleName name, String description) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = Role.builder().name(name).description(description).build();
            return roleRepository.save(role);
        });
    }
    //  Central user builder — ALL flags set on every user path
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
    // Finds or creates cafe owners and auto-activates pending dev signup accounts.
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
    //  Demo cafes generator: 10 cafes per owner (5 owners = 50 cafes)
    private record CafeSeed(
        String name, String description, String address, String city, String state,
        String pincode, String phone, String email, String openTime, String closeTime,
        String logo, String cover, Double rating, String fssai
    ) {}

    private String buildDemoCafeName(int ownerIndex, int localIndex) {
        String stem = DEMO_STEMS[Math.floorMod(localIndex, DEMO_STEMS.length)];
        String theme = DEMO_OWNER_THEMES[Math.floorMod(ownerIndex, DEMO_OWNER_THEMES.length)];
        return stem + " " + theme;
    }

    private String buildDemoCafeDescription(int ownerIndex, int localIndex, String city) {
        int idx = ownerIndex * DEMO_CAFES_PER_OWNER + localIndex;
        String style = DEMO_STYLE_NOTES[Math.floorMod(idx, DEMO_STYLE_NOTES.length)];
        String ambience = DEMO_AMBIENCE_NOTES[Math.floorMod(idx + localIndex, DEMO_AMBIENCE_NOTES.length)];
        return "A vibrant " + city + " cafe known for " + style + ", with " + ambience + ".";
    }

    private List<Cafe> createAllCafes(User owner1, User owner2, User owner3,
                                       User owner4, User owner5) {
        List<User> owners = List.of(owner1, owner2, owner3, owner4, owner5);
        Map<String, Cafe> existingByEmail = cafeRepository.findAll().stream()
                .filter(c -> c.getEmail() != null && !c.getEmail().isBlank())
                .collect(Collectors.toMap(
                        c -> c.getEmail().trim().toLowerCase(Locale.ROOT),
                        Function.identity(),
                        (first, second) -> first.getId() <= second.getId() ? first : second
                ));
        String[] cityCycle = {"Mumbai", "Pune", "Bengaluru", "Delhi", "Kolkata", "Hyderabad", "Chennai", "Ahmedabad", "Jaipur", "Panjim"};
        String[] stateCycle = {"Maharashtra", "Maharashtra", "Karnataka", "Delhi", "West Bengal", "Telangana", "Tamil Nadu", "Gujarat", "Rajasthan", "Goa"};
        String[] areaCycle = {"Central Avenue", "Lake View Road", "Park Street", "Metro Lane", "Harbor Drive", "Market Square", "Heritage Lane", "Food Street", "Riverside Walk", "Garden Circle"};
        String[] openCycle = {"06:30", "07:00", "07:30", "08:00", "08:30"};
        String[] closeCycle = {"21:00", "22:00", "22:30", "23:00", "23:30"};

        List<Cafe> cafes = new ArrayList<>();
        int globalCafeIndex = 0;
        for (int ownerIndex = 0; ownerIndex < owners.size(); ownerIndex++) {
            User owner = owners.get(ownerIndex);
            for (int localIndex = 0; localIndex < 10; localIndex++) {
                int i = globalCafeIndex++;
                String city = cityCycle[(ownerIndex * 3 + localIndex) % cityCycle.length];
                String state = stateCycle[(ownerIndex * 3 + localIndex) % stateCycle.length];
                String area = areaCycle[(ownerIndex * 5 + localIndex) % areaCycle.length];
                String cafeName = buildDemoCafeName(ownerIndex, localIndex);
                String description = buildDemoCafeDescription(ownerIndex, localIndex, city);
                String pincode = String.format("%06d", 400000 + (ownerIndex * 100) + localIndex + 1);
                String phone = String.format("98%08d", (ownerIndex * 1000) + (localIndex + 1));
                String email = "demo.cafe." + (ownerIndex + 1) + "." + (localIndex + 1) + "@demo.com";
                String openTime = openCycle[localIndex % openCycle.length];
                String closeTime = closeCycle[(ownerIndex + localIndex) % closeCycle.length];
                String logo = withCafeMediaVariant(DEMO_CAFE_LOGOS[i % DEMO_CAFE_LOGOS.length], "logo", i);
                String cover = withCafeMediaVariant(DEMO_CAFE_COVERS[i % DEMO_CAFE_COVERS.length], "cover", i);
                String fssai = String.format("10012345%06d", i + 1);
                double rating = BigDecimal.valueOf(4.1 + ((i % 9) * 0.1)).setScale(1, RoundingMode.HALF_UP).doubleValue();

                String emailKey = email.trim().toLowerCase(Locale.ROOT);
                Cafe cafe = existingByEmail.get(emailKey);
                boolean isNew = cafe == null;
                if (cafe == null) {
                    cafe = new Cafe();
                }
                cafe.setName(cafeName);
                cafe.setDescription(description);
                cafe.setAddress((10 + i) + ", " + area);
                cafe.setCity(city);
                cafe.setState(state);
                cafe.setPincode(pincode);
                cafe.setPhoneNumber(phone);
                cafe.setEmail(email);
                cafe.setOpenTime(openTime);
                cafe.setCloseTime(closeTime);
                cafe.setLogoUrl(logo);
                cafe.setCoverUrl(cover);
                cafe.setImageUrl(cover);
                cafe.setRating(rating);
                cafe.setFssaiNumber(fssai);
                cafe.setIsActive(true);
                cafe.setOwner(owner);
                Cafe savedCafe = cafeRepository.save(cafe);
                existingByEmail.put(emailKey, savedCafe);

                List<CafeGallery> existingGallery = cafeGalleryRepository.findByCafeIdOrderByDisplayOrderAsc(savedCafe.getId());
                List<CafeGallery> galleryBatch = new ArrayList<>();
                for (int g = 0; g < 3; g++) {
                    int imgIdx = i * 3 + g;
                    if (imgIdx >= ALL_GALLERY.length) {
                        imgIdx = Math.floorMod(imgIdx, ALL_GALLERY.length);
                    }
                    String imageUrl = withCafeMediaVariant(ALL_GALLERY[imgIdx], "gallery" + g, i);
                    if (g < existingGallery.size()) {
                        CafeGallery existing = existingGallery.get(g);
                        existing.setImageUrl(imageUrl);
                        existing.setCaption(cafeName + " — gallery photo " + (g + 1));
                        existing.setDisplayOrder(g);
                        galleryBatch.add(existing);
                    } else {
                        galleryBatch.add(CafeGallery.builder()
                                .cafe(savedCafe)
                                .imageUrl(imageUrl)
                                .caption(cafeName + " — gallery photo " + (g + 1))
                                .displayOrder(g)
                                .createdAt(LocalDateTime.now().minusDays(7 - g))
                                .build());
                    }
                }
                cafeGalleryRepository.saveAll(galleryBatch);

                cafes.add(savedCafe);
                logVerbose("[DevSeed] {} cafe: {} (owner: {})",
                        isNew ? "Created" : "Updated", cafeName, owner.getEmail());
            }
        }
        return cafes;
    }

    private String withCafeMediaVariant(String url, String type, int cafeIndex) {
        if (url == null || url.isBlank()) {
            return url;
        }
        String base = stripQuery(url);
        return base + "?demo_" + type + "=" + cafeIndex;
    }
    //  Tables — saveAll batch (10 per cafe, global table numbers)
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
    //  Menu Items — 50 items per cafe (one per category, demo-only)
    private record MenuSeed(
        String name, String description, double price,
        MenuItem.Category category, String imageFile,
        boolean isVeg, int prepMins
    ) {}

    private void seedMenuItems(Cafe cafe, int cafeIndex) {
        List<MenuSeed> defs = buildCompleteMenuForCafe(cafe, cafeIndex, getMenuItemsForCafe(cafeIndex));
        List<MenuItem> batch = new ArrayList<>(defs.size());
        Set<String> seenNames = new HashSet<>();
        Set<String> usedImageUrls = new HashSet<>();
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
            item.setImageUrl(resolveMenuImageUrl(cafeIndex, itemIndex, m.category(), m.imageFile(), usedImageUrls));
            item.setIsAvailable(true);
            item.setIsDeleted(false);
            item.setIsVegetarian(m.isVeg());
            item.setPreparationTimeMinutes(m.prepMins());
            batch.add(item);
        }
        menuItemRepository.saveAll(batch);
        logVerbose("[DevSeed] {} menu items seeded for: {}", batch.size(), cafe.getName());
    }

    private String resolveMenuImageUrl(
            int cafeIndex,
            int itemIndex,
            MenuItem.Category category,
            String fallbackImage,
            Set<String> usedImageUrls
    ) {
        String normalizedFallback = stripQuery(fallbackImage == null ? "" : fallbackImage.trim().toLowerCase(Locale.ROOT));
        if (normalizedFallback.startsWith("assets/")) {
            if (usedImageUrls.add(normalizedFallback)) {
                return withImageVariant(normalizedFallback, cafeIndex, itemIndex);
            }
        }
        if (VALID_MENU_IMAGE_FILES.contains(normalizedFallback)) {
            String preferred = ASSETS_MENU + normalizedFallback;
            if (usedImageUrls.add(preferred)) {
                return withImageVariant(preferred, cafeIndex, itemIndex);
            }
        }

        List<String> categoryPool = CATEGORY_IMAGE_POOL.getOrDefault(category, MENU_IMAGE_POOL);
        String chosen = pickDistinctImageFromPool(categoryPool, cafeIndex, itemIndex, usedImageUrls);
        if (chosen != null) {
            return withImageVariant(chosen, cafeIndex, itemIndex);
        }

        List<String> combinedPool = new ArrayList<>(MENU_IMAGE_POOL.size() + MENU_GENERATED_IMAGE_POOL.size());
        combinedPool.addAll(MENU_IMAGE_POOL);
        combinedPool.addAll(MENU_GENERATED_IMAGE_POOL);

        chosen = pickDistinctImageFromPool(combinedPool, cafeIndex, itemIndex * 5 + 11, usedImageUrls);
        if (chosen != null) {
            return withImageVariant(chosen, cafeIndex, itemIndex);
        }

        chosen = pickDistinctImageFromPool(MENU_GENERATED_IMAGE_POOL, cafeIndex, itemIndex * 7 + 19, usedImageUrls);
        if (chosen != null) {
            return withImageVariant(chosen, cafeIndex, itemIndex);
        }

        return withImageVariant(ASSETS_MENU + "other.jpg", cafeIndex, itemIndex);
    }

    private String withImageVariant(String imageUrl, int cafeIndex, int itemIndex) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return imageUrl;
        }
        String base = stripQuery(imageUrl);
        int safeCafe = cafeIndex < 0 ? 0 : cafeIndex;
        return base + "?demo_c=" + safeCafe + "&demo_i=" + itemIndex;
    }

    private String stripQuery(String value) {
        if (value == null) {
            return "";
        }
        int q = value.indexOf('?');
        return q >= 0 ? value.substring(0, q) : value;
    }

    private String pickDistinctImageFromPool(
            List<String> pool,
            int cafeIndex,
            int itemIndex,
            Set<String> usedImageUrls
    ) {
        if (pool == null || pool.isEmpty()) {
            return null;
        }

        for (int attempt = 0; attempt < pool.size(); attempt++) {
            int idx = Math.floorMod(cafeIndex * 37 + itemIndex * 11 + attempt * 5, pool.size());
            String candidate = pool.get(idx);
            if (usedImageUrls.add(candidate)) {
                return candidate;
            }
        }
        return null;
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

    private List<MenuSeed> buildCompleteMenuForCafe(Cafe cafe, int cafeIndex, List<MenuSeed> baseDefs) {
        Map<MenuItem.Category, MenuSeed> firstByCategory = new HashMap<>();
        for (MenuSeed seed : baseDefs) {
            firstByCategory.putIfAbsent(seed.category(), seed);
        }

        String cafeName = cafe != null && cafe.getName() != null ? cafe.getName().trim() : "Cafe";
        List<MenuSeed> complete = new ArrayList<>(MenuItem.Category.values().length);
        Set<String> usedNames = new HashSet<>();

        for (MenuItem.Category category : MenuItem.Category.values()) {
            MenuSeed existing = firstByCategory.get(category);
            MenuSeed picked = existing != null ? existing : generateMenuSeedForCategory(cafeName, category, cafeIndex);
            String uniqueName = uniqueMenuName(picked.name(), usedNames, category.name() + " " + (complete.size() + 1));
            complete.add(new MenuSeed(
                    uniqueName,
                    picked.description(),
                    picked.price(),
                    category,
                    picked.imageFile(),
                    picked.isVeg(),
                    picked.prepMins()
            ));
        }
        return complete;
    }

    private MenuSeed generateMenuSeedForCategory(String cafeName, MenuItem.Category category, int cafeIndex) {
        String categoryLabel = humanizeCategory(category);
        String itemName = categoryLabel + " Signature";
        String description = "Chef-crafted " + categoryLabel.toLowerCase(Locale.ROOT) + " from " + cafeName + ".";
        double price = defaultPriceForCategory(category, cafeIndex);
        boolean veg = isVegetarianDefault(category);
        int prep = defaultPrepForCategory(category);
        String image = defaultImageFileForCategory(category);
        return new MenuSeed(itemName, description, price, category, image, veg, prep);
    }

    private String uniqueMenuName(String preferred, Set<String> usedNames, String fallbackToken) {
        String base = (preferred == null || preferred.isBlank()) ? ("Chef Item " + fallbackToken) : preferred.trim();
        String key = base.toLowerCase(Locale.ROOT);
        if (usedNames.add(key)) {
            return base;
        }
        int idx = 2;
        while (!usedNames.add((base + " " + idx).toLowerCase(Locale.ROOT))) {
            idx++;
        }
        return base + " " + idx;
    }

    private String humanizeCategory(MenuItem.Category category) {
        String[] words = category.name().toLowerCase(Locale.ROOT).split("_");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            if (w.isEmpty()) continue;
            if (i > 0) sb.append(' ');
            sb.append(Character.toUpperCase(w.charAt(0)));
            if (w.length() > 1) {
                sb.append(w.substring(1));
            }
        }
        return sb.toString();
    }

    private double defaultPriceForCategory(MenuItem.Category category, int cafeIndex) {
        int base = switch (category) {
            case APPETIZER, SOUP, SNACKS, BAKERY, PASTRY, CAKE_SLICE, ICE_CREAM, WAFFLE, PANCAKE -> 169;
            case COFFEE, TEA, JUICE, BEVERAGE, SMOOTHIE, MOCKTAIL, SHAKE, FRAPPE, HOT_CHOCOLATE -> 149;
            case BURGER, PIZZA, PASTA, SANDWICH, WRAP, ROLLS, NOODLES, RICE_BOWL, MAIN_COURSE, COMBO_MEAL -> 259;
            case SEAFOOD, STEAK, GRILL -> 389;
            default -> 219;
        };
        return BigDecimal.valueOf(base + Math.floorMod(cafeIndex * 7 + category.ordinal() * 3, 71))
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private int defaultPrepForCategory(MenuItem.Category category) {
        return switch (category) {
            case STEAK, GRILL, SEAFOOD, BIRYANI, COMBO_MEAL -> 28;
            case PIZZA, PASTA, MAIN_COURSE, NOODLES, RICE_BOWL -> 20;
            case BURGER, SANDWICH, WRAP, ROLLS, MEXICAN, ITALIAN, CHINESE, THAI, INDIAN, KOREAN, JAPANESE, MEDITERRANEAN -> 16;
            case DESSERT, BAKERY, PASTRY, CAKE_SLICE, ICE_CREAM, WAFFLE, PANCAKE -> 10;
            case COFFEE, TEA, JUICE, BEVERAGE, SMOOTHIE, MOCKTAIL, SHAKE, FRAPPE, HOT_CHOCOLATE -> 6;
            default -> 12;
        };
    }

    private boolean isVegetarianDefault(MenuItem.Category category) {
        return switch (category) {
            case SEAFOOD, STEAK, GRILL -> false;
            default -> true;
        };
    }

    private String defaultImageFileForCategory(MenuItem.Category category) {
        return switch (category) {
            case COFFEE -> "coffee.jpg";
            case TEA -> "tea.jpg";
            case JUICE -> "juice.jpg";
            case BEVERAGE, SMOOTHIE, MOCKTAIL, SHAKE, FRAPPE, HOT_CHOCOLATE -> "beverage.jpg";
            case APPETIZER -> "appetizer.jpg";
            case BURGER -> "burger.jpg";
            case PIZZA -> "pizza.jpg";
            case PASTA -> "pasta.jpg";
            case SALAD -> "salad.jpg";
            case SOUP -> "other.jpg";
            case SANDWICH, WRAP, ROLLS -> "sandwich.jpg";
            case DESSERT, BAKERY, PASTRY, CAKE_SLICE, ICE_CREAM, WAFFLE, PANCAKE -> "dessert.jpg";
            case NOODLES, RICE_BOWL, BIRYANI, SEAFOOD, STEAK, GRILL, MAIN_COURSE, COMBO_MEAL -> "other.jpg";
            default -> "snacks.jpg";
        };
    }

    private int resolveCafeSeedIndex(Cafe cafe) {
        if (cafe == null || cafe.getName() == null) {
            return -1;
        }
        String normalized = cafe.getName().trim().toLowerCase(Locale.ROOT);
        if (normalized.startsWith("demo cafe ")) {
            String suffix = normalized.substring("demo cafe ".length()).trim();
            String[] parts = suffix.split("-");
            if (parts.length == 2) {
                try {
                    int owner = Integer.parseInt(parts[0]);
                    int local = Integer.parseInt(parts[1]);
                    if (owner >= 1 && owner <= 5 && local >= 1 && local <= 10) {
                        return (owner - 1) * 10 + (local - 1);
                    }
                } catch (NumberFormatException ignored) {
                    // fall through to legacy names
                }
            }
        }

        return switch (normalized) {
            case "brew haven" -> 0;
            case "urban beans" -> 1;
            case "latte lounge" -> 2;
            case "midnight cafe" -> 3;
            case "sunrise coffee" -> 4;
            case "harbor brew" -> 5;
            case "the garden cafe" -> 6;
            case "bean & stone" -> 7;
            case "the last chapter" -> 8;
            case "ember & oak" -> 9;
            case "bloom cafe" -> 10;
            default -> -1;
        };
    }

    // Cafe 0: Brew Haven (Mumbai)
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

    // Cafe 1: Urban Beans (Pune)
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

    // Cafe 2: Latte Lounge (Bengaluru)
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

    // Cafe 3: Midnight Cafe (Delhi)
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

    // Cafe 4: Sunrise Coffee (Kolkata)
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

    // Cafe 5: Harbor Brew (Mumbai waterfront)
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

    // Cafe 6: The Garden Cafe (Bengaluru)
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

    // Cafe 7: Bean & Stone (Delhi)
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

    // Cafe 8: The Last Chapter (Kolkata)
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

    // Cafe 9: Ember & Oak (Hyderabad)
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

    // Cafe 10: Bloom Cafe (Goa)
    private List<MenuSeed> bloomCafeMenu() {
        return List.of(
            new MenuSeed("Bloom Espresso",       "Single-origin Coorg natural-process espresso",            139, MenuItem.Category.COFFEE,   "coffee.jpg",      true,  3),
            new MenuSeed("Rose Gold Latte",      "Rose syrup, 24k gold flakes & double espresso foam",      289, MenuItem.Category.BEVERAGE, "coffee.jpg",      true,  6),
            new MenuSeed("Elderflower Latte",    "Elderflower cordial & espresso with steamed oat milk",    249, MenuItem.Category.TEA,      "coffee.jpg",      true,  5),
            new MenuSeed("Iced Hibiscus Latte",  "Cold espresso bloomed with hibiscus syrup & oat milk",    229, MenuItem.Category.BEVERAGE, "coffee.jpg",      true,  4),
            new MenuSeed("Butterfly Pea Latte",  "Colour-changing butterfly pea flower espresso latte",     239, MenuItem.Category.TEA,      "coffee.jpg",      true,  5),
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
        String roleToken = isChef ? "chef" : "waiter";
        String rawPw = isChef ? CHEF_PW : WAITER_PW;
        String cafeToken = cafe.getName() == null
                ? "cafe"
                : cafe.getName().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", ".");
        cafeToken = cafeToken.replaceAll("^\\.+|\\.+$", "");
        String email = roleToken + "." + cafeToken + "." + cafe.getId() + "@demo.com";
        String username = roleToken + "." + cafeToken + "." + cafe.getId();

        User staff = userRepository.findByEmail(email).orElseGet(() -> {
            String first = isChef ? "Chef" : "Waiter";
            String last = String.valueOf(cafe.getId());
            User u = buildBaseUser(first, last, email, username, rawPw);
            u.getRoles().add(role);
            return u;
        });

        staff.setCafe(cafe);
        staff.setCreatedByUser(owner);
        staff.setJoiningDate(LocalDate.now().minusMonths(3).minusDays(Math.floorMod(cafeIndex, 20)));
        staff.setExperienceYears(1 + Math.floorMod(cafeIndex, 5));
        staff.setShift(isChef ? "MORNING" : "EVENING");
        if (staff.getRoles().stream().noneMatch(r -> r.getName() == role.getName())) {
            staff.getRoles().add(role);
        }
        User saved = userRepository.save(staff);
        logVerbose("[DevSeed] 1 {} seeded for: {}", isChef ? "chef" : "waiter", cafe.getName());
        return List.of(saved);
    }
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
    // Seeds booking, order, order-item, and payment records with TRANSACTION_SLOTS_PER_CAFE orders per cafe.
    private int seedDemoTransactions(List<Cafe> cafes, List<User> customers) {
        if (customers.isEmpty()) {
            log.warn("[DevSeed] No customers available — skipping orders.");
            return 0;
        }

        int         totalCreated = 0;
        Set<String> usedSlots    = new HashSet<>();   // Req #5: in-memory collision guard

        for (int cafeIdx = 0; cafeIdx < cafes.size(); cafeIdx++) {
            Cafe cafe = cafes.get(cafeIdx);
            User cafeChef = userRepository.findByCafeIdAndRoleName(cafe.getId(), Role.RoleName.CHEF)
                    .stream().findFirst().orElse(null);
            User cafeWaiter = userRepository.findByCafeIdAndRoleName(cafe.getId(), Role.RoleName.WAITER)
                    .stream().findFirst().orElse(null);

            List<CafeTable>  tables    = cafeTableRepository.findByCafeId(cafe.getId());
            List<MenuItem>   menuItems = menuItemRepository
                    .findByCafeIdAndIsAvailableTrueAndIsDeletedFalse(cafe.getId());

            if (tables.isEmpty() || menuItems.isEmpty()) {
                log.warn("[DevSeed] Skipping orders for {} — no tables or menu items.", cafe.getName());
                continue;
            }

            for (int slot = 0; slot < TRANSACTION_SLOTS_PER_CAFE; slot++) {
                int slotIdx = Math.floorMod(slot, STATUS_CYCLE.length);
                int cycle = slot / STATUS_CYCLE.length;
                CafeTable table = tables.get(Math.floorMod(slot, tables.size()));
                Order.OrderStatus status = STATUS_CYCLE[slotIdx];
                int daysAgo = DAYS_AGO[slotIdx] + (cycle * 8);

                LocalDate bookingDate = LocalDate.now().minusDays(daysAgo);   // Req #6
                LocalTime bookingTime = LocalTime.of(BOOKING_HOURS[slotIdx], BOOKING_MINS[slotIdx]);

                // Derive placedAt: past orders placed at the actual booking hour; today's placed recently
                LocalDateTime placedAt = (daysAgo > 0)
                    ? bookingDate.atTime(bookingTime)
                    : LocalDateTime.now().minusHours(slot == 7 ? 4 : slot == 8 ? 2 : 1).minusMinutes(30);
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

                User customer = customers.get((cafeIdx * TRANSACTION_SLOTS_PER_CAFE + slot) % customers.size());

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
                    // Set createdAt before save so auditing preserves historical times for analytics.
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

                    // Keep staff columns populated in dev list views.
                    if (cafeChef != null) {
                        order.setPreparingByChef(cafeChef);
                    }
                    if (cafeWaiter != null) {
                        order.setServedByWaiter(cafeWaiter);
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
                    // Anchor createdAt to placedAt so historical orders land in the correct analytics day bucket.
                    order.setCreatedAt(placedAt);
                    Order savedOrder = orderRepository.save(order);   // cascade saves OrderItems

                    // 9d. Payment metadata coverage for dashboards and table views.
                    Payment.PaymentMethod method = (slot % 2 == 0)
                            ? Payment.PaymentMethod.UPI
                            : Payment.PaymentMethod.CREDIT_CARD;
                    Payment payment = new Payment();
                    payment.setOrder(savedOrder);
                    payment.setAmount(total);
                    payment.setCurrency("INR");
                    payment.setPaymentMethod(method);
                    payment.setPaymentGateway("RAZORPAY");
                    payment.setTransactionId("TXN_DEMO_" +
                            UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
                    payment.setPaymentGatewayOrderId("order_DEMO_" + cafeIdx + "_" + slot);
                    payment.setInitiatedAt(placedAt);

                    if (status == Order.OrderStatus.PENDING_PAYMENT) {
                        payment.setStatus(Payment.PaymentStatus.PENDING);
                    } else if (status == Order.OrderStatus.CANCELLED) {
                        payment.setStatus(Payment.PaymentStatus.CANCELLED);
                        payment.setFailureReason("Order cancelled before capture");
                        payment.setFailedAt(placedAt.plusMinutes(10));
                    } else {
                        payment.setStatus(Payment.PaymentStatus.CAPTURED);
                        payment.setPaymentGatewayPaymentId("pay_DEMO_" +
                                UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase());
                        payment.setCompletedAt(placedAt.plusMinutes(40));
                    }

                    paymentRepository.save(payment);

                    // Mark tables occupied for today's active orders so availability charts stay realistic.
                    if (daysAgo == 0
                            && status != Order.OrderStatus.SERVED
                            && status != Order.OrderStatus.CANCELLED) {
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
        cafes.sort(Comparator.comparing(Cafe::getId));

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
            String targetLogo = withCafeMediaVariant(DEMO_CAFE_LOGOS[i % DEMO_CAFE_LOGOS.length], "logo", i);
            if (!targetLogo.equals(cafe.getLogoUrl())) {
                cafe.setLogoUrl(targetLogo);
                changed = true;
            }
            String targetCover = withCafeMediaVariant(DEMO_CAFE_COVERS[i % DEMO_CAFE_COVERS.length], "cover", i);
            if (!targetCover.equals(cafe.getCoverUrl())) {
                cafe.setCoverUrl(targetCover);
                changed = true;
            }
            if (!targetCover.equals(cafe.getImageUrl())) {
                cafe.setImageUrl(targetCover);
                changed = true;
            }
            if (!Boolean.TRUE.equals(cafe.getIsActive())) {
                cafe.setIsActive(true);
                changed = true;
            }
            if (changed) {
                cafeRepository.save(cafe);
                cafesUpdated++;
            }

            List<CafeGallery> gallery = cafeGalleryRepository.findByCafeIdOrderByDisplayOrderAsc(cafe.getId());
            for (int g = 0; g < 3; g++) {
                int galleryIdx = i * 3 + g;
                if (galleryIdx >= ALL_GALLERY.length) {
                    galleryIdx = Math.floorMod(galleryIdx, ALL_GALLERY.length);
                }
                String target = withCafeMediaVariant(ALL_GALLERY[galleryIdx], "gallery" + g, i);
                if (g < gallery.size()) {
                    CafeGallery existing = gallery.get(g);
                    boolean galleryChanged = false;
                    if (!target.equals(existing.getImageUrl())) {
                        existing.setImageUrl(target);
                        galleryChanged = true;
                    }
                    if (existing.getDisplayOrder() != g) {
                        existing.setDisplayOrder(g);
                        galleryChanged = true;
                    }
                    if (galleryChanged) {
                        cafeGalleryRepository.save(existing);
                    }
                } else {
                    cafeGalleryRepository.save(CafeGallery.builder()
                            .cafe(cafe)
                            .imageUrl(target)
                            .caption(cafe.getName() + " — gallery photo " + (g + 1))
                            .displayOrder(g)
                            .createdAt(LocalDateTime.now().minusDays(3 - g))
                            .build());
                }
            }
        }

        Role chefRole = roleRepository.findByName(Role.RoleName.CHEF).orElse(null);
        Role waiterRole = roleRepository.findByName(Role.RoleName.WAITER).orElse(null);
        for (int i = 0; i < cafes.size(); i++) {
            Cafe cafe = cafes.get(i);
            User cafeOwner = cafe.getOwner() != null
                    ? cafe.getOwner()
                    : (!owners.isEmpty() ? owners.get(i % owners.size()) : defaultOwner);

            List<User> chefsForCafe = userRepository.findByCafeIdAndRoleName(cafe.getId(), Role.RoleName.CHEF);
            if (chefsForCafe.isEmpty() && chefRole != null && cafeOwner != null) {
                seedStaff(cafe, chefRole, cafeOwner, i, true);
                chefsForCafe = userRepository.findByCafeIdAndRoleName(cafe.getId(), Role.RoleName.CHEF);
            }
            chefsForCafe.stream().sorted(Comparator.comparing(User::getId)).skip(1).forEach(extra -> {
                extra.setIsActive(false);
                userRepository.save(extra);
            });

            List<User> waitersForCafe = userRepository.findByCafeIdAndRoleName(cafe.getId(), Role.RoleName.WAITER);
            if (waitersForCafe.isEmpty() && waiterRole != null && cafeOwner != null) {
                seedStaff(cafe, waiterRole, cafeOwner, i, false);
                waitersForCafe = userRepository.findByCafeIdAndRoleName(cafe.getId(), Role.RoleName.WAITER);
            }
            waitersForCafe.stream().sorted(Comparator.comparing(User::getId)).skip(1).forEach(extra -> {
                extra.setIsActive(false);
                userRepository.save(extra);
            });
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

            Cafe orderCafe = order.getCafe();
            if (orderCafe != null) {
                User cafeChef = userRepository.findByCafeIdAndRoleName(orderCafe.getId(), Role.RoleName.CHEF)
                        .stream().findFirst().orElse(null);
                User cafeWaiter = userRepository.findByCafeIdAndRoleName(orderCafe.getId(), Role.RoleName.WAITER)
                        .stream().findFirst().orElse(null);
                if (order.getPreparingByChef() == null && cafeChef != null) {
                    order.setPreparingByChef(cafeChef);
                    changed = true;
                }
                if (order.getServedByWaiter() == null && cafeWaiter != null) {
                    order.setServedByWaiter(cafeWaiter);
                    changed = true;
                }
            }

            if (changed) {
                orderRepository.save(order);
                ordersUpdated++;
            }
        }

        int paymentsUpdated = 0;
        for (Order order : orders) {
            if (paymentRepository.findByOrderId(order.getId()).isPresent()) {
                continue;
            }

            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setAmount(order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);
            payment.setCurrency("INR");
            payment.setPaymentMethod(Payment.PaymentMethod.UPI);
            payment.setPaymentGateway("RAZORPAY");
            payment.setTransactionId("TXN-FIX-" + order.getId());
            payment.setPaymentGatewayOrderId("order_FIX_" + order.getId());

            LocalDateTime baseTime = order.getPlacedAt() != null
                    ? order.getPlacedAt()
                    : (order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now());
            payment.setInitiatedAt(baseTime);

            if (order.getStatus() == Order.OrderStatus.PENDING_PAYMENT) {
                payment.setStatus(Payment.PaymentStatus.PENDING);
            } else if (order.getStatus() == Order.OrderStatus.CANCELLED) {
                payment.setStatus(Payment.PaymentStatus.CANCELLED);
                payment.setFailureReason("Order cancelled before capture");
                payment.setFailedAt(baseTime.plusMinutes(10));
            } else {
                payment.setStatus(Payment.PaymentStatus.CAPTURED);
                payment.setPaymentGatewayPaymentId("pay_FIX_" + order.getId());
                payment.setCompletedAt(baseTime.plusMinutes(35));
            }

            paymentRepository.save(payment);
            paymentsUpdated++;
        }

        List<Payment> payments = paymentRepository.findAll();
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
        Map<Long, Set<String>> usedImagesByCafe = new HashMap<>();
        Map<Long, Integer> itemOffsetByCafe = new HashMap<>();
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

            Long perCafeKey = item.getCafe() != null ? item.getCafe().getId() : -1L;
            int itemOffset = itemOffsetByCafe.getOrDefault(perCafeKey, 0);
            int cafeSeedIndex = resolveCafeSeedIndex(item.getCafe());
            MenuItem.Category targetCategory = item.getCategory() == null ? MenuItem.Category.OTHER : item.getCategory();
            if (item.getCategory() == null) {
                item.setCategory(targetCategory);
                changed = true;
            }
            Set<String> usedImages = usedImagesByCafe.computeIfAbsent(perCafeKey, key -> new HashSet<>());
            String expectedImage = resolveMenuImageUrl(
                    cafeSeedIndex,
                    itemOffset,
                    targetCategory,
                    item.getImageUrl(),
                    usedImages
            );
            itemOffsetByCafe.put(perCafeKey, itemOffset + 1);
            if (!expectedImage.equals(item.getImageUrl())) {
                item.setImageUrl(expectedImage);
                changed = true;
            }

            if (changed) {
                menuItemRepository.save(item);
                menuItemsUpdated++;
            }
        }

        // Enforce demo cafes to have one item per category (50 total categories) without duplicate tags.
        for (Cafe cafe : cafes) {
            int cafeSeedIndex = resolveCafeSeedIndex(cafe);
            if (cafeSeedIndex < 0) {
                continue;
            }

            List<MenuItem> activeItems = menuItemRepository.findAll().stream()
                    .filter(mi -> mi.getCafe() != null
                            && mi.getCafe().getId().equals(cafe.getId())
                            && !Boolean.TRUE.equals(mi.getIsDeleted()))
                    .sorted(Comparator.comparing(MenuItem::getId))
                    .toList();

            Map<MenuItem.Category, MenuItem> firstByCategory = new HashMap<>();
            Set<String> usedNames = new HashSet<>();
            Set<String> usedImageUrls = new HashSet<>();
            int slot = 0;

            for (MenuItem item : activeItems) {
                MenuItem.Category category = item.getCategory() == null ? MenuItem.Category.OTHER : item.getCategory();
                if (firstByCategory.containsKey(category)) {
                    item.setIsDeleted(true);
                    item.setIsAvailable(false);
                    menuItemRepository.save(item);
                    duplicateMenuItemsMarked++;
                    menuItemsUpdated++;
                    continue;
                }

                firstByCategory.put(category, item);
                String name = item.getName() != null ? item.getName().trim() : "";
                String uniqueName = uniqueMenuName(name, usedNames, category.name());
                if (!uniqueName.equals(item.getName())) {
                    item.setName(uniqueName);
                    menuItemsUpdated++;
                }
                String expectedImage = resolveMenuImageUrl(cafeSeedIndex, slot++, category, item.getImageUrl(), usedImageUrls);
                if (!expectedImage.equals(item.getImageUrl())) {
                    item.setImageUrl(expectedImage);
                    menuItemsUpdated++;
                }
                item.setCategory(category);
                item.setIsDeleted(false);
                item.setIsAvailable(true);
                menuItemRepository.save(item);
            }

            List<MenuSeed> completeDefs = buildCompleteMenuForCafe(cafe, cafeSeedIndex, getMenuItemsForCafe(cafeSeedIndex));
            Map<MenuItem.Category, MenuSeed> templateByCategory = new HashMap<>();
            for (MenuSeed ms : completeDefs) {
                templateByCategory.put(ms.category(), ms);
            }

            for (MenuItem.Category category : MenuItem.Category.values()) {
                if (firstByCategory.containsKey(category)) {
                    continue;
                }
                MenuSeed seed = templateByCategory.getOrDefault(
                        category,
                        generateMenuSeedForCategory(cafe.getName(), category, cafeSeedIndex)
                );
                String uniqueName = uniqueMenuName(seed.name(), usedNames, category.name());
                MenuItem add = new MenuItem();
                add.setCafe(cafe);
                add.setName(uniqueName);
                add.setDescription(seed.description());
                add.setPrice(BigDecimal.valueOf(seed.price()));
                add.setCategory(category);
                add.setImageUrl(resolveMenuImageUrl(cafeSeedIndex, slot++, category, seed.imageFile(), usedImageUrls));
                add.setIsAvailable(true);
                add.setIsDeleted(false);
                add.setIsVegetarian(seed.isVeg());
                add.setPreparationTimeMinutes(seed.prepMins());
                menuItemRepository.save(add);
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
            case PENDING_PAYMENT      -> Booking.BookingStatus.PENDING;
            case CANCELLED            -> Booking.BookingStatus.CANCELLED;
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
            case PENDING_PAYMENT -> { /* no kitchen timestamps yet */ }
            case CANCELLED -> {
                order.setCancelledAt(placedAt.plusMinutes(2));
                order.setCancellationReason("Demo cancellation metadata for dashboard visibility.");
            }
            case PLACED -> { /* no sub-timestamps yet */ }
        }
    }

}

