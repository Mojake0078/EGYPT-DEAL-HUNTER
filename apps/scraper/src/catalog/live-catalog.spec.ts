import { LiveCatalog, classifyStock, type ScraperLibrary } from './live-catalog'

describe('classifyStock', () => {
  it.each([
    [null, 'STOCK_STATUS_UNKNOWN'],
    ['23 bought in the past month', 'STOCK_STATUS_UNKNOWN'],
    ['ships from seller', 'STOCK_STATUS_UNKNOWN'],
    ['In Stock', 'STOCK_STATUS_IN_STOCK'],
    ['Only 2 left in stock', 'STOCK_STATUS_IN_STOCK'],
    ['Out of stock', 'STOCK_STATUS_OUT_OF_STOCK'],
    ['Currently unavailable', 'STOCK_STATUS_OUT_OF_STOCK'],
  ])('classifies %s conservatively', (value, expected) => {
    expect(classifyStock(value)).toBe(expected)
  })
})

describe('LiveCatalog', () => {
  it('maps the library result to one shop result per searched shop, skipping unpriced listings', async () => {
    const library: ScraperLibrary = {
      searchAll: jest.fn().mockResolvedValue({
        listings: [
          { source: 'noon', title: 'Mouse A', url: 'https://example.com/a', price: 899.5, sold: null },
          { source: 'noon', title: 'Mouse B', url: 'https://example.com/b', price: null, sold: null },
          {
            source: 'btech', title: 'Mouse C', url: 'https://example.com/c', price: 950, sold: 'Out of stock',
          },
        ],
        sources: [
          { source: 'noon', status: 'found' },
          { source: 'btech', status: 'found' },
          { source: 'amazon', status: 'blocked', error: 'HTTP 403' },
        ],
      }),
    }
    const results = []
    for await (const r of new LiveCatalog(library, { shopTimeoutMs: 1000, shopConcurrency: 2 }).search('mouse', [])) {
      results.push(r)
    }
    expect(results).toEqual([
      {
        shop: 'noon', status: 'SHOP_STATUS_FOUND', error: '',
        offers: [{
          shop: 'noon', title: 'Mouse A', pricePiastres: 89_950, url: 'https://example.com/a',
          stockStatus: 'STOCK_STATUS_UNKNOWN', inStock: false,
        }],
      },
      {
        shop: 'btech', status: 'SHOP_STATUS_FOUND', error: '',
        offers: [{
          shop: 'btech', title: 'Mouse C', pricePiastres: 95_000, url: 'https://example.com/c',
          stockStatus: 'STOCK_STATUS_OUT_OF_STOCK', inStock: false,
        }],
      },
      { shop: 'amazon', status: 'SHOP_STATUS_BLOCKED', error: 'HTTP 403', offers: [] },
    ])
    expect(library.searchAll).toHaveBeenCalledWith('mouse', {
      shops: undefined, timeoutMs: 1000, concurrency: 2,
    })
  })
})
