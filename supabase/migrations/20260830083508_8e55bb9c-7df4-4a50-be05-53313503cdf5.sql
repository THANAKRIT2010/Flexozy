DROP POLICY IF EXISTS "products public read" ON public.products;

CREATE POLICY "products anon read active"
  ON public.products FOR SELECT TO anon
  USING (active);

CREATE POLICY "products auth read"
  ON public.products FOR SELECT TO authenticated
  USING (active OR public.has_role(auth.uid(), 'admin'));
