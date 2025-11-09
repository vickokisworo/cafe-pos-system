import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  LogOut,
  User,
  Trash2,
  Plus,
  Minus,
  Search,
} from "lucide-react";
import { menuAPI, orderAPI, authAPI } from "../services/api";

const POSSystem = ({ user, onLogout }) => {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMenu();
  }, [category, search]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category !== "all") params.category = category;
      if (search) params.search = search;

      const response = await menuAPI.getAll(params);
      setMenu(response.data.data);
      setError("");
    } catch (err) {
      setError("Gagal memuat menu");
      console.error("Load menu error:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(
        cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
      );
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        items: cart,
        total: getTotal(),
        payment_method: "cash",
      };

      await orderAPI.create(orderData);
      alert(
        `Pembayaran berhasil!\nTotal: Rp ${getTotal().toLocaleString("id-ID")}`
      );
      setCart([]);
    } catch (err) {
      alert(
        "Terjadi kesalahan: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      onLogout();
    } catch (err) {
      console.error("Logout error:", err);
      // Still logout even if API call fails
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">☕</div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Cafe POS System
              </h1>
              <p className="text-sm text-gray-600">Sistem Kasir Profesional</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <User size={20} />
              <span className="font-medium">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filter */}
          <div className="bg-white rounded-xl shadow-md p-4 space-y-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Cari menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCategory("all")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  category === "all"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setCategory("food")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  category === "food"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Makanan
              </button>
              <button
                onClick={() => setCategory("drink")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  category === "drink"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Minuman
              </button>
            </div>
          </div>

          {/* Menu Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Memuat menu...</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {menu.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  <div className="text-5xl text-center mb-2">{item.image}</div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-orange-600 font-bold">
                    Rp {parseInt(item.price).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="text-orange-500" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Keranjang</h2>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Keranjang kosong
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm">
                          {item.name}
                        </h4>
                        <p className="text-orange-600 text-sm">
                          Rp {parseInt(item.price).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="font-bold text-gray-800">
                        Rp{" "}
                        {(parseInt(item.price) * item.qty).toLocaleString(
                          "id-ID"
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">
                  Total:
                </span>
                <span className="text-2xl font-bold text-orange-600">
                  Rp {getTotal().toLocaleString("id-ID")}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || loading}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Memproses..." : "Bayar Sekarang"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSSystem;
