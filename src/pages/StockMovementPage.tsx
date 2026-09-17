import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Settings, 
  RefreshCw,
  Eye,
  Calendar,
  Filter,
  Download,
  Edit,
  Save,
  X
} from 'lucide-react';

interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: 'sale' | 'restock' | 'adjustment' | 'return' | 'damage';
  quantity: number;
  current_stock: number;
  unit_price?: number;
  total_value?: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

interface StockSummary {
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_inventory_value: number;
  recent_movements_count: number;
  top_moving_products: Array<{
    product_id: string;
    product_name: string;
    total_sold: number;
    current_stock: number;
  }>;
}

interface InventoryItem {
  id: string;
  product_name: string;
  current_stock: number;
  low_stock_threshold: number;
  unit_price: number;
  total_value: number;
  last_movement_date?: string;
  last_movement_type?: string;
}

export default function StockMovementPage() {
  const [activeTab, setActiveTab] = useState<'movements' | 'inventory' | 'analytics' | 'adjust'>('movements');
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    product_id: '',
    movement_type: 'adjustment' as const,
    quantity: 0,
    notes: '',
    unit_price: 0
  });
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    document.title = 'Stock Management - BLOM Cosmetics Admin';
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch summary
      const summaryRes = await fetch('/.netlify/functions/admin-stock?action=summary');
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);
      }

      // Fetch movements
      const movementsRes = await fetch('/.netlify/functions/admin-stock?limit=20');
      if (movementsRes.ok) {
        const movementsData = await movementsRes.json();
        setMovements(movementsData.movements || []);
      }

      // Fetch inventory
      const inventoryRes = await fetch('/.netlify/functions/admin-stock?action=inventory');
      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        setInventory(inventoryData.inventory || []);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentForm.product_id || adjustmentForm.quantity === 0) return;

    try {
      setAdjusting(true);
      const response = await fetch('/.netlify/functions/admin-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_stock',
          ...adjustmentForm
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setShowAdjustmentForm(false);
          setAdjustmentForm({
            product_id: '',
            movement_type: 'adjustment',
            quantity: 0,
            notes: '',
            unit_price: 0
          });
          fetchData(); // Refresh data
        } else {
          throw new Error(result.message || 'Failed to adjust stock');
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to adjust stock');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'restock':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'return':
        return <Plus className="h-4 w-4 text-blue-500" />;
      case 'damage':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'text-red-600 bg-red-50';
      case 'restock':
        return 'text-green-600 bg-green-50';
      case 'return':
        return 'text-blue-600 bg-blue-50';
      case 'damage':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showMobileMenu={true} />
        <main className="section-padding">
          <Container>
            <div className="text-center py-16">
              <LoadingSpinner />
              <p className="text-gray-600 mt-4">Loading stock data…</p>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showMobileMenu={true} />
      <main className="section-padding">
        <Container>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold">Stock Management</h1>
                <p className="text-blue-100">Monitor and manage inventory movements</p>
              </div>
              <Button 
                onClick={fetchData} 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {/* Summary Stats */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{summary.total_products}</div>
                  <div className="text-blue-100 text-sm">Total Products</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-300">{summary.low_stock_products}</div>
                  <div className="text-blue-100 text-sm">Low Stock</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-300">{summary.out_of_stock_products}</div>
                  <div className="text-blue-100 text-sm">Out of Stock</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">R{summary.total_inventory_value.toFixed(2)}</div>
                  <div className="text-blue-100 text-sm">Inventory Value</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{summary.recent_movements_count}</div>
                  <div className="text-blue-100 text-sm">Recent Moves</div>
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <nav className="rounded-xl border bg-white divide-y">
                <button
                  className={`w-full text-left px-5 py-4 flex items-center gap-3 ${activeTab === 'movements' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('movements')}
                >
                  <Package className="h-5 w-5" />
                  Stock Movements
                </button>
                <button
                  className={`w-full text-left px-5 py-4 flex items-center gap-3 ${activeTab === 'inventory' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('inventory')}
                >
                  <Eye className="h-5 w-5" />
                  Inventory Levels
                </button>
                <button
                  className={`w-full text-left px-5 py-4 flex items-center gap-3 ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('analytics')}
                >
                  <TrendingUp className="h-5 w-5" />
                  Analytics
                </button>
                <button
                  className={`w-full text-left px-5 py-4 flex items-center gap-3 ${activeTab === 'adjust' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('adjust')}
                >
                  <Settings className="h-5 w-5" />
                  Adjust Stock
                </button>
              </nav>
            </aside>

            {/* Main Content */}
            <section className="lg:col-span-3 space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {/* Stock Movements Tab */}
              {activeTab === 'movements' && (
                <div className="rounded-xl border p-6 bg-white">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Recent Stock Movements</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                  
                  {movements.length === 0 ? (
                    <div className="text-gray-600 text-center py-8">No stock movements found.</div>
                  ) : (
                    <div className="space-y-4">
                      {movements.map((movement) => (
                        <div key={movement.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {getMovementIcon(movement.movement_type)}
                              <div>
                                <div className="font-medium">{movement.product_name}</div>
                                <div className="text-sm text-gray-500 capitalize">
                                  {movement.movement_type} • {new Date(movement.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${getMovementColor(movement.movement_type)}`}>
                                {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                              </div>
                              <div className="text-sm text-gray-500">
                                Stock: {movement.current_stock}
                              </div>
                            </div>
                          </div>
                          {movement.notes && (
                            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {movement.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Inventory Levels Tab */}
              {activeTab === 'inventory' && (
                <div className="rounded-xl border p-6 bg-white">
                  <h2 className="text-2xl font-bold mb-6">Current Inventory Levels</h2>
                  
                  {inventory.length === 0 ? (
                    <div className="text-gray-600 text-center py-8">No inventory data found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Product</th>
                            <th className="text-left py-3 px-4">Current Stock</th>
                            <th className="text-left py-3 px-4">Threshold</th>
                            <th className="text-left py-3 px-4">Unit Price</th>
                            <th className="text-left py-3 px-4">Total Value</th>
                            <th className="text-left py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventory.map((item) => {
                            const isLowStock = item.current_stock <= item.low_stock_threshold && item.current_stock > 0;
                            const isOutOfStock = item.current_stock <= 0;
                            
                            return (
                              <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium">{item.product_name}</td>
                                <td className="py-3 px-4">
                                  <span className={`${isOutOfStock ? 'text-red-600 font-bold' : isLowStock ? 'text-yellow-600 font-medium' : 'text-gray-900'}`}>
                                    {item.current_stock}
                                  </span>
                                </td>
                                <td className="py-3 px-4">{item.low_stock_threshold}</td>
                                <td className="py-3 px-4">R{item.unit_price.toFixed(2)}</td>
                                <td className="py-3 px-4">R{item.total_value.toFixed(2)}</td>
                                <td className="py-3 px-4">
                                  {isOutOfStock ? (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                      Out of Stock
                                    </span>
                                  ) : isLowStock ? (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                                      Low Stock
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                      In Stock
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="rounded-xl border p-6 bg-white">
                  <h2 className="text-2xl font-bold mb-6">Stock Analytics</h2>
                  
                  {summary?.top_moving_products && summary.top_moving_products.length > 0 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Top Moving Products</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {summary.top_moving_products.slice(0, 6).map((product) => (
                            <div key={product.product_id} className="border rounded-lg p-4">
                              <div className="font-medium">{product.product_name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Sold: {product.total_sold} units
                              </div>
                              <div className="text-sm text-gray-600">
                                Current Stock: {product.current_stock}
                              </div>
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      product.current_stock <= 5 ? 'bg-red-500' : 
                                      product.current_stock <= 10 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ 
                                      width: `${Math.min(100, (product.current_stock / 20) * 100)}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Adjust Stock Tab */}
              {activeTab === 'adjust' && (
                <div className="rounded-xl border p-6 bg-white">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Manual Stock Adjustment</h2>
                    <Button onClick={() => setShowAdjustmentForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Adjustment
                    </Button>
                  </div>

                  {/* Adjustment Form Modal */}
                  {showAdjustmentForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Adjust Stock</h3>
                          <button onClick={() => setShowAdjustmentForm(false)}>
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        
                        <form onSubmit={handleStockAdjustment} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Product ID
                            </label>
                            <input
                              type="text"
                              value={adjustmentForm.product_id}
                              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, product_id: e.target.value }))}
                              className="w-full border rounded-md px-3 py-2"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Movement Type
                            </label>
                            <select
                              value={adjustmentForm.movement_type}
                              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, movement_type: e.target.value as any }))}
                              className="w-full border rounded-md px-3 py-2"
                            >
                              <option value="adjustment">Direct Adjustment</option>
                              <option value="restock">Restock</option>
                              <option value="sale">Sale</option>
                              <option value="return">Return</option>
                              <option value="damage">Damage/Loss</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={adjustmentForm.quantity}
                              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                              className="w-full border rounded-md px-3 py-2"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unit Price (Optional)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={adjustmentForm.unit_price}
                              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                              className="w-full border rounded-md px-3 py-2"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <textarea
                              value={adjustmentForm.notes}
                              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
                              className="w-full border rounded-md px-3 py-2"
                              rows={3}
                            />
                          </div>
                          
                          <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={adjusting}>
                              {adjusting ? 'Adjusting...' : 'Adjust Stock'}
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setShowAdjustmentForm(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  <div className="text-gray-600">
                    <p>Use this section to manually adjust stock levels for:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Restocking inventory</li>
                      <li>Recording damaged or lost items</li>
                      <li>Correcting inventory discrepancies</li>
                      <li>Processing returns</li>
                    </ul>
                  </div>
                </div>
              )}
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}