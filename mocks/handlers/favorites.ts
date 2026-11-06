import { http, HttpResponse } from 'msw'
import { API_BASE, endpoints, routePatterns, type FavoritesResponse } from '../../src/api/contracts'
import { authenticate, isError } from '../auth'
import { db, persist } from '../db'
import { applyNetwork, currentScenario, errorResponse } from '../network'

const listFor = (userId: string): FavoritesResponse => ({ nftIds: db.favorites[userId] ?? [] })

export const favoritesHandlers = [
  http.get(`${API_BASE}${endpoints.favorites}`, async ({ request }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    return HttpResponse.json(listFor(auth.user.id))
  }),

  // PUT e DELETE são idempotentes: repetir devolve o mesmo estado, sem erro.
  http.put(`${API_BASE}${routePatterns.favorite}`, async ({ request, params }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    // Cenário `favorites-error`: a mutation falha, para exercitar rollback e recuperação (§9, item 4).
    if (currentScenario() === 'favorites-error') return errorResponse('transient_error', 'Não foi possível salvar o favorito.')
    const nftId = String(params.nftId)
    if (!db.nfts.some((n) => n.id === nftId)) return errorResponse('not_found', 'NFT não encontrado.')
    const current = db.favorites[auth.user.id] ?? []
    if (!current.includes(nftId)) db.favorites[auth.user.id] = [...current, nftId]
    persist()
    return HttpResponse.json(listFor(auth.user.id))
  }),

  http.delete(`${API_BASE}${routePatterns.favorite}`, async ({ request, params }) => {
    const failure = await applyNetwork(request)
    if (failure) return failure
    const auth = authenticate(request)
    if (isError(auth)) return auth
    if (currentScenario() === 'favorites-error') return errorResponse('transient_error', 'Não foi possível remover o favorito.')
    db.favorites[auth.user.id] = (db.favorites[auth.user.id] ?? []).filter((id) => id !== String(params.nftId))
    persist()
    return HttpResponse.json(listFor(auth.user.id))
  }),
]
