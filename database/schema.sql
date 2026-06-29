-- ============================================================
-- Peter Market - Esquema de Base de Datos (MySQL / PostgreSQL)
-- ============================================================

CREATE TABLE users (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(120)    NOT NULL,
    email       VARCHAR(255)    NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role        ENUM('admin','empleado','cliente') NOT NULL DEFAULT 'cliente',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE products (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED    NOT NULL,
    name        VARCHAR(200)    NOT NULL,
    description TEXT,
    price       DECIMAL(10,2)   NOT NULL,
    stock       INT UNSIGNED    NOT NULL DEFAULT 0,
    image_url   VARCHAR(500),
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id)
        REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED    NOT NULL,
    total_amount DECIMAL(12,2)  NOT NULL,
    status      ENUM('pendiente','confirmado','enviado','entregado','cancelado')
                NOT NULL DEFAULT 'pendiente',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_details (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id    INT UNSIGNED    NOT NULL,
    product_id  INT UNSIGNED    NOT NULL,
    quantity    INT UNSIGNED    NOT NULL,
    unit_price  DECIMAL(10,2)   NOT NULL,
    subtotal    DECIMAL(12,2)   NOT NULL,
    CONSTRAINT fk_detail_order   FOREIGN KEY (order_id)
        REFERENCES orders(id)   ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detail_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_details_order ON order_details(order_id);
