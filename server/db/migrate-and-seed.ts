import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

const sql = neon(connectionString);

async function runMigrationAndSeed() {
  console.log('🚀 Running database migrations on Neon PostgreSQL...');

  try {
    // 1. Create Tables
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'cashier',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ admin_users table checked/created');

    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ categories table checked/created');

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        name VARCHAR(150) NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        price INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        is_available BOOLEAN NOT NULL DEFAULT true,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ products table checked/created');

    await sql`
      CREATE TABLE IF NOT EXISTS cafe_tables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        table_number VARCHAR(20) NOT NULL UNIQUE,
        qr_token VARCHAR(64) NOT NULL UNIQUE,
        location_note VARCHAR(100),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ cafe_tables table checked/created');

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(32) NOT NULL UNIQUE,
        table_id UUID NOT NULL REFERENCES cafe_tables(id) ON DELETE RESTRICT,
        customer_name VARCHAR(100),
        status VARCHAR(30) NOT NULL DEFAULT 'menunggu',
        payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
        payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        total_amount INTEGER NOT NULL,
        notes TEXT,
        idempotency_key VARCHAR(64) UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ orders table checked/created');

    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(150) NOT NULL,
        unit_price INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ order_items table checked/created');

    // Create indexes for fast query performance
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cafe_tables_token ON cafe_tables(qr_token);`;
    console.log('✅ Indexes verified');

    // 2. Seed Data
    console.log('🌱 Seeding initial records...');

    // Seed Admin Users if empty
    const existingAdmins = await sql`SELECT count(*) as count FROM admin_users`;
    if (parseInt(existingAdmins[0].count) === 0) {
      const adminPassHash = await bcrypt.hash('admin123', 10);
      const cashierPassHash = await bcrypt.hash('kasir123', 10);

      await sql`
        INSERT INTO admin_users (username, password_hash, name, role, is_active)
        VALUES 
          ('admin', ${adminPassHash}, 'Manager Warkop', 'admin', true),
          ('kasir', ${cashierPassHash}, 'Kasir Barista', 'cashier', true)
      `;
      console.log('✅ Seeded admin users (admin: admin123, kasir: kasir123)');
    } else {
      console.log('ℹ️ Admin users already exist');
    }

    // Seed Tables if empty
    const existingTables = await sql`SELECT count(*) as count FROM cafe_tables`;
    if (parseInt(existingTables[0].count) === 0) {
      const initialTables = [
        { num: '01', token: 'wrk_tbl_01_a8f92b', note: 'Lantai 1 - Dekat Jendela Depan' },
        { num: '02', token: 'wrk_tbl_02_c4e17d', note: 'Lantai 1 - Samping Coffee Bar' },
        { num: '03', token: 'wrk_tbl_03_9a2b5e', note: 'Lantai 1 - Tengah Ruangan' },
        { num: '04', token: 'wrk_tbl_04_3f7d1a', note: 'Lantai 1 - Sudut Santai' },
        { num: '05', token: 'wrk_tbl_05_6e8b2c', note: 'Lantai 2 - Meja Komunal Komunitas' },
        { num: '06', token: 'wrk_tbl_06_1b9d4f', note: 'Lantai 2 - Sofa Pojok' },
        { num: '07', token: 'wrk_tbl_07_5c2a8e', note: 'Outdoor / Smoking Area A' },
        { num: '08', token: 'wrk_tbl_08_7e4f1b', note: 'Outdoor / Smoking Area B' },
      ];

      for (const t of initialTables) {
        await sql`
          INSERT INTO cafe_tables (table_number, qr_token, location_note, is_active)
          VALUES (${t.num}, ${t.token}, ${t.note}, true)
        `;
      }
      console.log('✅ Seeded 8 cafe tables with distinct tokens');
    } else {
      console.log('ℹ️ Cafe tables already exist');
    }

    // Seed Categories & Products if empty
    const existingCategories = await sql`SELECT count(*) as count FROM categories`;
    if (parseInt(existingCategories[0].count) === 0) {
      // 1. Kopi & Espresso
      const [catCoffee] = await sql`
        INSERT INTO categories (name, slug, description, sort_order)
        VALUES ('Kopi & Espresso', 'kopi-espresso', 'Racikan kopi nusantara dengan karakter pekat, aroma karamel, dan body yang mantap.', 1)
        RETURNING id;
      `;

      // 2. Non-Kopi & Teh
      const [catNonCoffee] = await sql`
        INSERT INTO categories (name, slug, description, sort_order)
        VALUES ('Non-Kopi & Teh', 'non-kopi-teh', 'Minuman segar, matcha artisanal, cokelat pekat, dan racikan teh aroma bunga.', 2)
        RETURNING id;
      `;

      // 3. Makanan & Indomie
      const [catFood] = await sql`
        INSERT INTO categories (name, slug, description, sort_order)
        VALUES ('Makanan & Indomie', 'makanan-indomie', 'Menu berat legendaris warkop dengan racikan bumbu khas racikan barista warkop.', 3)
        RETURNING id;
      `;

      // 4. Camilan & Roti
      const [catSnack] = await sql`
        INSERT INTO categories (name, slug, description, sort_order)
        VALUES ('Camilan & Roti', 'camilan-roti', 'Teman ngobrol yang renyah dan manis, cocok untuk nongkrong berjam-jam.', 4)
        RETURNING id;
      `;

      // Seed Products with high quality Unsplash food/coffee photos matching the editorial aesthetic
      const productsData = [
        // Kopi
        {
          catId: catCoffee.id,
          name: 'Kopi Susu Warkop Aren',
          desc: 'Espresso double shot dari biji arabika-robusta pilihan, susu segar creamy, dan gula aren organik cair khas warkop.',
          price: 18000,
          image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
          featured: true,
        },
        {
          catId: catCoffee.id,
          name: 'Kopi Tubruk Robusta Dampit',
          desc: 'Kopi tubruk murni khas Jawa Timur dengan aroma earthy yang tebal, crema keemasan, dan aftertaste dark chocolate.',
          price: 12000,
          image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
          featured: false,
        },
        {
          catId: catCoffee.id,
          name: 'Ice Americano Doppio',
          desc: 'Double shot espresso dipadukan dengan air mineral dingin dan es kristal murni. Ringan, bersih, dan segar.',
          price: 16000,
          image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
          featured: false,
        },
        {
          catId: catCoffee.id,
          name: 'Kopi Tarik Klasik',
          desc: 'Kopi robusta kental yang ditarik berbusa tinggi bersama susu kental manis gurih beraroma karamel panggang.',
          price: 15000,
          image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80',
          featured: true,
        },
        {
          catId: catCoffee.id,
          name: 'Manual Brew V60 Gayo Natural',
          desc: 'Seduhan pour-over menggunakan beans single origin Aceh Gayo dengan notes aroma buah persik, melati, dan acidity seimbang.',
          price: 24000,
          image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
          featured: false,
        },

        // Non Kopi
        {
          catId: catNonCoffee.id,
          name: 'Matcha Uji Oat Latte',
          desc: 'Bubuk green tea murni dari perkebunan Uji Kyoto dipadukan dengan oat milk creamy dan manis yang seimbang.',
          price: 23000,
          image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
          featured: true,
        },
        {
          catId: catNonCoffee.id,
          name: 'Cokelat Klasik Panas',
          desc: 'Cokelat kakao pekat Sulawesi diseduh hangat dengan susu murni, taburan bubuk kayu manis, dan marshmallow lembut.',
          price: 20000,
          image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80',
          featured: false,
        },
        {
          catId: catNonCoffee.id,
          name: 'Es Teh Manis Melati Warkop',
          desc: 'Racikan teh daun melati seduh gentong tradisional dengan aroma semerbak segar dan rasa sepet legit khas Jawa.',
          price: 8000,
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
          featured: false,
        },
        {
          catId: catNonCoffee.id,
          name: 'Wedang Jahe Susu Rempah',
          desc: 'Rebusan jahe merah bakar geprek, serai wangi, kapulaga, dan susu kental manis. Menghangatkan badan malam hari.',
          price: 14000,
          image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
          featured: false,
        },

        // Makanan
        {
          catId: catFood.id,
          name: 'Indomie Nyemek Spesial Barista',
          desc: 'Indomie goreng dimasak kuah kental gurih pedas manis, telur ceplok setengah matang, sawi hijau, dan bawang goreng melimpah.',
          price: 19000,
          image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
          featured: true,
        },
        {
          catId: catFood.id,
          name: 'Indomie Rebus Kari Kornet Keju',
          desc: 'Indomie rasa kari ayam kuah santan hangat, diberi topping tumisan kornet sapi pedas dan keju cheddar parut.',
          price: 21000,
          image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
          featured: false,
        },
        {
          catId: catFood.id,
          name: 'Nasi Gila Warkop Modern',
          desc: 'Nasi pulen hangat dengan oseng sosis bratwurst, bakso sapi, telur orak-arik, dan bumbu saus tiram pedas smoky.',
          price: 25000,
          image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
          featured: true,
        },
        {
          catId: catFood.id,
          name: 'Nasi Telur Pontianak Sambal Krispi',
          desc: 'Nasi putih dengan double telur ceplok krispi kecap asin rempah, taburan daun bawang renyah, dan sambal bawang ulek.',
          price: 17000,
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
          featured: false,
        },

        // Camilan
        {
          catId: catSnack.id,
          name: 'Roti Bakar Gandum Cokelat Keju',
          desc: 'Roti bakar empuk dipanggang mentega wangi, selai cokelat pekat lumer, dan keju parut gurih berlimpah.',
          price: 16000,
          image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80',
          featured: true,
        },
        {
          catId: catSnack.id,
          name: 'Pisang Goreng Wijen Saus Madu',
          desc: 'Pisang kepok manis berbalut tepung wijen krispi keemasan disiram madu hutan murni dan taburan kayu manis bubuk.',
          price: 15000,
          image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
          featured: false,
        },
        {
          catId: catSnack.id,
          name: 'Cireng Crispy Bumbu Rujak Pedas',
          desc: 'Cireng renyah di luar kenyal lembut di dalam, disajikan hangat dengan cocolan sambal rujak gula merah asem pedas.',
          price: 14000,
          image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
          featured: false,
        },
        {
          catId: catSnack.id,
          name: 'Dimsum Ayam Udang Kukus (4 Pcs)',
          desc: 'Olahan daging ayam dan udang segar bungkus kulit pangsit tipis dengan topping wortel, disajikan dengan chili oil racikan sendiri.',
          price: 20000,
          image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
          featured: false,
        },
      ];

      for (const p of productsData) {
        await sql`
          INSERT INTO products (category_id, name, description, price, image_url, is_available, is_featured)
          VALUES (${p.catId}, ${p.name}, ${p.desc}, ${p.price}, ${p.image}, true, ${p.featured})
        `;
      }
      console.log(`✅ Seeded 4 categories and ${productsData.length} editorial warkop products`);
    } else {
      console.log('ℹ️ Categories and products already exist');
    }

    console.log('🎉 Database migration & seed completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigrationAndSeed();
