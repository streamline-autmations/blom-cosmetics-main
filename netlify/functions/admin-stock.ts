import type { Handler } from '@netlify/functions';

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

export const handler: Handler = async (event) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error('Missing Supabase configuration')
    }

    const queryParams = event.queryStringParameters || {}

    // GET /admin-stock - Fetch stock movements and summary
    if (event.httpMethod === 'GET') {
      const action = queryParams.action || 'movements'
      const limit = queryParams.limit || '50'
      const offset = queryParams.offset || '0'
      const productId = queryParams.product_id
      const movementType = queryParams.movement_type
      const startDate = queryParams.start_date
      const endDate = queryParams.end_date

      if (action === 'summary') {
        // Get stock analytics summary
        const summaryRes = await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/get_stock_movement_summary`,
          {
            method: 'POST',
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              start_date: startDate,
              end_date: endDate
            })
          }
        )

        if (!summaryRes.ok) {
          throw new Error('Failed to fetch stock summary')
        }

        const summary = await summaryRes.json()

        // Get low stock and out of stock counts
        const inventoryRes = await fetch(
          `${SUPABASE_URL}/rest/v1/stock_analytics?select=*`,
          {
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`
            }
          }
        )

        const inventoryData = inventoryRes.ok ? await inventoryRes.json() : []
        const lowStockProducts = inventoryData.filter((item: any) => 
          item.current_stock <= item.low_stock_threshold && item.current_stock > 0
        ).length
        const outOfStockProducts = inventoryData.filter((item: any) => 
          item.current_stock <= 0
        ).length
        const totalInventoryValue = inventoryData.reduce((sum: number, item: any) => 
          sum + (item.current_stock * item.unit_price), 0
        )

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: {
              total_products: inventoryData.length,
              low_stock_products: lowStockProducts,
              out_of_stock_products: outOfStockProducts,
              total_inventory_value: totalInventoryValue,
              recent_movements_count: summary?.recent_movements_count || 0,
              top_moving_products: summary?.top_moving_products || []
            }
          })
        }
      }

      if (action === 'inventory') {
        // Get current inventory levels
        const inventoryRes = await fetch(
          `${SUPABASE_URL}/rest/v1/stock_analytics?select=*&order=product_name.asc`,
          {
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`
            }
          }
        )

        if (!inventoryRes.ok) {
          throw new Error('Failed to fetch inventory data')
        }

        const inventory = await inventoryRes.json()

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inventory
          })
        }
      }

      // Get stock movements
      let movementsQuery = `select=*`

      if (productId) {
        movementsQuery += `&product_id=eq.${productId}`
      }

      if (movementType) {
        movementsQuery += `&movement_type=eq.${movementType}`
      }

      if (startDate) {
        movementsQuery += `&created_at=gte.${startDate}`
      }

      if (endDate) {
        movementsQuery += `&created_at=lte.${endDate}`
      }

      movementsQuery += `&order=created_at.desc&limit=${limit}&offset=${offset}`

      const movementsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/stock_movements?${movementsQuery}`,
        {
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`
          }
        }
      )

      if (!movementsRes.ok) {
        throw new Error('Failed to fetch stock movements')
      }

      const movements = await movementsRes.json()

      // Get product names for movements
      const productIds = [...new Set(movements.map((m: any) => m.product_id))]
      if (productIds.length > 0) {
        const productsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/products?select=id,name&id=in.(${productIds.join(',')})`,
          {
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`
            }
          }
        )

        if (productsRes.ok) {
          const products = await productsRes.json()
          const productMap = products.reduce((map: any, product: any) => {
            map[product.id] = product.name
            return map
          }, {})

          movements.forEach((movement: any) => {
            movement.product_name = productMap[movement.product_id] || 'Unknown Product'
          })
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movements,
          count: movements.length,
          has_more: movements.length === parseInt(limit)
        })
      }
    }

    // POST /admin-stock - Create stock adjustment
    if (event.httpMethod === 'POST') {
      const body = event.body || '{}'
      let json: any
      try {
        json = JSON.parse(body)
      } catch {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'INVALID_JSON', message: 'Invalid JSON' })
        }
      }

      const { action: postAction, product_id, quantity, movement_type, notes, unit_price } = json

      if (postAction === 'adjust_stock') {
        if (!product_id || !quantity || !movement_type) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              error: 'MISSING_PARAMS', 
              message: 'product_id, quantity, and movement_type are required' 
            })
          }
        }

        // Get current stock level
        const currentStockRes = await fetch(
          `${SUPABASE_URL}/rest/v1/products?select=stock&id=eq.${product_id}`,
          {
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`
            }
          }
        )

        if (!currentStockRes.ok) {
          throw new Error('Failed to fetch current stock')
        }

        const products = await currentStockRes.json()
        const product = products[0]

        if (!product) {
          return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'PRODUCT_NOT_FOUND', message: 'Product not found' })
          }
        }

        let newStock = product.stock || 0
        let quantityChange = quantity

        // Calculate new stock based on movement type
        switch (movement_type) {
          case 'restock':
            newStock += quantity
            break
          case 'sale':
            newStock -= quantity
            break
          case 'adjustment':
            newStock = quantity // direct set
            quantityChange = quantity - (product.stock || 0)
            break
          case 'return':
            newStock += quantity
            break
          case 'damage':
            newStock -= quantity
            break
          default:
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                error: 'INVALID_MOVEMENT_TYPE', 
                message: 'Invalid movement type' 
              })
            }
        }

        // Update product stock
        const updateRes = await fetch(
          `${SUPABASE_URL}/rest/v1/products?id=eq.${product_id}`,
          {
            method: 'PATCH',
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ stock: newStock })
          }
        )

        if (!updateRes.ok) {
          throw new Error('Failed to update stock')
        }

        // Create stock movement record
        const movementRes = await fetch(
          `${SUPABASE_URL}/rest/v1/stock_movements`,
          {
            method: 'POST',
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              product_id,
              movement_type,
              quantity: Math.abs(quantityChange),
              current_stock: newStock,
              unit_price: unit_price || null,
              total_value: unit_price ? Math.abs(quantityChange) * unit_price : null,
              notes: notes || null
            })
          }
        )

        if (!movementRes.ok) {
          throw new Error('Failed to create stock movement record')
        }

        const movement = await movementRes.json()

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            message: 'Stock adjusted successfully',
            movement: movement[0],
            new_stock: newStock
          })
        }
      }

      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'INVALID_ACTION', message: 'Invalid action' })
      }
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' })
    }

  } catch (error: any) {
    console.error('Admin stock handler error:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'SERVER_ERROR',
        message: error.message || 'Internal server error'
      })
    }
  }
}