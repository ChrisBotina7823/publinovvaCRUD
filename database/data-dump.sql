-- MySQL dump 10.13  Distrib 8.1.0, for Win64 (x86_64)
--
-- Host: localhost    Database: db_links
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `folderId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (19,'ventas@publinovva.com','$2a$10$sXoc4D8sdCrLv3ekvuLVe.aXLKJyKaCUbNWJ1X5kwUUJB5oPghIri','Publinovva','1bTSK2peBpqb1CoO5yG66pNWwg0ThogNV');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(64) NOT NULL,
  `folderId` varchar(255) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(64) NOT NULL,
  `email` varchar(64) NOT NULL,
  `document` varchar(64) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` varchar(64) NOT NULL DEFAULT 'not started',
  `storage` int NOT NULL DEFAULT '0',
  `credit_amount` decimal(15,2) DEFAULT NULL,
  `credit_process` varchar(255) DEFAULT '---',
  `bank_number` varchar(255) DEFAULT '---',
  `available_balance` decimal(15,2) DEFAULT NULL,
  `photoId` text,
  `realization` varchar(255) DEFAULT 'en proceso',
  `realization_amount` decimal(15,2) DEFAULT NULL,
  `credit_note` varchar(255) DEFAULT NULL,
  `type` text,
  `fee_number` int DEFAULT '0',
  `fee_value` decimal(15,2) DEFAULT NULL,
  `payment_notification` tinyint(1) DEFAULT '0',
  `pending_description` text,
  `opportune_payment_date` date DEFAULT NULL,
  `max_payment_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `document` (`document`),
  KEY `fk_user` (`user_id`),
  CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `admins` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (77,'Cristian Eduardo Botina Carpio','1HelJF5_fbD3mUHHAAqBmGtkQFfc7BDuz',19,'2023-07-27 14:43:06','+573128265879','criedboca@gmail.com','1080691521','123','pending',217320),(91,'Cristian Eduardo Botina Carpio','15Kq8_VBFixhaS3v0ksR0g0pD2AZc5Jee',19,'2023-07-27 20:37:10','+573128265879','criedboca@gmail.com','1080691521aa','123','not started',0);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('8Z8tkRNH9rwk8JUmtCFgKqhVz5Taco4e',1690576691,'{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{},\"passport\":{\"user\":{\"id\":19,\"email\":\"ventas@publinovva.com\",\"password\":\"$2a$10$sXoc4D8sdCrLv3ekvuLVe.aXLKJyKaCUbNWJ1X5kwUUJB5oPghIri\",\"name\":\"Publinovva\",\"folderId\":\"1bTSK2peBpqb1CoO5yG66pNWwg0ThogNV\",\"type\":\"admin\"}}}'),('ORAj_dEJBuJwa2ug2zUY6w1IOWWIEoPB',1690571728,'{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),('jdYBKE2nODFrxFbSE0jHDmWZa_kkzIFX',1690569094,'{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),('knGDOc1j7YtzUqgD_P2JyKbUrJfqcByG',1690553136,'{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),('t4CfpgidqyWMiwipoFd86a0hwSQRVhlj',1690556862,'{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{},\"passport\":{\"user\":{\"id\":19,\"email\":\"ventas@publinovva.com\",\"password\":\"$2a$10$sXoc4D8sdCrLv3ekvuLVe.aXLKJyKaCUbNWJ1X5kwUUJB5oPghIri\",\"name\":\"Publinovva\",\"folderId\":\"1bTSK2peBpqb1CoO5yG66pNWwg0ThogNV\",\"type\":\"admin\"}}}');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-07-27 18:12:49
