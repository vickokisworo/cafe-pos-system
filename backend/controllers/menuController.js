const pool = require("../config/database");

// Get all menu items
exports.getAllMenu = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = "SELECT * FROM menu WHERE is_available = true";
    const params = [];
    let paramCount = 1;

    // Filter by category
    if (category && category !== "all") {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    // Search by name
    if (search) {
      query += ` AND name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += " ORDER BY category, name";

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get menu error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching menu",
    });
  }
};

// Get single menu item
exports.getMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM menu WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get menu item error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching menu item",
    });
  }
};

// Create menu item (admin only)
exports.createMenuItem = async (req, res) => {
  try {
    const { name, category, price, image } = req.body;

    // Validation
    if (!name || !category || !price) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, category, and price",
      });
    }

    const result = await pool.query(
      "INSERT INTO menu (name, category, price, image) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, category, price, image || "🍽️"]
    );

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create menu error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating menu item",
    });
  }
};

// Update menu item (admin only)
exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, image, is_available } = req.body;

    const result = await pool.query(
      "UPDATE menu SET name = COALESCE($1, name), category = COALESCE($2, category), price = COALESCE($3, price), image = COALESCE($4, image), is_available = COALESCE($5, is_available) WHERE id = $6 RETURNING *",
      [name, category, price, image, is_available, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update menu error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating menu item",
    });
  }
};

// Delete menu item (admin only)
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM menu WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Delete menu error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting menu item",
    });
  }
};
