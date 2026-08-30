-- Public readable tables
GRANT SELECT ON public.products, public.scripts, public.categories, public.site_settings,
  public.partners, public.team_members, public.roblox_genres, public.roblox_sounds,
  public.vault_items, public.profiles, public.script_likes TO anon, authenticated;

-- User-scoped tables (authenticated only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders, public.wallet_transactions,
  public.favorites, public.script_likes, public.reports, public.redeem_uses TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scripts, public.vault_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products, public.categories, public.partners,
  public.team_members, public.roblox_genres, public.roblox_sounds, public.redeem_codes,
  public.site_settings TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- Server-side / privileged
GRANT ALL ON public.products, public.scripts, public.categories, public.site_settings,
  public.partners, public.team_members, public.roblox_genres, public.roblox_sounds,
  public.vault_items, public.profiles, public.script_likes, public.orders,
  public.wallet_transactions, public.favorites, public.reports, public.redeem_codes,
  public.redeem_uses, public.user_roles TO service_role;
