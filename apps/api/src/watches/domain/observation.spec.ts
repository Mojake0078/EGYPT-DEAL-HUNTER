import { Observation } from './observation'

describe('Observation stock eligibility', () => {
  const base = {
    id: 'observation-1',
    watchId: 'watch-1',
    checkId: 'check-1',
    observedAt: new Date('2026-11-23T10:00:00Z'),
    shops: [{ shop: 'amazon', status: 'found' as const }, { shop: 'noon', status: 'found' as const }],
  }

  it('never ranks unknown or out-of-stock offers ahead of confirmed stock', () => {
    const observation = Observation.fromCheck({
      ...base,
      offers: [
        { shop: 'unknown', title: 'Cheap but unknown', pricePiastres: 100, url: 'https://example.com/u', stockStatus: 'unknown', inStock: false },
        { shop: 'out', title: 'Unavailable', pricePiastres: 200, url: 'https://example.com/o', stockStatus: 'out_of_stock', inStock: false },
        { shop: 'confirmed', title: 'Available', pricePiastres: 300, url: 'https://example.com/c', stockStatus: 'in_stock', inStock: true },
      ],
    })
    expect(observation.lowest?.shop).toBe('confirmed')
  })

  it('does not report a lowest offer when every listing has unknown stock', () => {
    const observation = Observation.fromCheck({
      ...base,
      offers: [
        { shop: 'unknown', title: 'Maybe available', pricePiastres: 100, url: 'https://example.com/u', stockStatus: 'unknown', inStock: false },
      ],
    })
    expect(observation.lowest).toBeNull()
  })
})
