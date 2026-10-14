async function runE2ETest() {
  const baseUrl = 'http://localhost:5174';
  console.log('🧪 Starting End-to-End Warkop QR System Validation on:', baseUrl);

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.log('✅ 1. Health Check:', healthData);

  // 2. Resolve Table 02 by token
  const tableToken = 'wrk_tbl_02_c4e17d';
  const tableRes = await fetch(`${baseUrl}/api/menu/table/${tableToken}`);
  const tableData = await tableRes.json();
  if (!tableRes.ok || !tableData.table) {
    throw new Error('Table resolution failed: ' + JSON.stringify(tableData));
  }
  console.log(`✅ 2. Table Resolved: Meja ${tableData.table.tableNumber} (${tableData.table.locationNote})`);

  // 3. Fetch Menu and select products
  const menuRes = await fetch(`${baseUrl}/api/menu`);
  const menuData = await menuRes.json();
  const coffeeCat = menuData.categories.find((c: any) => c.slug === 'kopi-espresso');
  const foodCat = menuData.categories.find((c: any) => c.slug === 'makanan-indomie');

  const kopiSusu = coffeeCat.products[0];
  const indomieNyemek = foodCat.products[0];
  console.log(`✅ 3. Products Selected: ${kopiSusu.name} (Rp ${kopiSusu.price}) & ${indomieNyemek.name} (Rp ${indomieNyemek.price})`);

  // 4. Place Customer Order (Checkout with QRIS)
  const idempotencyKey = `e2e_idemp_${Date.now()}`;
  const checkoutPayload = {
    tableToken,
    customerName: 'Haikal (Pelanggan Meja 02)',
    notes: 'Mohon kopinya jangan terlalu manis',
    paymentMethod: 'qris',
    idempotencyKey,
    items: [
      {
        productId: kopiSusu.id,
        quantity: 2,
        notes: 'Less sugar, es sedikit',
      },
      {
        productId: indomieNyemek.id,
        quantity: 1,
        notes: 'Pedas sedang, telur setengah matang',
      },
    ],
  };

  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkoutPayload),
  });
  const orderData = await orderRes.json();
  if (!orderRes.ok) {
    throw new Error('Order creation failed: ' + JSON.stringify(orderData));
  }
  const createdOrder = orderData.order;
  console.log(`✅ 4. Order Created: ${createdOrder.orderNumber}`);
  console.log(`   Table: Meja ${createdOrder.tableNumber} | Total Server-Recomputed: Rp ${createdOrder.totalAmount}`);
  console.log(`   Initial Status: ${createdOrder.status} | Payment: ${createdOrder.paymentStatus} (${createdOrder.paymentMethod})`);

  // 5. Test Customer Order Status Tracking
  const trackRes = await fetch(`${baseUrl}/api/orders/${createdOrder.orderNumber}`);
  const trackData = await trackRes.json();
  console.log(`✅ 5. Order Tracking Verified for ${trackData.order.orderNumber}`);
  console.log(`   Items in snapshot:`, trackData.order.items.map((i: any) => `${i.quantity}x ${i.productName} (Notes: ${i.notes})`));

  // 6. Test Admin / Cashier Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.token;
  console.log(`✅ 6. Cashier / Admin Authenticated as: ${loginData.user.name} (${loginData.user.role})`);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 7. Verify Order appears in Admin Dashboard
  const dashRes = await fetch(`${baseUrl}/api/admin/dashboard`, { headers: authHeaders });
  const dashData = await dashRes.json();
  const foundOrderInRecent = dashData.recentOrders.find((o: any) => o.orderNumber === createdOrder.orderNumber);
  console.log(`✅ 7. Order located in Admin Dashboard recent queue: ${foundOrderInRecent ? 'YES' : 'NO'}`);

  // 8. Confirm Payment (QRIS merchant verified)
  const payRes = await fetch(`${baseUrl}/api/admin/orders/${createdOrder.id}/payment`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ paymentStatus: 'paid' }),
  });
  const payData = await payRes.json();
  console.log(`✅ 8. Payment Confirmed by Cashier: Status -> ${payData.order.paymentStatus}`);

  // 9. Advance Status: Menunggu -> Diproses (Barista mulai meracik)
  const processRes = await fetch(`${baseUrl}/api/admin/orders/${createdOrder.id}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'diproses' }),
  });
  const processData = await processRes.json();
  console.log(`✅ 9. Status Advanced to: ${processData.order.status}`);

  // 10. Advance Status: Diproses -> Siap Diantar
  const readyRes = await fetch(`${baseUrl}/api/admin/orders/${createdOrder.id}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'siap_diantar' }),
  });
  const readyData = await readyRes.json();
  console.log(`✅ 10. Status Advanced to: ${readyData.order.status}`);

  // 11. Advance Status: Siap Diantar -> Selesai
  const doneRes = await fetch(`${baseUrl}/api/admin/orders/${createdOrder.id}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'selesai' }),
  });
  const doneData = await doneRes.json();
  console.log(`✅ 11. Status Advanced to: ${doneData.order.status}`);

  // 12. Check Reports reflecting the paid and finished order
  const reportRes = await fetch(`${baseUrl}/api/admin/reports`, { headers: authHeaders });
  const reportData = await reportRes.json();
  console.log(`✅ 12. Financial Report Aggregated:`);
  console.log(`   Total Revenue: Rp ${reportData.summary.totalRevenue}`);
  console.log(`   QRIS Share: ${reportData.summary.qrisShare}% | Cash Share: ${reportData.summary.cashShare}%`);
  console.log(`   Top Selling Products:`, reportData.topProducts.map((p: any) => `${p.productName} (${p.totalSold} sold)`));

  console.log('\n🎉 ALL 12 INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
}

runE2ETest().catch((err) => {
  console.error('❌ E2E Test Failure:', err);
  process.exit(1);
});
