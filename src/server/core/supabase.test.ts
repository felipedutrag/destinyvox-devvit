import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkSupabaseVip, upsertSupabaseVipUser } from './supabase';

const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockRedisDel = vi.fn();

vi.mock('@devvit/web/server', () => ({
  redis: {
    get: (...args: unknown[]) => mockRedisGet(...args),
    set: (...args: unknown[]) => mockRedisSet(...args),
    del: (...args: unknown[]) => mockRedisDel(...args),
  },
}));

describe('supabase VIP checker', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('retorna true se o usuário já estiver ativo no Redis (cache hit)', async () => {
    mockRedisGet.mockResolvedValue('active');

    const result = await checkSupabaseVip('testuser');
    expect(result).toBe(true);
    expect(mockRedisGet).toHaveBeenCalled();
  });

  it('consulta o Supabase quando não está em cache e retorna true se status for active', async () => {
    mockRedisGet.mockResolvedValue(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: '1', reddit_username: 'testuser', status: 'active', plan: 'vip' },
      ],
    } as unknown as Response);

    const result = await checkSupabaseVip('testuser');
    expect(result).toBe(true);
    expect(mockRedisSet).toHaveBeenCalledWith('destinyvox_vip_testuser', 'active');
  });

  it('retorna false se o usuário tiver status canceled ou não for encontrado no Supabase', async () => {
    mockRedisGet.mockResolvedValue(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: '1', reddit_username: 'testuser', status: 'canceled', plan: 'vip' },
      ],
    } as unknown as Response);

    const result = await checkSupabaseVip('testuser');
    expect(result).toBe(false);
    expect(mockRedisDel).toHaveBeenCalledWith('destinyvox_vip_testuser');
  });

  it('atualiza o status de VIP no Supabase via upsertSupabaseVipUser', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as unknown as Response);

    const ok = await upsertSupabaseVipUser('testuser', 'active');
    expect(ok).toBe(true);
    expect(mockRedisSet).toHaveBeenCalledWith('destinyvox_vip_testuser', 'active');
  });
});
