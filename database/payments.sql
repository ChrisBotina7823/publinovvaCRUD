CREATE TABLE `payments` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `payment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `customer_id` INT DEFAULT NULL,
    `paid_amount` DECIMAL DEFAULT 0,
    `pending_amount` DECIMAL DEFAULT 0,
    `description` TEXT,
    KEY `fk_customer` (`customer_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
)