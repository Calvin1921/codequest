import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock auth endpoints
  http.post('/api/auth/signin', () => {
    return HttpResponse.json({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
    })
  }),

  http.post('/api/auth/signout', () => {
    return HttpResponse.json({ success: true })
  }),

  // Mock API endpoints
  http.get('/api/posts', () => {
    return HttpResponse.json({
      posts: [
        {
          id: '1',
          title: 'Test Post',
          content: 'Test content',
          published: true,
          authorId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })
  }),

  http.post('/api/posts', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: '2',
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),
]