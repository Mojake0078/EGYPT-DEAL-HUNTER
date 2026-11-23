import { Console } from 'node:console'
import { mkdir, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { searchAll } from '../libs/egypt-price-scraper/dist/index.js'

const logger = new Console({ stdout: process.stdout, stderr: process.stderr })
const SHOPS = ['amazon', 'jumia', 'noon']
const SEED_QUERIES = [
  'Samsung Galaxy A56',
  'iPhone 16 128GB',
  'Xiaomi Redmi Note 14',
  'HP laptop 15',
  'Lenovo IdeaPad',
  'AirPods Pro 2',
  'JBL earbuds',
  'Samsung 43 inch TV',
  'air fryer 5L',
  'automatic washing machine',
]

function stockStatus(listing) {
  const sold = listing.sold?.trim().toLowerCase().replace(/\s+/g, ' ')
  if (sold && /^(out of stock|currently unavailable|unavailable|sold out)$/.test(sold)) {
    return 'OUT_OF_STOCK'
  }
  if (
    sold &&
    (/^(in stock|available|available now|add to cart|only \d+ left in stock)$/.test(sold) ||
      /^only \d+ left$/.test(sold))
  ) {
    return 'IN_STOCK'
  }
  if (listing.source === 'jumia' && listing.via === 'direct' && listing.sold === null) {
    return 'IN_STOCK'
  }
  return 'UNKNOWN'
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function toCsv(rows) {
  const columns = [
    'product_title',
    'shop',
    'price_egp',
    'stock_status',
    'source_type',
    'matched_queries',
    'observed_at',
    'deal_assessment',
    'product_url',
  ]
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')),
  ].join('\n')
}

async function main() {
  const requestedLimit = Number(process.env.DEAL_RADAR_QUERY_LIMIT ?? 3)
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
    throw new Error('DEAL_RADAR_QUERY_LIMIT must be a positive integer')
  }

  const queries = SEED_QUERIES.slice(0, requestedLimit)
  const observedAt = new Date().toISOString()
  const startedAt = observedAt
  const products = new Map()
  const sourceRuns = []

  logger.log(`Deal Radar one-shot scan: ${queries.length} queries across ${SHOPS.join(', ')}`)

  for (const query of queries) {
    logger.log(`\nSearching: ${query}`)
    try {
      const result = await searchAll(query, {
        shops: SHOPS,
        timeoutMs: 20_000,
        concurrency: 3,
      })

      sourceRuns.push({ query, sources: result.sources })
      for (const listing of result.listings) {
        if (!listing.url || !listing.price || listing.price <= 0) continue
        const key = `${listing.source}|${listing.url}`
        const existing = products.get(key)
        if (existing) {
          existing.matchedQueries.add(query)
          if (listing.price < existing.price_egp) existing.price_egp = listing.price
          continue
        }
        products.set(key, {
          product_title: listing.title,
          shop: listing.store,
          price_egp: listing.price,
          stock_status: stockStatus(listing),
          source_type: listing.via ?? 'direct',
          matchedQueries: new Set([query]),
          observed_at: observedAt,
          deal_assessment: 'INSUFFICIENT_HISTORY',
          product_url: listing.url,
        })
      }

      const found = result.sources.filter((source) => source.status === 'found').length
      const blocked = result.sources.filter((source) => source.status === 'blocked').length
      const failed = result.sources.filter((source) => source.status === 'failed').length
      logger.log(
        `  Listings: ${result.listings.length}; stores found: ${found}; blocked: ${blocked}; failed: ${failed}`,
      )
    } catch (error) {
      sourceRuns.push({ query, error: error instanceof Error ? error.message : String(error) })
      logger.error(`  Query failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const rows = [...products.values()]
    .map(({ matchedQueries, ...row }) => ({
      ...row,
      matched_queries: [...matchedQueries].join(' | '),
    }))
    .sort((a, b) => a.price_egp - b.price_egp)

  await mkdir('reports', { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const csvPath = `reports/deal-radar-${stamp}.csv`
  const jsonPath = `reports/deal-radar-${stamp}.json`
  const completedAt = new Date().toISOString()

  const report = {
    project: 'EGYPT DEAL HUNTER',
    startedAt,
    completedAt,
    shops: SHOPS,
    queries,
    uniqueListings: rows.length,
    sourceRuns,
    assessmentNote:
      'Prices are live observations, not verified discounts. Deal verification requires historical price snapshots.',
    listings: rows,
  }

  await writeFile(csvPath, toCsv(rows), 'utf8')
  await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8')

  logger.log(`\nSaved ${rows.length} unique listings:`)
  logger.log(`  CSV:  ${csvPath}`)
  logger.log(`  JSON: ${jsonPath}`)
  logger.log('Deal assessment: insufficient history; no discount claims are made.')
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
