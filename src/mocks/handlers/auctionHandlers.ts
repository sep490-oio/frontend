import { http, HttpResponse, delay } from 'msw'
import { API_URL } from '@/utils/constants'
import { mockAuctions, getMockAuctionDetail } from '../data/auctions'

export const auctionHandlers = [
  // List Auctions
  http.get(`${API_URL}/auctions`, async ({ request }) => {
    await delay(600)
    
    const url = new URL(request.url)
    const pageNumber = Number(url.searchParams.get('pageNumber')) || 1
    const pageSize = Number(url.searchParams.get('pageSize')) || 10
    
    // Support empty state testing if requested via query param `empty=true`
    if (url.searchParams.get('empty') === 'true') {
      return HttpResponse.json({
        items: [],
        metadata: {
          currentPage: pageNumber,
          totalPages: 1,
          pageSize,
          totalCount: 0,
          hasPrevious: false,
          hasNext: false,
        }
      })
    }

    // Return the mocked list
    return HttpResponse.json({
      items: mockAuctions,
      metadata: {
        currentPage: pageNumber,
        totalPages: 5,
        pageSize,
        totalCount: mockAuctions.length * 5,
        hasPrevious: pageNumber > 1,
        hasNext: pageNumber < 5,
      }
    })
  }),

  // Get Auction Detail
  http.get(`${API_URL}/auctions/:id`, async ({ params }) => {
    await delay(600)
    const { id } = params
    
    const detail = getMockAuctionDetail(id as string)
    if (!detail) {
      return new HttpResponse(null, { status: 404, statusText: 'Not Found' })
    }

    return HttpResponse.json(detail)
  })
]
