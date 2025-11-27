-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : jeu. 27 nov. 2025 à 21:12
-- Version du serveur : 8.0.44-0ubuntu0.24.04.1
-- Version de PHP : 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `w9ayetdelivery`
--

-- --------------------------------------------------------

--
-- Structure de la table `attachments`
--

CREATE TABLE `attachments` (
  `id` int UNSIGNED NOT NULL,
  `sent_by` enum('message','delivery','user','company') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int UNSIGNED NOT NULL,
  `url` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `attachments`
--

INSERT INTO `attachments` (`id`, `sent_by`, `entity_id`, `url`, `mime_type`, `created_at`) VALUES
(1, 'message', 4, 'http://localhost:3200/uploads/chat/1764119482220-264095622.js', 'text/javascript', '2025-11-26 02:11:22'),
(2, 'message', 5, 'http://localhost:3200/uploads/chat/1764119730449-600906936.pdf', 'application/pdf', '2025-11-26 02:15:30'),
(3, 'message', 6, 'http://localhost:3200/uploads/chat/1764119795181-843689090.pdf', 'application/pdf', '2025-11-26 02:16:35'),
(4, 'message', 7, 'http://localhost:3200/api/chat/attachments/1764119899268-81749836.png', 'image/png', '2025-11-26 02:18:19');

-- --------------------------------------------------------

--
-- Structure de la table `companies`
--

CREATE TABLE `companies` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo_url` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `legal_status` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `companies`
--

INSERT INTO `companies` (`id`, `user_id`, `name`, `logo_url`, `tax_id`, `legal_status`, `created_at`) VALUES
(14, 41, 'fedex', 'http://localhost:3200/uploads/o3O1d1H__400x400.jpg', '123456', 'SA', '2025-11-20 19:27:12'),
(15, 43, 'test', 'http://localhost:3200/uploads/Screenshot from 2025-11-22 00-19-03.png', '454554', 'test', '2025-11-22 23:50:13');

-- --------------------------------------------------------

--
-- Structure de la table `contact`
--

CREATE TABLE `contact` (
  `id` int NOT NULL,
  `fullname` varchar(64) NOT NULL,
  `email` varchar(64) NOT NULL,
  `tell` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `contact`
--

INSERT INTO `contact` (`id`, `fullname`, `email`, `tell`) VALUES
(5, 'karim ben ahmed', 'ibrahimghorbali605@gmail.com', 'ygvygyythby');

-- --------------------------------------------------------

--
-- Structure de la table `conversations`
--

CREATE TABLE `conversations` (
  `id` int UNSIGNED NOT NULL,
  `type` enum('delivery_thread','support','general') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_id` int UNSIGNED DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `conversations`
--

INSERT INTO `conversations` (`id`, `type`, `subject`, `delivery_id`, `created_at`) VALUES
(2, 'delivery_thread', 'Delivery #3', 3, '2025-11-26 01:36:29'),
(3, 'delivery_thread', 'Delivery #4', 4, '2025-11-26 02:26:58'),
(4, 'delivery_thread', 'Delivery #5', 5, '2025-11-27 21:16:36'),
(5, 'delivery_thread', 'Delivery #7', 7, '2025-11-27 22:07:26');

-- --------------------------------------------------------

--
-- Structure de la table `deliveries`
--

CREATE TABLE `deliveries` (
  `id` int UNSIGNED NOT NULL,
  `client_id` int UNSIGNED NOT NULL,
  `company_id` int UNSIGNED NOT NULL,
  `driver_id` int UNSIGNED DEFAULT NULL,
  `pickup_address` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dropoff_address` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receiver_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receiver_phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weight` decimal(10,2) DEFAULT NULL,
  `size` enum('S','M','L') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'TND',
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_amount` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','accepted','in_transit','delivered','cancelled','returned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `deliveries`
--

INSERT INTO `deliveries` (`id`, `client_id`, `company_id`, `driver_id`, `pickup_address`, `dropoff_address`, `receiver_name`, `receiver_phone`, `weight`, `size`, `price`, `currency`, `payment_method`, `payment_amount`, `status`, `completed_at`, `created_at`, `updated_at`) VALUES
(1, 42, 14, NULL, 'azazaz', 'Naftal GPL, نـهــج الشهيد عاشور عبد القادر, 39008 Kouinine, Algérie', 'ahmedbenahmed', '28123789', 45.00, 'M', 64.00, 'TND', 'Cash on Delivery', 72.00, 'pending', NULL, '2025-11-22 23:52:49', '2025-11-27 21:15:29'),
(2, 42, 14, NULL, 'azazaz', 'El Ouaha, Tunisie', 'ahmedbenahmed', '28123789', 12.00, 'S', 22.40, 'TND', 'Cash on Delivery', 30.40, 'pending', NULL, '2025-11-23 01:07:45', '2025-11-27 21:15:29'),
(3, 44, 14, 1, 'hay riadh sousse', 'Kasbet Ouled Saidane 01, Ras El Oued, Tunisie', 'Mayssa Ben Chikh Abderrahmen', '+21620023075', 0.50, 'M', 10.60, 'TND', 'Cash on Delivery', 18.60, 'pending', NULL, '2025-11-25 23:19:23', '2025-11-27 21:15:29'),
(4, 44, 15, 1, 'hay riadh sousse', 'Cite L\'Aeroport, Tunisie', 'Mayssa Ben Chikh Abderrahmen', '+21620023075', 1.00, 'M', 11.20, 'TND', 'Cash on Delivery', 19.20, 'delivered', NULL, '2025-11-26 02:26:18', '2025-11-27 21:15:29'),
(5, 44, 14, 1, 'sousse', 'tunis', NULL, NULL, 5.00, 'S', 55.05, 'TND', 'Cash on delivery', 63.05, 'returned', NULL, '2025-11-27 21:04:32', '2025-11-27 22:05:40'),
(6, 44, 14, 1, 'hay riadh sousse', 'Station de Bou Arkoub, 8040 Bou Argoub, Tunisie', 'maram', '11111111', 1.00, 'M', 11.20, 'TND', 'Cash on Delivery', NULL, 'returned', NULL, '2025-11-27 21:22:46', '2025-11-27 21:46:06'),
(7, 44, 14, 1, 'hay riadh sousse', 'Rue du Dinars, Sousse Jawhara, Tunisie', 'maram', '+21655422714', 1.00, 'M', 11.20, 'TND', 'Cash on Delivery', 18.20, 'delivered', NULL, '2025-11-27 21:29:15', '2025-11-27 21:30:55');

-- --------------------------------------------------------

--
-- Structure de la table `drivers`
--

CREATE TABLE `drivers` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `company_id` int UNSIGNED NOT NULL,
  `status` enum('available','busy','suspended','offline') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `drivers`
--

INSERT INTO `drivers` (`id`, `user_id`, `company_id`, `status`, `created_at`) VALUES
(1, 45, 14, 'available', '2025-11-25 23:23:58');

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `id` int UNSIGNED NOT NULL,
  `conversation_id` int UNSIGNED NOT NULL,
  `sender_id` int UNSIGNED NOT NULL,
  `receiver_id` int UNSIGNED DEFAULT NULL,
  `text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `attachment_id` int UNSIGNED DEFAULT NULL,
  `status` enum('sent','delivered','seen') COLLATE utf8mb4_unicode_ci DEFAULT 'sent',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `receiver_id`, `text`, `attachment_id`, `status`, `created_at`) VALUES
(3, 2, 44, 45, 'cc', NULL, 'seen', '2025-11-26 02:11:01'),
(4, 2, 44, 45, NULL, 1, 'seen', '2025-11-26 02:11:22'),
(5, 2, 44, 45, NULL, 2, 'seen', '2025-11-26 02:15:30'),
(6, 2, 44, 45, NULL, 3, 'seen', '2025-11-26 02:16:35'),
(7, 2, 44, 45, NULL, 4, 'seen', '2025-11-26 02:18:19'),
(8, 3, 44, 45, 'cc', NULL, 'seen', '2025-11-26 02:27:02'),
(9, 3, 45, 44, 'ff', NULL, 'seen', '2025-11-26 02:32:11'),
(10, 3, 44, 45, 'cc', NULL, 'seen', '2025-11-26 02:32:20'),
(11, 3, 44, 45, 'vv', NULL, 'seen', '2025-11-26 02:35:58'),
(12, 3, 45, 44, 'cc', NULL, 'seen', '2025-11-26 02:43:12'),
(13, 3, 45, 44, 'cc', NULL, 'seen', '2025-11-26 02:47:10'),
(14, 3, 45, 44, 'cc', NULL, 'seen', '2025-11-26 02:47:14'),
(15, 3, 44, 45, 'cc', NULL, 'seen', '2025-11-26 02:47:37'),
(16, 3, 45, 44, 'cc', NULL, 'seen', '2025-11-26 02:48:43'),
(17, 3, 44, 45, 'cv', NULL, 'seen', '2025-11-26 02:48:49'),
(18, 3, 44, 45, 'cc', NULL, 'seen', '2025-11-26 02:55:24'),
(19, 3, 45, 44, 'bonjour', NULL, 'seen', '2025-11-26 02:55:30'),
(20, 2, 44, 45, 'cc', NULL, 'seen', '2025-11-26 22:33:12'),
(21, 2, 45, 44, 'cc', NULL, 'sent', '2025-11-27 22:03:33'),
(22, 5, 45, 44, 'vv', NULL, 'sent', '2025-11-27 22:07:30');

-- --------------------------------------------------------

--
-- Structure de la table `reviews`
--

CREATE TABLE `reviews` (
  `id` int UNSIGNED NOT NULL,
  `client_id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `rating` tinyint NOT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('client','driver','company','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','suspended','banned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `verified` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_seen` datetime DEFAULT NULL,
  `is_online` tinyint(1) NOT NULL DEFAULT '0',
  `reset_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_code_expires` datetime DEFAULT NULL,
  `verification_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verification_token_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `address`, `status`, `verified`, `created_at`, `last_seen`, `is_online`, `reset_code`, `reset_code_expires`, `verification_token`, `verification_token_expires`) VALUES
(2, 'ibrahim ghorbali', 'ibrahimghorbali605@gmail.com', '26044125', '$2b$10$PgFk3YBdkqmJnq5kMVtSsuF0dUPXCRRY5ovkajRGUIxmrLMewDQL2', 'admin', 'Rue slovaquia, erriadh, sousse', 'active', 1, '2025-11-02 14:24:36', NULL, 0, NULL, NULL, NULL, NULL),
(41, 'fedex ', 'fedex@company.com', '12345678', '$2b$10$nQV7zDqLrhKxRLXIQ06I3ODwKgau3GfIJdjpRa01qwBDoL0XyjQAy', 'company', 'street', 'active', 0, '2025-11-20 19:27:12', NULL, 0, NULL, NULL, NULL, NULL),
(42, 'ahmedbenahmed', 'crackertn433@gmail.com', '28123789', '$2b$10$pt2iGVKaJxvC64T5TIgnl.incAVdpvxhvXGUFbuD9idVfwNtWhgbG', 'client', 'Kanaan,sousse,tunisie', 'active', 1, '2025-11-22 21:32:49', NULL, 0, NULL, NULL, NULL, NULL),
(43, 'test', 'aaa@gmail.com', '4545454545', '$2b$10$gwaLO8UUzj4YhxeE3hoUAOV5gDHLj4he95eII/en2hSR1pZSvbYN2', 'company', 'aaa', 'active', 0, '2025-11-22 23:50:13', NULL, 0, NULL, NULL, NULL, NULL),
(44, 'Mayssa Ben Chikh Abderrahmen', 'abderrahmenmayssa@gmail.com', '+21620023075', '$2b$10$e88JDQ5QAMNWs.30uLATsecmba87XXzmJ1n7ii017heXlcwLgUILG', 'client', '34 Rue de Malli cité Ennouzha', 'active', 0, '2025-11-25 23:13:26', '2025-11-27 21:25:56', 0, NULL, NULL, NULL, NULL),
(45, 'mimii', 'mayssaabd9@gmail.com', '2111118', '$2b$10$e88JDQ5QAMNWs.30uLATsecmba87XXzmJ1n7ii017heXlcwLgUILG', 'driver', 'hohooh', 'active', 0, '2025-11-25 23:22:58', '2025-11-27 22:11:16', 0, NULL, NULL, NULL, NULL);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `attachments`
--
ALTER TABLE `attachments`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Index pour la table `contact`
--
ALTER TABLE `contact`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `delivery_id` (`delivery_id`);

--
-- Index pour la table `deliveries`
--
ALTER TABLE `deliveries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `driver_id` (`driver_id`);

--
-- Index pour la table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `company_id` (`company_id`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `attachment_id` (`attachment_id`),
  ADD KEY `fk_messages_receiver` (`receiver_id`);

--
-- Index pour la table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`),
  ADD KEY `delivery_id` (`delivery_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `attachments`
--
ALTER TABLE `attachments`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `contact`
--
ALTER TABLE `contact`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `deliveries`
--
ALTER TABLE `deliveries`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT pour la table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `fk_companies_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `deliveries`
--
ALTER TABLE `deliveries`
  ADD CONSTRAINT `deliveries_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `deliveries_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `deliveries_ibfk_3` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `drivers`
--
ALTER TABLE `drivers`
  ADD CONSTRAINT `drivers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `drivers_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`attachment_id`) REFERENCES `attachments` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
