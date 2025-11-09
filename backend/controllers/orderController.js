const pool = require("../config/database");

// Create new order
exports.createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { items, total, payment_method } = req.body;
    const user_id = req.user.id;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    if (!total || total <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid total amount",
      });
    }

    await client.query("BEGIN");

    // Insert order
    const orderResult = await client.query(
      "INSERT INTO orders (user_id, total, payment_method, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_id, total, payment_method || "cash", "completed"]
    );

    const order = orderResult.rows[0];

    // Insert order items
    for (const item of items) {
      await client.query(
        "INSERT INTO order_items (order_id, menu_id, menu_name, price, quantity, subtotal) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          order.id,
          item.id,
          item.name,
          item.price,
          item.qty,
          item.price * item.qty,
        ]
      );
    }

    await client.query("COMMIT");

    // Get complete order with items
    const completeOrder = await pool.query(
      `SELECT o.*, 
              json_agg(
                json_build_object(
                  'id', oi.id,
                  'menu_id', oi.menu_id,
                  'menu_name', oi.menu_name,
                  'price', oi.price,
                  'quantity', oi.quantity,
                  'subtotal', oi.subtotal
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [order.id]
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: completeOrder.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating order",
    });
  } finally {
    client.release();
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const { start_date, end_date, user_id } = req.query;

    let query = `
      SELECT o.*, 
             u.username, u.name as cashier_name,
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'menu_name', oi.menu_name,
                 'price', oi.price,
                 'quantity', oi.quantity,
                 'subtotal', oi.subtotal
               )
             ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Filter by date range
    if (start_date) {
      query += ` AND o.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND o.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    // Filter by user
    if (user_id) {
      query += ` AND o.user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    query += " GROUP BY o.id, u.username, u.name ORDER BY o.created_at DESC";

    const result = await pool.query(query, params);

    // Calculate statistics
    const totalRevenue = result.rows.reduce(
      (sum, order) => sum + parseInt(order.total),
      0
    );
    const totalOrders = result.rows.length;

    res.status(200).json({
      success: true,
      count: totalOrders,
      total_revenue: totalRevenue,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching orders",
    });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT o.*, 
              u.username, u.name as cashier_name,
              json_agg(
                json_build_object(
                  'id', oi.id,
                  'menu_name', oi.menu_name,
                  'price', oi.price,
                  'quantity', oi.quantity,
                  'subtotal', oi.subtotal
                )
              ) as items
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id, u.username, u.name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching order",
    });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const { period } = req.query; // day, week, month, year

    let dateFilter = "";
    switch (period) {
      case "day":
        dateFilter = "created_at >= CURRENT_DATE";
        break;
      case "week":
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case "month":
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case "year":
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '1 year'";
        break;
      default:
        dateFilter = "1=1";
    }

    // Total orders and revenue
    const totalStats = await pool.query(
      `SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_revenue
       FROM orders
       WHERE ${dateFilter}`
    );

    // Best selling items
    const bestSelling = await pool.query(
      `SELECT oi.menu_name, SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE ${dateFilter}
       GROUP BY oi.menu_name
       ORDER BY total_sold DESC
       LIMIT 10`
    );

    // Orders by payment method
    const paymentMethods = await pool.query(
      `SELECT payment_method, COUNT(*) as count, SUM(total) as revenue
       FROM orders
       WHERE ${dateFilter}
       GROUP BY payment_method`
    );

    res.status(200).json({
      success: true,
      data: {
        summary: totalStats.rows[0],
        best_selling: bestSelling.rows,
        payment_methods: paymentMethods.rows,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching statistics",
    });
  }
};
